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
    }

    const auth = await getGoogleSheetsAuth(credentials);
    const sheets = google.sheets({ version: "v4", auth });

    // Get fresh data from sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:R`,
    });

    let rows = response.data.values || [];

    // Format the data for Google Sheets
    const newRow = [
      bookingId, // First column is UUID
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
          `${bookingData.createdBy || "unknown"} (${bookingData.createdAt ? new Date(bookingData.createdAt).toLocaleString() : new Date().toLocaleString()})`
        : `${bookingData.createdBy || "unknown"} (${bookingData.createdAt ? new Date(bookingData.createdAt).toLocaleString() : new Date().toLocaleString()})`,
      // Add edit history column - append to existing history when editing
      bookingData.isEditing
        ? rows.find((row) => row[0] === bookingId)?.[17]
          ? `${rows.find((row) => row[0] === bookingId)[17]}; Edited by ${bookingData.createdBy || "unknown"} on ${new Date().toLocaleString()}`
          : `Edited by ${bookingData.createdBy || "unknown"} on ${new Date().toLocaleString()}`
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
      }
    }

    // Get spreadsheet metadata for sheet operations
    const spreadsheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    let sheetId = null;
    for (const sheet of spreadsheetMetadata.data.sheets) {
      if (sheet.properties.title === sheetName) {
        sheetId = sheet.properties.sheetId;
        break;
      }
    }

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
        });

        console.log(
          `Successfully inserted year header for ${bookingYear} at row ${yearInsertIndex}`
        );

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
        });

        console.log("Appended year header at the end of sheet");
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
      }
    } else {
      // Year block exists, find correct position within it
      insertIndex = yearBlockStart + 3; // Start after year header (convert to 1-based)
      inserted = false;

      for (let i = yearBlockStart + 1; i <= yearBlockEnd; i++) {
        if (i >= rows.length) break;

        const currentRow = rows[i];

        // Skip empty rows or other year headers within the block
        if (!currentRow || !currentRow[2] || currentRow[2].trim() === "") {
          continue;
        }

        const rowMonth = currentRow[2];
        const rowDayParts = rowMonth.split("-");

        if (rowDayParts.length === 2) {
          const rowDay = parseInt(rowDayParts[0], 10);

          // Primary sort by day number within the year
          if (dayNumber < rowDay) {
            insertIndex = i + 2;
            inserted = true;
            break;
          } else if (dayNumber === rowDay) {
            // If days are equal, sort by fromDate within the same day
            if (currentRow.length >= 8 && currentRow[7]) {
              const rowFromDate = parseFormattedDate(currentRow[7]);

              if (newBookingFromDate < rowFromDate) {
                insertIndex = i + 2;
                inserted = true;
                break;
              }
            }
          }
        }
      }

      // If not inserted yet, place at the end of the year block
      if (!inserted) {
        insertIndex = yearBlockEnd + 3;
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
    }

    // Insert booking data WITHOUT any styling
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
          `Successfully inserted booking data at row ${insertIndex} without styling`
        );
      }
    } catch (error) {
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

    await scheduleBookingEmails(bookingData.agentEmail, {
      uuid: bookingId,
      client: bookingData.client,
      agentName: bookingData.agentName || "Travel Partner",
      fromDate: bookingData.formattedFrom,
      toDate: bookingData.formattedTo,
      formattedFrom: bookingData.formattedFrom,
      formattedTo: bookingData.formattedTo,
    });

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
