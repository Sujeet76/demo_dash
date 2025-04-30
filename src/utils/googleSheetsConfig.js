import { google } from 'googleapis';

// Generate a UUID v4
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0,
          v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Month names in order
export const MONTH_NAMES = [
  "Jan", "Feb", "March", "April", "May", "June", 
  "July", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Helper function to get month name from month number (1-12)
export const getMonthName = (monthNumber) => {
  const index = parseInt(monthNumber) - 1;
  return index >= 0 && index < 12 ? MONTH_NAMES[index] : null;
};

// Parse date in DD/MM/YYYY format to a Date object
export function parseFormattedDate(dateStr) {
  if (!dateStr) return new Date(0); 
  
  try {
    const [day, month, year] = dateStr.split('/');
    if (!day || !month || !year) return new Date(0);
    return new Date(year, month - 1, day);
  } catch (error) {
    console.error(`Error parsing date: ${dateStr}`, error);
    return new Date(0); // Default to earliest date if there's a parsing error
  }
}

export const getGoogleSheetsAuth = async (credentials) => {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  return auth;
};

// Function to append data to a Google Sheet
export const appendToSheet = async (auth, spreadsheetId, range, values) => {
  const sheets = google.sheets({ version: 'v4', auth });
  
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [values]
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error appending data to sheet:', error);
    throw error;
  }
};

// Function to insert data at specific position in a Google Sheet
export const insertRowAtPosition = async (auth, spreadsheetId, sheetId, rowIndex, values) => {
  const sheets = google.sheets({ version: 'v4', auth });
  
  try {
    // Insert empty row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowIndex - 1, 
                endIndex: rowIndex 
              }
            }
          }
        ]
      }
    });
    
    // Fill the row with data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!A${rowIndex}:P${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values]
      }
    });
    
    return { rowIndex };
  } catch (error) {
    console.error('Error inserting row into sheet:', error);
    throw error;
  }
};
