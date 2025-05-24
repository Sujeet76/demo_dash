"use client"
import { useState, useEffect } from 'react';
import EmailDocumentForm from './EmailDocumentForm';

function BookingList({ bookings, onDelete, onModify }) {
  const [hoveringModify, setHoveringModify] = useState(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  console.log({ bookings });

  // Function to convert bookings to CSV format
  const convertToCSV = (bookings) => {
    // Define headers based on booking properties
    const headers = [
      'ID', 'Sheet', 'Day', 'Month', 'Client', 'REQ Rooms', 'Confirm', 'Agent',
      'From', 'To', 'Nights', 'Safari', 'Arrival Details'
    ];
    
    // Create CSV string with headers
    let csvContent = headers.join(',') + '\n';
    
    // Add each booking as a row
    bookings.forEach(booking => {
      const row = [
        booking.uuid ? `"${booking.uuid}"` : 'N/A',
        booking.sheetName ? `"${booking.sheetName}"` : '',
        booking.day ? `"${booking.day}"` : '',
        booking.month ? `"${booking.month}"` : '',
        booking.client ? `"${booking.client}"` : '',
        booking.reqRooms ? `"${booking.reqRooms}"` : '',
        booking.confirm ? `"${booking.confirm}"` : '',
        booking.agent ? `"${booking.agent}"` : '',
        booking.formattedFrom || booking.from ? `"${booking.formattedFrom || booking.from}"` : '',
        booking.formattedTo || booking.to ? `"${booking.formattedTo || booking.to}"` : '',
        booking.nights ? `"${booking.nights}"` : '',
        booking.safari === 'Yes' ? `"Yes (${booking.formattedSafariDate || booking.safariDate})"` : '"No"',
        booking.arrivalDetails ? `"${booking.arrivalDetails}"` : ''
      ];
      
      csvContent += row.join(',') + '\n';
    });
    
    return csvContent;
  };

  // Generate CSV content when bookings change
  useEffect(() => {
    if (bookings && bookings.length > 0) {
      const csv = convertToCSV(bookings);
      setCsvContent(csv);
    }
  }, [bookings]);

  // Function to handle email button click
  const handleEmailButtonClick = () => {
    setShowEmailForm(true);
  };

  if (bookings.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px', 
        backgroundColor: 'rgba(60, 47, 47, 0.3)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '14px',
        margin: '20px 0'
      }}>
        <p>No bookings found. Create a new booking or adjust your search criteria.</p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Email document modal */}
      {showEmailForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "24px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <h2
                style={{ color: "#333", fontSize: "18px", fontWeight: "bold" }}
              >
                Send Bookings as Email
              </h2>
              <button
                onClick={() => setShowEmailForm(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#333",
                }}
              >
                &times;
              </button>
            </div>

            <EmailDocumentForm
              documentType="excel"
              userId="admin"
              generatedContent={csvContent}
              defaultFileName={`bookings-export-${new Date().toISOString().split("T")[0]}.csv`}
              onSuccess={() => {
                alert("Bookings sent successfully!");
                setShowEmailForm(false);
              }}
              onError={(error) => {
                console.error("Error sending bookings:", error);
              }}
            />
          </div>
        </div>
      )}

      {/* Export actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "12px",
          gap: "10px",
        }}
      >
        <button
          onClick={handleEmailButtonClick}
          style={{
            padding: "8px 16px",
            background: "linear-gradient(90deg, #2d6ca3, #3d89c3)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span style={{ fontSize: "16px" }}>✉️</span> Email Bookings
        </button>
      </div>

      <div style={{ overflowX: "auto", margin: "20px 0" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: "0",
            fontSize: "14px",
            color: "white",
          }}
        >
          {" "}
          <thead>
            <tr>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "left",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#d9c2a6",
                  fontWeight: "600",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                  width: "60px",
                }}
              >
                ID
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "left",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#d9c2a6",
                  fontWeight: "600",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                  width: "80px",
                }}
              >
                Sheet
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "left",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#d9c2a6",
                  fontWeight: "600",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                }}
              >
                Day
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "left",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#d9c2a6",
                  fontWeight: "600",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                }}
              >
                Month
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "left",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#d9c2a6",
                  fontWeight: "600",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                }}
              >
                Client
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "left",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#d9c2a6",
                  fontWeight: "600",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                }}
              >
                REQ Rooms
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "left",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#d9c2a6",
                  fontWeight: "600",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                }}
              >
                Confirm
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "left",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#d9c2a6",
                  fontWeight: "600",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                }}
              >
                Agent
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "left",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#d9c2a6",
                  fontWeight: "600",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                }}
              >
                From
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "left",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#d9c2a6",
                  fontWeight: "600",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                }}
              >
                To
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "left",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#d9c2a6",
                  fontWeight: "600",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                }}
              >
                Nights
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "left",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#d9c2a6",
                  fontWeight: "600",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                }}
              >
                Safari
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "left",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#d9c2a6",
                  fontWeight: "600",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                }}
              >
                Arrival
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "left",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#d9c2a6",
                  fontWeight: "600",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>{" "}
          <tbody>
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  transition: "background-color 0.3s",
                  backgroundColor: "rgba(60, 47, 47, 0.2)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(60, 47, 47, 0.4)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(60, 47, 47, 0.2)")
                }
              >
                {" "}
                <td
                  style={{
                    padding: "14px 12px",
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: "12px",
                  }}
                >
                  {booking.uuid ? booking.uuid.substring(0, 8) : "N/A"}
                </td>
                <td
                  style={{
                    padding: "14px 12px",
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "13px",
                  }}
                >
                  {booking.sheetName && booking.sheetName !== "Sheet1" ? (
                    <span
                      style={{
                        padding: "3px 7px",
                        backgroundColor: "rgba(139, 111, 71, 0.3)",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "500",
                      }}
                    >
                      {booking.sheetName}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td
                  style={{
                    padding: "14px 12px",
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  {booking.day}
                </td>
                <td
                  style={{
                    padding: "14px 12px",
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  {booking.month}
                </td>
                <td
                  style={{
                    padding: "14px 12px",
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  {booking.client}
                </td>
                <td
                  style={{
                    padding: "14px 12px",
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  {booking.reqRooms}
                </td>
                <td style={{ padding: "14px 12px" }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "500",
                      backgroundColor: getStatusColor(booking.confirm).bg,
                      color: getStatusColor(booking.confirm).text,
                    }}
                  >
                    {booking.confirm}
                  </span>
                </td>
                <td
                  style={{
                    padding: "14px 12px",
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  {booking.agent}
                </td>
                <td
                  style={{
                    padding: "14px 12px",
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  {booking.formattedFrom || booking.from}
                </td>
                <td
                  style={{
                    padding: "14px 12px",
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  {booking.formattedTo || booking.to}
                </td>
                <td
                  style={{
                    padding: "14px 12px",
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  {booking.nights}
                </td>
                <td
                  style={{
                    padding: "14px 12px",
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  {booking.safari === "Yes"
                    ? `${booking.safari} (${booking.formattedSafariDate || booking.safariDate})`
                    : "No"}
                </td>
                <td
                  style={{
                    padding: "14px 12px",
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  {booking.arrivalDetails}
                </td>{" "}
                <td style={{ padding: "14px 12px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => onModify(booking)}
                      onMouseEnter={() => setHoveringModify(booking.id)}
                      onMouseLeave={() => setHoveringModify(null)}
                      style={{
                        padding: "6px 12px",
                        background:
                          hoveringModify === booking.id
                            ? "linear-gradient(90deg, #3f7fb6, #5499d0)"
                            : "linear-gradient(90deg, #2d6ca3, #3d89c3)",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "500",
                        letterSpacing: "0.3px",
                        transition: "all 0.3s",
                        boxShadow:
                          hoveringModify === booking.id
                            ? "0 4px 12px rgba(61, 137, 195, 0.4)"
                            : "0 2px 8px rgba(61, 137, 195, 0.3)",
                      }}
                    >
                      Modify
                    </button>{" "}
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this booking?"
                          )
                        ) {
                          onDelete(booking.id, booking.uuid);
                        }
                      }}
                      style={{
                        padding: "6px 12px",
                        background: "linear-gradient(90deg, #b71c1c, #e57373)",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "500",
                        letterSpacing: "0.3px",
                        transition: "all 0.3s",
                        boxShadow: "0 2px 8px rgba(183, 28, 28, 0.3)",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper function for status colors
function getStatusColor(status) {
  switch(status) {
    case 'Confirmed':
      return {
        bg: 'rgba(46, 125, 50, 0.2)',
        text: '#81c784'
      };
    case 'Pending':
      return {
        bg: 'rgba(237, 108, 2, 0.2)',
        text: '#ffb74d'
      };
    case 'Cancelled':
      return {
        bg: 'rgba(183, 28, 28, 0.2)',
        text: '#e57373'
      };
    default:
      return {
        bg: 'rgba(66, 66, 66, 0.2)',
        text: '#e0e0e0'
      };
  }
}

export default BookingList;