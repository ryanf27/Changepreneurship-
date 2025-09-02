import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Development bypass mode - set to false to use real authentication
const BYPASS_AUTH = false;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(BYPASS_AUTH ? { 
    id: 'demo-user', 
    username: 'demo', 
    email: 'demo@changepreneurship.com' 
  } : null);
  const [isAuthenticated, setIsAuthenticated] = useState(BYPASS_AUTH);
  const [isLoading, setIsLoading] = useState(!BYPASS_AUTH);

  // Initialize authentication state
  useEffect(() => {
    if (BYPASS_AUTH) {
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          const data = await apiService.verifySession();
          setUser(data.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.warn('Session verification failed:', error.message);
        apiService.clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);
  const register = async (userData) => {
    if (BYPASS_AUTH) {
      return { success: true, data: { user: user } };
    }

    try {
      const data = await apiService.register(userData);
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true, data };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  const login = async (credentials) => {
    if (BYPASS_AUTH) {
      return { success: true, data: { user: user } };
    }

    try {
      const data = await apiService.login(credentials);
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    if (BYPASS_AUTH) {
      return;
    }

    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const getProfile = async () => {
    if (BYPASS_AUTH) {
      return { success: true, data: { user: user } };
    }

    if (!apiService.isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const data = await apiService.getProfile();
      setUser(data.user);
      return { success: true, data };
    } catch (error) {
      console.error('Profile fetch error:', error);
      return { success: false, error: error.message };
    }
  };

  const apiCall = async (endpoint, options = {}) => {
    if (BYPASS_AUTH) {
      // In bypass mode, return mock successful responses
      return new Response(JSON.stringify({ success: true, data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!apiService.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const config = {
      headers: apiService.getHeaders(),
      ...options
    };

    const response = await fetch(`${apiService.getApiBaseUrl()}${endpoint}`, config);
    
    if (response.status === 401) {
      // Token expired or invalid
      await logout();
      throw new Error('Session expired');
    }

    return response;
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    sessionToken: apiService.getSessionToken(),
    register,
    login,
    logout,
    getProfile,
    apiCall,
    apiService // Expose apiService for direct access
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

