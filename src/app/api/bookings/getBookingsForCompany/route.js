import {
  getGoogleSheetsAuth,
  generateUUID,
  MONTH_NAMES,
  parseFormattedDate,
  credentials,
  normalizeDateForComparison,
} from "@/utils/googleSheetsConfig";
import { google } from "googleapis";

export async function GET(request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const company = searchParams.get("company"); // Required company name
    const sortBy = searchParams.get("sortBy") || "fromDate"; // Default sort by fromDate
    const sortOrder = searchParams.get("sortOrder") || "asc"; // Default ascending order
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    // If no company is specified, return an error
    if (!company) {
      return Response.json(
        { success: false, error: "Company parameter is required" },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const auth = await getGoogleSheetsAuth(credentials);
    const sheets = google.sheets({ version: "v4", auth });

    let allRows = [];

    // Process all sheets
    for (const sheetName of MONTH_NAMES) {
      try {
        // Get data from each sheet
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A2:S`, // Updated to include both extra columns
        });

        if (response.data.values && response.data.values.length > 0) {
          // Add sheetName to each row for reference
          const sheetRows = response.data.values
            // Filter by company (agent is at index 6)
            .filter(row => row[6] && row[6].trim().toLowerCase() === company.toLowerCase())
            .map((row) => {
              return { sheetName, row };
            });
          allRows = [...allRows, ...sheetRows];
        }
      } catch (error) {
        // Sheet might not exist, just continue
        console.log(`Sheet ${sheetName} doesn't exist or is empty`);
      }
    }

    // Extract just the row data and convert to booking objects
    const bookings = allRows.map((item, index) => {
      const row = item.row;
      return {
        uuid: row[0] || generateUUID(),
        id: Date.now() + index,
        sheetName: item.sheetName, // Include sheet name (month)
        day: row[1] || "",
        month: row[2] || "",
        client: row[3] || "",
        reqRooms: row[4] || "",
        confirm: row[5] || "Pending",
        agent: row[6] || "",
        formattedFrom: row[7] || "",
        formattedTo: row[8] || "",
        nights: row[9] || "",
        voucherNoReconfirm: row[10] || "",
        safari: row[11] || "No",
        formattedSafariDate: row[12] || "",
        arrivalDetails: row[13] || "",
        guestContactInfo: row[14] || "",
        specialRequests: row[15] || "",
        fromDate: parseFormattedDate(row[7] || ""),
        toDate: parseFormattedDate(row[8] || ""),
      };
    });

    // Sort bookings based on parameters
    bookings.sort((a, b) => {
      let fieldA, fieldB;
      
      switch(sortBy) {
        case "fromDate":
          fieldA = a.fromDate ? a.fromDate.getTime() : 0;
          fieldB = b.fromDate ? b.fromDate.getTime() : 0;
          break;
        case "toDate":
          fieldA = a.toDate ? a.toDate.getTime() : 0;
          fieldB = b.toDate ? b.toDate.getTime() : 0;
          break;
        case "client":
          fieldA = a.client;
          fieldB = b.client;
          break;
        case "rooms":
          fieldA = parseInt(a.reqRooms) || 0;
          fieldB = parseInt(b.reqRooms) || 0;
          break;
        case "nights":
          fieldA = parseInt(a.nights) || 0;
          fieldB = parseInt(b.nights) || 0;
          break;
        default:
          fieldA = a.fromDate ? a.fromDate.getTime() : 0;
          fieldB = b.fromDate ? b.fromDate.getTime() : 0;
      }

      // For string fields
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortOrder === 'asc' 
          ? fieldA.localeCompare(fieldB) 
          : fieldB.localeCompare(fieldA);
      }
      
      // For numeric fields
      return sortOrder === 'asc' ? fieldA - fieldB : fieldB - fieldA;
    });

    // Calculate total items and pages for pagination
    const totalItems = bookings.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedBookings = bookings.slice(startIndex, endIndex);

    return Response.json({
      success: true,
      company,
      bookings: paginatedBookings,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching bookings for company:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
