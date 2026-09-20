import api from './axios';

const normalizeReview = (r) => {
  if (!r) return null;
  return {
    id: r.id,
    propertyId: r.property?.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt ? (typeof r.createdAt === 'string' ? r.createdAt.split('T')[0] : r.createdAt) : '',
    tenantName: r.tenant?.name || 'Tenant',
    propertyTitle: r.property?.title || ''
  };
};

export const reviewAPI = {
  create: async (reviewData) => {
    const response = await api.post('/api/reviews', reviewData);
    return normalizeReview(response.data);
  },
  getByProperty: async (propertyId) => {
    const response = await api.get(`/api/reviews/property/${propertyId}`);
    return (response.data || []).map(normalizeReview);
  },
  getMyReviews: async () => {
    const response = await api.get('/api/reviews/my-reviews');
    return (response.data || []).map(normalizeReview);
  },
  update: async (reviewId, reviewData) => {
    const response = await api.put(`/api/reviews/${reviewId}`, reviewData);
    return normalizeReview(response.data);
  },
  delete: async (reviewId) => {
    await api.delete(`/api/reviews/${reviewId}`);
    return true;
  }
};
