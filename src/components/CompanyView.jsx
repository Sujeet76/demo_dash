"use client"
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '@/utils/api';
import BookingList from './BookingList';

function CompanyView() {
  // State for company data view
  const [sortBy, setSortBy] = useState("count");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyBookingsSortBy, setCompanyBookingsSortBy] = useState("fromDate");
  const [companyBookingsSortOrder, setCompanyBookingsSortOrder] = useState("asc");
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10
  });

  // Fetch companies data
  const { 
    data: companiesData, 
    isLoading: companiesLoading, 
    error: companiesError 
  } = useQuery({
    queryKey: ['bookingsByCompany', sortBy, sortOrder],
    queryFn: () => bookingsApi.getBookingsByCompany({ sortBy, sortOrder }),
  });

  // Fetch bookings for selected company
  const { 
    data: companyBookingsData, 
    isLoading: companyBookingsLoading, 
    error: companyBookingsError 
  } = useQuery({
    queryKey: [
      'bookingsForCompany', 
      selectedCompany, 
      companyBookingsSortBy, 
      companyBookingsSortOrder,
      pagination.page,
      pagination.pageSize
    ],
    queryFn: () => selectedCompany 
      ? bookingsApi.getBookingsForCompany({
          company: selectedCompany,
          sortBy: companyBookingsSortBy,
          sortOrder: companyBookingsSortOrder,
          page: pagination.page,
          pageSize: pagination.pageSize
        }) 
      : null,
    enabled: !!selectedCompany,
  });

  const companies = companiesData?.companies || [];
  const companyBookings = companyBookingsData?.bookings || [];
  const companyBookingsPagination = companyBookingsData?.pagination || {
    totalPages: 1,
    totalItems: 0
  };

  const handleCompanyClick = (companyName) => {
    setSelectedCompany(companyName);
    setPagination({ page: 1, pageSize: 10 }); // Reset pagination when selecting a new company
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleCompanySortChange = (field) => {
    if (sortBy === field) {
      // If already sorting by this field, toggle sort order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Otherwise, set the new sort field and default to descending
      setSortBy(field);
      setSortOrder("desc"); // Default to descending for count and rooms
      if (field === "name") setSortOrder("asc"); // Default to ascending for name
    }
  };

  const handleBookingSortChange = (field) => {
    if (companyBookingsSortBy === field) {
      // Toggle sort order if already sorting by this field
      setCompanyBookingsSortOrder(companyBookingsSortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field
      setCompanyBookingsSortBy(field);
      setCompanyBookingsSortOrder("asc"); // Default to ascending
    }
  };

  const getSortIcon = (currentSortBy, field) => {
    if (currentSortBy !== field) return null;
    return currentSortBy === field && (
      (sortOrder === "asc" || companyBookingsSortOrder === "asc") 
        ? " ↑" 
        : " ↓"
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ 
        fontSize: '24px', 
        marginBottom: '20px',
        color: '#d9c2a6'
      }}>
        Company Bookings Overview
      </h2>

      {/* Back button (when viewing company details) */}
      {selectedCompany && (
        <button 
          onClick={() => setSelectedCompany(null)}
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(90deg, #2d6ca3, #3d89c3)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>←</span> Back to Companies
        </button>
      )}

      {!selectedCompany ? (
        // Companies list view
        <div>
          {companiesLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Loading companies data...
            </div>
          ) : companiesError ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#e57373',
              backgroundColor: 'rgba(183, 28, 28, 0.2)',
              borderRadius: '8px'
            }}>
              Error loading companies: {companiesError.message}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'separate',
                borderSpacing: '0',
                fontSize: '14px',
                color: 'white'
              }}>
                <thead>
                  <tr>
                    <th 
                      style={{ 
                        padding: '16px 12px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#d9c2a6',
                        fontWeight: '600',
                        fontSize: '13px',
                        letterSpacing: '0.5px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleCompanySortChange('name')}
                    >
                      Company Name {getSortIcon(sortBy, 'name')}
                    </th>
                    <th 
                      style={{ 
                        padding: '16px 12px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#d9c2a6',
                        fontWeight: '600',
                        fontSize: '13px',
                        letterSpacing: '0.5px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleCompanySortChange('count')}
                    >
                      Booking Count {getSortIcon(sortBy, 'count')}
                    </th>
                    <th 
                      style={{ 
                        padding: '16px 12px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#d9c2a6',
                        fontWeight: '600',
                        fontSize: '13px',
                        letterSpacing: '0.5px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleCompanySortChange('rooms')}
                    >
                      Total Rooms Booked {getSortIcon(sortBy, 'rooms')}
                    </th>
                    <th style={{ 
                      padding: '16px 12px', 
                      textAlign: 'left', 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#d9c2a6',
                      fontWeight: '600',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company, index) => (
                    <tr 
                      key={index}
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background-color 0.3s',
                        backgroundColor: 'rgba(60, 47, 47, 0.2)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(60, 47, 47, 0.4)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(60, 47, 47, 0.2)'}
                    >
                      <td style={{ padding: '14px 12px', color: 'rgba(255, 255, 255, 0.9)' }}>
                        {company.companyName}
                      </td>
                      <td style={{ padding: '14px 12px', color: 'rgba(255, 255, 255, 0.9)' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: 'rgba(46, 125, 50, 0.2)',
                          color: '#81c784'
                        }}>
                          {company.bookingCount}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px', color: 'rgba(255, 255, 255, 0.9)' }}>
                        {company.roomsBooked}
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <button 
                          onClick={() => handleCompanyClick(company.companyName)}
                          style={{
                            padding: '6px 12px',
                            background: 'linear-gradient(90deg, #2d6ca3, #3d89c3)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            letterSpacing: '0.3px',
                            transition: 'all 0.3s',
                            boxShadow: '0 2px 8px rgba(61, 137, 195, 0.3)'
                          }}
                        >
                          View Bookings
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // Company details view
        <div>
          <h3 style={{ 
            fontSize: '20px', 
            marginBottom: '15px',
            color: '#d9c2a6'
          }}>
            Bookings for {selectedCompany}
          </h3>

          {/* Sorting controls for company bookings */}
          <div style={{ 
            display: 'flex', 
            marginBottom: '15px', 
            gap: '15px'
          }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Sort by:</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => handleBookingSortChange('fromDate')}
                style={{
                  padding: '5px 10px',
                  backgroundColor: companyBookingsSortBy === 'fromDate' ? 'rgba(139, 111, 71, 0.5)' : 'rgba(60, 47, 47, 0.4)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Date {getSortIcon(companyBookingsSortBy, 'fromDate')}
              </button>
              <button 
                onClick={() => handleBookingSortChange('client')}
                style={{
                  padding: '5px 10px',
                  backgroundColor: companyBookingsSortBy === 'client' ? 'rgba(139, 111, 71, 0.5)' : 'rgba(60, 47, 47, 0.4)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Client {getSortIcon(companyBookingsSortBy, 'client')}
              </button>
              <button 
                onClick={() => handleBookingSortChange('rooms')}
                style={{
                  padding: '5px 10px',
                  backgroundColor: companyBookingsSortBy === 'rooms' ? 'rgba(139, 111, 71, 0.5)' : 'rgba(60, 47, 47, 0.4)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Rooms {getSortIcon(companyBookingsSortBy, 'rooms')}
              </button>
              <button 
                onClick={() => handleBookingSortChange('nights')}
                style={{
                  padding: '5px 10px',
                  backgroundColor: companyBookingsSortBy === 'nights' ? 'rgba(139, 111, 71, 0.5)' : 'rgba(60, 47, 47, 0.4)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Nights {getSortIcon(companyBookingsSortBy, 'nights')}
              </button>
            </div>
          </div>

          {/* Company bookings list */}
          {companyBookingsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Loading bookings...
            </div>
          ) : companyBookingsError ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#e57373',
              backgroundColor: 'rgba(183, 28, 28, 0.2)',
              borderRadius: '8px'
            }}>
              Error loading bookings: {companyBookingsError.message}
            </div>
          ) : (
            <>
              <BookingList bookings={companyBookings} />
              
              {/* Pagination for company bookings */}
              {companyBookingsPagination.totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  margin: '20px 0',
                  color: 'white'
                }}>
                  <button
                    onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                    style={{
                      padding: '5px 10px',
                      background: pagination.page === 1 
                        ? 'rgba(60, 47, 47, 0.4)' 
                        : 'linear-gradient(90deg, #3f7fb6, #5499d0)',
                      color: pagination.page === 1 ? 'rgba(255, 255, 255, 0.5)' : 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: pagination.page === 1 ? 'default' : 'pointer',
                      fontSize: '14px',
                      opacity: pagination.page === 1 ? 0.7 : 1
                    }}
                  >
                    Previous
                  </button>
                  <span>
                    Page {pagination.page} of {companyBookingsPagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(Math.min(companyBookingsPagination.totalPages, pagination.page + 1))}
                    disabled={pagination.page === companyBookingsPagination.totalPages}
                    style={{
                      padding: '5px 10px',
                      background: pagination.page === companyBookingsPagination.totalPages 
                        ? 'rgba(60, 47, 47, 0.4)' 
                        : 'linear-gradient(90deg, #3f7fb6, #5499d0)',
                      color: pagination.page === companyBookingsPagination.totalPages ? 'rgba(255, 255, 255, 0.5)' : 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: pagination.page === companyBookingsPagination.totalPages ? 'default' : 'pointer',
                      fontSize: '14px',
                      opacity: pagination.page === companyBookingsPagination.totalPages ? 0.7 : 1
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default CompanyView;
