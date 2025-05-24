'use client'

import { useState, useEffect } from 'react';
import { bookingsApi } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';

export default function UserActivityTracker() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  
  // Check if admin authentication is available
  useEffect(() => {
    const storedAdminKey = localStorage.getItem('adminKey');
    if (storedAdminKey) {
      setAdminKey(storedAdminKey);
      setIsAdmin(true);
    }
  }, []);
  
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminKey) {
      localStorage.setItem('adminKey', adminKey);
      setIsAdmin(true);
    }
  };

  const adminDataQuery = useQuery({
    queryKey: ['userTrackingData', adminKey],
    queryFn: async ()=> {
      const data = await bookingsApi.getUserTrackingData(adminKey);
      return data.trackingData || [];
    },
    enabled: isAdmin,
    refetchOnWindowFocus: false,
  })
  
  // Filter the activity data
  const filteredData = adminDataQuery.data?.filter(item => {
    const matchesUser = !filterUser || 
      (item.parsedInfo?.username && item.parsedInfo.username.toLowerCase().includes(filterUser.toLowerCase()));
    const matchesAction = !filterAction || item.actionType === filterAction;
    return matchesUser && matchesAction;
  });
  
  // Format the date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  if (!isAdmin) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Administrator Access</h2>
        <form onSubmit={handleAdminLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="adminKey">
              Admin Key
            </label>
            <input
              type="password"
              id="adminKey"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Access Admin Panel
          </button>
        </form>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">User Activity Tracking</h2>

      <div className="mb-6 flex items-center  flex-wrap gap-4">
        <button
          onClick={() => adminDataQuery.refetch()}
          style={{
            padding: "8px 16px",
            marginRight: "8px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#8b6f47",
            color: "white",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600",
            transition: "all 0.3s",
          }}
        >
          {adminDataQuery.isPending ? "Loading..." : "Refresh Data"}
        </button>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by User:
          </label>
          <input
            type="text"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            placeholder="Enter username"
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Action:
          </label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Actions</option>
            <option value="created">Created</option>
            <option value="edited">Edited</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      {adminDataQuery.isError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {adminDataQuery.error.message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b">Action Type</th>
              <th className="py-2 px-4 border-b">User</th>
              <th className="py-2 px-4 border-b">Timestamp</th>
              <th className="py-2 px-4 border-b">Client</th>
              <th className="py-2 px-4 border-b">Sheet</th>
              <th className="py-2 px-4 border-b">UUID</th>
            </tr>
          </thead>
          <tbody>
            {filteredData?.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-4 px-4 text-center">
                  {adminDataQuery.data?.length === 0
                    ? "Click Refresh Data to load activity"
                    : "No matching records found"}
                </td>
              </tr>
            ) : (
              filteredData?.map((item, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <td className="py-2 px-4 border-b">
                    <span
                      className={`inline-block px-2 py-1 rounded text-sm ${
                        item.actionType === "created"
                          ? "bg-green-100 text-green-800"
                          : item.actionType === "edited"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.actionType.charAt(0).toUpperCase() +
                        item.actionType.slice(1)}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    {item.parsedInfo?.username || "Unknown"}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {formatDate(item.parsedInfo?.timestamp)}
                  </td>
                  <td className="py-2 px-4 border-b">{item.client || "N/A"}</td>
                  <td className="py-2 px-4 border-b">{item.sheetName}</td>
                  <td className="py-2 px-4 border-b text-xs font-mono">
                    {item.uuid}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
