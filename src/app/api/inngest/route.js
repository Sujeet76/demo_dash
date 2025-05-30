import { serve } from "inngest/next";
import { inngest } from "../../../src/inngest/client";
import { scheduleEmailDelivery } from "../../../src/inngest/functions";

// Create the handler for Inngest
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    scheduleEmailDelivery,
  ],
});
