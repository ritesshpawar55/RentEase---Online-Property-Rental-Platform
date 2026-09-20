import api from './axios';

export const wishlistAPI = {
  get: async () => {
    const response = await api.get('/api/wishlist');
    return (response.data || []).map(item => item.property || item);
  },

  toggle: async (propertyId) => {
    const response = await api.post(`/api/wishlist/${propertyId}`);
    return response.data;
  },

  check: async (propertyId) => {
    const response = await api.get(`/api/wishlist/${propertyId}/check`);
    return response.data?.wishlisted || false;
  },

  add: async (propertyId) => wishlistAPI.toggle(propertyId),
  remove: async (propertyId) => wishlistAPI.toggle(propertyId)
};
