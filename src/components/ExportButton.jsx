import { useState } from 'react';

function ExportButton({ bookings }) {
  const [isHovering, setIsHovering] = useState(false);
  
  const exportToCSV = () => {
    // Generate CSV content based on the bookings data
    const csvHeader = [
      'Day',
      'Month',
      'Client',
      'REQ Rooms',
      'Confirm',
      'Agent',
      'From',
      'To',
      'Nights',
      'Voucher No Reconfirm',
      'Safari',
      'Safari Date',
      'Arrival Details',
      'Sightings',
      'Hotel',
      'Guest Email',
      'Guest Phone',
      'Special Requests'
    ].join(',');
    
    const csvRows = bookings.map(booking => {
      return [
        booking.day,
        booking.month,
        `"${booking.client}"`,
        booking.reqRooms,
        booking.confirm,
        `"${booking.agent}"`,
        booking.formattedFrom || booking.from,
        booking.formattedTo || booking.to,
        booking.nights,
        `"${booking.voucherNoReconfirm}"`,
        `"${booking.safari}"`,
        booking.formattedSafariDate || booking.safariDate,
        booking.arrivalDetails,
        booking.sightings,
        booking.hotel,
        booking.guestEmail,
        booking.guestPhone,
        `"${booking.specialRequests}"`
      ].join(',');
    });
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Create a blob and generate a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <button
      onClick={exportToCSV}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        padding: '10px 20px',
        background: isHovering
          ? 'linear-gradient(90deg, #3d6d5e, #4a8673)'
          : 'linear-gradient(90deg, #355e52, #3d6d5e)',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        letterSpacing: '0.5px',
        transition: 'all 0.3s',
        boxShadow: isHovering
          ? '0 4px 15px rgba(61, 109, 94, 0.4)'
          : '0 2px 10px rgba(61, 109, 94, 0.3)',
      }}
    >
      EXPORT CSV
    </button>
  );
}

export default ExportButton;