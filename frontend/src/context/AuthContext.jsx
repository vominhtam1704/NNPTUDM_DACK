import React, { createContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import { uploadUserAvatar } from '../services/users';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!accessToken);

  // Fetch current user profile
  const getCurrentUser = useCallback(async (token) => {
    try {
      if (!token) return null;
      const response = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (err) {
      console.error('Failed to fetch user:', err);
      return null;
    }
  }, []);

  // Register user
  const register = useCallback(async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone,
        role: 'customer' // Default role, admin assigns role later
      });

      if (response.success) {
        setError(null);
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login user
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/login', { email, password });

      if (response.success) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken, user: userData } = response.data;

        // Store tokens
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        localStorage.setItem('user', JSON.stringify(userData));

        // Update state
        setAccessToken(newAccessToken);
        setRefreshToken(newRefreshToken);
        setUser(userData);
        setIsAuthenticated(true);
        setError(null);

        return { success: true, message: 'Login successful' };
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (userId, payload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.put(`/users/${userId}`, payload);

      if (response.success) {
        const updatedUser = response.data;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true, data: updatedUser, message: response.message };
      }

      throw new Error(response.message);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Update profile failed';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Forgot password - send reset link
  const forgotPassword = useCallback(async (email) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });

      if (response.success) {
        setError(null);
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Request failed';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset password with token
  const resetPassword = useCallback(async (token, password, confirmPassword) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post(`/auth/reset-password/${token}`, {
        password,
        confirmPassword
      });

      if (response.success) {
        setError(null);
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Reset failed';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint - skip token check to avoid circular dependency
      const tokenToUse = accessToken;
      if (tokenToUse) {
        await apiClient.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${tokenToUse}` }
        }).catch(() => {}); // Ignore errors
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Reset state
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  }, [accessToken]);

  // Refresh access token
  const refreshAccessToken = useCallback(async (token) => {
    try {
      const response = await apiClient.post('/auth/refresh-token', {
        refreshToken: token
      });

      if (response.success) {
        const newAccessToken = response.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        setAccessToken(newAccessToken);
        return newAccessToken;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (err) {
      console.error('Token refresh error:', err);
      logout();
      return null;
    }
  }, [logout]);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
          setAccessToken(token);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Auth initialization error:', err);
          // Skip logout call to avoid effects
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    refreshAccessToken,
    getCurrentUser,
    updateProfile,
    uploadAvatar: useCallback(async (formData) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await uploadUserAvatar(formData);
        if (response.success) {
          // IMPORTANT: The backend returns the OLD user object in the avatar upload response.
          // We must fetch the fresh user profile to ensure the UI reflects the new avatar URL.
          const freshResponse = await getCurrentUser(accessToken);
          const userData = freshResponse?.data || response.data;
          
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          return { success: true, data: userData, message: response.message };
        }
        throw new Error(response.message);
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Upload avatar failed';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      } finally {
        setIsLoading(false);
      }
    }, [accessToken, getCurrentUser])
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
