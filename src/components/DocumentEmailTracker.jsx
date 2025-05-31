import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  FileText,
  Calendar,
  User,
  Mail,
} from "lucide-react";

export default function DocumentEmailTracker({ adminKey }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackingData, setTrackingData] = useState([]);
  const [filters, setFilters] = useState({
    userId: '',
    documentType: '',
    startDate: '',
    endDate: '',
  });

  // Load tracking data
  const fetchTrackingData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.documentType) queryParams.append('documentType', filters.documentType);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      
      const response = await fetch(`/api/admin/trackDocumentEmail?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${adminKey}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tracking data');
      }
      
      setTrackingData(data.data || []);
    } catch (err) {
      console.error('Error fetching tracking data:', err);
      setError(err.message || 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Apply filters
  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchTrackingData();
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      userId: '',
      documentType: '',
      startDate: '',
      endDate: '',
    });
    fetchTrackingData();
  };
  
  // Load data on component mount
  useEffect(() => {
    if (adminKey) {
      fetchTrackingData();
    }
  }, [adminKey]);
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (!adminKey) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        Admin authentication required to view document tracking data.
      </div>
    );
  }

  return (
    <div className="">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-200 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold">!</span>
              </div>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Nature-inspired Filters */}
        <div className="bg-white rounded-3xl p-8 mb-8 shadow-xl border border-green-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Filter className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800">
              Filter the Habitat
            </h3>
          </div>

          <form
            onSubmit={handleApplyFilters}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <div className="space-y-2">
              <label
                htmlFor="userId"
                className="flex items-center space-x-2 text-sm font-medium text-gray-700"
              >
                <User className="w-4 h-4 text-green-600" />
                <span>Researcher ID</span>
              </label>
              <input
                type="text"
                id="userId"
                name="userId"
                value={filters.userId}
                onChange={handleFilterChange}
                placeholder="Enter researcher ID..."
                className="w-full px-4 py-3 border-2 border-green-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-green-50/30"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="documentType"
                className="flex items-center space-x-2 text-sm font-medium text-gray-700"
              >
                <FileText className="w-4 h-4 text-green-600" />
                <span>Document Species</span>
              </label>
              <select
                id="documentType"
                name="documentType"
                value={filters.documentType}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 border-2 border-green-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-green-50/30"
              >
                <option value="">All Species</option>
                <option value="excel">📊 Data Sheets</option>
                <option value="pdf">📋 Research Papers</option>
                <option value="doc">📄 Field Notes</option>
                <option value="other">📁 Other Materials</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="startDate"
                className="flex items-center space-x-2 text-sm font-medium text-gray-700"
              >
                <Calendar className="w-4 h-4 text-green-600" />
                <span>Migration Start</span>
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 border-2 border-green-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-green-50/30"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="endDate"
                className="flex items-center space-x-2 text-sm font-medium text-gray-700"
              >
                <Calendar className="w-4 h-4 text-green-600" />
                <span>Migration End</span>
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 border-2 border-green-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-green-50/30"
              />
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Trail</span>
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-3 border-2 border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Track Wildlife</span>
              </button>
            </div>
          </form>
        </div>

        {/* Results with nature theme */}
        <div className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-8 py-6 border-b border-green-200">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-green-700" />
              </div>
              <span>Document Migration Patterns</span>
            </h3>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center space-x-3">
                  <div className="animate-spin w-8 h-8 border-3 border-green-200 border-t-green-600 rounded-full"></div>
                  <p className="text-gray-600 text-lg">
                    Tracking wildlife movements...
                  </p>
                </div>
              </div>
            ) : trackingData.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg">
                  No wildlife tracks found in this area.
                </p>
                <p className="text-gray-500 mt-2">
                  Try adjusting your search filters to expand the habitat range.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-2 border-green-100">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 bg-green-50/50 rounded-tl-xl">
                        🕐 Timestamp
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 bg-green-50/50">
                        👤 Researcher
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 bg-green-50/50">
                        📋 Document
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 bg-green-50/50">
                        📧 Recipient
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 bg-green-50/50 rounded-tr-xl">
                        🏷️ Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-100">
                    {trackingData.map((entry, index) => {
                      const typeInfo = getDocumentTypeInfo(entry.documentType);
                      return (
                        <tr
                          key={entry.id}
                          className={`hover:bg-green-50/30 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-green-25/20"}`}
                        >
                          <td className="px-6 py-5 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span>{formatDate(entry.timestamp)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {entry.userId}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-8 h-8 ${typeInfo.bg} rounded-lg flex items-center justify-center`}
                              >
                                <span className="text-sm">{typeInfo.icon}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                {entry.documentName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                                <Mail className="w-4 h-4 text-purple-600" />
                              </div>
                              <span className="text-sm text-gray-900">
                                {entry.recipientEmail}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeInfo.bg} ${typeInfo.color} border border-current border-opacity-20`}
                            >
                              {entry.documentType.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
