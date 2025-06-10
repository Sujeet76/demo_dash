import {
  getGoogleSheetsAuth,
  generateUUID,
  MONTH_NAMES,
  getMonthName,
  parseFormattedDate,
  credentials,
  getStandardizedMonthName,
} from "@/utils/googleSheetsConfig";
import { scheduleBookingEmails } from "@/utils/mailersendConfig";
import { google } from "googleapis";

// Helper function to get all dates between fromDate and toDate (excluding toDate)
function getDateRange(fromDate, toDate) {
  const dates = [];
  const current = new Date(fromDate);
  const end = new Date(toDate);

  while (current < end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// Helper function to get sheet name from date
function getSheetNameFromDate(date) {
  const month = date.getMonth(); // 0-based
  return MONTH_NAMES[month];
}

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper function to format date for booking data
function formatDateForBooking(date) {
  const day = date.getDate();
  const month = date.getMonth(); // 0-based
  const year = date.getFullYear();
  const monthName = MONTH_NAMES[month];
  
  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = date.getDay();
  const dayName = DAY[dayOfWeek];
  
  return {
    day: day,
    month: `${day}-${monthName}`,
    year: year,
    sheetName: monthName,
    dayName: dayName
  };
}

// Helper function to format date as string (DD/MM/YYYY)
function formatDateString(date) {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Helper function to ensure sheet has enough rows
async function ensureSheetCapacity(
  sheets,
  spreadsheetId,
  sheetId,
  requiredRows
) {
  try {
    // Get current sheet properties
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: false,
    });

    const sheet = spreadsheet.data.sheets.find(
      (s) => s.properties.sheetId === sheetId
    );
    const currentRowCount = sheet.properties.gridProperties.rowCount;

    if (currentRowCount < requiredRows + 100) {
      // Add buffer
      const newRowCount = requiredRows + 1000;
      console.log(
        `Expanding sheet capacity from ${currentRowCount} to ${newRowCount} rows`
      );

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId: sheetId,
                  gridProperties: {
                    rowCount: newRowCount,
                  },
                },
                fields: "gridProperties.rowCount",
              },
            },
          ],
        },
      });
    }
  } catch (error) {
    console.warn("Could not check/expand sheet capacity:", error.message);
  }
}

