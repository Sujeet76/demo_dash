"use client"

import { loginData } from '@/utils/constant';
import { useState } from 'react';


function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isUsernameActive, setIsUsernameActive] = useState(false);
  const [isPasswordActive, setIsPasswordActive] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Check for specific credentials: admin@123 and 12345
    const isValidLogin = loginData.some(
      (user) => user.username === username && user.password === password
    );
    if (isValidLogin) {
      const details = loginData.find(
        (user) => user.username === username
      );
      const currentTime = new Date().toISOString();
      const userInfo = {
        username: details.username,
        lastLogin: currentTime,
        displayName: details.username // You can customize this with actual user info
      };
      
      onLogin(username);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', username);
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    } else {
      setError('Invalid username or password');
    }
  };

  // Common styles for input field containers
  const inputContainerStyle = {
    width: '80%',          
    maxWidth: '300px',     
    marginLeft: 'auto',     
    marginRight: 'auto',    
    position: 'relative'
  };

  // Common input field style
  const inputFieldStyle = {
    width: '100%',
    padding: '24px 16px 10px',
    border: 'none',
    backgroundColor: 'rgba(60, 47, 47, 0.5)',
    borderRadius: '10px',
    fontSize: '15px',
    transition: 'all 0.3s',
    outline: 'none',
    color: 'white',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #3c2f2f 0%, #1e1a1a 100%)',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: 'rgba(30, 26, 26, 0.8)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          padding: '15px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: '15px',
              position: 'relative',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40">
              <path d="M20 5 L30 30 L10 30 Z" fill="#8b6f47" />
              <path d="M20 8 L28 28 L12 28 Z" fill="#1e1a1a" />
            </svg>
          </div>
          <h1 style={{ fontSize: '22px', margin: 0, fontWeight: '600' }}>
            Ranthambore Regency Booking
          </h1>
        </div>
        <nav>
          <ul
            style={{
              display: 'flex',
              listStyle: 'none',
              margin: 0,
              padding: 0,
            }}
          >
            <li style={{ marginRight: '24px' }}>
              <a
                href="#"
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Home
              </a>
            </li>
            <li style={{ marginRight: '24px' }}>
              <a
                href="#"
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Features
              </a>
            </li>
            <li style={{ marginRight: '24px' }}>
              <a
                href="#"
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Docs
              </a>
            </li>
            <li>
              <a
                href="#"
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </header>

      {/* Main Content */}
      <main
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            width: '400px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'rgba(30, 26, 26, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            style={{
              padding: '28px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                margin: '0',
                fontSize: '24px',
                letterSpacing: '0.5px',
                fontWeight: '600',
                background: 'linear-gradient(90deg, #8b6f47, #d9c2a6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              SIGN IN
            </h2>
            <p
              style={{
                margin: '10px 0 0',
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              Access your booking dashboard
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',  // Center all form elements horizontally
            }}
          >
            {error && (
              <p
                style={{
                  color: '#d9c2a6',
                  backgroundColor: 'rgba(139, 111, 71, 0.2)',
                  padding: '10px',
                  borderRadius: '4px',
                  textAlign: 'center',
                  marginBottom: '20px',
                  fontSize: '14px',
                  width: '80%',
                  maxWidth: '300px',
                }}
              >
                {error}
              </p>
            )}
            
            {/* Username Field */}
            <div style={{...inputContainerStyle, marginBottom: '24px'}}>
              <label
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: isUsernameActive || username ? '8px' : '50%',
                  transform:
                    isUsernameActive || username
                      ? 'translateY(0)'
                      : 'translateY(-50%)',
                  fontSize: isUsernameActive || username ? '12px' : '15px',
                  color: isUsernameActive
                    ? '#8b6f47'
                    : 'rgba(255, 255, 255, 0.6)',
                  transition: 'all 0.2s ease-in-out',
                  pointerEvents: 'none',
                }}
              >
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setIsUsernameActive(true)}
                onBlur={() => setIsUsernameActive(false)}
                style={{
                  ...inputFieldStyle,
                  boxShadow: isUsernameActive
                    ? '0 0 0 2px rgba(139, 111, 71, 0.5)'
                    : 'none',
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{...inputContainerStyle, marginBottom: '32px'}}>
              <label
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: isPasswordActive || password ? '8px' : '50%',
                  transform:
                    isPasswordActive || password
                      ? 'translateY(0)'
                      : 'translateY(-50%)',
                  fontSize: isPasswordActive || password ? '12px' : '15px',
                  color: isPasswordActive
                    ? '#8b6f47'
                    : 'rgba(255, 255, 255, 0.6)',
                  transition: 'all 0.2s ease-in-out',
                  pointerEvents: 'none',
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordActive(true)}
                onBlur={() => setIsPasswordActive(false)}
                style={{
                  ...inputFieldStyle,
                  boxShadow: isPasswordActive
                    ? '0 0 0 2px rgba(139, 111, 71, 0.5)'
                    : 'none',
                }}
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '28px',
                width: '80%',
                maxWidth: '300px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  id="remember"
                  type="checkbox"
                  style={{
                    marginRight: '8px',
                    accentColor: '#8b6f47',
                  }}
                />
                <label
                  htmlFor="remember"
                  style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  Remember me
                </label>
              </div>
              <a
                href="#"
                style={{
                  fontSize: '14px',
                  color: '#d9c2a6',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
              >
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              style={{
                width: '80%',
                maxWidth: '300px',
                padding: '14px',
                background: isHovering
                  ? 'linear-gradient(90deg, #8b6f47, #a68a64)'
                  : 'linear-gradient(90deg, #7a5f3d, #8b6f47)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                letterSpacing: '0.5px',
                transition: 'all 0.3s',
                boxShadow: isHovering
                  ? '0 6px 20px rgba(139, 111, 71, 0.4)'
                  : '0 4px 12px rgba(139, 111, 71, 0.3)',
              }}
            >
              SIGN IN
            </button>

            {/* Sign Up Link */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <p
                style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                }}
              >
                Don't have an account?{' '}
                <a
                  href="#"
                  style={{
                    color: '#d9c2a6',
                    textDecoration: 'none',
                    fontWeight: '500',
                  }}
                >
                  Sign up
                </a>
              </p>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: 'rgba(30, 26, 26, 0.95)',
          color: 'white',
          padding: '30px',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            maxWidth: '1200px',
            margin: '0 auto',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ marginBottom: '20px', flexBasis: '300px' }}>
            <h3
              style={{
                margin: '0 0 15px',
                fontSize: '18px',
                fontWeight: '600',
                color: '#fff',
              }}
            >
              
            </h3>
            <p
              style={{
                margin: '0 0 10px',
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: '1.6',
              }}
            >
              Manage your hotel bookings with ease and efficiency.
            </p>
          </div>

          <div style={{ marginBottom: '20px', flexBasis: '200px' }}>
            <h4
              style={{
                margin: '0 0 15px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#fff',
              }}
            >
              Quick Links
            </h4>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              <li style={{ marginBottom: '10px' }}>
                <a
                  href="#"
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  Dashboard
                </a>
              </li>
              <li style={{ marginBottom: '10px' }}>
                <a
                  href="#"
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  Bookings
                </a>
              </li>
              <li style={{ marginBottom: '10px' }}>
                <a
                  href="#"
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#"
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px', flexBasis: '200px' }}>
            <h4
              style={{
                margin: '0 0 15px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#fff',
              }}
            >
              Support
            </h4>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              <li style={{ marginBottom: '10px' }}>
                <a
                  href="#"
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  Help Center
                </a>
              </li>
              <li style={{ marginBottom: '10px' }}>
                <a
                  href="#"
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  Documentation
                </a>
              </li>
              <li style={{ marginBottom: '10px' }}>
                <a
                  href="#"
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            marginTop: '20px',
            paddingTop: '20px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center',
          }}
        >
          <p>© 2025 Hotel Booking Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LoginPage;