import { getGoogleSheetsAuth, MONTH_NAMES } from '@/utils/googleSheetsConfig';
import { google } from 'googleapis';

export async function DELETE(request) {
  try {
    const { uuid, deletedBy } = await request.json();
    
    if (!uuid) {
      return Response.json({ success: false, error: 'Booking UUID is required' }, { status: 400 });
    }

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
    };

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const auth = await getGoogleSheetsAuth(credentials);
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get spreadsheet metadata to find all sheets
    const spreadsheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId
    });    // Using our shared MONTH_NAMES constant
    
    // Check each month sheet and Sheet1 for the booking
    const sheetsToCheck = [...MONTH_NAMES, "Sheet1"];
    
    let foundSheet = null;
    let rowIndexToDelete = -1;
    let foundSheetId = null;
    
    // Search in each sheet for the UUID
    for (const sheetName of sheetsToCheck) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A2:S`, // Updated to include both extra columns
        });
        
        if (response.data.values && response.data.values.length > 0) {
          console.log(`Checking ${sheetName} for UUID ${uuid}`);
          const rows = response.data.values;
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row && row.length > 0 && row[0] === uuid) {
              rowIndexToDelete = i + 2; // +2 because we start at row 2 and Google Sheets is 1-indexed
              foundSheet = sheetName;
              
              // Find the sheet ID for this sheet
              for (const sheet of spreadsheetMetadata.data.sheets) {
                if (sheet.properties.title === sheetName) {
                  foundSheetId = sheet.properties.sheetId;
                  break;
                }
              }
              break;
            }
          }
          
          if (foundSheet) break; // Stop searching if we found it
        }
      } catch (error) {
        // Sheet might not exist, just continue
        console.log(`Sheet ${sheetName} doesn't exist or is empty`);
      }
    }

    if (!foundSheet || rowIndexToDelete === -1 || foundSheetId === null) {
      return Response.json({ 
        success: false, 
        error: 'Booking not found in any sheet' 
      }, { status: 404 });
    }
    
    console.log(`Found booking with UUID ${uuid} in sheet ${foundSheet} at row ${rowIndexToDelete}`);
    
    // Instead of actually deleting the row, let's move it to a "Deleted" sheet
    // First, get the row data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${foundSheet}!A${rowIndexToDelete}:S${rowIndexToDelete}`,
    });
    
    const rowData = response.data.values[0];
    
    // Check if "Deleted" sheet exists, if not create it
    let deletedSheetExists = false;
    let deletedSheetId = null;
    
    for (const sheet of spreadsheetMetadata.data.sheets) {
      if (sheet.properties.title === "Deleted") {
        deletedSheetExists = true;
        deletedSheetId = sheet.properties.sheetId;
        break;
      }
    }
    
    if (!deletedSheetExists) {
      // Create Deleted sheet
      const addSheetResponse = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: "Deleted"
              }
            }
          }]
        }
      });
      
      deletedSheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;
      
      // Add headers to Deleted sheet
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Deleted!A1:T1",
        valueInputOption: "RAW",
        resource: {
          values: [[
            "UUID", "Day", "Month", "Client", "Rooms", "Status",
            "Agent", "From", "To", "Nights", "Voucher", "Safari",
            "Safari Date", "Arrival", "Contact", "Requests", "Created By", "Edit History",
            "Deleted By", "Deleted On"
          ]]
        }
      });
    }
    
    // Add the row to Deleted sheet with deletion metadata
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Deleted!A2:T",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[
          ...rowData,
          deletedBy || "unknown",
          new Date().toLocaleString()
        ]]
      }
    });
    
    // Now delete the original row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: foundSheetId,
                dimension: 'ROWS',
                startIndex: rowIndexToDelete - 1, // 0-indexed
                endIndex: rowIndexToDelete // exclusive
              }
            }
          }
        ]
      }
    });
    
    return Response.json({ 
      success: true, 
      message: `Booking deleted from sheet ${foundSheet} at row ${rowIndexToDelete}` 
    });
  } catch (error) {
    console.error('Error deleting booking from Google Sheets:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
