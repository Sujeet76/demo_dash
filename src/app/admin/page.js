'use client'

import { useState, useEffect } from 'react';
import UserActivityTracker from '@/components/UserActivityTracker';
import LoginPage from '@/components/LoginPage';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const loggedInStatus = localStorage.getItem('isLoggedIn');
    setIsLoggedIn(loggedInStatus === 'true');
  }, []);

  const handleLogin = (username) => {
    setIsLoggedIn(true);
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
              View and manage user activity tracking data
            </p>
          </div>
          
          <UserActivityTracker />
        </div>
      )}
    </div>
  );
}
