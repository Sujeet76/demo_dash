import { useState } from "react";

import BookingForm from "./BookingForm";
import BookingList from "./BookingList";
import CalendarView from "./calender-view";
import CompanyView from "./CompanyView";
import SearchBar from "./SearchBar";
import ExportButton from "./ExportButton";
import { bookingsApi } from "@/utils/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";


function BookingManager() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isHoveringNewBooking, setIsHoveringNewBooking] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");  const [dateFilter, setDateRange] = useState({
    fromDate: null,
    toDate: null,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 400,
  });
  const [viewMode, setViewMode] = useState("list"); // "list", "calendar", or "company"

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["bookings", pagination.page, pagination.pageSize, selectedMonth, dateFilter],
    queryFn: () =>
      bookingsApi.getBookings({
        page: pagination.page,
        pageSize: pagination.pageSize,
        month: selectedMonth,
        fromDate: dateFilter.fromDate,
        toDate: dateFilter.toDate,
      }),
    
  });

  const deleteMutation = useMutation(
    {
      mutationFn: (data) => bookingsApi.deleteBooking(data.uuid, data.deletedBy),
      onSuccess: () => {
        // Invalidate the query to refetch and get the real data
        queryClient.invalidateQueries(["bookings"]);
      },
      onError: (error) => {
        console.error("Error deleting booking:", error);
        alert("An error occurred while deleting the booking. Please try again.");
      },
    }
  );

  const bookings = data?.bookings || [];

  const addBooking = (booking) => {
    if (isEditing) {
      // Update existing booking
      queryClient.setQueryData(
        ["bookings", pagination.page, pagination.pageSize, selectedMonth],
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            bookings: oldData.bookings.map((b) =>
              b.id === booking.id ? booking : b
            ),
          };
        }
      );
    } else {
      // Add new booking - optimistic update
      queryClient.setQueryData(
        ["bookings", pagination.page, pagination.pageSize, selectedMonth],
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            bookings: [...oldData.bookings, booking],
          };
        }
      );
    }

    setCurrentBooking(null);
    setShowForm(false);
    setIsEditing(false);

    // Invalidate the query to refetch and get the real data
    queryClient.invalidateQueries(["bookings"]);
  };

  const deleteBooking = async (id) => {
    try {
      // Find the booking with the given id to get its UUID
      const bookingToDelete = bookings.find((booking) => booking.id === id);

      if (!bookingToDelete || !bookingToDelete.uuid) {
        console.error("Cannot delete booking: UUID not found");
        return;
      }

      // Get user information from localStorage
      let userIdentifier = 'unknown';
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          userIdentifier = userInfo.username || localStorage.getItem('username') || 'unknown';
        } else if (localStorage.getItem('username')) {
          userIdentifier = localStorage.getItem('username');
        }
      } catch (error) {
        console.error('Error parsing user info:', error);
      }

      // Execute deletion with react-query mutation
      await deleteMutation.mutateAsync({
        uuid: bookingToDelete.uuid,
        deletedBy: userIdentifier
      });
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("An error occurred while deleting the booking. Please try again.");
    }
  };

  const modifyBooking = (booking) => {
    setCurrentBooking(booking);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setCurrentBooking(null);
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    setPagination((prev) => ({
      ...prev,
      page: 1, // Reset to first page when changing month
    }));
  };

  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (booking.day && booking.day.toLowerCase().includes(searchLower)) ||
      (booking.month && booking.month.toLowerCase().includes(searchLower)) ||
      (booking.client && booking.client.toLowerCase().includes(searchLower)) ||
      (booking.agent && booking.agent.toLowerCase().includes(searchLower)) ||
      (booking.confirm &&
        booking.confirm.toLowerCase().includes(searchLower)) ||
      (booking.guestContactInfo &&
        booking.guestContactInfo.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #3c2f2f 0%, #1e1a1a 100%)",
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <header
        style={{
          backgroundColor: "rgba(30, 26, 26, 0.8)",
          backdropFilter: "blur(10px)",
          color: "white",
          padding: "15px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginRight: "15px",
              position: "relative",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40">
              <path d="M20 5 L30 30 L10 30 Z" fill="#8b6f47" />
              <path d="M20 8 L28 28 L12 28 Z" fill="#1e1a1a" />
            </svg>
          </div>
          <h1 style={{ fontSize: "22px", margin: 0, fontWeight: "600" }}>
            Hotel Booking Manager
          </h1>
        </div>
        <nav>
          <ul
            style={{
              display: "flex",
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >            <li style={{ marginRight: "24px" }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setViewMode("list");
                }}
                style={{
                  color: viewMode === "list" ? "#d9c2a6" : "rgba(255, 255, 255, 0.8)",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "500",
                  borderBottom: viewMode === "list" ? "2px solid #8b6f47" : "none",
                  paddingBottom: "4px"
                }}
              >
                Bookings List
              </a>
            </li>
            <li style={{ marginRight: "24px" }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setViewMode("calendar");
                }}
                style={{
                  color: viewMode === "calendar" ? "#d9c2a6" : "rgba(255, 255, 255, 0.8)",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "500",
                  borderBottom: viewMode === "calendar" ? "2px solid #8b6f47" : "none",
                  paddingBottom: "4px"
                }}
              >
                Calendar View
              </a>
            </li>
            <li style={{ marginRight: "24px" }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setViewMode("company");
                }}
                style={{
                  color: viewMode === "company" ? "#d9c2a6" : "rgba(255, 255, 255, 0.8)",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "500",
                  borderBottom: viewMode === "company" ? "2px solid #8b6f47" : "none",
                  paddingBottom: "4px"
                }}
              >
                Company View
              </a>
            </li>
          </ul>
        </nav>
      </header>

      {/* Main Content */}
      <main
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          flex: 1,
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            width: "90%",
            maxWidth: "1200px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
            borderRadius: "16px",
            overflow: "hidden",
            background: "rgba(30, 26, 26, 0.6)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            style={{
              padding: "28px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                margin: "0",
                fontSize: "24px",
                letterSpacing: "0.5px",
                fontWeight: "600",
                background: "linear-gradient(90deg, #8b6f47, #d9c2a6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              BOOKING DASHBOARD
            </h2>            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {/* View Mode Toggle */}              <div style={{
                display: "flex",
                padding: "2px",
                background: "rgba(30, 26, 26, 0.8)",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}>
                <button
                  onClick={() => setViewMode("list")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: viewMode === "list" ? "rgba(139, 111, 71, 0.7)" : "transparent",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: viewMode === "calendar" ? "rgba(139, 111, 71, 0.7)" : "transparent",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                >
                  Calendar View
                </button>
                <button
                  onClick={() => setViewMode("company")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: viewMode === "company" ? "rgba(139, 111, 71, 0.7)" : "transparent",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                >
                  Company View
                </button>
              </div>

              {/* Month Filter Dropdown */}
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "rgba(30, 26, 26, 0.8)",
                  color: "#fff",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <option value="">All Months</option>
                {["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"]?.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>

              <ExportButton bookings={bookings} />
              <button
                onClick={() => {
                  if (showForm) {
                    handleCancelForm();
                  } else {
                    setShowForm(true);
                    setIsEditing(false);
                    setCurrentBooking(null);
                  }
                }}
                onMouseEnter={() => setIsHoveringNewBooking(true)}
                onMouseLeave={() => setIsHoveringNewBooking(false)}
                style={{
                  padding: "10px 20px",
                  background: isHoveringNewBooking
                    ? "linear-gradient(90deg, #8b6f47, #a68a64)"
                    : "linear-gradient(90deg, #7a5f3d, #8b6f47)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  letterSpacing: "0.5px",
                  transition: "all 0.3s",
                  boxShadow: isHoveringNewBooking
                    ? "0 6px 20px rgba(139, 111, 71, 0.4)"
                    : "0 4px 12px rgba(139, 111, 71, 0.3)",
                }}
              >
                {showForm ? "CANCEL" : "NEW BOOKING"}
              </button>
            </div>
          </div>

          <div style={{ padding: "32px" }}>
            {isLoading || deleteMutation.isLoading ? (
              <div
                style={{ textAlign: "center", padding: "40px", color: "white" }}
              >
                <div style={{ fontSize: "18px", marginBottom: "10px" }}>
                  {deleteMutation.isLoading
                    ? "Deleting booking..."
                    : "Loading bookings..."}
                </div>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    border: "4px solid rgba(255, 255, 255, 0.1)",
                    borderTop: "4px solid #8b6f47",
                    borderRadius: "50%",
                    margin: "0 auto",
                    animation: "spin 1s linear infinite",
                  }}
                ></div>
                <style jsx>{`
                  @keyframes spin {
                    0% {
                      transform: rotate(0deg);
                    }
                    100% {
                      transform: rotate(360deg);
                    }
                  }
                `}</style>
              </div>
            ) : error || deleteMutation.error ? (
              <div
                style={{ textAlign: "center", padding: "40px", color: "white" }}
              >
                <div
                  style={{
                    fontSize: "18px",
                    marginBottom: "10px",
                    color: "#ff6b6b",
                  }}
                >
                  Error: {error?.message || deleteMutation.error?.message}
                </div>
                <button
                  onClick={() => queryClient.invalidateQueries(["bookings"])}
                  style={{
                    padding: "8px 16px",
                    background: "linear-gradient(90deg, #7a5f3d, #8b6f47)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Retry
                </button>
              </div>
            ) : showForm ? (
              <BookingForm
                onAddBooking={addBooking}
                initialBooking={currentBooking}
                isEditing={isEditing}
              />            ) : (              <>
                {viewMode === "list" ? (
                  <>
                    <SearchBar
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                    />
                    <div>
                      <input
                        type="date"
                        value={dateFilter.fromDate || ""}
                        onChange={(e) =>
                          setDateRange((prev) => ({
                            ...prev,
                            fromDate: e.target.value,
                          }))
                        }
                        placeholder="From Date"
                        style={{
                          padding: "8px",
                          marginRight: "10px",
                          borderRadius: "8px",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          backgroundColor: "rgba(30, 26, 26, 0.8)",
                          color: "#fff",
                        }}
                      />
                      <input
                        type="date"
                        value={dateFilter.toDate || ""}
                        onChange={(e) =>
                          setDateRange((prev) => ({
                            ...prev,
                            toDate: e.target.value,
                          }))
                        }
                        placeholder="To Date"
                        style={{
                          padding: "8px",
                          borderRadius: "8px",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          backgroundColor: "rgba(30, 26, 26, 0.8)",
                          color: "#fff",
                        }}
                      />
                    </div>
                    <BookingList
                      bookings={filteredBookings}
                      onDelete={deleteBooking}
                      onModify={modifyBooking}
                    />
                  </>
                ) : viewMode === "calendar" ? (
                  <CalendarView />
                ) : (
                  <CompanyView />
                )}{/* Pagination Controls */}
                {viewMode === "list" && data?.pagination?.totalPages > 1 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "30px",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1 || isLoading}
                      style={{
                        padding: "8px 16px",
                        backgroundColor:
                          pagination.page <= 1
                            ? "rgba(30, 26, 26, 0.4)"
                            : "rgba(30, 26, 26, 0.8)",
                        color: pagination.page <= 1 ? "#777" : "#fff",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                        fontSize: "14px",
                        cursor:
                          pagination.page <= 1 || isLoading
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      Previous
                    </button>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        color: "white",
                        fontSize: "14px",
                        margin: "0 10px",
                      }}
                    >
                      Page {pagination.page} of{" "}
                      {data?.pagination?.totalPages || 1}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={
                        pagination.page >=
                          (data?.pagination?.totalPages || 1) || isLoading
                      }
                      style={{
                        padding: "8px 16px",
                        backgroundColor:
                          pagination.page >= (data?.pagination?.totalPages || 1)
                            ? "rgba(30, 26, 26, 0.4)"
                            : "rgba(30, 26, 26, 0.8)",
                        color:
                          pagination.page >= (data?.pagination?.totalPages || 1)
                            ? "#777"
                            : "#fff",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                        fontSize: "14px",
                        cursor:
                          pagination.page >=
                            (data?.pagination?.totalPages || 1) || isLoading
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "rgba(30, 26, 26, 0.95)",
          color: "white",
          padding: "30px",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            maxWidth: "1200px",
            margin: "0 auto",
            flexWrap: "wrap",
          }}
        >
          <div style={{ marginBottom: "20px", flexBasis: "300px" }}>
            <h3
              style={{
                margin: "0 0 15px",
                fontSize: "18px",
                fontWeight: "600",
                color: "#fff",
              }}
            ></h3>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: "14px",
                color: "rgba(255, 255, 255, 0.7)",
                lineHeight: "1.6",
              }}
            >
              Manage your hotel bookings with ease and efficiency.
            </p>
          </div>

          <div style={{ marginBottom: "20px", flexBasis: "200px" }}>
            <h4
              style={{
                margin: "0 0 15px",
                fontSize: "16px",
                fontWeight: "600",
                color: "#fff",
              }}
            >
              Quick Links
            </h4>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              <li style={{ marginBottom: "10px" }}>
                <a
                  href="#"
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    textDecoration: "none",
                    fontSize: "14px",
                  }}
                >
                  Dashboard
                </a>
              </li>
              <li style={{ marginBottom: "10px" }}>
                <a
                  href="#"
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    textDecoration: "none",
                    fontSize: "14px",
                  }}
                >
                  Bookings
                </a>
              </li>
              <li style={{ marginBottom: "10px" }}>
                <a
                  href="#"
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    textDecoration: "none",
                    fontSize: "14px",
                  }}
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#"
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    textDecoration: "none",
                    fontSize: "14px",
                  }}
                >
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: "20px", flexBasis: "200px" }}>
            <h4
              style={{
                margin: "0 0 15px",
                fontSize: "16px",
                fontWeight: "600",
                color: "#fff",
              }}
            >
              Support
            </h4>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              <li style={{ marginBottom: "10px" }}>
                <a
                  href="#"
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    textDecoration: "none",
                    fontSize: "14px",
                  }}
                >
                  Help Center
                </a>
              </li>
              <li style={{ marginBottom: "10px" }}>
                <a
                  href="#"
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    textDecoration: "none",
                    fontSize: "14px",
                  }}
                >
                  Documentation
                </a>
              </li>
              <li style={{ marginBottom: "10px" }}>
                <a
                  href="#"
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    textDecoration: "none",
                    fontSize: "14px",
                  }}
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    textDecoration: "none",
                    fontSize: "14px",
                  }}
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            marginTop: "20px",
            paddingTop: "20px",
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.5)",
            textAlign: "center",
          }}
        >
          <p>© 2025 Hotel Booking Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default BookingManager;