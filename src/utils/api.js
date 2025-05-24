import axios from "axios";

const bookingsApi = {
  getBookings: async ({ page = 1, pageSize = 400, month = "", fromDate = null, toDate = null }) => {
    const params = { page, pageSize };
    if (month) params.month = month;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;

    const { data } = await axios.get("/api/bookings/getBookings", { params });

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch bookings");
    }

    return data;
  },

  deleteBooking: async (uuid, deletedBy = 'unknown') => {
    const { data } = await axios.delete("/api/bookings/deleteBooking", {
      data: { uuid, deletedBy },
    });

    if (!data.success) {
      throw new Error(data.error || "Failed to delete booking");
    }

    return data;
  },

  getBookingAggregates: async ({ month = "", fromDate = null, toDate = null, view = "month" }) => {
    const params = { view };
    if (month) params.month = month;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;

    const { data } = await axios.get("/api/bookings/getBookingAggregates", { params });

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch booking aggregates");
    }

    return data;
  },

  getBookingsByCompany: async ({ sortBy = "count", sortOrder = "desc" }) => {
    const params = { sortBy, sortOrder };

    const { data } = await axios.get("/api/bookings/getBookingsByCompany", { params });

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch bookings by company");
    }

    return data;
  },

  getBookingsForCompany: async ({ 
    company, 
    sortBy = "fromDate", 
    sortOrder = "asc",
    page = 1,
    pageSize = 10
  }) => {
    if (!company) {
      throw new Error("Company parameter is required");
    }

    const params = { company, sortBy, sortOrder, page, pageSize };

    const { data } = await axios.get("/api/bookings/getBookingsForCompany", { params });

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch bookings for company");
    }

    return data;
  },

  getUserTrackingData: async (adminKey) => {
    const params = { adminKey };
    
    const { data } = await axios.get("/api/admin/getUserTrackingData", { params });

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch user tracking data");
    }

    return data;
  },
};

export {
  bookingsApi,
}