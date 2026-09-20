import { create } from 'zustand';
import { bookingAPI } from '../lib/booking.api';

export const useBookingStore = create((set, get) => ({
  bookings: [],
  loading: false,
  error: null,

  fetchTenantBookings: async (status) => {
    set({ loading: true, error: null });
    try {
      const data = await bookingAPI.getTenantBookings(status);
      const sorted = [...data].sort((a, b) => new Date(b.requestedOn) - new Date(a.requestedOn));
      set({ bookings: sorted, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || err.response?.data?.message || err.message, loading: false });
    }
  },

  fetchLandlordBookings: async (status) => {
    set({ loading: true, error: null });
    try {
      const data = await bookingAPI.getLandlordBookings(status);
      const sorted = [...data].sort((a, b) => new Date(b.requestedOn) - new Date(a.requestedOn));
      set({ bookings: sorted, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || err.response?.data?.message || err.message, loading: false });
    }
  },

  createBookingRequest: async (bookingData) => {
    set({ loading: true, error: null });
    try {
      const newBooking = await bookingAPI.create(bookingData);
      set((state) => ({
        bookings: [newBooking, ...state.bookings],
        loading: false,
      }));
      return newBooking;
    } catch (err) {
      set({ error: err.response?.data?.error || err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  updateBookingStatus: async (bookingId, status, details = {}) => {
    set({ loading: true, error: null });
    try {
      const updated = await bookingAPI.updateStatus(bookingId, status, details);
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === bookingId ? { ...b, ...updated } : b)),
        loading: false,
      }));
      return updated;
    } catch (err) {
      set({ error: err.response?.data?.error || err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  cancelBooking: async (bookingId) => {
    set({ loading: true, error: null });
    try {
      await bookingAPI.cancel(bookingId);
      set((state) => ({
        bookings: state.bookings.filter((b) => b.id !== bookingId),
        loading: false,
      }));
    } catch (err) {
      set({ error: err.response?.data?.error || err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  respondToCounter: async (bookingId, decision) => {
    set({ loading: true, error: null });
    try {
      const updated = await bookingAPI.respondToCounter(bookingId, decision);
      set((state) => ({
        bookings: state.bookings.map((b) => (b.id === bookingId ? { ...b, ...updated } : b)),
        loading: false,
      }));
      return updated;
    } catch (err) {
      set({ error: err.response?.data?.error || err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  // Real-time listener updater
  applyBookingUpdate: (update) => {
    const { bookingId, status, counterOffer } = update;
    set((state) => ({
      bookings: state.bookings.map((b) => {
        if (b.id === bookingId) {
          const updated = { ...b, status };
          if (counterOffer !== undefined) {
            updated.counterOffer = counterOffer;
          }
          return updated;
        }
        return b;
      })
    }));
  },

  clearBookings: () => {
    set({ bookings: [] });
  }
}));
