import { NextResponse } from "next/server";

// Simple in-memory storage for document email tracking
// In a production app, this would be stored in a database
let documentEmailTrackingData = [];

export async function POST(request) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (token !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, documentName, recipientEmail, documentType, timestamp } = body;

    // Validate required fields
    if (!userId || !documentName || !recipientEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Add tracking data
    const trackingEntry = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      documentName,
      recipientEmail,
      documentType: documentType || 'excel',
      timestamp: timestamp || new Date().toISOString(),
    };

    documentEmailTrackingData.push(trackingEntry);

    // Limit the size of in-memory storage (would be handled by DB in production)
    if (documentEmailTrackingData.length > 1000) {
      documentEmailTrackingData = documentEmailTrackingData.slice(-1000);
    }

    return NextResponse.json({ success: true, data: trackingEntry });
  } catch (error) {
    console.error("Error tracking document email:", error);
    return NextResponse.json(
      { error: "Failed to track document email", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (token !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract query parameters for filtering
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const documentType = searchParams.get("documentType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Apply filters
    let filteredData = [...documentEmailTrackingData];

    if (userId) {
      filteredData = filteredData.filter(entry => entry.userId === userId);
    }

    if (documentType) {
      filteredData = filteredData.filter(entry => entry.documentType === documentType);
    }

    if (startDate) {
      const start = new Date(startDate);
      filteredData = filteredData.filter(entry => new Date(entry.timestamp) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      filteredData = filteredData.filter(entry => new Date(entry.timestamp) <= end);
    }

    // Sort by timestamp descending (newest first)
    filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return NextResponse.json({ success: true, data: filteredData });
  } catch (error) {
    console.error("Error fetching document email tracking data:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracking data", details: error.message },
      { status: 500 }
    );
  }
}
