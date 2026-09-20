import api from './axios';

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    const data = response.data;
    const user = {
      userId: data.userId,
      name: data.name,
      email: data.email,
      phone: data.phone,   // ← add this
      role: data.role
    };
    localStorage.setItem('rentease_token', data.token);
    localStorage.setItem('rentease_user', JSON.stringify(user));
    return { token: data.token, user };
  },

  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  verifyOtp: async (userId, otp) => {
    const response = await api.post('/api/auth/verify-otp', { userId: Number(userId), otp });
    const data = response.data;
    const user = {
      userId: data.userId,
      name: data.name,
      email: data.email,
      phone: data.phone,   // ← add this
      role: data.role
    };
    localStorage.setItem('rentease_token', data.token);
    localStorage.setItem('rentease_user', JSON.stringify(user));
    return { token: data.token, user };
  },

  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/api/auth/profile', profileData);
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.put('/api/auth/change-password', passwordData);
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (resetData) => {
    const response = await api.post('/api/auth/reset-password', resetData);
    return response.data;
  },

  resendOtp: async (email) => {
    const response = await api.post(`/api/auth/resend-otp?email=${encodeURIComponent(email)}`);
    return response.data;
  },

  logout: async () => {
    localStorage.removeItem('rentease_token');
    localStorage.removeItem('rentease_user');
    return { success: true };
  }
};
