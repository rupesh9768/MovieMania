// Auth context for app-wide authentication state
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

  // Auto-load user on app refresh
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
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
        // Token is invalid or expired
        logoutApi();
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);


  const login = async (email, password) => {
    const data = await loginApi(email, password);
    if (data.success && data.user) {
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  };


  const register = async (formData) => {
    const data = await registerApi(formData);
    if (data.success && data.user) {
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  };


  const logout = () => {
    logoutApi();
    localStorage.removeItem('user');
    setUser(null);
  };


  const refreshUser = async () => {
    try {
      setAuthHeader();
      const data = await getProfile();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };


  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
