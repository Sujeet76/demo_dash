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

  deleteBooking: async (uuid) => {
    const { data } = await axios.delete("/api/bookings/deleteBooking", {
      data: { uuid },
    });

    if (!data.success) {
      throw new Error(data.error || "Failed to delete booking");
    }

    return data;
  },
};

export {
  bookingsApi,
}