import { credentials, getGoogleSheetsAuth, MONTH_NAMES } from '@/utils/googleSheetsConfig';
import { google } from 'googleapis';

export async function DELETE(request) {
  try {
    const { uuid, deletedBy } = await request.json();
    
    if (!uuid) {
      return Response.json({ success: false, error: 'Booking UUID is required' }, { status: 400 });
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const auth = await getGoogleSheetsAuth(credentials);
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get spreadsheet metadata to find all sheets
    const spreadsheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId
    });    // Using our shared MONTH_NAMES constant
      // Check each month sheet and Sheet1 for the booking
    const sheetsToCheck = [...MONTH_NAMES, "Sheet1"];
    
    let foundEntries = []; // Will store all matching entries
    let foundSheetId = null;
    
    // Search in each sheet for the UUID (including multi-day entries)
    for (const sheetName of sheetsToCheck) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A2:T`, // Updated to include day index column
        });
        
        if (response.data.values && response.data.values.length > 0) {
          console.log(`Checking ${sheetName} for UUID ${uuid}`);
          const rows = response.data.values;
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row && row.length > 0 && row[0] === uuid) {
              // Found an entry with matching base UUID
              foundEntries.push({
                sheetName: sheetName,
                rowIndex: i + 2, // +2 because we start at row 2 and Google Sheets is 1-indexed
                rowData: row,
                dayIndex: row[19] || 0 // Day index from column T (index 19)
              });
              console.log(
                `Found booking entry at row ${i + 2} in ${sheetName} (day index: ${row[19] || 0})`
              );
              
              // Find the sheet ID for this sheet if not already found
              if (!foundSheetId) {
                for (const sheet of spreadsheetMetadata.data.sheets) {
                  if (sheet.properties.title === sheetName) {
                    foundSheetId = sheet.properties.sheetId;
                    break;
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        // Sheet might not exist, just continue
        console.log(`Sheet ${sheetName} doesn't exist or is empty`);
      }
    }

    if (foundEntries.length === 0 || foundSheetId === null) {
      return Response.json({ 
        success: false, 
        error: 'Booking not found in any sheet' 
      }, { status: 404 });
    }
    
    console.log(`Found ${foundEntries.length} booking entries with UUID ${uuid}`);
    
    // Sort entries by day index to maintain order when moving to deleted sheet
    foundEntries.sort((a, b) => (a.dayIndex || 0) - (b.dayIndex || 0));    
    // Instead of actually deleting the rows, let's move them to a "Deleted" sheet
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
        range: "Deleted!A1:U1",
        valueInputOption: "RAW",
        resource: {
          values: [[
            "UUID", "Day", "Month", "Client", "Rooms", "Status",
            "Agent", "From", "To", "Nights", "Voucher", "Safari",
            "Safari Date", "Arrival", "Contact", "Requests", "Created By", "Edit History",
            "Day Index", "Deleted By", "Deleted On"
          ]]
        }
      });
    }
    
    // Move all entries to Deleted sheet with deletion metadata
    const entriesToDelete = [];
    for (const entry of foundEntries) {
      const extendedRowData = [
        ...entry.rowData, 
        deletedBy || "unknown", 
        new Date().toISOString()
      ];
      entriesToDelete.push(extendedRowData);
    }
    
    // Add all entries to Deleted sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Deleted!A2:U",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: entriesToDelete,
      },
    });
    
    // Now delete the original rows (in reverse order to maintain indices)
    // Group by sheet and sort by row index descending
    const entriesBySheet = {};
    foundEntries.forEach(entry => {
      if (!entriesBySheet[entry.sheetName]) {
        entriesBySheet[entry.sheetName] = [];
      }
      entriesBySheet[entry.sheetName].push(entry);
    });
    
    // Delete from each sheet
    for (const [sheetName, entries] of Object.entries(entriesBySheet)) {
      // Sort by row index descending to delete from bottom up
      entries.sort((a, b) => b.rowIndex - a.rowIndex);
      
      // Find sheet ID for this sheet
      let currentSheetId = null;
      for (const sheet of spreadsheetMetadata.data.sheets) {
        if (sheet.properties.title === sheetName) {
          currentSheetId = sheet.properties.sheetId;
          break;
        }
      }
      
      if (currentSheetId) {
        // Delete each row
        for (const entry of entries) {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [
                {
                  deleteDimension: {
                    range: {
                      sheetId: currentSheetId,
                      dimension: 'ROWS',
                      startIndex: entry.rowIndex - 1, // 0-indexed
                      endIndex: entry.rowIndex // exclusive
                    }
                  }
                }
              ]
            }
          });
          
          console.log(`Deleted row ${entry.rowIndex} from sheet ${sheetName}`);
        }
      }
    }
    
    return Response.json({ 
      success: true, 
      message: `Deleted ${foundEntries.length} booking entries with UUID ${uuid} from ${Object.keys(entriesBySheet).length} sheet(s)`,
      deletedEntries: foundEntries.length
    });
  } catch (error) {
    console.error('Error deleting booking from Google Sheets:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
