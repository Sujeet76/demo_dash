import {
  getGoogleSheetsAuth,
  generateUUID,
  MONTH_NAMES,
  parseFormattedDate,
} from "@/utils/googleSheetsConfig";
import { google } from 'googleapis';

export async function GET(request) {
  try {
    // Get URL parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const month = searchParams.get('month'); // Optional month filter
    
    // Get credentials from environment variables
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

    const auth = await getGoogleSheetsAuth(credentials);
    const sheets = google.sheets({ version: 'v4', auth });

    // Get spreadsheet metadata to find all sheets
    const spreadsheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId
    });   
    
    let allRows = [];
      // Determine which sheets to check based on the month parameter
    let sheetsToCheck = [];
    
    if (month) {      // If a specific month is requested, only check that month's sheet
      const monthIndex = MONTH_NAMES.findIndex(m => 
        m.toLowerCase() === month.toLowerCase()
      );
      
      if (monthIndex !== -1) {
        sheetsToCheck = [MONTH_NAMES[monthIndex]];
      } else {        // If month doesn't match exactly, try to find a close match
        const matchingMonth = MONTH_NAMES.find(m => 
          m.toLowerCase().startsWith(month.toLowerCase())
        );
        
        if (matchingMonth) {
          sheetsToCheck = [matchingMonth];
        } else {
          // If no match found, return empty result
          return Response.json({ 
            success: true, 
            bookings: [],
            pagination: { 
              page, 
              pageSize, 
              totalItems: 0, 
              totalPages: 0,
              availableMonths: MONTH_NAMES
            }
          });
        }
      }    } else {
      // If no month specified, check all sheets
      sheetsToCheck = [...MONTH_NAMES, "Sheet1"];
    }
    
    // Get data from specified sheets
    for (const sheetName of sheetsToCheck) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A2:Q`,
        });
        
        if (response.data.values && response.data.values.length > 0) {
          console.log(`Found ${response.data.values.length} rows in ${sheetName}`);
          // Add sheetName to each row for reference
          const sheetRows = response.data.values.map(row => {
            return { sheetName, row };
          });
          allRows = [...allRows, ...sheetRows];
        }
      } catch (error) {
        // Sheet might not exist, just continue
        console.log(`Sheet ${sheetName} doesn't exist or is empty`);
      }
    }    // Extract just the row data
    const rows = allRows.map(item => item.row);
    const bookings = rows.map((row, index) => {
      return {
        uuid: row[0] || generateUUID(),
        id: Date.now() + index,
        sheetName: allRows[index].sheetName, // Include sheet name (month)
        day: row[1] || '',
        month: row[2] || '',
        client: row[3] || '',
        reqRooms: row[4] || '',
        confirm: row[5] || 'Pending',
        agent: row[6] || '',
        formattedFrom: row[7] || '',
        formattedTo: row[8] || '',
        nights: row[9] || '',
        voucherNoReconfirm: row[10] || '',
        safari: row[11] || 'No',
        formattedSafariDate: row[12] || '',
        arrivalDetails: row[13] || '',
        guestContactInfo: row[14] || '',
        specialRequests: row[15] || '',
        toDate: parseFormattedDate(row[8] || '')
      };
    });
    
    // Sort bookings by date
    bookings.sort((a, b) => a.toDate - b.toDate);
    
    // Calculate total items and pages for pagination
    const totalItems = bookings.length;
    const totalPages = Math.ceil(totalItems / pageSize);
      // Get available months (actually existing in the spreadsheet)
    const availableMonths = [...new Set(allRows.map(item => item.sheetName))].filter(
      sheet => MONTH_NAMES.includes(sheet)
    );
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedBookings = bookings.slice(startIndex, endIndex);

    // console.log({paginatedBookings})

    return Response.json({ 
      success: true, 
      bookings: paginatedBookings,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        availableMonths
      }
    });
    
// Using the imported parseFormattedDate function
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
