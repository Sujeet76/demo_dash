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
        if(standardizedMonthName) {
          sheetName = standardizedMonthName;
        }
      }

      console.log(`Using sheet for month: ${sheetName}`);
    }

    const range = `${sheetName}!A:S`; // Range for 19 columns (A through S, including the hidden user columns)
    const bookingId = bookingData.uuid || generateUUID();

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
      bookingData.safari,
      bookingData.formattedSafariDate,
      bookingData.arrivalDetails,
      bookingData.guestContactInfo,
      bookingData.specialRequests,
      // Add hidden user tracking field with timestamp
      bookingData.isEditing ? 
        (rows.find(row => row[0] === bookingId)?.[16] || `${bookingData.createdBy || 'unknown'} (${bookingData.createdAt ? new Date(bookingData.createdAt).toLocaleString() : new Date().toLocaleString()})`) : 
        `${bookingData.createdBy || 'unknown'} (${bookingData.createdAt ? new Date(bookingData.createdAt).toLocaleString() : new Date().toLocaleString()})`,
      // Add edit history column - append to existing history when editing
      bookingData.isEditing ? 
        (rows.find(row => row[0] === bookingId)?.[17] ? 
          `${rows.find(row => row[0] === bookingId)[17]}; Edited by ${bookingData.createdBy || 'unknown'} on ${new Date().toLocaleString()}` : 
          `Edited by ${bookingData.createdBy || 'unknown'} on ${new Date().toLocaleString()}`) : 
        '',
    ];

    const auth = await getGoogleSheetsAuth(credentials);
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:R`
    });

    const rows = response.data.values || [];

    let dayNumber = 0;
    if (bookingData.month) {
      const dayPart = bookingData.month.split("-")[0];
      dayNumber = parseInt(dayPart, 10);
    }

    let insertIndex = 2;
    let inserted = false;
    const newBookingFromDate = bookingData.formattedFrom
      ? parseFormattedDate(bookingData.formattedFrom)
      : new Date(0);
    

    /**
     * How sorting works:
     *  |-> first find the correct position according to the day number then gives preference to from month
     */
    for (let i = 0; i < rows.length; i++) {
      // Check if the row has month data
      if (rows[i].length >= 3 && rows[i][2]) {
        const rowMonth = rows[i][2]; // month column
        const rowDayParts = rowMonth.split("-");

        if (rowDayParts.length === 2) {
          const rowDay = parseInt(rowDayParts[0], 10);

          // Primary sort by day number within the month
          if (dayNumber < rowDay) {
            insertIndex = i + 2;
            inserted = true;
            break;
          } else if (dayNumber === rowDay) {
            // If days are equal, sort by fromDate within the same day
            // The from date is at index 7
            if (rows[i].length >= 8 && rows[i][7]) {
              const rowFromDate = parseFormattedDate(rows[i][7]);

              if (newBookingFromDate < rowFromDate) {
                insertIndex = i + 2;
                inserted = true;
                break;
              }
            }
          }
        }
      }
    }

    if (!inserted) {
      insertIndex = rows.length + 2;
    }

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

    if (sheetId === null) {
      console.log(`Sheet ${sheetName} not found. Creating it.`);

      // Create the new sheet
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
              // "Special Requests",
              // "Created At",
            ],
          ],
        },
      });
    }

    console.log(`Using sheet ID: ${sheetId} for ${sheetName}`);

    const MAX_GRID_SIZE = 2000;

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
        console.log("Successfully appended row at the end of the sheet");
      } else {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A${insertIndex}:R${insertIndex}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [newRow],
          },
        });
        console.log(`Successfully inserted row at position ${insertIndex}`);
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

    console.log({
      uuid: "booking-123",
      client: "John Doe",
      agentName: "Travel Partner",
      fromDate: bookingData.formattedFrom,
      toDate: bookingData.formattedTo,
      formattedFrom: bookingData.formattedFrom,
      formattedTo: bookingData.formattedTo,
    });


    const scheduledEmails = await scheduleBookingEmails(
      bookingData.agentEmail,
      {
        uuid: bookingId,
        client: bookingData.client,
        agentName: bookingData.agentName || "Travel Partner",
        fromDate: bookingData.formattedFrom,
        toDate: bookingData.formattedTo,
        formattedFrom: bookingData.formattedFrom,
        formattedTo: bookingData.formattedTo,
      }
    );

    console.log({ scheduledEmails });

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
