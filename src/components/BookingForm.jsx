import { useState, useEffect } from 'react';

function BookingForm({ onAddBooking, initialBooking, isEditing }) {
  const [booking, setBooking] = useState(() => {
    return initialBooking || {
      day: '',
      month: '',
      client: '',
      reqRooms: '',
      confirm: 'Confirmed',
      agent: '',
      from: '',
      to: '',
      nights: '',
      voucherNoReconfirm: '',
      safari: 'No',
      safariDate: '',
      arrivalDetails: 'Train',
      guestContactInfo: '',
      specialRequests: ''
    };
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update booking when initialBooking prop changes
  useEffect(() => {
    if (initialBooking) {
      setBooking(initialBooking);
    }
  }, [initialBooking]);
  
  const [isHovering, setIsHovering] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBooking(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-calculate nights when from and to dates are selected
    if (name === 'from' || name === 'to') {
      if (booking.from && e.target.value) {
        const fromDate = name === 'from' ? new Date(value) : new Date(booking.from);
        const toDate = name === 'to' ? new Date(value) : new Date(booking.to);
        const timeDiff = toDate.getTime() - fromDate.getTime();
        const nightCount = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (nightCount > 0) {
          setBooking(prev => ({
            ...prev,
            nights: nightCount
          }));
        }
      }
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();    // Format dates before submitting
    const formattedBooking = {
      ...booking,
      formattedFrom: formatDate(booking.from),
      formattedTo: formatDate(booking.to),
      formattedSafariDate: formatDate(booking.safariDate),
      // If editing, keep existing ID and UUID, otherwise generate a new ID
      id: isEditing ? booking.id : Date.now(),
      uuid: isEditing ? booking.uuid : undefined, // Will be generated server-side if undefined
    };

    // console.log({formattedBooking});
    
    try {
      // Send the data to Google Sheets API through our Next.js API route
      setIsSubmitting(true);
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedBooking),
      });

      const result = await response.json();
      console.log('API response:', result);      if (!result.success) {
        throw new Error(result.error || 'Failed to add booking to Google Sheets');
      }
      
      // Update the booking with the returned UUID if it's new
      if (!isEditing && result.uuid) {
        formattedBooking.uuid = result.uuid;
      }
      
      // Add to local state
      onAddBooking(formattedBooking);
      
      // Reset the form
      setBooking({
        day: '',
        month: '',
        client: '',
        reqRooms: '',
        confirm: 'Confirmed',
        agent: '',
        from: '',
        to: '',
        nights: '',
        voucherNoReconfirm: '',
        safari: 'No',
        safariDate: '',
        arrivalDetails: 'Train',
        guestContactInfo: '',
        specialRequests: ''
      });
      
      alert('Booking successfully added to Google Sheets!');
    } catch (error) {
      console.error('Error adding booking to Google Sheets:', error);
      alert('Failed to add booking to Google Sheets. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'rgba(60, 47, 47, 0.5)',
    borderRadius: '10px',
    fontSize: '14px',
    transition: 'all 0.3s',
    outline: 'none',
    color: 'white',
    boxSizing: 'border-box'
  };
  
  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500'
  };
  
  return (
    <div
      style={{
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "20px",
        color: "white",
      }}
    >
      <h3
        style={{
          margin: "0 0 24px 0",
          fontSize: "20px",
          fontWeight: "600",
          background: "linear-gradient(90deg, #8b6f47, #d9c2a6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Create New Booking
      </h3>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          <div>
            <label style={labelStyle}>Day</label>
            <input
              type="text"
              name="day"
              value={booking.day}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Month</label>
            <input
              type="text"
              name="month"
              value={booking.month}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Client</label>
            <input
              type="text"
              name="client"
              value={booking.client}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>REQ Rooms</label>
            <input
              type="text"
              name="reqRooms"
              value={booking.reqRooms}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Confirm</label>
            <select
              name="confirm"
              value={booking.confirm}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Agent</label>
            <input
              type="text"
              name="agent"
              value={booking.agent}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>From</label>
            <input
              type="date"
              name="from"
              value={booking.from}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>To</label>
            <input
              type="date"
              name="to"
              value={booking.to}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Nights</label>
            <input
              type="number"
              name="nights"
              value={booking.nights}
              onChange={handleChange}
              min="1"
              readOnly
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Voucher No Reconfirm</label>
            <input
              type="text"
              name="voucherNoReconfirm"
              value={booking.voucherNoReconfirm}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Safari</label>
            <select
              name="safari"
              value={booking.safari}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Safari Date (dd/mm/yyyy)</label>
            <input
              type="date"
              name="safariDate"
              value={booking.safariDate}
              onChange={handleChange}
              style={inputStyle}
              disabled={booking.safari === "No"}
            />
          </div>

          <div>
            <label style={labelStyle}>Arrival Details</label>
            <select
              name="arrivalDetails"
              value={booking.arrivalDetails}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="Train">Train</option>
              <option value="Surface">Surface</option>
              <option value="Own">Own</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Guest Email/Phone</label>
            <input
              type="text"
              name="guestContactInfo"
              value={booking.guestContactInfo}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Email or phone number"
            />
          </div>

          <div style={{ gridColumn: "1 / span 2" }}>
            <label style={labelStyle}>Special Requests</label>
            <textarea
              name="specialRequests"
              value={booking.specialRequests}
              onChange={handleChange}
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
            />
          </div>
        </div>

        <div style={{ marginTop: "30px", textAlign: "right" }}>
          <button
            type="submit"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{
              padding: "12px 24px",
              background: isHovering
                ? "linear-gradient(90deg, #8b6f47, #a68a64)"
                : "linear-gradient(90deg, #7a5f3d, #8b6f47)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              letterSpacing: "0.5px",
              transition: "all 0.3s",
              boxShadow: isHovering
                ? "0 6px 20px rgba(139, 111, 71, 0.4)"
                : "0 4px 12px rgba(139, 111, 71, 0.3)",
            }}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Submitting..."
              : isEditing
              ? "Update Booking"
              : "CREATE BOOKING"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BookingForm;