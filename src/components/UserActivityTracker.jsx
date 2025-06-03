'use client'

import { useState, useEffect } from 'react';
import { bookingsApi } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';
import {
  Eye,
  Leaf,
  Filter,
  RefreshCw,
  Search,
  Shield,
  Lock,
  Activity,
  User,
  Clock,
  Monitor,
  FileText,
  Hash,
} from "lucide-react";


export default function UserActivityTracker({adminKey}) {
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const adminDataQuery = useQuery({
    queryKey: ['userTrackingData', adminKey],
    queryFn: async ()=> {
      const data = await bookingsApi.getUserTrackingData(adminKey);
      return data.trackingData || [];
    },
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

  const getActionIcon = (action) => {
    switch(action) {
      case 'created': return '🌱';
      case 'edited': return '🦋';
      case 'deleted': return '🍂';
      default: return '🌿';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div
        className={`absolute pointer-events-none inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23059669" fill-opacity="0.02"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]`}
      />

      <div className="relative space-y-8">
        {/* Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-green-100">
          <div className="flex flex-wrap items-center gap-6">
            <button
              onClick={adminDataQuery.refetch}
              disabled={adminDataQuery.isFetching}
              className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-2xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <RefreshCw
                className={`w-5 h-5 ${adminDataQuery.isFetching ? "animate-spin" : ""}`}
              />
              <span>
                {adminDataQuery.isFetching ? "Tracking..." : "Refresh Data"}
              </span>
            </button>

            <div className="flex items-center space-x-2 bg-green-50 rounded-2xl px-4 py-3 border border-green-200">
              <Search className="w-5 h-5 text-green-600" />
              <input
                type="text"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                placeholder="Search by admin name..."
                className="bg-transparent border-none outline-none text-gray-700 placeholder-gray-500 min-w-[150px]"
              />
            </div>

            <div className="flex items-center space-x-2 bg-blue-50 rounded-2xl px-4 py-3 border border-blue-200">
              <Filter className="w-5 h-5 text-blue-600" />
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="bg-transparent border-none outline-none text-gray-700 min-w-[120px] cursor-pointer"
              >
                <option value="">All Actions</option>
                <option value="created">🌱 Created</option>
                <option value="edited">🦋 Edited</option>
                <option value="deleted">🍂 Deleted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activity Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-green-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <th className="py-4 px-6 text-left font-semibold flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Action</span>
                  </th>
                  <th className="py-4 px-6 text-left font-semibold">
                    <div className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Admin name</span>
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left font-semibold">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5" />
                      <span>Timestamp</span>
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left font-semibold">
                    <div className="flex items-center space-x-2">
                      <Monitor className="w-5 h-5" />
                      <span>Guest name</span>
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left font-semibold">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Sheet Name</span>
                    </div>
                  </th>
                  <th className="py-4 px-6 text-left font-semibold">
                    <div className="flex items-center space-x-2">
                      <Hash className="w-5 h-5" />
                      <span>ID</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData?.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 px-6 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="text-6xl">🦉</div>
                        <p className="text-gray-600 text-lg">
                          {filteredData?.length === 0
                            ? "Click 'Refresh Wildlife Data' to start tracking"
                            : "No matching activities found in the sanctuary"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData?.map((item, index) => (
                    <tr
                      key={index}
                      className={`${
                        index % 2 === 0 ? "bg-green-50" : "bg-white"
                      } hover:bg-green-100 transition-colors duration-200 border-b border-green-100`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {getActionIcon(item.actionType)}
                          </span>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              item.actionType === "created"
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : item.actionType === "edited"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-orange-100 text-orange-800 border border-orange-200"
                            }`}
                          >
                            {item.actionType.charAt(0).toUpperCase() +
                              item.actionType.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {(item.parsedInfo?.username ||
                              "U")[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">
                            {item.parsedInfo?.username || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600 font-mono text-sm">
                        {formatDate(item.parsedInfo?.timestamp)}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200">
                          {item.client || "N/A"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-50 text-purple-700 border border-purple-200">
                          {item.sheetName}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border">
                          {item.uuid}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
  
  // return (
  //   <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-orange-900">
  //     <div className="p-6">
  //       <div className="max-w-7xl mx-auto">
  //         <div className="mb-8">
  //           <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
  //             User Activity Tracking
  //           </h2>
  //           <p className="text-gray-400">Monitor and analyze user activity across the system</p>
  //         </div>

  //         <div className="mb-8 bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-orange-500/20">
  //           <div className="flex items-center flex-wrap gap-6">
  //             <button
  //               onClick={() => adminDataQuery.refetch()}
  //               className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
  //               disabled={adminDataQuery.isPending}
  //             >
  //               <span className={adminDataQuery.isPending ? "animate-spin" : ""}>
  //                 {adminDataQuery.isPending ? "⟳" : "↻"}
  //               </span>
  //               {adminDataQuery.isPending ? "Loading..." : "Refresh Data"}
  //             </button>

  //             <div className="flex-1 min-w-0">
  //               <label className="block text-orange-300 mb-2 font-medium">
  //                 Filter by User
  //               </label>
  //               <input
  //                 type="text"
  //                 value={filterUser}
  //                 onChange={(e) => setFilterUser(e.target.value)}
  //                 placeholder="Enter username..."
  //                 className="w-full px-4 py-3 bg-gray-700 border border-orange-500/30 rounded-lg text-white placeholder-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 focus:outline-none transition-all"
  //               />
  //             </div>

  //             <div className="flex-1 min-w-0">
  //               <label className="block text-orange-300 mb-2 font-medium">
  //                 Filter by Action
  //               </label>
  //               <select
  //                 value={filterAction}
  //                 onChange={(e) => setFilterAction(e.target.value)}
  //                 className="w-full px-4 py-3 bg-gray-700 border border-orange-500/30 rounded-lg text-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 focus:outline-none transition-all"
  //               >
  //                 <option value="">All Actions</option>
  //                 <option value="created">Created</option>
  //                 <option value="edited">Edited</option>
  //                 <option value="deleted">Deleted</option>
  //               </select>
  //             </div>
  //           </div>
  //         </div>

  //         {adminDataQuery.isError && (
  //           <div className="bg-red-900/50 border border-red-500 text-red-200 px-6 py-4 rounded-xl mb-6 backdrop-blur-sm">
  //             <div className="flex items-center gap-3">
  //               <span className="text-red-400 text-xl">⚠</span>
  //               <span className="font-medium">{adminDataQuery.error.message}</span>
  //             </div>
  //           </div>
  //         )}

  //         <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-orange-500/20 overflow-hidden shadow-2xl">
  //           <div className="overflow-x-auto">
  //             <table className="min-w-full">
  //               <thead>
  //                 <tr className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border-b border-orange-500/30">
  //                   <th className="py-4 px-6 text-left text-orange-300 font-semibold">Action Type</th>
  //                   <th className="py-4 px-6 text-left text-orange-300 font-semibold">User</th>
  //                   <th className="py-4 px-6 text-left text-orange-300 font-semibold">Timestamp</th>
  //                   <th className="py-4 px-6 text-left text-orange-300 font-semibold">Client</th>
  //                   <th className="py-4 px-6 text-left text-orange-300 font-semibold">Sheet</th>
  //                   <th className="py-4 px-6 text-left text-orange-300 font-semibold">UUID</th>
  //                 </tr>
  //               </thead>
  //               <tbody>
  //                 {filteredData?.length === 0 ? (
  //                   <tr>
  //                     <td colSpan="6" className="py-12 px-6 text-center text-gray-400">
  //                       <div className="flex flex-col items-center gap-3">
  //                         <span className="text-4xl">📊</span>
  //                         <span className="text-lg">
  //                           {adminDataQuery.data?.length === 0
  //                             ? "Click Refresh Data to load activity"
  //                             : "No matching records found"}
  //                         </span>
  //                       </div>
  //                     </td>
  //                   </tr>
  //                 ) : (
  //                   filteredData?.map((item, index) => (
  //                     <tr
  //                       key={index}
  //                       className={`border-b border-gray-700/50 hover:bg-orange-500/5 transition-colors ${
  //                         index % 2 === 0 ? "bg-gray-800/30" : "bg-gray-900/30"
  //                       }`}
  //                     >
  //                       <td className="py-4 px-6">
  //                         <span
  //                           className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
  //                             item.actionType === "created"
  //                               ? "bg-green-500/20 text-green-400 border border-green-500/30"
  //                               : item.actionType === "edited"
  //                               ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
  //                               : "bg-red-500/20 text-red-400 border border-red-500/30"
  //                           }`}
  //                         >
  //                           {item.actionType === "created" && "✨ "}
  //                           {item.actionType === "edited" && "✏️ "}
  //                           {item.actionType === "deleted" && "🗑️ "}
  //                           {item.actionType.charAt(0).toUpperCase() + item.actionType.slice(1)}
  //                         </span>
  //                       </td>
  //                       <td className="py-4 px-6 text-gray-300 font-medium">
  //                         {item.parsedInfo?.username || "Unknown"}
  //                       </td>
  //                       <td className="py-4 px-6 text-gray-400">
  //                         {formatDate(item.parsedInfo?.timestamp)}
  //                       </td>
  //                       <td className="py-4 px-6 text-gray-400">{item.client || "N/A"}</td>
  //                       <td className="py-4 px-6 text-gray-300">{item.sheetName}</td>
  //                       <td className="py-4 px-6 text-xs font-mono text-gray-500 max-w-32 truncate">
  //                         {item.uuid}
  //                       </td>
  //                     </tr>
  //                   ))
  //                 )}
  //               </tbody>
  //             </table>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
}
