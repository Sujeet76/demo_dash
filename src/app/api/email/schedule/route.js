import { calculateSchedulingDates, scheduleEmail } from "@/utils/mailersendConfig";

export async function POST(request) {
  try {
    const { bookingData, recipientEmail } = await request.json();

    if (!recipientEmail) {
      return Response.json(
        { success: false, error: "Recipient email is required" },
        { status: 400 }
      );
    }

    if (!bookingData.from) {
      return Response.json(
        { success: false, error: "Check-in date is required" },
        { status: 400 }
      );
    }

    // Calculate scheduling dates
    const schedules = calculateSchedulingDates(bookingData.from);
    
    if (schedules.length === 0) {
      return Response.json({
        success: true,
        message: "No emails scheduled - check-in date is too close",
        scheduledEmails: []
      });
    }

    // Schedule all emails
    const schedulingResults = [];
    
    for (const schedule of schedules) {
      const result = await scheduleEmail(
        recipientEmail,
        schedule.type,
        schedule.scheduledDate,
        bookingData
      );
      
      schedulingResults.push({
        ...result,
        daysBeforeCheckIn: schedule.daysBeforeCheckIn,
        scheduledDate: schedule.scheduledDate.toISOString()
      });
    }

    // Check if all emails were scheduled successfully
    const failedEmails = schedulingResults.filter(result => !result.success);
    
    if (failedEmails.length > 0) {
      console.error('Some emails failed to schedule:', failedEmails);
    }

    return Response.json({
      success: true,
      message: `Scheduled ${schedulingResults.filter(r => r.success).length} emails`,
      scheduledEmails: schedulingResults,
      checkInDate: bookingData.from,
      totalDaysUntilCheckIn: Math.ceil((new Date(bookingData.from).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    });

  } catch (error) {
    console.error("Error scheduling emails:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to check scheduled emails for a booking
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingUuid = searchParams.get('bookingUuid');
    const fromDate = searchParams.get('fromDate');

    if (!fromDate) {
      return Response.json(
        { success: false, error: "fromDate parameter is required" },
        { status: 400 }
      );
    }

    // Calculate what the scheduling would be for this date
    const schedules = calculateSchedulingDates(fromDate);
    
    return Response.json({
      success: true,
      possibleSchedules: schedules.map(schedule => ({
        emailType: schedule.type,
        daysBeforeCheckIn: schedule.daysBeforeCheckIn,
        scheduledDate: schedule.scheduledDate.toISOString(),
        isPastDue: schedule.scheduledDate < new Date()
      })),
      checkInDate: fromDate,
      totalDaysUntilCheckIn: Math.ceil((new Date(fromDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    });

  } catch (error) {
    console.error("Error checking email schedules:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
