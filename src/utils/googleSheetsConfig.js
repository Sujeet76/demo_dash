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

export const credentials = {
  type: process.env.GOOGLE_APPLICATION_TYPE,
  project_id: process.env.GOOGLE_APPLICATION_PROJECT_ID,
  private_key_id: process.env.GOOGLE_APPLICATION_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_APPLICATION_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  ),
  client_email: process.env.GOOGLE_APPLICATION_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_APPLICATION_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.GOOGLE_APPLICATION_CLIENT_CERT_URL,
  universe_domain: "googleapis.com",
};

export const MONTH_NAME_MAP = {
  // January variations
  jan: "Jan",
  january: "Jan",
  1: "Jan",
  "01": "Jan",

  // February variations
  feb: "Feb",
  february: "Feb",
  2: "Feb",
  "02": "Feb",

  // March variations
  mar: "March",
  march: "March",
  3: "March",
  "03": "March",

  // April variations
  apr: "April",
  april: "April",
  4: "April",
  "04": "April",

  // May variations
  may: "May",
  5: "May",
  "05": "May",

  // June variations
  jun: "June",
  june: "June",
  6: "June",
  "06": "June",

  // July variations
  jul: "July",
  july: "July",
  7: "July",
  "07": "July",

  // August variations
  aug: "Aug",
  august: "Aug",
  8: "Aug",
  "08": "Aug",

  // September variations
  sep: "Sep",
  sept: "Sep",
  september: "Sep",
  9: "Sep",
  "09": "Sep",

  // October variations
  oct: "Oct",
  october: "Oct",
  10: "Oct",

  // November variations
  nov: "Nov",
  november: "Nov",
  11: "Nov",

  // December variations
  dec: "Dec",
  december: "Dec",
  12: "Dec",
};


export const getStandardizedMonthName = (monthText) => {
  if (!monthText) return null;

  // Convert to lowercase for case-insensitive matching
  const normalized = monthText.toLowerCase();

  // Return the standardized name or null if not found
  return MONTH_NAME_MAP[normalized] || null;
};