export async function POST(request) {
  try {
    console.log("Hitting the API route");
    const bookingData = await request.json();

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const bookingId = bookingData.uuid || generateUUID();

    // Parse from and to dates
    const fromDate = parseFormattedDate(bookingData.formattedFrom);
    const toDate = parseFormattedDate(bookingData.formattedTo);

    if (!fromDate || !toDate) {
      throw new Error("Invalid from or to date format");
    }

    // Get all dates for the booking (excluding end date)
    const bookingDates = getDateRange(fromDate, toDate);
    console.log(
      `Creating ${bookingDates.length} entries for booking from ${formatDateString(fromDate)} to ${formatDateString(toDate)}`
    );

    const auth = await getGoogleSheetsAuth(credentials);
    const sheets = google.sheets({ version: "v4", auth });

    // Get spreadsheet metadata
    const spreadsheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    // If editing, first clean up ALL existing entries with the same UUID from ALL sheets
    if (bookingData.isEditing && bookingData.uuid) {
      console.log(
        `Editing mode: Cleaning up all existing entries with UUID ${bookingData.uuid} from all sheets`
      );

      // Get all existing sheets to check for entries to delete
      const allSheetNames = spreadsheetMetadata.data.sheets.map(
        (sheet) => sheet.properties.title
      );

      for (const existingSheetName of allSheetNames) {
        // Skip if it's not a month sheet (avoid cleaning up non-month sheets)
        if (!MONTH_NAMES.includes(existingSheetName)) {
          continue;
        }

        try {
          // Get sheet data
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${existingSheetName}!A2:R`,
          });

          const rows = response.data.values || [];
          const rowsToDelete = [];

          // Find all rows with matching UUID
          for (let i = 0; i < rows.length; i++) {
            if (rows[i] && rows[i][0] === bookingData.uuid) {
              rowsToDelete.push(i + 2); // Convert to 1-based sheet row
            }
          }

          if (rowsToDelete.length > 0) {
            console.log(
              `Found ${rowsToDelete.length} entries to delete in sheet ${existingSheetName}`
            );

            // Get sheet ID
            let sheetId = null;
            for (const sheet of spreadsheetMetadata.data.sheets) {
              if (sheet.properties.title === existingSheetName) {
                sheetId = sheet.properties.sheetId;
                break;
              }
            }

            // Delete rows in reverse order to maintain indices
            for (let i = rowsToDelete.length - 1; i >= 0; i--) {
              const sheetRowIndex = rowsToDelete[i];
              try {
                await sheets.spreadsheets.batchUpdate({
                  spreadsheetId,
                  requestBody: {
                    requests: [
                      {
                        deleteDimension: {
                          range: {
                            sheetId: sheetId,
                            dimension: "ROWS",
                            startIndex: sheetRowIndex - 1,
                            endIndex: sheetRowIndex,
                          },
                        },
                      },
                    ],
                  },
                });
                console.log(
                  `Deleted existing row ${sheetRowIndex} from sheet ${existingSheetName}`
                );
              } catch (error) {
                console.warn(
                  `Could not delete row ${sheetRowIndex} from sheet ${existingSheetName}: ${error.message}`
                );
              }
            }
          }
        } catch (error) {
          // Sheet might not exist or might be empty, continue with next sheet
          console.log(
            `Could not check sheet ${existingSheetName} for cleanup: ${error.message}`
          );
        }
      }
    }

    // Group dates by sheet name to minimize sheet operations
    const datesBySheet = {};
    bookingDates.forEach((date) => {
      const sheetName = getSheetNameFromDate(date);
      if (!datesBySheet[sheetName]) {
        datesBySheet[sheetName] = [];
      }
      datesBySheet[sheetName].push(date);
    });

    console.log(
      `Booking spans across ${Object.keys(datesBySheet).length} sheets:`,
      Object.keys(datesBySheet)
    );

    // Process each sheet
    const insertionResults = [];

    for (const [sheetName, datesInSheet] of Object.entries(datesBySheet)) {
      console.log(
        `Processing ${datesInSheet.length} entries for sheet: ${sheetName}`
      );

      // Find or create sheet
      let sheetId = null;
      for (const sheet of spreadsheetMetadata.data.sheets) {
        if (sheet.properties.title === sheetName) {
          sheetId = sheet.properties.sheetId;
          break;
        }
      }

      // Create sheet if it doesn't exist
      if (sheetId === null) {
        console.log(`Sheet ${sheetName} not found. Creating it.`);

        const addSheetResponse = await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                    gridProperties: {
                      rowCount: 1000, // Start with adequate capacity
                      columnCount: 20,
                    },
                  },
                },
              },
            ],
          },
        });

        sheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;

        // Add headers to new sheet
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1:R1`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [
              [
                "ID",
                "Day",
                "month",
                "Client",
                "REQ RMs",
                "Cnfm",
                "Agent",
                "From",
                "To",
                "nts",
                "Vchr no ",
                "recon rm",
                "Safari",
                "Arrival Details",
                "Sightings",
                "Guest Contact",
                "Special Requests",
                "Created By",
              ],
            ],
          },
        });
      }

      // Get current sheet data (fresh data since we've already cleaned up)
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A2:S`,
      });

      let rows = response.data.values || [];

      // Sort dates in this sheet chronologically for proper insertion
      datesInSheet.sort((a, b) => a.getTime() - b.getTime());

      // Get all unique years for this sheet to manage year headers
      const yearsInSheet = [
        ...new Set(datesInSheet.map((date) => date.getFullYear())),
      ];
      const processedYears = new Set();

      // Process each date in this sheet
      for (const date of datesInSheet) {
        const dateInfo = formatDateForBooking(date);
        const bookingYear = dateInfo.year;
        const dayNumber = parseInt(dateInfo.day);

        // Ensure sheet has enough capacity before insertion
        const estimatedRequiredRows =
          rows.length + datesInSheet.length + yearsInSheet.length + 10;
        await ensureSheetCapacity(
          sheets,
          spreadsheetId,
          sheetId,
          estimatedRequiredRows
        );

        // Check if year header needs to be inserted (only once per year)
        if (!processedYears.has(bookingYear)) {
          const yearHeaderExists = await checkYearHeaderExists(
            rows,
            bookingYear
          );

          if (!yearHeaderExists) {
            console.log(
              `Inserting year header for ${bookingYear} in sheet ${sheetName}`
            );
            const yearInsertIndex = await insertYearHeader(
              sheets,
              spreadsheetId,
              sheetName,
              sheetId,
              bookingYear,
              rows
            );

            // Refresh rows data after year header insertion
            const updatedResponse = await sheets.spreadsheets.values.get({
              spreadsheetId,
              range: `${sheetName}!A2:S`,
            });
            rows = updatedResponse.data.values || [];
          }

          processedYears.add(bookingYear);
        }

        // Create booking row for this specific date
        const newRow = [
          bookingId,
          dateInfo.dayName, // Day of the week  
          dateInfo.month,
          bookingData.client,
          bookingData.reqRooms,
          bookingData.confirm,
          bookingData.agent,
          bookingData.formattedFrom, // Keep original from date
          bookingData.formattedTo, // Keep original to date
          bookingData.nights,
          bookingData.voucherNoReconfirm,
          "", // Recon RM
          bookingData.formattedSafariDate || "",
          bookingData.arrivalDetails,
          "", // Sightings
          bookingData.guestContactInfo,
          bookingData.specialRequests,
          // Add hidden user tracking field with timestamp
          bookingData.isEditing
            ? rows.find((row) => row[0] === bookingId)?.[17] ||
              `${bookingData.createdBy || "unknown"} (${bookingData.createdAt ? bookingData.createdAt : new Date().toISOString()})`
            : `${bookingData.createdBy || "unknown"} (${bookingData.createdAt ? bookingData.createdAt : new Date().toISOString()})`,
          // Add edit history column
          bookingData.isEditing
            ? rows.find((row) => row[0] === bookingId)?.[18]
              ? `${rows.find((row) => row[0] === bookingId)[18]}; ${bookingData.createdBy || "unknown"} edited on ${new Date().toISOString()}`
              : `${bookingData.createdBy || "unknown"} edited on ${new Date().toISOString()}`
            : "",
        ];

        // Find insertion point using improved logic
        const insertIndex = await findInsertionPoint(
          sheets,
          spreadsheetId,
          sheetName,
          sheetId,
          bookingYear,
          dayNumber,
          rows
        );

        // Insert the booking
        await insertBookingRow(
          sheets,
          spreadsheetId,
          sheetName,
          sheetId,
          newRow,
          insertIndex
        );

        // Refresh rows data after insertion for next iteration
        const refreshedResponse = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A2:S`,
        });
        rows = refreshedResponse.data.values || [];

        insertionResults.push({
          date: formatDateString(date),
          sheet: sheetName,
          insertedAt: insertIndex,
        });

        console.log(
          `Inserted booking for ${formatDateString(date)} in sheet ${sheetName} at row ${insertIndex}`
        );
      }
    }

    // Schedule emails only once for the entire booking
    if (
      bookingData.agentEmail &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.agentEmail)
    ) {
      await scheduleBookingEmails(bookingData.agentEmail, {
        uuid: bookingId,
        client: bookingData.client,
        agentName: bookingData.agentName || "Travel Partner",
        fromDate: bookingData.formattedFrom,
        toDate: bookingData.formattedTo,
        formattedFrom: bookingData.formattedFrom,
        formattedTo: bookingData.formattedTo,
      });
      console.log(`Scheduled booking email for ${bookingData.agentEmail}`);
    } else {
      console.log("No valid agent email provided, skipping email scheduling");
    }

    return Response.json({
      success: true,
      uuid: bookingId,
      insertionResults: insertionResults,
      totalEntries: bookingDates.length,
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to check if year header already exists
function checkYearHeaderExists(rows, year) {
  for (let i = 0; i < rows.length; i++) {
    const currentRow = rows[i];

    // Check if this is a year header row
    if (
      currentRow[3] &&
      !isNaN(parseInt(currentRow[3])) &&
      parseInt(currentRow[3]) === year &&
      (!currentRow[1] || currentRow[1].trim() === "") &&
      (!currentRow[2] || currentRow[2].trim() === "") &&
      (!currentRow[7] || currentRow[7].trim() === "")
    ) {
      return true;
    }
  }
  return false;
}

// Helper function to find insertion point with improved logic
async function findInsertionPoint(
  sheets,
  spreadsheetId,
  sheetName,
  sheetId,
  bookingYear,
  dayNumber,
  rows
) {
  let insertIndex = 2;

  console.log({
    bookingYear,
    dayNumber,
  })

  // Find year block
  let yearBlockStart = -1;
  let yearBlockEnd = -1;

  // Find target year block
  for (let i = 0; i < rows.length; i++) {
    const currentRow = rows[i];

    // Check if this is a year header row
    if (
      currentRow[3] &&
      !isNaN(parseInt(currentRow[3])) &&
      parseInt(currentRow[3]) === bookingYear &&
      (!currentRow[1] || currentRow[1].trim() === "") &&
      (!currentRow[2] || currentRow[2].trim() === "") &&
      (!currentRow[7] || currentRow[7].trim() === "")
    ) {
      yearBlockStart = i;
      break;
    }
  }

  // If target year block was found, find its end
  if (yearBlockStart !== -1) {
    yearBlockEnd = rows.length - 1;

    for (let i = yearBlockStart + 1; i < rows.length; i++) {
      const currentRow = rows[i];

      if (
        currentRow[3] &&
        !isNaN(parseInt(currentRow[3])) &&
        (!currentRow[1] || currentRow[1].trim() === "") &&
        (!currentRow[2] || currentRow[2].trim() === "") &&
        (!currentRow[7] || currentRow[7].trim() === "")
      ) {
        yearBlockEnd = i - 1;
        break;
      }
    }

    // Find correct position within year block based on day
    insertIndex = yearBlockStart + 2; // Start after year header

    for (let i = yearBlockStart + 1; i <= yearBlockEnd; i++) {
      if (i >= rows.length) break;

      const currentRow = rows[i];
      if (!currentRow || !currentRow[2] || currentRow[2].trim() === "") {
        continue;
      }

      const rowMonth = currentRow[2]?.trim()?.toLowerCase();
      const rowDayParts = rowMonth.split("-") || [];

      if (rowDayParts.length === 2) {
        const rowDay = parseInt(rowDayParts[0], 10);
        // console.log({
        //   ss: currentRow[3],
        //   rowDay,
        //   dayNumber,
        // })
        if (dayNumber <= rowDay) {
          if(!currentRow[3] || currentRow[3]?.trim() ==="") {
            insertIndex = i + 2; // Insert before this row
            break;
          }
        }
      }else if (rowMonth === "total") {
        // If we hit a total row, insert before it
        // if it's previous row and compared day is less than or equal to total row day
        const previousRow = rows[Math.max(i - 1, yearBlockStart)];
        const previousRowDayParts = previousRow[2]?.trim().toLowerCase().split("-") || [];
        // console.log({
        //   previousRow,
        //   pr: previousRow[3],
        //   prDay: previousRowDayParts,
        //   currentRow: currentRow[3],
        //   dayNumber,
        // })

        if(previousRowDayParts?.length === 2){
          const previousRowDay = parseInt(previousRowDayParts[0], 10);
          if (dayNumber <= previousRowDay) {
            insertIndex = i + 2; // Insert before this total row to that day block
            break;
          }
        }
      }
    }

    // If we haven't found a position, insert at end of year block
    if (insertIndex === yearBlockStart + 2) {
      insertIndex = yearBlockEnd + 3;
    }
  } else {
    // Year block not found - this shouldn't happen as we ensure year header exists
    console.warn(`Year ${bookingYear} block not found, appending to end`);
    insertIndex = rows.length + 2;
  }

  return insertIndex;
}

// Helper function to insert year header with improved positioning
async function insertYearHeader(
  sheets,
  spreadsheetId,
  sheetName,
  sheetId,
  bookingYear,
  rows
) {
  let yearInsertIndex = 2;
  let allYearHeaders = [];

  // First pass: identify all year headers
  for (let i = 0; i < rows.length; i++) {
    const currentRow = rows[i];

    // Check if this is a year header row
    if (
      currentRow[3] &&
      !isNaN(parseInt(currentRow[3])) &&
      (!currentRow[1] || currentRow[1].trim() === "") &&
      (!currentRow[2] || currentRow[2].trim() === "") &&
      (!currentRow[7] || currentRow[7].trim() === "")
    ) {
      const yearValue = parseInt(currentRow[3]);
      allYearHeaders.push({ year: yearValue, index: i });
    }
  }

  // Sort existing year headers
  allYearHeaders.sort((a, b) => a.year - b.year);

  // Find correct position for new year header
  let insertBeforeYear = null;
  for (const yearHeader of allYearHeaders) {
    if (bookingYear < yearHeader.year) {
      insertBeforeYear = yearHeader;
      yearInsertIndex = yearHeader.index + 2; // +2 for 1-based indexing
      break;
    }
  }

  // If no year to insert before, append at end
  if (!insertBeforeYear) {
    let lastDataRow = 1;
    for (let i = rows.length - 1; i >= 0; i--) {
      const currentRow = rows[i];
      if (
        currentRow &&
        currentRow.some((cell) => cell && cell.toString().trim() !== "")
      ) {
        lastDataRow = i + 2; // +2 for 1-based indexing
        break;
      }
    }
    yearInsertIndex = lastDataRow + 1;
  }

  // Create year header row
  const yearHeaderRow = Array(19).fill(""); // 19 columns
  yearHeaderRow[3] = String(bookingYear); // Year in client column

  // Insert year header
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: yearInsertIndex - 1,
                endIndex: yearInsertIndex,
              },
            },
          },
        ],
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${yearInsertIndex}:S${yearInsertIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [yearHeaderRow],
      },
    });

    // Apply styling to year header
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: yearInsertIndex - 1,
                endRowIndex: yearInsertIndex,
                startColumnIndex: 0,
                endColumnIndex: 19,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 1.0,
                    green: 1.0,
                    blue: 0.0,
                  },
                  textFormat: {
                    bold: true,
                    foregroundColor: {
                      red: 0.0,
                      green: 0.0,
                      blue: 0.0,
                    },
                  },
                },
              },
              fields: "userEnteredFormat(backgroundColor,textFormat)",
            },
          },
        ],
      },
    });

    console.log(
      `Inserted year header for ${bookingYear} at row ${yearInsertIndex}`
    );
  } catch (error) {
    console.warn("Could not insert year header:", error.message);
    yearInsertIndex = rows.length + 2;
  }

  return yearInsertIndex;
}

