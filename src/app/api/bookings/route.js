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

export async function POST(request) {
  try {
    console.log("Hitting the API route");
    const bookingData = await request.json();

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const month = bookingData.month;
    let sheetName = "Sheet1";

    if (month) {
      const monthParts = month.split("-");
      if (monthParts.length === 2) {
        const monthName = monthParts[1];
        const standardizedMonthName = getStandardizedMonthName(monthName);
        if (standardizedMonthName) {
          sheetName = standardizedMonthName;
        }
      }

      console.log(`Using sheet for month: ${sheetName}`);
    }

    const range = `${sheetName}!A:S`; // Range for 19 columns (A through S, including the hidden user columns)
    const bookingId = bookingData.uuid || generateUUID();

    // Extract year from booking data
    let bookingYear = null;
    if (bookingData.formattedFrom) {
      const fromDate = parseFormattedDate(bookingData.formattedFrom);
      bookingYear = fromDate.getFullYear();
    } else if (bookingData.formattedTo) {
      const toDate = parseFormattedDate(bookingData.formattedTo);
      bookingYear = toDate.getFullYear();
    }    const auth = await getGoogleSheetsAuth(credentials);
    const sheets = google.sheets({ version: "v4", auth });

    // Get spreadsheet metadata for sheet operations (needed early for delete operations)
    const spreadsheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    // console.log(`Spreadsheet metadata retrieved for ID: ${spreadsheetId}`);
    console.log({spreadsheetMetadata});

    let sheetId = null;
    for (const sheet of spreadsheetMetadata.data.sheets) {
      if (sheet.properties.title === sheetName) {
        sheetId = sheet.properties.sheetId;
        break;
      }
    }
    console.log(`Found sheet ID: ${sheetId} for sheet: ${sheetName}`);

    // Get fresh data from sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:R`,
    });

    let rows = response.data.values || [];

    // If this is an edit operation, find and remove the existing record first
    if (bookingData.isEditing && bookingData.uuid) {
      console.log(`Editing mode: Looking for existing record with UUID ${bookingData.uuid}`);
      
      let existingRowIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === bookingData.uuid) {
          existingRowIndex = i;
          console.log(`Found existing record at row ${i + 2} (sheet row ${i + 2})`);
          break;
        }
      }

      if (existingRowIndex !== -1) {
        // Remove the existing row from the sheet
        const sheetRowIndex = existingRowIndex + 2; // Convert to 1-based sheet row
        
        try {          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [
                {
                  deleteDimension: {
                    range: {
                      sheetId: sheetId,
                      dimension: "ROWS",
                      startIndex: sheetRowIndex - 1, // Convert to 0-based
                      endIndex: sheetRowIndex,
                    },
                  },
                },
              ],
            },
          });
          
          // Remove from our local array as well
          rows.splice(existingRowIndex, 1);
          console.log(`Successfully removed existing record from row ${sheetRowIndex}`);
        } catch (error) {
          console.warn(`Could not delete existing row: ${error.message}`);
          // Continue with the operation - worst case we'll have a duplicate temporarily
        }
        
        // Refresh the data after deletion to ensure accurate row indexing
        const refreshResponse = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A2:R`,
        });
        rows = refreshResponse.data.values || [];
        console.log("Refreshed sheet data after deleting existing record");
      } else {
        console.log(`No existing record found with UUID ${bookingData.uuid}`);
      }
    }

    // Format the data for Google Sheets
    const newRow = [
      bookingId,
      bookingData.day,
      bookingData.month,
      bookingData.client,
      bookingData.reqRooms,
      bookingData.confirm,
      bookingData.agent,
      bookingData.formattedFrom,
      bookingData.formattedTo,
      bookingData.nights,
      bookingData.voucherNoReconfirm,
      "", // Recon RM (not provided in bookingData)
      bookingData.formattedSafariDate || "",
      bookingData.arrivalDetails,
      bookingData.guestContactInfo,
      bookingData.specialRequests,
      // Add hidden user tracking field with timestamp
      bookingData.isEditing
        ? rows.find((row) => row[0] === bookingId)?.[16] ||
          `${bookingData.createdBy || "unknown"} (${bookingData.createdAt ? bookingData.createdAt : new Date().toISOString()})`
        : `${bookingData.createdBy || "unknown"} (${bookingData.createdAt ? bookingData.createdAt : new Date().toISOString()})`,
      // Add edit history column - append to existing history when editing
      bookingData.isEditing
        ? rows.find((row) => row[0] === bookingId)?.[17]
          ? `${rows.find((row) => row[0] === bookingId)[17]}; ${bookingData.createdBy || "unknown"} edited on ${new Date().toISOString()}`
          : `${bookingData.createdBy || "unknown"} edited on ${new Date().toISOString()}`
        : "",
    ];

    console.log("New booking data row:", newRow);

    let dayNumber = 0;
    if (bookingData.month) {
      const dayPart = bookingData.month.split("-")[0];
      dayNumber = parseInt(dayPart, 10);
    }

    let insertIndex = 2;
    let inserted = false;
    const newBookingFromDate = bookingData.formattedFrom
      ? parseFormattedDate(bookingData.formattedFrom)
      : new Date(0); // Find year block and determine insert position
    let yearBlockStart = -1;
    let yearBlockEnd = -1;
    let allYearHeaders = [];

    /**
     * How sorting works:
     * 1. First find all existing year headers and their positions
     * 2. If target year exists, find its block boundaries
     * 3. If target year doesn't exist, insert year header at the end of all data
     * 4. Within the year block, sort by day number then by from date
     */

    // First pass: identify all year headers and find target year block
    for (let i = 0; i < rows.length; i++) {
      const currentRow = rows[i];

      // Check if this is a year header row (contains only year in client column)
      if (
        currentRow[3] &&
        !isNaN(parseInt(currentRow[3])) &&
        (!currentRow[1] || currentRow[1].trim() === "") && // No day
        (!currentRow[2] || currentRow[2].trim() === "") && // No month
        (!currentRow[7] || currentRow[7].trim() === "")
      ) {
        // No from date

        const yearValue = parseInt(currentRow[3]);
        allYearHeaders.push({ year: yearValue, index: i });

        if (yearValue === bookingYear) {
          yearBlockStart = i;
        }
      }
    }

    // If target year block was found, find its end
    if (yearBlockStart !== -1) {
      yearBlockEnd = rows.length - 1; // Default to end of data

      // Look for the next year header after our target year
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
      }    }

    // If no year block found, insert year header at the correct chronological position
    if (yearBlockStart === -1) {
      // Find the correct position to insert the new year
      let yearInsertIndex = 2; // Default to start after header
      let insertBeforeYear = null;

      // Sort existing year headers to find correct position
      allYearHeaders.sort((a, b) => a.year - b.year);

      // Find where to insert the new year chronologically
      for (const yearHeader of allYearHeaders) {
        if (bookingYear < yearHeader.year) {
          insertBeforeYear = yearHeader;
          yearInsertIndex = yearHeader.index + 2; // Convert to 1-based indexing
          break;
        }
      }

      // If no year to insert before, insert at the end
      if (!insertBeforeYear) {
        // Find the last row with data
        let lastDataRow = 1;
        for (let i = rows.length - 1; i >= 0; i--) {
          const currentRow = rows[i];
          if (
            currentRow &&
            currentRow.some((cell) => cell && cell.toString().trim() !== "")
          ) {
            lastDataRow = i + 2;
            break;
          }
        }
        yearInsertIndex = lastDataRow + 1;
      }

      console.log(
        `Inserting year ${bookingYear} at row ${yearInsertIndex}${insertBeforeYear ? ` (before year ${insertBeforeYear.year})` : " (at end)"}`
      );

      // Create year header row
      const yearHeaderRow = [
        "", // ID
        "", // Day
        "", // Month
        String(bookingYear), // Client column contains year
        "", // REQ RMs
        "", // Cnfm
        "", // Agent
        "", // From
        "", // To
        "", // Nights
        "", // Vchr no
        "", // Safari
        "", // Safari date
        "", // Arrival details
        "", // Guest contact
        "", // Special requests
        "", // Created by
        "", // Edit history
      ];

      // Check if we need to expand the grid first
      const currentGridSize = await sheets.spreadsheets.get({
        spreadsheetId,
        ranges: [`${sheetName}!A:A`],
        includeGridData: false,
      });

      let gridRowCount = 1000;
      for (const sheet of currentGridSize.data.sheets) {
        if (sheet.properties.title === sheetName) {
          gridRowCount = sheet.properties.gridProperties.rowCount;
          break;
        }
      }

      // If insert index exceeds current grid size, expand the grid
      if (yearInsertIndex >= gridRowCount) {
        const newRowCount = Math.max(
          gridRowCount + 1000,
          yearInsertIndex + 100
        );
        console.log(
          `Expanding grid from ${gridRowCount} to ${newRowCount} rows`
        );

        try {
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
                        columnCount: 20,
                      },
                    },
                    fields: "gridProperties.rowCount",
                  },
                },
              ],
            },
          });
          console.log(`Successfully expanded grid to ${newRowCount} rows`);
        } catch (error) {
          console.error("Failed to expand grid:", error);
          throw new Error(
            `Cannot insert at row ${yearInsertIndex}: Grid expansion failed`
          );
        }
      }

      // Insert the year header at the correct position
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
          range: `${sheetName}!A${yearInsertIndex}:R${yearInsertIndex}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [yearHeaderRow],
          },
        });        console.log(
          `Successfully inserted year header for ${bookingYear} at row ${yearInsertIndex}`
        );

        // Apply styling to the newly inserted year header
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId: sheetId,
                    startRowIndex: yearInsertIndex - 1, // The year header row
                    endRowIndex: yearInsertIndex,       // Only this single row
                    startColumnIndex: 0,               // Start from column A
                    endColumnIndex: 18,                // Through column R
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: {
                        red: 1.0,
                        green: 1.0,
                        blue: 0.0, // Yellow background
                      },
                      textFormat: {
                        bold: true,
                        foregroundColor: {
                          red: 0.0,
                          green: 0.0,
                          blue: 0.0, // Black text
                        },
                      },
                    },
                  },
                  fields: "userEnteredFormat(backgroundColor,textFormat)",
                },
              },
              {
                updateDimensionProperties: {
                  range: {
                    sheetId: sheetId,
                    dimension: "ROWS",
                    startIndex: yearInsertIndex - 1,
                    endIndex: yearInsertIndex,
                  },
                  properties: {
                    pixelSize: 30, // Larger row height
                  },
                  fields: "pixelSize",
                },
              },
            ],
          },
        });
        console.log(`Applied yellow background, bold text, and larger height to year header at row ${yearInsertIndex}`);

        insertIndex = yearInsertIndex + 1;
      } catch (error) {
        console.warn("Could not insert year header:", error.message);
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetName}!A:R`,
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
          requestBody: {
            values: [yearHeaderRow],
          },
        });        console.log("Appended year header at the end of sheet");
        const appendedRowIndex = rows.length + 2; // The row where it was appended
        
        // Apply styling to the appended year header
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId: sheetId,
                    startRowIndex: appendedRowIndex - 1, // The year header row (0-based)
                    endRowIndex: appendedRowIndex,       // Only this single row
                    startColumnIndex: 0,                // Start from column A
                    endColumnIndex: 18,                 // Through column R
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: {
                        red: 1.0,
                        green: 1.0,
                        blue: 0.0, // Yellow background
                      },
                      textFormat: {
                        bold: true,
                        foregroundColor: {
                          red: 0.0,
                          green: 0.0,
                          blue: 0.0, // Black text
                        },
                      },
                    },
                  },
                  fields: "userEnteredFormat(backgroundColor,textFormat)",
                },
              },
              {
                updateDimensionProperties: {
                  range: {
                    sheetId: sheetId,
                    dimension: "ROWS",
                    startIndex: appendedRowIndex - 1,
                    endIndex: appendedRowIndex,
                  },
                  properties: {
                    pixelSize: 30, // Larger row height
                  },
                  fields: "pixelSize",
                },
              },
            ],
          },
        });
        console.log(`Applied yellow background, bold text, and larger height to appended year header at row ${appendedRowIndex}`);
        
        insertIndex = rows.length + 3;
      } // Update yearBlockStart and yearBlockEnd to reflect the new positions
      yearBlockStart = yearInsertIndex - 2; // Adjust for 0-based indexing
      yearBlockEnd = yearInsertIndex - 2; // CRITICAL FIX: After inserting a year header, we need to refresh the sheet data
      // because all row indices have shifted for rows that come after the insertion point
      if (insertBeforeYear) {
        console.log("Refreshing sheet data after year header insertion...");
        const refreshResponse = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A2:R`,
        });
        rows = refreshResponse.data.values || [];

        // Recalculate year block positions with fresh data
        yearBlockStart = -1;
        yearBlockEnd = -1;

        for (let i = 0; i < rows.length; i++) {
          const currentRow = rows[i];

          if (
            currentRow[3] &&
            !isNaN(parseInt(currentRow[3])) &&
            (!currentRow[1] || currentRow[1].trim() === "") &&
            (!currentRow[2] || currentRow[2].trim() === "") &&
            (!currentRow[7] || currentRow[7].trim() === "")
          ) {
            const yearValue = parseInt(currentRow[3]);

            if (yearValue === bookingYear) {
              yearBlockStart = i;
              // Find the end of this year block
              yearBlockEnd = rows.length - 1;
              for (let j = i + 1; j < rows.length; j++) {
                const nextRow = rows[j];
                if (
                  nextRow[3] &&
                  !isNaN(parseInt(nextRow[3])) &&
                  (!nextRow[1] || nextRow[1].trim() === "") &&
                  (!nextRow[2] || nextRow[2].trim() === "") &&
                  (!nextRow[7] || nextRow[7].trim() === "")
                ) {
                  yearBlockEnd = j - 1;
                  break;
                }
              }
              break;
            }
          }
        }

        // Update insert index based on fresh data
        insertIndex = yearBlockStart + 3; // Start after year header (convert to 1-based)
        console.log(`Updated insertIndex to ${insertIndex} after data refresh`);
      }    } else {
      // Year block exists, find correct position within it
      insertIndex = yearBlockStart + 3; // Start after year header (convert to 1-based)
      inserted = false;

      // Strategy: Find the correct day group and insert before its TOTAL row
      let dayGroupStart = -1;
      let dayGroupEnd = -1;
      let totalRowIndex = -1;

      // First, find if there's already a group for our target day
      for (let i = yearBlockStart + 1; i <= yearBlockEnd; i++) {
        if (i >= rows.length) break;

        const currentRow = rows[i];
        if (!currentRow || !currentRow[2] || currentRow[2].trim() === "") {
          continue;
        }

        const rowMonth = currentRow[2];

        // Check if this is a TOTAL row
        if (rowMonth.toLowerCase().includes("total")) {
          if (dayGroupStart !== -1) {
            // We found the end of a day group
            dayGroupEnd = i - 1;
            totalRowIndex = i;
            break;
          }
          continue;
        }

        const rowDayParts = rowMonth.split("-");
        if (rowDayParts.length === 2) {
          const rowDay = parseInt(rowDayParts[0], 10);

          if (rowDay === dayNumber) {
            // Found our target day group
            if (dayGroupStart === -1) {
              dayGroupStart = i;
            }
          } else if (dayGroupStart !== -1) {
            // We were in our target day group but now hit a different day
            dayGroupEnd = i - 1;
            break;
          } else if (dayNumber < rowDay) {
            // Insert before this day since our day comes earlier
            insertIndex = i + 2;
            inserted = true;
            console.log(`Inserting before day ${rowDay} at row ${i + 2}`);
            break;
          }
        }
      }

      // If we found our target day group
      if (dayGroupStart !== -1) {
        if (totalRowIndex !== -1) {
          // Insert before the TOTAL row
          insertIndex = totalRowIndex + 2;
          inserted = true;
          console.log(`Found day group for ${dayNumber} with TOTAL row, inserting before TOTAL at row ${totalRowIndex + 2}`);
        } else {
          // Find the end of the day group and insert there
          let endOfDayGroup = dayGroupEnd !== -1 ? dayGroupEnd : yearBlockEnd;
          
          // Look for the last actual booking entry in this day group
          for (let i = endOfDayGroup; i >= dayGroupStart; i--) {
            if (i >= rows.length) continue;
            const currentRow = rows[i];
            if (currentRow && currentRow[2] && currentRow[2].trim() !== "" && 
                !currentRow[2].toLowerCase().includes("total")) {
              // Sort by fromDate within the same day
              if (currentRow.length >= 8 && currentRow[7]) {
                const rowFromDate = parseFormattedDate(currentRow[7]);
                if (newBookingFromDate >= rowFromDate) {
                  insertIndex = i + 3; // Insert after this entry
                  inserted = true;
                  console.log(`Inserting after booking with date ${currentRow[7]} at row ${i + 3}`);
                  break;
                }
              }
            }
          }
          
          // If still not inserted, insert at the beginning of the day group
          if (!inserted) {
            insertIndex = dayGroupStart + 2;
            inserted = true;
            console.log(`Inserting at beginning of day group for ${dayNumber} at row ${dayGroupStart + 2}`);
          }
        }
      }

      // If not inserted yet, place at the end of the year block
      if (!inserted) {
        insertIndex = yearBlockEnd + 3;
        console.log(`No matching day found, inserting at end of year block at row ${yearBlockEnd + 3}`);
      }
    }

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
                },
              },
            },
          ],
        },
      });

      sheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:O1`,
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
            ],
          ],
        },
      });
    }

    console.log(`Using sheet ID: ${sheetId} for ${sheetName}`);
    console.log(
      `Inserting booking at row ${insertIndex} for year ${bookingYear}`
    );

    // Check if we need to expand grid for booking insertion
    const currentGridSize = await sheets.spreadsheets.get({
      spreadsheetId,
      ranges: [`${sheetName}!A:A`],
      includeGridData: false,
    });

    let gridRowCount = 1000; // Default
    for (const sheet of currentGridSize.data.sheets) {
      if (sheet.properties.title === sheetName) {
        gridRowCount = sheet.properties.gridProperties.rowCount;
        break;
      }
    }

    // If insert index exceeds current grid size, expand the grid
    if (insertIndex >= gridRowCount) {
      const newRowCount = Math.max(gridRowCount + 1000, insertIndex + 100);
      console.log(
        `Expanding grid for booking insertion from ${gridRowCount} to ${newRowCount} rows`
      );

      try {
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
                      columnCount: 20, // Maintain column count
                    },
                  },
                  fields: "gridProperties.rowCount",
                },
              },
            ],
          },
        });
        console.log(
          `Successfully expanded grid to ${newRowCount} rows for booking`
        );
      } catch (error) {
        console.error("Failed to expand grid for booking:", error);
        // Continue with append fallback
      }
    }

    const MAX_GRID_SIZE = gridRowCount; // Use actual grid size

    // Insert booking row dimension WITHOUT any styling
    if (insertIndex <= MAX_GRID_SIZE) {
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
                    startIndex: insertIndex - 1,
                    endIndex: insertIndex,
                  },
                },
              },
            ],
          },
        });
        console.log(
          `Inserted row dimension at ${insertIndex} for booking (no styling)`
        );
      } catch (error) {
        console.warn(
          "Warning: Could not insert dimension, will append instead:",
          error.message
        );
        insertIndex = rows.length + 2;
      }
    } else {
      console.log(
        `Insert index ${insertIndex} exceeds grid size limit, appending to end instead`
      );
      insertIndex = rows.length + 2;
    }    // Insert booking data with transparent background styling from column 2
    try {
      if (insertIndex > MAX_GRID_SIZE) {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetName}!A:R`,
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
          requestBody: {
            values: [newRow],
          },
        });
        console.log(
          "Successfully appended booking row at the end of the sheet"
        );
      } else {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A${insertIndex}:R${insertIndex}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [newRow],
          },
        });
        console.log(
          `Successfully inserted booking data at row ${insertIndex}`
        );
      }      // Apply transparent background styling from column 2 onwards with black text for entire row
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              // First apply black text to the entire row (columns A through R)
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: insertIndex - 1, // The booking row
                  endRowIndex: insertIndex,       // Only this single row
                  startColumnIndex: 0,           // Start from column A (index 0)
                  endColumnIndex: 18,            // Through column R
                },
                cell: {
                  userEnteredFormat: {
                    textFormat: {
                      foregroundColor: {
                        red: 0.0,
                        green: 0.0,
                        blue: 0.0, // Black text
                      },
                    },
                  },
                },
                fields: "userEnteredFormat.textFormat",
              },
            },
            {
              // Then apply transparent background from column B onwards
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: insertIndex - 1, // The booking row
                  endRowIndex: insertIndex,       // Only this single row
                  startColumnIndex: 1,           // Start from column B (index 1)
                  endColumnIndex: 18,            // Through column R
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 1.0,
                      green: 1.0,
                      blue: 1.0,
                      alpha: 0.0, // Transparent background
                    },
                  },
                },
                fields: "userEnteredFormat.backgroundColor",
              },
            },
          ],
        },
      });
      console.log(`Applied black text to entire row and transparent background from column B onwards to booking row ${insertIndex}`);
    }catch (error) {
      console.error("Error updating/appending values:", error);
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:R`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [newRow],
        },
      });
      console.log(
        "Fallback: Successfully appended row at the end of the sheet"
      );
    }

    // Check if agentEmail is valid before scheduling emails
    if (bookingData.agentEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.agentEmail)) {
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
      insertedAt: insertIndex,
      uuid: bookingId,
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
