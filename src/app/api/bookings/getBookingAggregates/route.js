import {
  getGoogleSheetsAuth,
  MONTH_NAMES,
  credentials,
} from "@/utils/googleSheetsConfig";
import { google } from "googleapis";

// Improved date parsing function that handles DD/MM/YYYY format
function parseFormattedDate(dateStr) {
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

// Format date as YYYY-MM-DD consistently
function formatDateAsKey(date) {
  if (!date) return null;

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Parse YYYY-MM-DD string to Date object (for query parameters)
function parseISODate(dateStr) {
  if (!dateStr) return null;

  try {
    // Create date with UTC time
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  } catch (error) {
    console.error(`Error parsing ISO date: ${dateStr}`, error);
    return null;
  }
}

export async function GET(request) {
  try {
    // Get URL parameters for month and date range filtering
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // Month filter (e.g., "january")
    const fromDate = searchParams.get("fromDate"); // Optional from date filter (format: YYYY-MM-DD)
    const toDate = searchParams.get("toDate"); // Optional to date filter (format: YYYY-MM-DD)
    const view = searchParams.get("view") || "month"; // View type: "month" or "date"

    console.log({ month, fromDate, toDate, view });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const auth = await getGoogleSheetsAuth(credentials);
    const sheets = google.sheets({ version: "v4", auth });

    // Get spreadsheet metadata to find all sheets
    const spreadsheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId,
    });

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
          // Default to all sheets if no match
          sheetsToCheck = MONTH_NAMES;
        }
      }
    } else {
      // If no month specified, check all sheets
      sheetsToCheck = MONTH_NAMES;
    }

    // Parse from/to dates once for comparison
    const fromDateObj = parseISODate(fromDate);
    const toDateObj = parseISODate(toDate);

    let bookingsByDate = {};
    let statusAggregates = {
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      total: 0,
    };

    // Process each sheet
    for (const sheetName of sheetsToCheck) {
      try {
        // Get data from each sheet
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A:Z`,
        });

        const rows = response.data.values || [];

        if (rows.length > 0) {
          // Find header row and determine column indices
          const headerRow = rows[0];
          const dateColumnIndex = 7;
          const statusColumnIndex = 5;

          if (dateColumnIndex !== -1 && statusColumnIndex !== -1) {
            // Skip header row
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];

              // Skip empty rows
              if (!row || row.length === 0) continue;

              // Get date and status
              const dateValue = row[dateColumnIndex];
              const status = row[statusColumnIndex]?.toLowerCase() || "unknown";

              if (dateValue) {
                try {
                  // Parse date properly from DD/MM/YYYY format
                  const bookingDate = parseFormattedDate(dateValue);

                  // Skip if date couldn't be parsed
                  if (!bookingDate) continue;

                  // Apply date filters if provided
                  if (
                    (!fromDateObj || bookingDate >= fromDateObj) &&
                    (!toDateObj || bookingDate <= toDateObj)
                  ) {
                    // Format date to YYYY-MM-DD for consistent keys
                    const dateStr = formatDateAsKey(bookingDate);

                    // Initialize date entry if it doesn't exist
                    if (!bookingsByDate[dateStr]) {
                      bookingsByDate[dateStr] = {
                        date: dateStr,
                        confirmed: 0,
                        pending: 0,
                        cancelled: 0,
                        total: 0,
                      };
                    }

                    // Increment appropriate counters
                    if (!isNaN(Number(status)) && Number(status) >= 0) {
                      const count = parseInt(status);
                      bookingsByDate[dateStr].confirmed += count;
                      bookingsByDate[dateStr].total += count;
                      statusAggregates.confirmed += count;
                      statusAggregates.total += count;
                    } else if (
                      status.includes("cancel") ||
                      status.includes("reject")
                    ) {
                      bookingsByDate[dateStr].cancelled++;
                      bookingsByDate[dateStr].total++;
                      statusAggregates.cancelled++;
                      statusAggregates.total++;
                    } else {
                      // Default to pending
                      bookingsByDate[dateStr].pending++;
                      bookingsByDate[dateStr].total++;
                      statusAggregates.pending++;
                      statusAggregates.total++;
                    }
                  }
                } catch (error) {
                  console.error(`Error processing date ${dateValue}:`, error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error processing sheet ${sheetName}:`, error);
      }
    }

    // Prepare response based on the requested view
    let responseData;

    if (view === "month") {
      // Return data organized by date
      responseData = {
        success: true,
        aggregates: statusAggregates,
        bookingsByDate: Object.values(bookingsByDate).sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
      };
    } else {
      // Return overall aggregates
      responseData = {
        success: true,
        aggregates: statusAggregates,
      };
    }

    return new Response(JSON.stringify(responseData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching booking aggregates:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch booking aggregates: " + error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
