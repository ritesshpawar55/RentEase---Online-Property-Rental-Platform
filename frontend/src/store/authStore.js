import { create } from 'zustand';
import { authAPI } from '../lib/auth.api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('rentease_user')) || null,
  token: localStorage.getItem('rentease_token') || null,
  isAuthenticated: !!localStorage.getItem('rentease_token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await authAPI.login(email, password);
      set({
        token,
        user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      return user;
    } catch (error) {
      set({
        error: error.response?.data?.error || error.response?.data?.error || error.response?.data?.message || 'Login failed. Please verify credentials.',
        loading: false,
      });
      throw error;
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.register(userData);
      set({ loading: false });
      return response;
    } catch (error) {
      set({
        error: error.response?.data?.error || error.response?.data?.error || error.response?.data?.message || 'Registration failed.',
        loading: false,
      });
      throw error;
    }
  },

  verifyOtp: async (userId, otp) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await authAPI.verifyOtp(userId, otp);
      set({
        token,
        user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      return user;
    } catch (error) {
      set({
        error: error.response?.data?.error || error.response?.data?.error || error.response?.data?.message || 'OTP verification failed.',
        loading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout API call failed, forcing local logout:', err);
    } finally {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('rentease_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false });
      return null;
    }
    
    set({ loading: true });
    try {
      const user = await authAPI.getMe();
      set({
        user,
        token,
        isAuthenticated: true,
        loading: false,
      });
      return user;
    } catch (err) {
      console.error('Verify authentication failed, logging out:', err);
      // Auto clean
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
      return null;
    }
  },

  updateProfile: async (updatedUser) => {
    set({ loading: true, error: null });
    try {
      const payload = {
        name: updatedUser.name,
        phone: updatedUser.phone
      };
      const resultUser = await authAPI.updateProfile(payload);

      // Merge carefully — keep existing fields if not returned
      const currentUser = get().user;
      const mergedUser = {
        ...currentUser,      // keep everything existing
        name: resultUser.name || currentUser.name,
        phone: resultUser.phone || updatedUser.phone, // ← use input if not returned
        email: resultUser.email || currentUser.email,
      };

      localStorage.setItem('rentease_user', JSON.stringify(mergedUser));
      set({ user: mergedUser, loading: false });
      return mergedUser;
    } catch (error) {
      set({
        error: error.response?.data?.error ||
              error.response?.data?.message ||
              'Failed to update profile details.',
        loading: false,
      });
      throw error;
    }
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    set({ loading: true, error: null });
    try {
      await authAPI.changePassword({ currentPassword, newPassword, confirmPassword });
      set({ loading: false });
    } catch (error) {
      set({
        error: error.response?.data?.error || error.response?.data?.error || error.response?.data?.message || 'Failed to change password.',
        loading: false,
      });
      throw error;
    }
  }
}));

// Listen to interceptor forced logouts (401 Unauthorized)
if (typeof window !== 'undefined') {
  window.addEventListener('auth-logout', () => {
    useAuthStore.getState().logout();
  });
}
