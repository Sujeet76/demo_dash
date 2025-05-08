import {
  getGoogleSheetsAuth,
  generateUUID,
  MONTH_NAMES,
  parseFormattedDate,
  credentials,
} from "@/utils/googleSheetsConfig";
import { google } from "googleapis";

export async function GET(request) {
  try {
    // Get URL parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const month = searchParams.get("month"); // Optional month filter
    const fromDate = searchParams.get("fromDate"); // Optional from date filter
    const toDate = searchParams.get("toDate"); // Optional to date filter

    console.log({ month, fromDate, toDate });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const auth = await getGoogleSheetsAuth(credentials);
    const sheets = google.sheets({ version: "v4", auth });

    // Get spreadsheet metadata to find all sheets
    const spreadsheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    let allRows = [];
    // Determine which sheets to check based on the month parameter
    let sheetsToCheck = [];

    if (month) {
      // If a specific month is requested, only check that month's sheet
      const monthIndex = MONTH_NAMES.findIndex(
        (m) => m.toLowerCase() === month.toLowerCase()
      );

      if (monthIndex !== -1) {
        sheetsToCheck = [MONTH_NAMES[monthIndex]];
      } else {
        // If month doesn't match exactly, try to find a close match
        const matchingMonth = MONTH_NAMES.find((m) =>
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
              availableMonths: MONTH_NAMES,
            },
          });
        }
      }
    } else {
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
          // Add sheetName to each row for reference
          const sheetRows = response.data.values.map((row) => {
            return { sheetName, row };
          });
          allRows = [...allRows, ...sheetRows];
        }
      } catch (error) {
        // Sheet might not exist, just continue
        console.log(`Sheet ${sheetName} doesn't exist or is empty`);
      }
    } // Extract just the row data
    let rows = allRows.map((item) => item.row);
    if (fromDate || toDate) {
      // Parse dates as Date objects for comparison
      const fromDateF = fromDate ? new Date(fromDate) : null;
      const toDateF = toDate ? new Date(toDate) : null;

      rows = rows.filter((row) => {
        // Assuming row[7] contains date in a format parsable by Date constructor
        const rowDate = new Date(row[7]);

        // If only fromDate is specified, filter dates >= fromDate
        if (fromDateF && !toDateF) {
          return rowDate >= fromDateF;
        }

        // If only toDate is specified, filter dates <= toDate
        if (toDateF && !fromDateF) {
          return rowDate <= toDateF;
        }

        // If both dates are specified, filter dates between fromDate and toDate (inclusive)
        return rowDate >= fromDateF && rowDate <= toDateF;
      });
    }

    const bookings = rows.map((row, index) => {
      return {
        uuid: row[0] || generateUUID(),
        id: Date.now() + index,
        sheetName: allRows[index].sheetName, // Include sheet name (month)
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
        toDate: parseFormattedDate(row[8] || ""),
      };
    });

    // Sort bookings by date
    bookings.sort((a, b) => a.toDate - b.toDate);

    // Calculate total items and pages for pagination
    const totalItems = bookings.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    // Get available months (actually existing in the spreadsheet)
    const availableMonths = [
      ...new Set(allRows.map((item) => item.sheetName)),
    ].filter((sheet) => MONTH_NAMES.includes(sheet));

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
        availableMonths,
      },
    });

    // Using the imported parseFormattedDate function
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
