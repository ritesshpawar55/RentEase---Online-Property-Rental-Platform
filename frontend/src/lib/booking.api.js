import api from './axios';

const normalizeBooking = (b) => {
  if (!b) return null;
  const formatDate = (d) => {
    if (!d) return '';
    if (Array.isArray(d)) return `${d[0]}-${String(d[1]).padStart(2,'0')}-${String(d[2]).padStart(2,'0')}`;
    return typeof d === 'string' ? d.split('T')[0] : d;
  };
  return {
    id: b.id,
    propertyId: b.property?.id,
    propertyTitle: b.property?.title || 'Property',
    propertyImage: b.property?.imageUrl || null,
    city: b.property?.city || '',
    locality: b.property?.locality || '',
    rent: b.property?.rent || 0,
    // Final price to actually charge: the negotiated counter offer once it has been
    // accepted (status ACCEPTED/COMPLETED), otherwise the original listed rent.
    agreedRent: (b.counterOffer && (b.status === 'ACCEPTED' || b.status === 'COMPLETED'))
      ? b.counterOffer
      : (b.property?.rent || 0),
    moveInDate: formatDate(b.moveInDate),
    message: b.message || '',
    counterOffer: b.counterOffer,
    counterOfferBy: b.counterOfferBy,
    landlordResponse: b.responseMessage || null,
    status: b.status || 'PENDING',
    requestedOn: formatDate(b.createdAt),
    tenantName: b.tenant?.name || '',
    tenantEmail: b.tenant?.email || '',
    tenantPhone: b.tenant?.phone || '',
    landlordName: b.landlord?.name || '',
    landlordEmail: b.landlord?.email || '',
  };
};

export const bookingAPI = {
  create: async (bookingData) => {
    const response = await api.post('/api/bookings', bookingData);
    return normalizeBooking(response.data);
  },

  getTenantBookings: async (status) => {
    const params = status ? { status } : {};
    const response = await api.get('/api/bookings/tenant', { params });
    return (response.data || []).map(normalizeBooking);
  },

  getLandlordBookings: async (status) => {
    const params = status ? { status } : {};
    const response = await api.get('/api/bookings/landlord', { params });
    return (response.data || []).map(normalizeBooking);
  },

  updateStatus: async (id, status, details = {}) => {
    const payload = { status };
    if (details.responseMessage) payload.responseMessage = details.responseMessage;
    if (details.counterOffer) payload.counterOffer = Number(details.counterOffer);
    const response = await api.put(`/api/bookings/${id}/status`, payload);
    return normalizeBooking(response.data);
  },

  cancel: async (id) => {
    await api.delete(`/api/bookings/${id}`);
    return true;
  },

  respondToCounter: async (id, decision) => {
    const response = await api.put(`/api/bookings/${id}/respond-counter`, { decision });
    return normalizeBooking(response.data);
  },

  createPaymentOrder: async (bookingId) => {
    const response = await api.post(`/api/payments/create-order/${bookingId}`);
    return response.data;
  },

  verifyPayment: async (paymentData) => {
    const response = await api.post('/api/payments/verify', paymentData);
    return response.data;
  }
};