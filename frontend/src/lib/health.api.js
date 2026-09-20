import api from './axios';
import { mlAPI } from './ml.api';

export const healthAPI = {
  // GET /actuator/health
  getSpringBootHealth: async () => {
    try {
      const response = await api.get('/actuator/health');
      return response.data;
    } catch (e) {
      return { status: 'DOWN', error: e.message };
    }
  },

  // Check ML Service availability using the dedicated Flask ML Service
  getFlaskMlHealth: async () => {
    try {
      const response = await mlAPI.getHealth();
      return response;
    } catch (e) {
      return { status: 'DOWN', message: 'ML Service Unreachable' };
    }
  }
};
