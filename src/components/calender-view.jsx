"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { bookingsApi } from "@/utils/api";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Download,
} from "lucide-react";

// Helper functions
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

// Format date string to display in a more readable format
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateForAPI = (date) => {
  return date ? date.toISOString().split("T")[0] : null;
};

// Determine booking status from the data
const getBookingStatus = (booking) => {
  if (!booking) return "pending";

  const confirmValue = booking.confirm;

  if (
    confirmValue === null ||
    confirmValue === undefined ||
    confirmValue === ""
  ) {
    return "pending";
  }

  if (typeof confirmValue === "string") {
    const lowerConfirm = confirmValue.toLowerCase();
    if (lowerConfirm === "cancelled" || lowerConfirm === "canceled") {
      return "cancelled";
    }
    if (lowerConfirm === "pending") {
      return "pending";
    }
    if (lowerConfirm === "0") {
      return "pending";
    }
    // If it's any number above 0, consider it confirmed
    if (!isNaN(Number(confirmValue)) && Number(confirmValue) > 0) {
      return "confirmed";
    }
  }

  // Default fallback
  return "pending";
};

const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [dateRange, setDateRange] = useState({
    fromDate: null,
    toDate: null,
  });
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showLegend, setShowLegend] = useState(true);

  // Format dates for API calls
  // Set date range based on selected month view
  useEffect(() => {
    if (viewMonth !== null && viewYear !== null) {
      const monthName = new Date(viewYear, viewMonth, 1)
        .toLocaleString("default", { month: "long" })
        .toLowerCase();
      setSelectedMonth(monthName);

      // Set date range for the entire month
      const firstDay = new Date(viewYear, viewMonth, 1);
      const lastDay = new Date(viewYear, viewMonth + 1, 0);

      setDateRange({
        fromDate: formatDateForAPI(firstDay),
        toDate: formatDateForAPI(lastDay),
      });
    }
  }, [viewMonth, viewYear]);

  // Reset pagination when date changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentPage(1);
    }
  }, [selectedDate]);

  // Fetch booking aggregate data
  const {
    data: bookingData,
    isLoading,
    error,
    refetch: refetchAggregates,
  } = useQuery({
    queryKey: [
      "bookingAggregates",
      selectedMonth,
      dateRange.fromDate,
      dateRange.toDate,
    ],
    queryFn: () =>
      bookingsApi.getBookingAggregates({
        month: selectedMonth,
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
        view: "month",
      }),
    enabled: !!selectedMonth || (!!dateRange.fromDate && !!dateRange.toDate),
  });

  // Fetch booking details for a specific date when selected
  const { data: detailsData, isLoading: isLoadingDetails } = useQuery({
    queryKey: [
      "bookingDetails",
      selectedDate,
      currentPage,
      pageSize,
      filterStatus,
    ],
    queryFn: () =>
      bookingsApi.getBookings({
        fromDate: selectedDate,
        toDate: selectedDate,
        page: currentPage,
        pageSize,
        status: filterStatus !== "all" ? filterStatus : undefined,
      }),
    enabled: !!selectedDate,
  });

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    setCurrentPage(1); // Reset to first page when selecting a new date
  };

  const handlePrevMonth = () => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status === filterStatus ? "all" : status);
    setCurrentPage(1); // Reset to first page when changing filters
  };

  const toggleLegend = () => {
    setShowLegend(!showLegend);
  };

  const exportBookingsToCSV = () => {
    if (!detailsData || !detailsData.bookings.length) return;

    // Create CSV content
    const headers = [
      "Client",
      "Rooms",
      "Status",
      "Nights",
      "From",
      "To",
      "Agent",
      "Special Requests",
    ];
    const rows = detailsData.bookings.map((booking) => [
      booking.client || "N/A",
      booking.reqRooms || "N/A",
      getBookingStatus(booking),
      booking.nights || "N/A",
      booking.formattedFrom || "N/A",
      booking.formattedTo || "N/A",
      booking.agent || "N/A",
      booking.specialRequests || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bookings_${selectedDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate calendar
  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDayOfMonth = getFirstDayOfMonth(viewYear, viewMonth);

    const monthName = new Date(viewYear, viewMonth, 1).toLocaleString(
      "default",
      { month: "long" }
    );

    // Build calendar grid
    let calendarDays = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(
        <div key={`empty-${i}`} className="calendar-day empty"></div>
      );
    }

    // Check if today is in this month
    const today = new Date();
    const isCurrentMonth =
      today.getMonth() === viewMonth && today.getFullYear() === viewYear;
    const currentDay = today.getDate();

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;

      // Find booking data for this date
      const bookingForDate = bookingData?.bookingsByDate?.find(
        (b) => b.date === dateStr
      );
      const totalBookings = bookingForDate?.total || 0;
      const confirmed = bookingForDate?.confirmed || 0;
      const pending = bookingForDate?.pending || 0;
      const cancelled = bookingForDate?.cancelled || 0;

      const isActive = selectedDate === dateStr;
      const isToday = isCurrentMonth && day === currentDay;

      // Determine day status classes
      let statusClass = "";
      if (totalBookings > 0) {
        if (confirmed > 0 && pending === 0 && cancelled === 0) {
          statusClass = "all-confirmed";
        } else if (pending > 0) {
          statusClass = "has-pending";
        } else if (cancelled > 0 && confirmed === 0 && pending === 0) {
          statusClass = "all-cancelled";
        }
      }

      calendarDays.push(
        <div
          key={dateStr}
          className={`calendar-day ${isActive ? "active" : ""} ${
            isToday ? "today" : ""
          } ${statusClass}`}
          onClick={() => handleDateClick(dateStr)}
        >
          <div className="day-number">{day}</div>
          {bookingData && (
            <div className="booking-status">
              {totalBookings > 0 ? (
                <div className="booking-counts">
                  <div className="booking-total">
                    <span className="count-label">Total:</span>
                    <span className="count-value">{totalBookings}</span>
                  </div>
                  <div className="counts-detail">
                    {confirmed > 0 && (
                      <div className="count-item confirmed">
                        <span className="count-icon"></span>
                        <span className="count-number">{confirmed}</span>
                      </div>
                    )}
                    {pending > 0 && (
                      <div className="count-item pending">
                        <span className="count-icon"></span>
                        <span className="count-number">{pending}</span>
                      </div>
                    )}
                    {cancelled > 0 && (
                      <div className="count-item cancelled">
                        <span className="count-icon"></span>
                        <span className="count-number">{cancelled}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="no-bookings-indicator"></div>
              )}

              {totalBookings > 0 && (
                <div className="status-bars">
                  {confirmed > 0 && (
                    <div
                      className="status-bar confirmed"
                      style={{ flex: confirmed / totalBookings }}
                    ></div>
                  )}
                  {pending > 0 && (
                    <div
                      className="status-bar pending"
                      style={{ flex: pending / totalBookings }}
                    ></div>
                  )}
                  {cancelled > 0 && (
                    <div
                      className="status-bar cancelled"
                      style={{ flex: cancelled / totalBookings }}
                    ></div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <button className="month-nav-button" onClick={handlePrevMonth}>
            <ChevronLeft className="shrink-0" size={20} />
          </button>
          <h2>
            {monthName} {viewYear}
          </h2>
          <button
            className="month-nav-button shrink-0"
            onClick={handleNextMonth}
          >
            <ChevronRight className="shrink-0" size={20} />
          </button>
        </div>

        <div className="calendar-days-header">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="calendar-grid">{calendarDays}</div>

        <div className="legend-container">
          {showLegend && (
            <div className="calendar-legend">
              <div className="legend-item">
                <div className="legend-color confirmed"></div>
                <span>Confirmed</span>
              </div>
              <div className="legend-item">
                <div className="legend-color pending"></div>
                <span>Pending</span>
              </div>
              <div className="legend-item">
                <div className="legend-color cancelled"></div>
                <span>Cancelled</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Generate booking details panel with pagination
  const renderBookingDetailsPanel = () => {
    if (!selectedDate) return null;

    const totalPages = detailsData?.pagination?.totalPages || 1;
    const bookings = detailsData?.bookings || [];

    // Count totals by status for the selected date
    const selectedDateData = bookingData?.bookingsByDate?.find(
      (b) => b.date === selectedDate
    );

    return (
      <div className="booking-details-panel">
        <div className="details-header">
          <div>
            <h3>{formatDisplayDate(selectedDate)}</h3>
            {selectedDateData && (
              <div className="p-2 rounded shadow-md">
                <span className="block text-sm font-semibold text-white">
                  {selectedDateData.total} bookings
                </span>
                <div className="mt-2 space-y-1">
                  <span className="block text-sm text-green-600 font-medium">
                    {selectedDateData.confirmed} confirmed
                  </span>
                  <span className="block text-sm text-yellow-500 font-medium">
                    {selectedDateData.pending} pending
                  </span>
                  <span className="block text-sm text-red-500 font-medium">
                    {selectedDateData.cancelled} cancelled
                  </span>
                </div>
              </div>
            )}
          </div>
          <button
            className="close-button aspect-square size-8"
            onClick={() => setSelectedDate(null)}
          >
            <X className="shrink-0" size={18} />
          </button>
        </div>

        <div className="details-actions">
          <div className="status-filters">
            <button
              className={`filter-button ${
                filterStatus === "all" ? "active" : ""
              }`}
              onClick={() => handleFilterChange("all")}
            >
              All
            </button>
            <button
              className={`filter-button ${
                filterStatus === "confirmed" ? "active" : ""
              }`}
              onClick={() => handleFilterChange("confirmed")}
            >
              Confirmed
            </button>
            <button
              className={`filter-button ${
                filterStatus === "pending" ? "active" : ""
              }`}
              onClick={() => handleFilterChange("pending")}
            >
              Pending
            </button>
            <button
              className={`filter-button ${
                filterStatus === "cancelled" ? "active" : ""
              }`}
              onClick={() => handleFilterChange("cancelled")}
            >
              Cancelled
            </button>
          </div>

          {bookings.length > 0 && (
            <button className="export-button" onClick={exportBookingsToCSV}>
              <Download size={14} />
              Export
            </button>
          )}
        </div>

        {isLoadingDetails ? (
          <div className="details-loading">
            <div className="loading-spinner small"></div>
            <p>Loading bookings...</p>
          </div>
        ) : bookings.length > 0 ? (
          <>
            <div className="details-list">
              {bookings.map((booking) => {
                const status = getBookingStatus(booking);

                return (
                  <div
                    key={booking.uuid}
                    className={`booking-card status-${status}`}
                  >
                    <div className="booking-card-header">
                      <h4>{booking.client || "Guest"}</h4>
                      <span className={`status-badge ${status}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}{" "}
                        {status === "confirmed" &&
                          `(${parseInt(booking.confirm)})`}
                      </span>
                    </div>
                    <div className="booking-card-details">
                      <div className="detail-item">
                        <span className="detail-label">Rooms:</span>
                        <span className="detail-value">
                          {booking.reqRooms || "N/A"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Dates:</span>
                        <span className="detail-value">
                          {booking.formattedFrom} -{" "}
                          {booking.formattedTo || "N/A"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Nights:</span>
                        <span className="detail-value">
                          {booking.nights || "N/A"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Agent:</span>
                        <span className="detail-value">
                          {booking.agent || "N/A"}
                        </span>
                      </div>
                      {booking.specialRequests && (
                        <div className="detail-note">
                          <span className="note-label">Special Requests:</span>
                          <p className="note-text">{booking.specialRequests}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  className="page-button"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ArrowLeft className="shrink-0" size={16} />
                </button>
                <div className="page-info">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  className="page-button"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <ArrowRight className="shrink-0" size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-bookings">
            <p>No bookings found for this date.</p>
            {filterStatus !== "all" && (
              <button
                className="clear-filter"
                onClick={() => setFilterStatus("all")}
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="calendar-view">
      <div className="page-header">
        <div className="page-title">
          <Calendar size={24} />
          <h1>Booking Calendar</h1>
        </div>
        <div className="header-right"></div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading calendar data...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>Error loading booking data: {error.message}</p>
          <button onClick={() => refetchAggregates()}>Try Again</button>
        </div>
      ) : (
        <div
          className={`calendar-with-details ${
            selectedDate ? "with-panel" : ""
          }`}
        >
          {generateCalendar()}
          {selectedDate && renderBookingDetailsPanel()}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
