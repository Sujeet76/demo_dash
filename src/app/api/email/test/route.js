import { calculateSchedulingDates } from "@/utils/mailersendConfig";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');

    if (!fromDate) {
      return Response.json(
        { success: false, error: "fromDate parameter is required" },
        { status: 400 }
      );
    }

    // Calculate scheduling dates
    const schedules = calculateSchedulingDates(fromDate);
    const currentDate = new Date();
    const checkInDate = new Date(fromDate);
    const totalDays = Math.ceil((checkInDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    return Response.json({
      success: true,
      fromDate,
      currentDate: currentDate.toISOString(),
      totalDaysUntilCheckIn: totalDays,
      schedules: schedules.map(schedule => ({
        emailType: schedule.type,
        daysBeforeCheckIn: schedule.daysBeforeCheckIn,
        scheduledDate: schedule.scheduledDate.toISOString(),
        isPastDue: schedule.scheduledDate < currentDate,
        scheduledDateFormatted: schedule.scheduledDate.toLocaleDateString(),
        scheduledTimeFormatted: schedule.scheduledDate.toLocaleTimeString()
      }))
    });

  } catch (error) {
    console.error("Error testing email scheduling:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
