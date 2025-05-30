
import { Resend } from "resend";
import { inngest } from "./client";

// Initialize Resend for email delivery
const resend = new Resend(process.env.RESEND_API_KEY);

// Function to handle scheduled email delivery
export const scheduleEmailDelivery = inngest.createFunction(
  { id: "schedule-email-delivery" },
  { event: "email/schedule" },
  async ({ event, step }) => {
    const {
      recipientEmail,
      bookingDetails,
      emailType,
      template,
      daysBeforeCheckIn,
    } = event.data;

    // await step.sleepUntil("waiting for scheduled email", new Date(event.data.scheduledDate));
    

    return await step.run("send-scheduled-email", async () => {
      try {
        // Replace template variables
        const htmlContent = template.html
          .replace(
            /{{agent_name}}/g,
            bookingDetails.agentName || "Travel Partner"
          )
          .replace(/{{client_name}}/g, bookingDetails.client || "Valued Guest")
          .replace(
            /{{check_in_date}}/g,
            bookingDetails.formattedFrom || formatDate(bookingDetails.fromDate)
          )
          .replace(
            /{{check_out_date}}/g,
            bookingDetails.formattedTo || formatDate(bookingDetails.toDate)
          );

        const emailData = {
          from:
            process.env.EMAIL_FROM ||
            "reservations@ranthamboreregency.com",
          to: recipientEmail,
          subject: template.subject,
          html: htmlContent,
          tags: [
            { name: "booking", value: bookingDetails.uuid || "unknown" },
            { name: "type", value: emailType.toLowerCase() },
            { name: "days-before", value: daysBeforeCheckIn.toString() },
            { name: "method", value: "inngest" },
          ],
        };

        const response = await resend.emails.send(emailData);

        console.log(`✅ Scheduled email sent via Inngest:`, {
          emailType,
          recipientEmail,
          messageId: response.data?.id,
          bookingId: bookingDetails.uuid,
        });

        return {
          success: true,
          messageId: response.data?.id,
          emailType,
          sentAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error(`❌ Error sending scheduled email via Inngest:`, error);
        throw error;
      }
    });
  }
);

// Utility function to format dates
function formatDate(dateString) {
  if (!dateString) return "";
  let date;
  if (typeof dateString === 'string' && dateString.includes('/')) {
    const [day, month, year] = dateString.split('/');
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(dateString);
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
