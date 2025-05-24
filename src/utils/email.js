import { Resend } from 'resend';
import {
  getGoogleSheetsAuth,
  exportSheetAsPDF,
  exportSheetAsExcel,
  credentials,
  getGoogleSheetViewLink,
} from "./googleSheetsConfig";

const resend = new Resend(process.env.RESEND_API_KEY);
const adminEmail = process.env.ADMIN_EMAIL;
const emailFrom = process.env.EMAIL_FROM;

export async function sendEmailWithDocument({ to, subject, text, html, attachment, senderInfo = '' }) {
  try {
    let processedContent = attachment.content;
    
    // If it's a string and looks like base64 data URI, extract just the base64 part
    if (typeof processedContent === 'string' && processedContent.startsWith('data:')) {
      processedContent = Buffer.from(processedContent.split(',')[1], 'base64');
    } 

    else if (typeof processedContent === 'string' && !processedContent.startsWith('data:')) {
      processedContent = Buffer.from(processedContent);
    }
    
    // Create the email payload
    const payload = {
      from: emailFrom,
      to: [to],
      subject: subject,
      text: text,
      html: html,
      attachments: [{
        filename: attachment.filename,
        content: processedContent
      }]
    };
    
   
    if (adminEmail) {
      const adminSubject = `[COPY] ${subject} - Sent by ${to}`;
      const adminText = `
This is an automated copy of an email with attachment sent by ${to}.
${senderInfo ? `Sender information: ${senderInfo}` : ''}

Original email:
${text}
      `;
      
      const adminHtml = `
<p>This is an automated copy of an email with attachment sent by ${to}.</p>
${senderInfo ? `<p>Sender information: ${senderInfo}</p>` : ''}
<hr>
<p><strong>Original email:</strong></p>
${html}
      `;
      
      // Send a copy to the admin
      await resend.emails.send({
        from: emailFrom,
        to: adminEmail,
        subject: adminSubject,
        text: adminText,
        html: adminHtml,
        attachments: [{
          filename: attachment.filename,
          content: processedContent
        }]
      });
    }
    
    // Send the original email
    const data = await resend.emails.send(payload);
    return data;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

/**
 * Tracks when a document is sent as an email attachment
 * 
 * @param {Object} options - Tracking options
 * @param {string} options.userId - ID of the user sending the email
 * @param {string} options.documentName - Name of the document being sent
 * @param {string} options.recipientEmail - Email of the recipient
 * @param {string} [options.documentType='excel'] - Type of document (excel, pdf, etc.)
 * @returns {Promise<void>}
 */
export async function trackDocumentEmailSent({ userId, documentName, recipientEmail, documentType = 'excel' }) {
  try {
    // You can implement logging to your database here
    // For now, we'll just log to console
    console.log(`Document email tracking: User ${userId} sent ${documentType} document "${documentName}" to ${recipientEmail} at ${new Date().toISOString()}`);
    
    // You could send this data to an API endpoint to store in your database
    const trackingData = {
      userId,
      documentName,
      recipientEmail,
      documentType,
      timestamp: new Date().toISOString()
    };
    
    // Example API call to store tracking data (uncomment if you have an endpoint)
    // await fetch('/api/admin/trackDocumentEmail', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(trackingData)
    // });
    
    return trackingData;
  } catch (error) {
    console.error("Document tracking error:", error);
    throw error;
  }
}

export async function sendEmailWithGoogleSheet({ 
  to, 
  subject, 
  text, 
  html, 
  spreadsheetId, 
  sheetName, 
  format = 'excel',
  senderInfo = '' 
}) {
  try {

    
    const auth = await getGoogleSheetsAuth(credentials);
    console.log(`Getting Google Sheet with ID: ${spreadsheetId} in format: ${format}`);
    
    // Get the document content based on the requested format
    let content;
    let filename;
    
    if (format === 'pdf') {
      console.log(`Exporting sheet as PDF: ${sheetName || 'default sheet'}`);
      content = await exportSheetAsPDF(auth, spreadsheetId, sheetName);
      filename = `${sheetName || 'Spreadsheet'}-${new Date().toISOString().split('T')[0]}.pdf`;
    } else {
      console.log(`Exporting sheet as Excel`);
      content = await exportSheetAsExcel(auth, spreadsheetId);
      filename = `${sheetName || 'Spreadsheet'}-${new Date().toISOString().split('T')[0]}.xlsx`;
    }
    
    if (!content || content.length === 0) {
      throw new Error(`Failed to export Google Sheet: Empty content returned for format ${format}`);
    }
    
    console.log(`Successfully exported document: ${filename} (${content.length} bytes)`);
    
    // Add a link to the original sheet in the HTML content
    // const viewLink = getGoogleSheetViewLink(spreadsheetId);
    const enhancedHtml = `
      ${html}
    `;
    
    // Send the email with the exported document
    return await sendEmailWithDocument({
      to,
      subject,
      text: `${text}`,
      html: enhancedHtml,
      attachment: {
        filename,
        content
      },
      senderInfo
    });
  } catch (error) {
    console.error("Error sending Google Sheet email:", error);
    throw error;
  }
}
