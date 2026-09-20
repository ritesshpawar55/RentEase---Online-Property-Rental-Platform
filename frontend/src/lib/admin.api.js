import api from './axios';

export const adminAPI = {
  // GET /api/admin/stats
  getStats: async () => {
    const response = await api.get('/api/admin/stats');
    return response.data;
  },

  // GET /api/admin/users
  getUsers: async (role = null, page = 0, size = 20) => {
    const params = { page, size };
    if (role) params.role = role;
    const response = await api.get('/api/admin/users', { params });
    return response.data;
  },

  // GET /api/admin/users/search
  searchUsers: async (query) => {
    const response = await api.get('/api/admin/users/search', { params: { query } });
    return response.data;
  },

  // PUT /api/admin/users/{userId}/toggle-status
  toggleUserStatus: async (userId) => {
    const response = await api.put(`/api/admin/users/${userId}/toggle-status`);
    return response.data;
  },

  // PUT /api/admin/properties/{propertyId}/suspend
  suspendProperty: async (propertyId, reason = 'Violated platform policies') => {
    const response = await api.put(`/api/admin/properties/${propertyId}/suspend`, { reason });
    return response.data;
  },

  // DELETE /api/admin/reviews/{reviewId}
  deleteReview: async (reviewId) => {
    await api.delete(`/api/admin/reviews/${reviewId}`);
    return true;
  }
};
