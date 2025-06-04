import {
  getGoogleSheetsAuth,
  MONTH_NAMES,
  credentials,
  parseUserTracking
} from "@/utils/googleSheetsConfig";
import { google } from "googleapis";

export async function GET(request) {
  try {
    // Check authentication - in a real app, add proper auth check here
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get("adminKey");
    
    // Simple adminKey check (replace with proper auth in production)
    if (adminKey !== process.env.NEXT_PUBLIC_ADMIN_KEY) {
      return Response.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }
    
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const auth = await getGoogleSheetsAuth(credentials);
    const sheets = google.sheets({ version: "v4", auth });

    // Array to hold all tracked actions
    const allTrackedActions = [];
    
    // Process main sheets
    for (const sheetName of [...MONTH_NAMES, "Sheet1"]) {
      try {
        // Get data including the tracking columns
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A2:S`,
        });

        if (response.data.values && response.data.values.length > 0) {
          const rows = response.data.values;
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row.length >= 17) {
              const createdByInfo = row[17] || '';
              const editHistory = row[18] || '';
              
              if (createdByInfo) {
                allTrackedActions.push({
                  sheetName,
                  rowIndex: i + 2, // 1-indexed + header row
                  uuid: row[0],
                  client: row[3],
                  actionType: 'created',
                  trackingInfo: createdByInfo,
                  parsedInfo: parseUserTracking(createdByInfo,"created")
                });
              }
              
              if (editHistory) {
                // Split by semicolon to get multiple edits
                const edits = editHistory.split(';').map(edit => edit.trim());
                
                edits.forEach(edit => {
                  if (edit) {
                    allTrackedActions.push({
                      sheetName,
                      rowIndex: i + 2,
                      uuid: row[0],
                      client: row[3],
                      actionType: 'edited',
                      trackingInfo: edit,
                      parsedInfo: parseUserTracking(edit, "edited")
                    });
                  }
                });
              }
            }
          }
        }
      } catch (error) {
        console.log(`Error processing ${sheetName}: ${error.message}`);
      }
    }
    
    // Also check the Deleted sheet
    try {
      const deletedResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `Deleted!A2:T`,
      });
      
      if (deletedResponse.data.values && deletedResponse.data.values.length > 0) {
        const rows = deletedResponse.data.values;
        
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row.length >= 19) {
            const deletedBy = row[18] || '';
            const deletedOn = row[19] || '';
            
            if (deletedBy) {
              allTrackedActions.push({
                sheetName: 'Deleted',
                rowIndex: i + 2,
                uuid: row[0],
                client: row[3],
                actionType: 'deleted',
                trackingInfo: `${deletedBy} deleted on ${deletedOn}`,
                parsedInfo: {
                  username: deletedBy,
                  timestamp: deletedOn,
                  action: 'deleted',
                }
              });
            }
          }
        }
      }
    } catch (error) {
      console.log(`Deleted sheet might not exist: ${error.message}`);
    }
    
    // Sort by timestamp (newest first)
    // Sort by timestamp (newest first)
    allTrackedActions.sort((a, b) => {
      const timeA = a.parsedInfo.timestamp ? new Date(a.parsedInfo.timestamp).getTime() : 0;
      const timeB = b.parsedInfo.timestamp ? new Date(b.parsedInfo.timestamp).getTime() : 0;
      return timeB - timeA;
    });
    
    // Group by UUID and add count
    const uuidGroups = {};
    allTrackedActions.forEach(action => {
      if (!uuidGroups[action.uuid]) {
      uuidGroups[action.uuid] = {
        ...action,
        count: 1
      };
      } else {
      uuidGroups[action.uuid].count++;
      }
    });
    
    // Convert back to array
    const groupedActions = Object.values(uuidGroups);
    
    return Response.json({
      success: true,
      trackingData: groupedActions
    });
  } catch (error) {
    console.error("Error fetching user tracking data:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