// Helper function to insert booking row
async function insertBookingRow(
  sheets,
  spreadsheetId,
  sheetName,
  sheetId,
  newRow,
  insertIndex
) {
  try {
    // Insert row dimension
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: insertIndex - 1,
                endIndex: insertIndex,
              },
            },
          },
        ],
      },
    });

    // Insert data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${insertIndex}:S${insertIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [newRow],
      },
    });

    // Apply styling
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: insertIndex - 1,
                endRowIndex: insertIndex,
                startColumnIndex: 0,
                endColumnIndex: 19,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    foregroundColor: {
                      red: 0.0,
                      green: 0.0,
                      blue: 0.0,
                    },
                  },
                },
              },
              fields: "userEnteredFormat.textFormat",
            },
          },
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: insertIndex - 1,
                endRowIndex: insertIndex,
                startColumnIndex: 1,
                endColumnIndex: 19,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 1.0,
                    green: 1.0,
                    blue: 1.0,
                    alpha: 0.0,
                  },
                },
              },
              fields: "userEnteredFormat.backgroundColor",
            },
          },
        ],
      },
    });
  } catch (error) {
    console.warn(
      "Could not insert at specific position, appending instead:",
      error.message
    );

    // Fallback to append
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:S`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [newRow],
      },
    });
  }
}
