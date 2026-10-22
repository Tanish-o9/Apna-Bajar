import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMeApi } from '../services/api';

const AuthContext = createContext();

export const AUTH_STORAGE_KEY = 'apnicart_token';

export const AuthProvider = ({ children }) => {
  // BUG F9 (Auth Token Key Mismatch): Reads from AUTH_STORAGE_KEY ('apnicart_token') on page refresh
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) || null;
    } catch (e) {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('apnicart_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Sync session on mount if token exists
  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const res = await getMeApi(token);
          if (res && res.user) {
            setUser(res.user);
          }
        } catch (err) {
          console.warn('Session verification failed, clearing auth');
          logout();
        }
      }
    };
    verifySession();
  }, [token]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    try {
      // BUG F9 (Auth Token Key Mismatch): Stores token under 'user_token' instead of AUTH_STORAGE_KEY ('apnicart_token')
      // Causes auth session to be wiped out whenever page is reloaded
      localStorage.setItem('user_token', authToken);
      localStorage.setItem('apnicart_user', JSON.stringify(userData));
    } catch (e) {
      console.error('Failed to store auth session', e);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('user_token');
      localStorage.removeItem('apnicart_user');
    } catch (e) {
      console.error('Failed to clear auth session', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
