import api from './axios';

export const landlordAPI = {
  // GET /api/landlord/dashboard
  getDashboard: async () => {
    const response = await api.get('/api/landlord/dashboard');
    const data = response.data;
    
    return {
      totalListings: data.totalListings || 0,
      activeListings: data.activeListings || 0,
      pendingRequests: data.pendingRequests || 0,
      totalRequests: data.totalRequests || 0,
      acceptedRequests: data.acceptedRequests || 0,
      rejectedRequests: data.rejectedRequests || 0,
      occupiedUnits: data.occupiedUnits || 0,
      occupancyRate: data.occupancyRate || 0,
      totalMonthlyRentPotential: data.totalMonthlyRentPotential || 0,
      averageRentPerListing: data.averageRentPerListing || 0,
      recentBookings: data.recentBookings || [],
      topListings: data.topListings || []
    };
  }
};
