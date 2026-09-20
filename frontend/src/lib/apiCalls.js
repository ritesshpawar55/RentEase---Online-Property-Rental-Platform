import api from './axios';
import { authAPI } from './auth.api';
import { propertyAPI } from './property.api';
import { amenityAPI } from './amenity.api';
import { bookingAPI } from './booking.api';
import { wishlistAPI } from './wishlist.api';
import { reviewAPI } from './review.api';
import { paymentAPI } from './payment.api';
import { aiAPI } from './ai.api';
import { landlordAPI } from './landlord.api';
import { adminAPI } from './admin.api';
import { healthAPI } from './health.api';
import { mlAPI } from './ml.api';

// Direct export of modular APIs
export {
  authAPI,
  propertyAPI,
  amenityAPI,
  bookingAPI,
  wishlistAPI,
  reviewAPI,
  paymentAPI,
  aiAPI,
  landlordAPI,
  adminAPI,
  healthAPI,
  mlAPI
};

// ==========================================
// Dashboard / Admin Analytics API Calls (Facade)
// ==========================================

export const analyticsAPI = {
  getLandlordStats: async () => {
    return await landlordAPI.getDashboard();
  },

  getAdminStats: async () => {
    return await adminAPI.getStats();
  }
};
