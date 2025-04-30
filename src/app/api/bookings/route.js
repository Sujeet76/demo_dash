import { getGoogleSheetsAuth, generateUUID, MONTH_NAMES, getMonthName, parseFormattedDate } from '@/utils/googleSheetsConfig';
import { google } from 'googleapis';

export async function POST(request) {
  try {

    console.log("Hitting the API route");
    const bookingData = await request.json();
    
    const credentials = {
      type: process.env.GOOGLE_APPLICATION_TYPE,
      project_id: process.env.GOOGLE_APPLICATION_PROJECT_ID,
      private_key_id: process.env.GOOGLE_APPLICATION_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_APPLICATION_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_APPLICATION_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_APPLICATION_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.GOOGLE_APPLICATION_CLIENT_CERT_URL,
      universe_domain: "googleapis.com"
    };    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    // Determine which sheet to use based on the formattedFrom date
    const fromDate = bookingData.formattedFrom;
    let sheetName = "Sheet1"; // Default sheet name
    
    if (fromDate) {
      // Extract month from fromDate (format is DD/MM/YYYY)
      const [day, month, year] = fromDate.split('/');
      
      // Get month name using the shared helper function
      const monthName = getMonthName(month);
      if (monthName) {
        sheetName = monthName;
      }
      
      console.log(`Using sheet for month: ${sheetName}`);
    }
    
    const range = `${sheetName}!A:Q`; // Range for 17 columns (A through Q)
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
    ];

    const auth = await getGoogleSheetsAuth(credentials);
    const sheets = google.sheets({ version: 'v4', auth });   

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:Q`, // Skip header row, include all columns (A-Q)
    });

    console.log({ response: response.data.values });
    
    const rows = response.data.values || [];

    const formattedToDate = parseFormattedDate(bookingData.formattedTo);
    
    let insertIndex = 2; 
    let inserted = false;
      for (let i = 0; i < rows.length; i++) {
      // Check if the row has enough elements
      if (rows[i].length >= 8) {
        // Since we added UUID as first column, formattedTo is now at index 8 (9th column)
        const rowFormattedTo = rows[i][8]; 
        console.log({rowFormattedTo});
        
        if (rowFormattedTo) {
          const rowDate = parseFormattedDate(rowFormattedTo);
          
          if (formattedToDate <= rowDate) {
            insertIndex = i + 2; 
            inserted = true;
            break;
          }
        }
      }
    }
    
    if (!inserted) {
      insertIndex = rows.length + 2; 
    }    // Get the sheet metadata to find the correct sheetId based on sheet name
    const spreadsheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId
    });

    // Find the sheet with the matching name
    let sheetId = null;
    for (const sheet of spreadsheetMetadata.data.sheets) {
      if (sheet.properties.title === sheetName) {
        sheetId = sheet.properties.sheetId;
        break;
      }
    }

    // If the sheet doesn't exist, create it
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
                  title: sheetName
                }
              }
            }
          ]
        }
      });
      
      // Get the ID of the newly created sheet
      sheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;
      
      // Add headers to the new sheet
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

    console.log(`Using sheet ID: ${sheetId} for ${sheetName}`);    // Now use the correct sheet ID for the batch update
    // Check if the insertIndex exceeds the grid size limit
    const MAX_GRID_SIZE = 2000; // Setting a safe limit below the 2099 mentioned in the error
    
    if (insertIndex <= MAX_GRID_SIZE) {
      // Only perform insertDimension if within grid size limits
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                insertDimension: {
                  range: {
                    sheetId: sheetId, // Using the retrieved sheet ID
                    dimension: "ROWS",
                    startIndex: insertIndex - 1, // 0-based index
                    endIndex: insertIndex // exclusive
                  }
                }
              }
            ]
          }
        });
      } catch (error) {
        console.warn('Warning: Could not insert dimension, will append instead:', error.message);
        // If insertion fails, we'll append at the end in the next step
        insertIndex = rows.length + 2;
      }
    } else {
      console.log(`Insert index ${insertIndex} exceeds grid size limit, appending to end instead`);
      insertIndex = rows.length + 2; // Fallback to appending at the end
    }
    try {
      // For large sheets with many rows, use append instead of update at a specific position
      if (insertIndex > MAX_GRID_SIZE) {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetName}!A:Q`,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values: [newRow]
          }
        });
        console.log('Successfully appended row at the end of the sheet');
      } else {
        // Use update for precise positioning within grid size limits
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A${insertIndex}:Q${insertIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [newRow]
          }
        });
        console.log(`Successfully inserted row at position ${insertIndex}`);
      }
    } catch (error) {
      console.error('Error updating/appending values:', error);
      // Fallback to append if update fails
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:Q`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [newRow]
        }
      });
      console.log('Fallback: Successfully appended row at the end of the sheet');
    }

    return Response.json({ success: true, insertedAt: insertIndex, uuid: bookingId });
  } catch (error) {
    console.error('Error in API route:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Using the imported parseFormattedDate function
