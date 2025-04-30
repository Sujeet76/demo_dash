"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const BookingManager = dynamic(() => import("@/components/BookingManager"), {
  ssr: false,
});
const LoginPage = dynamic(() => import("@/components/LoginPage"), {
  ssr: false,
});

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const loginStatus = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loginStatus);
  }, []);

  const handleLogin = (user) => {
    setUsername(user);
    setIsLoggedIn(true);
    localStorage.setItem("isLoggedIn", "true");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    localStorage.setItem("isLoggedIn", "false");
  };

  // Only render content after client-side hydration
  if (!isClient) {
    return null; // or a loading indicator
  }

  return (
    <>
      {isLoggedIn ? (
        <BookingManager username={username} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;
