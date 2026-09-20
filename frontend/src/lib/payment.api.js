import api from './axios';

export const paymentAPI = {
  createOrder: async (bookingId) => {
    const response = await api.post(`/api/payments/create-order/${bookingId}`);
    return response.data;
  },
  verifyPayment: async (paymentData) => {
    const response = await api.post('/api/payments/verify', paymentData);
    return response.data;
  },
  getByBooking: async (bookingId) => {
    const response = await api.get(`/api/payments/booking/${bookingId}`);
    return response.data;
  }
};
