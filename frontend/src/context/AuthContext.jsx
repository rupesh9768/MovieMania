// ====================================
// Auth Context
// Provides authentication state across the app
//
// TODO: Profile editing (name, avatar, password change)
// TODO: Discussion system (movie-based comments/reviews)
// TODO: Social login (Google, GitHub)
// ====================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  login as loginApi,
  register as registerApi,
  getProfile,
  logout as logoutApi,
  getToken,
  setAuthHeader
} from '../api/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ====================================
  // Auto-load user on app refresh
  // ====================================
  useEffect(() => {
    const loadUser = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setAuthHeader();
        const data = await getProfile();
        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
        // Token is invalid or expired
        logoutApi();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // ====================================
  // Login
  // ====================================
  const login = async (email, password) => {
    const data = await loginApi(email, password);
    if (data.success && data.user) {
      setUser(data.user);
    }
    return data;
  };

  // ====================================
  // Register
  // ====================================
  const register = async (formData) => {
    const data = await registerApi(formData);
    if (data.success && data.user) {
      setUser(data.user);
    }
    return data;
  };

  // ====================================
  // Logout
  // ====================================
  const logout = () => {
    logoutApi();
    setUser(null);
  };

  // ====================================
  // Derived State
  // ====================================
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
