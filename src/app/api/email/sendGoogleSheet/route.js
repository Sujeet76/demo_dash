import { NextResponse } from "next/server";
import { sendEmailWithGoogleSheet, trackDocumentEmailSent } from "@/utils/email";

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      to, 
      subject, 
      message,  
      sheetName, 
      format = 'excel', 
      userId,
      senderInfo = ''
    } = body;

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Validate required fields
    if (!to || !subject || !spreadsheetId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`Processing Google Sheet email request: 
      - SpreadsheetID: ${spreadsheetId}
      - Format: ${format}
      - Sheet name: ${sheetName || 'default'}
    `);

    // Create email HTML content
    const html = `
      <div>
        <p>${message || 'Please find the attached Google Sheet document.'}</p>
        <p>This document was sent on ${new Date().toLocaleDateString()}.</p>
      </div>
    `;

    // Send email with original Google Sheet as attachment
    const emailResult = await sendEmailWithGoogleSheet({
      to,
      subject,
      text: message || 'Please find the attached Google Sheet document.',
      html,
      spreadsheetId,
      sheetName,
      format,
      senderInfo
    });

    // Track document email for analytics
    if (userId) {
      await trackDocumentEmailSent({
        userId,
        documentName: `${sheetName || 'Google Sheet'}.${format}`,
        recipientEmail: to,
        documentType: format
      });
    }

    return NextResponse.json({ success: true, data: emailResult });
  } catch (error) {
    console.error("Error sending Google Sheet email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error.message },
      { status: 500 }
    );
  }
}
