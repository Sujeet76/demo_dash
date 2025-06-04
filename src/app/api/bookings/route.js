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

    const spreadsheetId = process.env.GOOGLE_SHEET_ID; // Helper function to get sheet name from a date
    function getSheetNameFromDate(date) {
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      const standardizedMonthName = getStandardizedMonthName(monthName);
      return standardizedMonthName || "Sheet1";
    }

    // Helper function to get sheet ID from sheet name
    function getSheetIdFromName(sheetName) {
      for (const sheet of spreadsheetMetadata.data.sheets) {
        if (sheet.properties.title === sheetName) {
          return sheet.properties.sheetId;
        }
      }
      return null;
    } // For editing operations, we need to delete from ALL possible month sheets
    // since the booking might span multiple months
    async function deleteExistingBookingFromAllSheets(
      uuid,
      sheets,
      spreadsheetId,
      bookingData
    ) {
      console.log(
        `Searching for existing booking entries with UUID ${uuid} across all month sheets...`
      );

      let totalDeleted = 0;
      let allTrackingData = {};
      let allEditHistory = {};

      for (const targetSheetName of MONTH_NAMES) {
        try {
          const targetRange = `${targetSheetName}!A:T`;
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: targetRange,
          });

          let sheetRows = response.data.values || [];
          if (sheetRows.length <= 1) continue; // Skip if no data (just header or empty)

          // Remove header row
          sheetRows = sheetRows.slice(1);

          // Find entries with matching UUID
          const matchingIndices = [];
          for (let i = 0; i < sheetRows.length; i++) {
            if (sheetRows[i][0] === uuid) {
              matchingIndices.push(i);
              // Preserve tracking data
              const dayIndex = sheetRows[i][19] || 0;
              allTrackingData[dayIndex] =
                sheetRows[i][17] ||
                `${bookingData.createdBy || "unknown"} (${bookingData.createdAt || new Date().toISOString()})`;
              allEditHistory[dayIndex] = sheetRows[i][18] || "";
              console.log(
                `Found entry in ${targetSheetName} at data row ${i} (sheet row ${i + 2}), dayIndex: ${dayIndex}`
              );
            }
          }

          if (matchingIndices.length > 0) {
            const targetSheetId = getSheetIdFromName(targetSheetName);
            if (!targetSheetId) {
              console.warn(`Could not find sheet ID for ${targetSheetName}`);
              continue;
            }

            // Delete in reverse order
            for (let idx = matchingIndices.length - 1; idx >= 0; idx--) {
              const dataRowIndex = matchingIndices[idx];
              const sheetRowIndex = dataRowIndex + 2; // +2 for header and 1-based indexing

              try {
                await sheets.spreadsheets.batchUpdate({
                  spreadsheetId,
                  requestBody: {
                    requests: [
                      {
                        deleteDimension: {
                          range: {
                            sheetId: targetSheetId,
                            dimension: "ROWS",
                            startIndex: sheetRowIndex - 1,
                            endIndex: sheetRowIndex,
                          },
                        },
                      },
                    ],
                  },
                });

                totalDeleted++;
                console.log(
                  `Deleted entry from ${targetSheetName} sheet row ${sheetRowIndex}`
                );
              } catch (error) {
                console.error(
                  `Failed to delete from ${targetSheetName} row ${sheetRowIndex}: ${error.message}`
                );
                throw error;
              }
            }
          }
        } catch (error) {
          if (error.message.includes("Unable to parse range")) {
            // Sheet doesn't exist, skip it
            continue;
          }
          throw error;
        }
      }

      console.log(`Total deleted entries across all sheets: ${totalDeleted}`);
      return { totalDeleted, allTrackingData, allEditHistory };
    }

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

    const range = `${sheetName}!A:T`; // Range for 20 columns (A through T, including the day index column)
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

    // Get spreadsheet metadata for sheet operations (needed early for delete operations)
    const spreadsheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    // console.log(`Spreadsheet metadata retrieved for ID: ${spreadsheetId}`);
    // console.log({ spreadsheetMetadata });

    let sheetId = null;
    for (const sheet of spreadsheetMetadata.data.sheets) {
      if (sheet.properties.title === sheetName) {
        sheetId = sheet.properties.sheetId;
        break;
      }
    }
    console.log(`Found sheet ID: ${sheetId} for sheet: ${sheetName}`); // Get fresh data from sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    let rows = response.data.values || [];
    console.log(`Retrieved ${rows.length} total rows from sheet ${sheetName}`);

    // Filter out any header rows and empty rows for processing
    // Assuming row 1 is header, start from row 2 (index 1)
    if (rows.length > 1) {
      rows = rows.slice(1); // Remove header row
      console.log(`After removing header: ${rows.length} data rows`);
    }

    // Log existing entries with the same UUID for debugging
    const existingUuidEntries = rows.filter(
      (row) => row[0] === bookingData.uuid
    );
    console.log(
      `Found ${existingUuidEntries.length} existing entries with UUID ${bookingData.uuid}:`
    );
    existingUuidEntries.forEach((entry, idx) => {
      console.log(
        `  Entry ${idx + 1}: dayIndex=${entry[19] || 0}, to=${entry[8]}, nights=${entry[9]}, from=${entry[7]}`
      );
    }); // If this is an edit operation, find and remove ALL existing records with the same base UUID first    // Handle editing case: preserve tracking data before deletion
    let originalTrackingData = {};
    let originalEditHistory = {};

    if (bookingData.isEditing && bookingData.uuid) {
      console.log(
        `Editing mode: Looking for ALL existing records with base UUID ${bookingData.uuid} across all sheets`
      ); // Use the helper function to delete from all sheets and preserve tracking data
      const { totalDeleted, allTrackingData, allEditHistory } =
        await deleteExistingBookingFromAllSheets(
          bookingData.uuid,
          sheets,
          spreadsheetId,
          bookingData
        );

      console.log(
        `Successfully deleted ${totalDeleted} existing entries across all sheets`
      );
      // Use the preserved tracking data
      originalTrackingData = allTrackingData;
      originalEditHistory = allEditHistory;
    }

    // Check if this is a multi-day booking (from date to to date, excluding end date)
    const fromDate = bookingData.formattedFrom
      ? parseFormattedDate(bookingData.formattedFrom)
      : null;
    const toDate = bookingData.formattedTo
      ? parseFormattedDate(bookingData.formattedTo)
      : null;

    let bookingRows = [];

    if (fromDate && toDate && fromDate < toDate) {
      // Generate booking entries for each day from fromDate to (toDate - 1 day)
      const currentDate = new Date(fromDate);
      let dayCount = 0;
      while (currentDate < toDate) {
        const dayName = currentDate.toLocaleDateString("en-US", {
          weekday: "short",
        });
        const dayNum = currentDate.getDate();
        const monthName = currentDate.toLocaleDateString("en-US", {
          month: "short",
        });
        const monthFormatted = `${dayNum}-${monthName}`;

        // Use the same bookingId for all entries in a multi-day booking
        // Add day index as metadata in a hidden column for identification
        const dailyBookingId = bookingId; // Keep the same ID for all days

        // Create a row for this specific day
        const dailyRow = [
          dailyBookingId, // Same ID for all days
          dayName,
          monthFormatted,
          bookingData.client,
          bookingData.reqRooms,
          bookingData.confirm,
          bookingData.agent,
          bookingData.formattedFrom,
          bookingData.formattedTo,
          bookingData.nights,
          bookingData.voucherNoReconfirm,
          "", // Recon RM
          bookingData.formattedSafariDate || "",
          bookingData.arrivalDetails || "",
          "", // Sightings
          bookingData.guestContactInfo || "",
          bookingData.specialRequests || "", // Add hidden user tracking field with timestamp and day index
          bookingData.isEditing
            ? originalTrackingData[dayCount] ||
              `${bookingData.createdBy || "unknown"} (${bookingData.createdAt || new Date().toISOString()})`
            : `${bookingData.createdBy || "unknown"} (${bookingData.createdAt || new Date().toISOString()})`,
          // Add edit history column
          bookingData.isEditing
            ? originalEditHistory[dayCount]
              ? `${originalEditHistory[dayCount]}; ${bookingData.createdBy || "unknown"} edited on ${new Date().toISOString()}`
              : `${bookingData.createdBy || "unknown"} edited on ${new Date().toISOString()}`
            : "",
          // Add day index as metadata (hidden column) for multi-day bookings
          dayCount,
        ];

        bookingRows.push({
          row: dailyRow,
          dayNumber: dayNum,
          date: new Date(currentDate),
          monthFormatted: monthFormatted,
          dayIndex: dayCount,
        });

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        dayCount++;
      }

      console.log(
        `Generated ${bookingRows.length} daily booking entries from ${bookingData.formattedFrom} to ${bookingData.formattedTo} (excluding end date)`
      );
    } else {
      // Single day booking - use the original logic
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
        bookingData.arrivalDetails || "",
        "", // Sightings (not provided in bookingData)
        bookingData.guestContactInfo || "",
        bookingData.specialRequests || "", // Add hidden user tracking field with timestamp
        bookingData.isEditing
          ? originalTrackingData[0] ||
            `${bookingData.createdBy || "unknown"} (${bookingData.createdAt || new Date().toISOString()})`
          : `${bookingData.createdBy || "unknown"} (${bookingData.createdAt || new Date().toISOString()})`,
        // Add edit history column - append to existing history when editing
        bookingData.isEditing
          ? originalEditHistory[0]
            ? `${originalEditHistory[0]}; ${bookingData.createdBy || "unknown"} edited on ${new Date().toISOString()}`
            : `${bookingData.createdBy || "unknown"} edited on ${new Date().toISOString()}`
          : "",
        // Add day index (0 for single day bookings)
        0,
      ];

      let dayNumber = 0;
      if (bookingData.month) {
        const dayPart = bookingData.month.split("-")[0];
        dayNumber = parseInt(dayPart, 10);
      }

      bookingRows.push({
        row: newRow,
        dayNumber: dayNumber,
        date: fromDate || new Date(),
        monthFormatted: bookingData.month,
        dayIndex: 0,
      });
    }
    console.log("Booking rows to insert:", bookingRows.length);

    // Now process each booking row, inserting into the correct month's sheet
    for (
      let bookingIndex = 0;
      bookingIndex < bookingRows.length;
      bookingIndex++
    ) {
      const currentBooking = bookingRows[bookingIndex];
      const newRow = currentBooking.row;
      const dayNumber = currentBooking.dayNumber;
      const newBookingFromDate = currentBooking.date;

      // Determine the correct sheet for this specific booking entry
      const entryMonthName = currentBooking.date.toLocaleDateString("en-US", {
        month: "short",
      });
      const targetSheetName =
        getStandardizedMonthName(entryMonthName) || sheetName;

      console.log(
        `Processing booking ${bookingIndex + 1}/${bookingRows.length} for day ${dayNumber} (${currentBooking.monthFormatted}) -> target sheet: ${targetSheetName}`
      );

      // For cross-month bookings, we need to get the target sheet's data and ID
      let targetSheetId = sheetId; // Default to original sheet
      let targetRows = rows; // Default to original sheet's data
      let targetRange = range; // Default to original range

      // If this entry goes to a different sheet, get that sheet's data
      if (targetSheetName !== sheetName) {
        // Find the target sheet ID
        targetSheetId = null;
        for (const sheet of spreadsheetMetadata.data.sheets) {
          if (sheet.properties.title === targetSheetName) {
            targetSheetId = sheet.properties.sheetId;
            break;
          }
        }

        if (!targetSheetId) {
          console.error(`Target sheet '${targetSheetName}' not found`);
          throw new Error(`Target sheet '${targetSheetName}' not found`);
        }

        // Get fresh data from the target sheet
        targetRange = `${targetSheetName}!A:T`;
        const targetResponse = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: targetRange,
        });

        targetRows = targetResponse.data.values || [];
        console.log(
          `Retrieved ${targetRows.length} total rows from target sheet ${targetSheetName}`
        );

        // Filter out header row
        if (targetRows.length > 1) {
          targetRows = targetRows.slice(1);
        }
      }

      let insertIndex = 2;
      let inserted = false;

      // Extract year from current booking date
      let bookingYear = newBookingFromDate
        ? newBookingFromDate.getFullYear()
        : null;

      let yearBlockStart = -1;
      let yearBlockEnd = -1;
      let allYearHeaders = [];

      /**
       * How sorting works:
       * 1. First find all existing year headers and their positions
       * 2. If target year exists, find its block boundaries
       * 3. If target year doesn't exist, insert year header at the end of all data
       * 4. Within the year block, sort by day number then by from date
       */ // First pass: identify all year headers and find target year block in the target sheet
      for (let i = 0; i < targetRows.length; i++) {
        const currentRow = targetRows[i];

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
      } // If target year block was found, find its end
      if (yearBlockStart !== -1) {
        yearBlockEnd = targetRows.length - 1; // Default to end of data

        // Look for the next year header after our target year
        for (let i = yearBlockStart + 1; i < targetRows.length; i++) {
          const currentRow = targetRows[i];

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
        } // If no year to insert before, insert at the end
        if (!insertBeforeYear) {
          // Find the last row with data
          let lastDataRow = 1;
          for (let i = targetRows.length - 1; i >= 0; i--) {
            const currentRow = targetRows[i];
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
        ]; // Check if we need to expand the grid first
        const currentGridSize = await sheets.spreadsheets.get({
          spreadsheetId,
          ranges: [`${targetSheetName}!A:A`],
          includeGridData: false,
        });

        let gridRowCount = 1000;
        for (const sheet of currentGridSize.data.sheets) {
          if (sheet.properties.title === targetSheetName) {
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
                        sheetId: targetSheetId,
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
            range: `${targetSheetName}!A${yearInsertIndex}:R${yearInsertIndex}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [yearHeaderRow],
            },
          });
          console.log(
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
                      sheetId: targetSheetId,
                      startRowIndex: yearInsertIndex - 1, // The year header row
                      endRowIndex: yearInsertIndex, // Only this single row
                      startColumnIndex: 0, // Start from column A
                      endColumnIndex: 19, // Through column S
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
                      sheetId: targetSheetId,
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
          console.log(
            `Applied yellow background, bold text, and larger height to year header at row ${yearInsertIndex}`
          );

          insertIndex = yearInsertIndex + 1;
        } catch (error) {
          console.warn("Could not insert year header:", error.message);
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetName}!A:T`,
            valueInputOption: "USER_ENTERED",
            insertDataOption: "INSERT_ROWS",
            requestBody: {
              values: [yearHeaderRow],
            },
          });
          console.log("Appended year header at the end of sheet");
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
                      endRowIndex: appendedRowIndex, // Only this single row
                      startColumnIndex: 0, // Start from column A
                      endColumnIndex: 18, // Through column R
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
          console.log(
            `Applied yellow background, bold text, and larger height to appended year header at row ${appendedRowIndex}`
          );

          insertIndex = rows.length + 3;
        } // Update yearBlockStart and yearBlockEnd to reflect the new positions
        yearBlockStart = yearInsertIndex - 2; // Adjust for 0-based indexing
        yearBlockEnd = yearInsertIndex - 2; // CRITICAL FIX: After inserting a year header, we need to refresh the sheet data
        // because all row indices have shifted for rows that come after the insertion point
        if (insertBeforeYear) {
          console.log("Refreshing sheet data after year header insertion...");
          const refreshResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A2:S`,
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
          console.log(
            `Updated insertIndex to ${insertIndex} after data refresh`
          );
        }
      } else {
        // Year block exists, find correct position within it
        insertIndex = yearBlockStart + 3; // Start after year header (convert to 1-based)
        inserted = false;

        // Strategy: Find the correct day group and insert before its TOTAL row
        let dayGroupStart = -1;
        let dayGroupEnd = -1;
        let totalRowIndex = -1; // First, find if there's already a group for our target day
        for (let i = yearBlockStart + 1; i <= yearBlockEnd; i++) {
          if (i >= targetRows.length) break;

          const currentRow = targetRows[i];
          if (!currentRow || !currentRow[2] || currentRow[2].trim() === "") {
            continue;
          }
          const rowMonth = currentRow[2];
          console.log({ rowMonth }); // Check if this is a TOTAL row - be more specific
          if (rowMonth && rowMonth.trim().toLowerCase().startsWith("total")) {
            if (dayGroupStart !== -1) {
              // We found the end of our target day group with a TOTAL row
              dayGroupEnd = i - 1;
              totalRowIndex = i;
              console.log(
                `Found TOTAL row at index ${i} for day group starting at ${dayGroupStart}`
              );
              console.log(`TOTAL row content:`, currentRow);
              console.log(`TOTAL row is at sheet row: ${i + 2}`);
              break;
            }
            // If we hit a TOTAL row but haven't found our day group yet, continue looking
            continue;
          }

          const rowDayParts = rowMonth.split("-");
          if (rowDayParts.length === 2) {
            const rowDay = parseInt(rowDayParts[0], 10);
            if (rowDay === dayNumber) {
              // Found our target day group
              if (dayGroupStart === -1) {
                dayGroupStart = i;
                console.log(
                  `Found start of day group for day ${dayNumber} at index ${i}`
                );
              }
            } else if (dayGroupStart !== -1) {
              // We were in our target day group but now hit a different day
              dayGroupEnd = i - 1;
              console.log(
                `End of day group for day ${dayNumber} at index ${i - 1}`
              );
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

        // Additional check: if we found a day group but no TOTAL row,
        // scan ahead to see if there's a TOTAL row immediately after the day group
        if (dayGroupStart !== -1 && totalRowIndex === -1) {
          let scanStart =
            dayGroupEnd !== -1 ? dayGroupEnd + 1 : dayGroupStart + 1;
          for (let i = scanStart; i <= yearBlockEnd && i < rows.length; i++) {
            const currentRow = rows[i];
            if (
              currentRow &&
              currentRow[2] &&
              currentRow[2].toLowerCase().includes("total")
            ) {
              totalRowIndex = i;
              console.log(`Found TOTAL row at index ${i} after day group scan`);
              break;
            }
            // If we hit another day's data, stop scanning
            if (
              currentRow &&
              currentRow[2] &&
              currentRow[2].split("-").length === 2
            ) {
              const otherDayNum = parseInt(currentRow[2].split("-")[0], 10);
              if (!isNaN(otherDayNum) && otherDayNum !== dayNumber) {
                break;
              }
            }
          }
        }

        // If we found our target day group
        if (dayGroupStart !== -1) {
          if (totalRowIndex !== -1) {
            // Insert before the TOTAL row
            // CRITICAL FIX: Insert at totalRowIndex + 2 to get the correct sheet row position
            insertIndex = totalRowIndex + 2; // This converts 0-based array index to 1-based sheet row
            inserted = true;
            console.log(
              `Found day group for ${dayNumber} with TOTAL row at array index ${totalRowIndex}, which is sheet row ${totalRowIndex + 2}`
            );
            console.log(
              `FIXED: Setting insertIndex to ${insertIndex} (totalRowIndex + 2) to insert BEFORE the TOTAL row`
            );
            console.log(
              `After insertion, TOTAL row should be pushed to row ${insertIndex + 1}`
            );
          } else {
            // Find the end of the day group and insert there
            let endOfDayGroup = dayGroupEnd !== -1 ? dayGroupEnd : yearBlockEnd;

            // Look for the last actual booking entry in this day group
            for (let i = endOfDayGroup; i >= dayGroupStart; i--) {
              if (i >= rows.length) continue;
              const currentRow = rows[i];
              if (
                currentRow &&
                currentRow[2] &&
                currentRow[2].trim() !== "" &&
                !currentRow[2].toLowerCase().includes("total")
              ) {
                // Sort by fromDate within the same day
                if (currentRow.length >= 8 && currentRow[7]) {
                  const rowFromDate = parseFormattedDate(currentRow[7]);
                  if (newBookingFromDate >= rowFromDate) {
                    insertIndex = i + 3; // Insert after this entry
                    inserted = true;
                    console.log(
                      `Inserting after booking with date ${currentRow[7]} at row ${i + 3}`
                    );
                    break;
                  }
                }
              }
            }

            // If still not inserted, insert at the beginning of the day group
            if (!inserted) {
              insertIndex = dayGroupStart + 2;
              inserted = true;
              console.log(
                `Inserting at beginning of day group for ${dayNumber} at row ${dayGroupStart + 2}`
              );
            }
          }
        }

        // If not inserted yet, place at the end of the year block
        if (!inserted) {
          insertIndex = yearBlockEnd + 3;
          console.log(
            `No matching day found, inserting at end of year block at row ${yearBlockEnd + 3}`
          );
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
                "Email rcvd",
                "Special Request",
                "admin create log",
                "admin edit log",
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
          insertIndex = targetRows.length + 2;
        }
      } else {
        console.log(
          `Insert index ${insertIndex} exceeds grid size limit, appending to end instead`
        );
        insertIndex = targetRows.length + 2;
      }

      // Insert booking data with transparent background styling from column 2
      try {
        if (insertIndex > MAX_GRID_SIZE) {
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${targetSheetName}!A:T`,
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
            range: `${targetSheetName}!A${insertIndex}:T${insertIndex}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [newRow],
            },
          });
          console.log(
            `Successfully inserted booking data at row ${insertIndex}`
          );
        }

        // Apply transparent background styling from column 2 onwards with black text for entire row
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                // First apply black text to the entire row (columns A through R)
                repeatCell: {
                  range: {
                    sheetId: targetSheetId,
                    startRowIndex: insertIndex - 1, // The booking row
                    endRowIndex: insertIndex, // Only this single row
                    startColumnIndex: 0, // Start from column A (index 0)
                    endColumnIndex: 18, // Through column R
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
                    sheetId: targetSheetId,
                    startRowIndex: insertIndex - 1, // The booking row
                    endRowIndex: insertIndex, // Only this single row
                    startColumnIndex: 1, // Start from column B (index 1)
                    endColumnIndex: 18, // Through column R
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
        console.log(
          `Applied black text to entire row and transparent background from column B onwards to booking row ${insertIndex}`
        );
      } catch (error) {
        console.error("Error updating/appending values:", error);
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetName}!A:T`,
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
    } // End of booking loop

    // Check if agentEmail is valid before scheduling emails
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
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
