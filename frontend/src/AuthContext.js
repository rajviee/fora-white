import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from './utils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Validate Initial Token on Load
    const storedToken = localStorage.getItem('token');
    
    // Safely filter out invalid strings like "undefined" or "null"
    if (storedToken && storedToken !== 'undefined' && storedToken !== 'null') {
      try {
        const decoded = jwtDecode(storedToken);
        
        // 2. Token Validity Check
        // If it's a valid JWT, check for expiration
        if (decoded && decoded.exp && decoded.exp * 1000 < Date.now()) {
          console.warn('Stored token expired, logging out');
          logout();
        } else {
          // 3. Permissive Login State
          // Even if jwtDecode fails (non-JWT token), we still consider the user "logged in"
          // but we provide a default user object to avoid UI crashes
          setUser(decoded || { id: 'user', role: 'employee', name: 'User' });
        }
      } catch (err) {
        console.error('Initial token decode error:', err);
        // Fallback: stay logged in if token exists but decoding fails
        setUser({ id: 'user', role: 'employee', name: 'User' });
      }
    } else if (storedToken) {
      // Clean up string "undefined" or "null"
      logout();
    }
    setLoading(false);
  }, [token]);

  const login = (newToken, subscription) => {
    if (!newToken || newToken === 'undefined' || newToken === 'null') {
      console.error('Attempted to login with invalid token:', newToken);
      throw new Error('Login failed: Invalid or missing token in server response');
    }

    console.info('Logging in with token...');
    
    // Update local storage
    localStorage.setItem('token', newToken);
    if (subscription) {
      localStorage.setItem('subscription', typeof subscription === 'string' ? subscription : JSON.stringify(subscription));
    }
    
    // Decode token safely
    const decoded = jwtDecode(newToken);
    
    // 4. Permissive User State Update
    // Fallback to basic object if decoding fails (for opaque tokens)
    const userObj = decoded || { id: 'user', role: 'employee', name: 'User' };
    
    // Update State
    setUser(userObj);
    setToken(newToken);
    
    console.info('Login successful, user state updated');
  };

  const logout = () => {
    console.info('Logging out user...');
    localStorage.removeItem('token');
    localStorage.removeItem('subscription');
    localStorage.removeItem('userData');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
