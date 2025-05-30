import { useState, useEffect } from "react";

function EmailSchedulePreview({ fromDate, agentEmail }) {
  const [schedulePreview, setSchedulePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fromDate && agentEmail) {
      fetchSchedulePreview();
    } else {
      setSchedulePreview(null);
    }
  }, [fromDate, agentEmail]);

  const fetchSchedulePreview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/email/schedule?fromDate=${fromDate}`);
      const data = await response.json();
      
      if (data.success) {
        setSchedulePreview(data);
      }
    } catch (error) {
      console.error("Error fetching schedule preview:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!fromDate || !agentEmail) return null;

  const emailTypeLabels = {
    RECONFIRMATION_VOUCHER: "Reconfirmation Voucher Request",
    ADVANCE_PAYMENT: "Advance Payment Request", 
    SAFARI_BOOKING: "Safari Booking Requirements"
  };

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "16px",
        backgroundColor: "rgba(139, 111, 71, 0.1)",
        borderRadius: "8px",
        border: "1px solid rgba(139, 111, 71, 0.3)",
      }}
    >
      <h4
        style={{
          margin: "0 0 12px 0",
          fontSize: "16px",
          color: "#8b6f47",
          fontWeight: "600",
        }}
      >
        📧 Email Schedule Preview
      </h4>

      {loading ? (
        <div style={{ color: "rgba(255, 255, 255, 0.7)" }}>
          Loading schedule preview...
        </div>
      ) : schedulePreview ? (
        <div>
          <div style={{ 
            fontSize: "14px", 
            color: "rgba(255, 255, 255, 0.8)",
            marginBottom: "12px" 
          }}>
            <strong>Recipient:</strong> {agentEmail}
            <br />
            <strong>Check-in Date:</strong> {new Date(fromDate).toLocaleDateString()}
            <br />
            <strong>Days until check-in:</strong> {schedulePreview.totalDaysUntilCheckIn}
          </div>

          {schedulePreview.possibleSchedules && schedulePreview.possibleSchedules.length > 0 ? (
            <div>
              <div style={{ 
                fontSize: "14px", 
                color: "rgba(255, 255, 255, 0.9)",
                marginBottom: "8px",
                fontWeight: "500"
              }}>
                Scheduled Emails:
              </div>
              {schedulePreview.possibleSchedules.map((schedule, index) => (
                <div
                  key={index}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: schedule.isPastDue ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)",
                    borderRadius: "6px",
                    marginBottom: "6px",
                    fontSize: "13px",
                    border: `1px solid ${schedule.isPastDue ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"}`,
                  }}
                >
                  <div style={{ fontWeight: "500", color: "white" }}>
                    {emailTypeLabels[schedule.emailType] || schedule.emailType}
                  </div>
                  <div style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                    {schedule.daysBeforeCheckIn} days before check-in
                  </div>
                  <div style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                    {new Date(schedule.scheduledDate).toLocaleDateString()} at{" "}
                    {new Date(schedule.scheduledDate).toLocaleTimeString()}
                  </div>
                  {schedule.isPastDue && (
                    <div style={{ color: "#ef4444", fontSize: "12px" }}>
                      ⚠️ This would be scheduled in the past and will be sent immediately
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "14px",
              fontStyle: "italic"
            }}>
              No emails will be scheduled - check-in date is too close.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default EmailSchedulePreview;
