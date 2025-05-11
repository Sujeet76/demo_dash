import {
  getGoogleSheetsAuth,
  MONTH_NAMES,
  credentials,
} from "@/utils/googleSheetsConfig";
import { google } from "googleapis";

export async function GET(request) {
  try {
    // Get URL parameters for sorting
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "count"; // Default sort by count
    const sortOrder = searchParams.get("sortOrder") || "desc"; // Default descending order

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const auth = await getGoogleSheetsAuth(credentials);
    const sheets = google.sheets({ version: "v4", auth });

    // Company column is the "Agent" field at index 6
    const companyColumnIndex = 6;

    let companyBookings = {};

    // Process all sheets
    for (const sheetName of MONTH_NAMES) {
      try {
        // Get data from each sheet
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A:Z`,
        });

        const rows = response.data.values || [];

        if (rows.length > 0) {
          // Skip header row
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];

            // Skip empty rows or rows without company info
            if (!row || row.length === 0 || !row[companyColumnIndex]) continue;

            // Get company name and normalize it (trim and convert to lowercase for consistency)
            const company = row[companyColumnIndex].trim();
            
            // Count rooms booked (reqRooms is at index 4)
            const roomsBooked = parseInt(row[4]) || 1; // Default to 1 if not specified
            
            // Initialize company entry if it doesn't exist
            if (!companyBookings[company]) {
              companyBookings[company] = {
                companyName: company,
                bookingCount: 0,
                roomsBooked: 0,
              };
            }

            // Increment counters
            companyBookings[company].bookingCount++;
            companyBookings[company].roomsBooked += roomsBooked;
          }
        }
      } catch (error) {
        console.error(`Error processing sheet ${sheetName}:`, error);
      }
    }

    // Convert to array for sorting
    let companiesArray = Object.values(companyBookings);

    // Sort the array based on the sortBy and sortOrder parameters
    companiesArray.sort((a, b) => {
      const sortField = sortBy === "name" ? "companyName" : 
                        sortBy === "rooms" ? "roomsBooked" : "bookingCount";
      
      if (sortOrder === "asc") {
        if (sortField === "companyName") {
          return a[sortField].localeCompare(b[sortField]);
        }
        return a[sortField] - b[sortField];
      } else {
        if (sortField === "companyName") {
          return b[sortField].localeCompare(a[sortField]);
        }
        return b[sortField] - a[sortField];
      }
    });

    return Response.json({
      success: true,
      companies: companiesArray,
    });
  } catch (error) {
    console.error("Error fetching booking counts by company:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
