import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('smarterp_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('smarterp_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
    localStorage.removeItem('smarterp_token');
    localStorage.removeItem('smarterp_user');
  }, []);

  const login = useCallback(async (username_or_email, password) => {
    const data = await authService.login(username_or_email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('smarterp_token', data.access_token);
    localStorage.setItem('smarterp_user', JSON.stringify(data.user));
    return data.user;
  }, []);

  const register = useCallback(async (userData) => {
    const data = await authService.register(userData);
    return data;
  }, []);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('smarterp_token');
      if (storedToken) {
        try {
          const freshUser = await authService.getMe();
          setUser(freshUser);
          localStorage.setItem('smarterp_user', JSON.stringify(freshUser));
        } catch (err) {
          console.warn('Session verification failed, logging out', err);
          await logout();
        }
      }
      setLoading(false);
    };
    verifyAuth();
  }, [logout]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    role: user?.role || (user?.roles?.[0]?.name) || 'EMPLOYEE',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
