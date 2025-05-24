'use client'

import { useState, useEffect } from 'react';
import UserActivityTracker from '@/components/UserActivityTracker';
import LoginPage from '@/components/LoginPage';
import DocumentEmailTracker from '@/components/DocumentEmailTracker';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [activeTab, setActiveTab] = useState('user-activity');

  useEffect(() => {
    // Check if user is logged in
    const loggedInStatus = localStorage.getItem('isLoggedIn');
    setIsLoggedIn(loggedInStatus === 'true');
    
    // Get admin key from localStorage if available
    const storedAdminKey = localStorage.getItem('adminKey');
    if (storedAdminKey) {
      setAdminKey(storedAdminKey);
    }
  }, []);

  const handleLogin = (username, password) => {
    setIsLoggedIn(true);
    
    // For demo purposes, we're using a simple key
    // In production, this would be handled securely through a proper auth system
    const key = process.env.NEXT_PUBLIC_ADMIN_KEY || 'your_secret_key';
    setAdminKey(key);
    localStorage.setItem('adminKey', key);
  };

  return (
    <div>
      {!isLoggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <div className="p-4 min-h-dvh py-10 max-w-screen-xl mx-auto">
          <div className="mb-4 flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-800">
              View and manage user activity and document tracking data
            </p>
          </div>
          
          {/* Admin Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
              <li className="mr-2">
                <button
                  onClick={() => setActiveTab('user-activity')}
                  className={`inline-block p-4 rounded-t-lg ${
                    activeTab === 'user-activity'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'hover:text-gray-600 hover:border-gray-300'
                  }`}
                >
                  User Activity
                </button>
              </li>
              <li className="mr-2">
                <button
                  onClick={() => setActiveTab('document-emails')}
                  className={`inline-block p-4 rounded-t-lg ${
                    activeTab === 'document-emails'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'hover:text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Document Email Tracking
                </button>
              </li>
            </ul>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'user-activity' ? (
            <UserActivityTracker />
          ) : (
            <DocumentEmailTracker adminKey={adminKey} />
          )}
        </div>
      )}
    </div>
  );
}
