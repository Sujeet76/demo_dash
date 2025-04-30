import { useState } from 'react';
import BookingList from './BookingList';
import SearchBar from './SearchBar';
import { MONTH_NAMES } from '@/utils/googleSheetsConfig';

function BookingUI({ 
  bookings, 
  searchTerm, 
  setSearchTerm, 
  onDelete, 
  onModify,
  availableMonths,
  activeMonth,
  setActiveMonth,
  page,
  setPage,
  pageSize,
  totalPages,
  totalItems,
  isLoading
}) {
  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (booking.day && booking.day.toLowerCase().includes(searchLower)) ||
      (booking.month && booking.month.toLowerCase().includes(searchLower)) ||
      (booking.client && booking.client.toLowerCase().includes(searchLower)) ||
      (booking.agent && booking.agent.toLowerCase().includes(searchLower)) ||
      (booking.confirm && booking.confirm.toLowerCase().includes(searchLower)) ||
      (booking.guestContactInfo && booking.guestContactInfo.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div>
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      
      {/* Month heading */}
      <div style={{
        margin: '20px 0 10px',
        padding: '0 0 10px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          margin: '0',
          color: '#d9c2a6',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{ marginRight: '10px' }}>
            {activeMonth ? `${activeMonth} Bookings` : 'All Bookings'}
          </span>
          {totalItems > 0 && (
            <span style={{
              fontSize: '14px',
              fontWeight: 'normal',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              ({totalItems} {totalItems === 1 ? 'entry' : 'entries'})
            </span>
          )}
        </h3>
      </div>
        {/* Month tabs */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '10px',
          paddingBottom: '5px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: '500',
            marginRight: '10px'
          }}>
            Filter by month:
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          padding: '6px',
          background: 'rgba(30, 26, 26, 0.6)',
          borderRadius: '10px',
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <button
            onClick={() => {
              setActiveMonth(null);
              setPage(1);
            }}
            style={{
              padding: '8px 16px',
            marginRight: '8px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeMonth === null ? '#8b6f47' : 'rgba(60, 47, 47, 0.4)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeMonth === null ? '600' : '400',
            transition: 'all 0.3s'
          }}
        >
          All Months
        </button>
        
        {availableMonths.sort((a, b) => {
          return MONTH_NAMES.indexOf(a) - MONTH_NAMES.indexOf(b);
        }).map((month) => (
          <button
            key={month}
            onClick={() => {
              setActiveMonth(month);
              setPage(1);
            }}
            style={{
              padding: '8px 16px',
              marginRight: '8px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeMonth === month ? '#8b6f47' : 'rgba(60, 47, 47, 0.4)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeMonth === month ? '600' : '400',
              transition: 'all 0.3s'
            }}
          >
            {month}
          </button>
        ))}
      </div>
      
      {isLoading ? (
        <div style={{
          textAlign: 'center',
          padding: '30px',
          backgroundColor: 'rgba(60, 47, 47, 0.3)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: '20px 0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255, 255, 255, 0.1)',
              borderTop: '3px solid #8b6f47',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}></div>
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <p>Loading {activeMonth ? activeMonth : 'all'} bookings...</p>
          </div>
        </div>
      ) : filteredBookings.length === 0 ? (
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
          <p>No bookings found for {activeMonth ? `month: ${activeMonth}` : 'any month'}.</p>
          {searchTerm && <p>Try adjusting your search criteria.</p>}
        </div>
      ) : (
        <BookingList 
          bookings={filteredBookings} 
          onDelete={onDelete} 
          onModify={onModify} 
        />
      )}
      
      {/* Pagination controls */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '20px',
        padding: '10px 0'
      }}>
        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
          Showing {bookings.length > 0 ? ((page - 1) * pageSize) + 1 : 0} to {Math.min(page * pageSize, totalItems)} of {totalItems} entries
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1 || isLoading}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: page === 1 || isLoading ? 'rgba(60, 47, 47, 0.2)' : 'rgba(60, 47, 47, 0.6)',
              color: page === 1 || isLoading ? 'rgba(255, 255, 255, 0.5)' : 'white',
              border: 'none',
              cursor: page === 1 || isLoading ? 'default' : 'pointer'
            }}
          >
            Previous
          </button>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px'
          }}>
            Page {page} of {totalPages || 1}
          </div>
          
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || isLoading}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: page >= totalPages || isLoading ? 'rgba(60, 47, 47, 0.2)' : 'rgba(60, 47, 47, 0.6)',
              color: page >= totalPages || isLoading ? 'rgba(255, 255, 255, 0.5)' : 'white',
              border: 'none',
              cursor: page >= totalPages || isLoading ? 'default' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}

export default BookingUI;
