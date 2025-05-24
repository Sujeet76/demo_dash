import { NextResponse } from "next/server";
import { sendEmailWithDocument, trackDocumentEmailSent } from "@/utils/email";

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      to, 
      subject, 
      message, 
      documentContent, 
      documentName, 
      userId,
      documentType = 'excel',
      senderInfo = ''
    } = body;

    // Validate required fields
    if (!to || !subject || !documentContent || !documentName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Process content based on format
    let content = documentContent;
    
    // Convert base64 document content to Buffer if needed
    if (typeof content === 'string') {
      if (content.startsWith('data:')) {
        // It's a data URI - extract the base64 content
        content = Buffer.from(content.split(',')[1], 'base64');
      } else {
        // It's plain text or CSV - convert to buffer
        content = Buffer.from(content);
      }
    }

    // Create email HTML content
    const html = `
      <div>
        <p>${message || 'Please find the attached document.'}</p>
        <p>This document was sent on ${new Date().toLocaleDateString()}.</p>
      </div>
    `;

    console.log(`Sending email to ${to} with attachment: ${documentName} (${typeof content} format)`);

    // Send email with document attachment
    const emailResult = await sendEmailWithDocument({
      to,
      subject,
      text: message || 'Please find the attached document.',
      html,
      attachment: {
        filename: documentName,
        content
      },
      senderInfo
    });

    // Track document email for analytics
    if (userId) {
      await trackDocumentEmailSent({
        userId,
        documentName,
        recipientEmail: to,
        documentType
      });
    }

    return NextResponse.json({ success: true, data: emailResult });
  } catch (error) {
    console.error("Error sending document email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error.message },
      { status: 500 }
    );
  }
}
