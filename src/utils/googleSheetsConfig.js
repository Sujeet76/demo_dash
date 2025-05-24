import { google } from 'googleapis';
import nodeFetch from 'node-fetch';

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
  if (!dateStr) return null;

  try {
    const parts = dateStr.trim().split("/");
    if (parts.length !== 3) return null;

    // Extract day, month, year from the DD/MM/YYYY format
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JavaScript Date
    const year = parseInt(parts[2], 10);

    // Check if the values are valid
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    // Create date with UTC time to avoid timezone issues
    return new Date(Date.UTC(year, month, day));
  } catch (error) {
    console.error(`Error parsing date: ${dateStr}`, error);
    return null;
  }
}

export const getGoogleSheetsAuth = async (credentials) => {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  return auth;
};

export function normalizeDateForComparison(date) {
  if (!date) return null;

  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}


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

// Helper functions for user tracking
export function formatUserAction(username, action, timestamp = null) {
  const dateTime = timestamp ? new Date(timestamp) : new Date();
  return `${username || 'unknown'} (${action}) ${dateTime.toLocaleString()}`;
}

// Function to extract user information from a tracking string
export function parseUserTracking(trackingString) {
  if (!trackingString) return { username: 'unknown', timestamp: null };
  
  const match = trackingString.match(/^(.*?)\s*\((.*?)\)\s*(.*)$/);
  if (match) {
    return {
      username: match[1].trim(),
      action: match[2].trim(),
      timestamp: match[3].trim()
    };
  }
  
  return { username: trackingString, action: '', timestamp: null };
}

/**
 * Export Google Sheet as PDF
 * @param {Object} auth - Authenticated Google API client
 * @param {string} spreadsheetId - ID of the spreadsheet
 * @param {string} sheetName - Name of the sheet to export (optional)
 * @returns {Promise<Buffer>} - PDF content as Buffer
 */
export const exportSheetAsPDF = async (auth, spreadsheetId, sheetName = null) => {
  try {
    console.log(`Starting PDF export for spreadsheet: ${spreadsheetId}, sheet: ${sheetName || 'default'}`);
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get spreadsheet info to get the default sheet ID if needed
    let sheetId = 0; // Default to first sheet
    
    if (sheetName) {
      // Get all sheets in the spreadsheet to find the ID of the requested sheet
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties'
      });
      
      const targetSheet = spreadsheet.data.sheets.find(
        sheet => sheet.properties.title === sheetName
      );
      
      if (targetSheet) {
        sheetId = targetSheet.properties.sheetId;
      } else {
        console.warn(`Sheet "${sheetName}" not found, using default sheet`);
      }
    }
    
    // Export URL format for PDF
    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=pdf&gid=${sheetId}`;
    console.log(`Using export URL: ${exportUrl}`);
    
    try {
      // First, try using Drive API to export the file
      // If Drive API fails, try a direct fetch to the export URL
      const response = await nodeFetch(exportUrl, {
        headers: {
          Authorization: `Bearer ${(await auth.getAccessToken()).token}`,
        },
      });

      if (!response.ok) {
        console.log({response})
        throw new Error(
          `Export request failed with status: ${response.status}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log(
        `PDF export successful via direct fetch, size: ${arrayBuffer.byteLength} bytes`
      );
      return Buffer.from(arrayBuffer);
    } catch (driveError) {
      console.error('Drive API export failed, trying alternative method...', driveError);
      
      throw driveError
    }
  } catch (error) {
    console.error('Error exporting sheet as PDF:', error);
    throw error;
  }
};

/**
 * Export Google Sheet as Excel
 * @param {Object} auth - Authenticated Google API client
 * @param {string} spreadsheetId - ID of the spreadsheet
 * @returns {Promise<Buffer>} - Excel content as Buffer
 */
export const exportSheetAsExcel = async (auth, spreadsheetId) => {
  try {
    console.log(`Starting Excel export for spreadsheet: ${spreadsheetId}`);
    
    try {
      // Use Drive API to download the file as Excel
      const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
      const response = await nodeFetch(exportUrl, {
        headers: {
          Authorization: `Bearer ${(await auth.getAccessToken()).token}`,
        },
      });
      if (!response.ok) {
        throw new Error(
          `Export request failed with status: ${response.status}`
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      console.log(
        `Excel export successful via direct fetch, size: ${arrayBuffer.byteLength} bytes`
      );
      return Buffer.from(arrayBuffer);
    } catch (driveError) {
      console.error('Drive API export failed, trying alternative method...', driveError);
      throw driveError;
    }
  } catch (error) {
    console.error('Error exporting sheet as Excel:', error);
    throw error;
  }
};

/**
 * Get a download link for the original Google Sheet
 * @param {string} spreadsheetId - ID of the spreadsheet
 * @returns {string} - URL to access the sheet
 */
export const getGoogleSheetViewLink = (spreadsheetId) => {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/view`;
};

/**
 * Get a download link for the Google Sheet as Excel
 * @param {string} spreadsheetId - ID of the spreadsheet
 * @returns {string} - URL to download the sheet as Excel
 */
export const getGoogleSheetExcelDownloadLink = (spreadsheetId) => {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
};
