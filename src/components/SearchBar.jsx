import { useState } from 'react';

function SearchBar({ searchTerm, onSearchChange }) {
  const [isHoveringSearch, setIsHoveringSearch] = useState(false);
  
  return (
    <div style={{ 
      marginBottom: '24px',
      display: 'flex',
      gap: '16px',
      alignItems: 'center'
    }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search bookings by client, hotel, agent, etc."
          style={{
            width: '100%',
            padding: '14px 16px 14px 48px',
            border: 'none',
            backgroundColor: 'rgba(60, 47, 47, 0.5)',
            borderRadius: '10px',
            fontSize: '14px',
            transition: 'all 0.3s',
            outline: 'none',
            color: 'white',
          }}
        />
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: '0.6',
          }}
        >
          <path
            d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {searchTerm && (
        <button
          onClick={() => onSearchChange('')}
          onMouseEnter={() => setIsHoveringSearch(true)}
          onMouseLeave={() => setIsHoveringSearch(false)}
          style={{
            padding: '10px 16px',
            background: isHoveringSearch
              ? 'rgba(60, 47, 47, 0.7)'
              : 'rgba(60, 47, 47, 0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.3s',
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}

export default SearchBar;