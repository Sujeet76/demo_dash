"use client";

import { useState, useEffect } from "react";
import UserActivityTracker from "@/components/UserActivityTracker";
import DocumentEmailTracker from "@/components/DocumentEmailTracker";
import { Activity, Mail, Shield, Leaf, TreePine, Bird } from "lucide-react";
import { Eye } from "lucide-react";
import { Lock } from "lucide-react";

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [activeTab, setActiveTab] = useState("user-activity");

  useEffect(() => {
    // Get admin key from localStorage if available
    const storedAdminKey = localStorage.getItem("adminKey");
    const isValidAdminKey = storedAdminKey === process.env.NEXT_PUBLIC_ADMIN_KEY
    if (storedAdminKey && isValidAdminKey) {
      setAdminKey(storedAdminKey);
      setIsLoggedIn(true);
    }else {
      setAdminKey("");
      setIsLoggedIn(false);
      localStorage.removeItem("adminKey");
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    const key = process.env.NEXT_PUBLIC_ADMIN_KEY || "your_secret_key";
    setAdminKey(key);
    localStorage.setItem("adminKey", key);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div
        className={`absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23059669\" fill-opacity=\"0.02\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] pointer-events-none`}
      ></div>

      {!isLoggedIn ? (
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6 h-full py-20">
          <div
            className={`absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23059669" fill-opacity="0.03"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] pointer-events-none`}
          ></div>

          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full border border-green-100">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Admin Login
              </h2>
              <p className="text-gray-600">Administrative Access Required</p>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                <input
                  type="password"
                  id="adminKey"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter your ranger key..."
                  className="w-full pl-12 pr-4 py-4 border-2 border-green-200 rounded-2xl focus:border-green-500 focus:outline-none transition-all duration-300 bg-white/90 backdrop-blur-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
                />
              </div>

              <button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-2xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
              >
                <Eye className="w-5 h-5" />
                <span>Enter Wildlife Sanctuary</span>
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                🦋 Protected by Nature&apos;s Guard 🌿
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative p-6 min-h-screen py-10 max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <TreePine className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                Wildlife Sanctuary Dashboard
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Monitor and manage conservation activities across the sanctuary
            </p>
          </div>

          {/* Admin Tabs */}
          <div className="mb-8">
            <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow-lg border border-green-100 w-fit p-2 px-3">
              <div className="flex flex-wrap justify-start gap-2">
                <button
                  onClick={() => setActiveTab("user-activity")}
                  className={`flex items-center space-x-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                    activeTab === "user-activity"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg transform scale-105"
                      : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                  }`}
                >
                  <Activity className="w-5 h-5" />
                  <span>Admin Activity</span>
                  {activeTab === "user-activity" && (
                    <Bird className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("document-emails")}
                  className={`flex items-center space-x-3 disabled:opacity-60 disabled:cursor-none px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                    activeTab === "document-emails"
                      ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg transform scale-105"
                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                  disabled
                >
                  <Mail className="w-5 h-5" />
                  <span>Document Communications</span>
                  {activeTab === "document-emails" && (
                    <Leaf className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === "user-activity" ? (
              <UserActivityTracker adminKey={adminKey} />
            ) : (
              <DocumentEmailTracker adminKey={adminKey} />
            )}
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-gray-500 flex items-center justify-center space-x-2">
            <Leaf className="w-5 h-5 text-green-500" />
            <span>Wildlife Sanctuary Administrative System</span>
            <span>🌿</span>
          </div>
        </div>
      )}
    </div>
  );

  // return (
  //   <div>
  //     {!isLoggedIn ? (
  //       <LoginPage onLogin={handleLogin} />
  //     ) : (
  //       <div className="p-4 min-h-dvh py-10 max-w-screen-xl mx-auto">
  //         <div className="mb-4 flex flex-col gap-2">
  //           <h1 className="text-3xl font-bold">Admin Dashboard</h1>
  //           <p className="text-gray-800">
  //             View and manage user activity and document tracking data
  //           </p>
  //         </div>

  //         {/* Admin Tabs */}
  //         <div className="mb-6 border-b border-gray-200">
  //           <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
  //             <li className="mr-2">
  //               <button
  //                 onClick={() => setActiveTab('user-activity')}
  //                 className={`inline-block p-4 rounded-t-lg ${
  //                   activeTab === 'user-activity'
  //                     ? 'text-blue-600 border-b-2 border-blue-600'
  //                     : 'hover:text-gray-600 hover:border-gray-300'
  //                 }`}
  //               >
  //                 User Activity
  //               </button>
  //             </li>
  //             <li className="mr-2">
  //               <button
  //                 onClick={() => setActiveTab('document-emails')}
  //                 className={`inline-block p-4 rounded-t-lg ${
  //                   activeTab === 'document-emails'
  //                     ? 'text-blue-600 border-b-2 border-blue-600'
  //                     : 'hover:text-gray-600 hover:border-gray-300'
  //                 }`}
  //               >
  //                 Document Email Tracking
  //               </button>
  //             </li>
  //           </ul>
  //         </div>

  //         {/* Tab Content */}
  //         {activeTab === 'user-activity' ? (
  //           <UserActivityTracker />
  //         ) : (
  //           <DocumentEmailTracker adminKey={adminKey} />
  //         )}
  //       </div>
  //     )}
  //   </div>
  // );
}
