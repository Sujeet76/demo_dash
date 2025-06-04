import {
  getGoogleSheetsAuth,
  generateUUID,
  parseFormattedDate,
  credentials,
  getStandardizedMonthName,
} from "@/utils/googleSheetsConfig";

// Multi-day booking endpoint - creates entries for each day from start to end date (excluding end date)
export async function POST(request) {
  try {
    console.log("Processing multi-day booking request");
    const bookingData = await request.json();
    
    const fromDate = parseFormattedDate(bookingData.formattedFrom);
    const toDate = parseFormattedDate(bookingData.formattedTo);
    
    if (!fromDate || !toDate || fromDate >= toDate) {
      return Response.json(
        { success: false, error: "Invalid date range for multi-day booking" },
        { status: 400 }
      );
    }
    
    const results = [];
    const currentDate = new Date(fromDate);
    let dayCount = 0;
    const baseUUID = bookingData.uuid || generateUUID();
    
    console.log(`Creating bookings from ${bookingData.formattedFrom} to ${bookingData.formattedTo} (excluding end date)`);
    
    // Create a booking for each day from fromDate to (toDate - 1 day)
    while (currentDate < toDate) {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = currentDate.getDate();
      const monthName = currentDate.toLocaleDateString('en-US', { month: 'short' });
      const monthFormatted = `${dayNum}-${monthName}`;
      
      // Create booking data for this specific day
      const dailyBookingData = {
        ...bookingData,
        day: dayName,
        month: monthFormatted,
        uuid: `${baseUUID}-day${dayCount}`
      };
      
      console.log(`Creating booking for ${dayName} ${monthFormatted}`);
      
      try {
        // Call the single-day booking API
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dailyBookingData)
        });
        
        const dailyResult = await response.json();
        
        results.push({
          day: monthFormatted,
          success: dailyResult.success,
          uuid: dailyBookingData.uuid,
          insertedAt: dailyResult.insertedAt,
          error: dailyResult.error || null
        });
        
        if (!dailyResult.success) {
          console.error(`Failed to create booking for ${monthFormatted}:`, dailyResult.error);
        }
        
      } catch (error) {
        console.error(`Error creating booking for ${monthFormatted}:`, error);
        results.push({
          day: monthFormatted,
          success: false,
          uuid: dailyBookingData.uuid,
          error: error.message
        });
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      dayCount++;
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    return Response.json({
      success: failureCount === 0,
      message: `Created ${successCount} daily bookings${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      totalDays: results.length,
      successCount,
      failureCount,
      results: results
    });
    
  } catch (error) {
    console.error("Error in multi-day booking:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
