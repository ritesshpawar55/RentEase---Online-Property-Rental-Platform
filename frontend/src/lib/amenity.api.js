import api from './axios';

export const amenityAPI = {
  getAll: async () => {
    const response = await api.get('/api/amenities');
    return response.data || [];
  },
  linkAmenities: async (propertyId, amenityIds) => {
    const response = await api.post(`/api/amenities/property/${propertyId}`, { amenityIds });
    return response.data;
  }
};
