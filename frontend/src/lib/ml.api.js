import axios from 'axios';

// Dedicated Axios instance for Flask ML Service
const mlAxios = axios.create({
  baseURL: import.meta.env.VITE_FLASK_API_BASE_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Response Interceptor for ML API
 */
mlAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[Flask ML API Error]:', error.message);
    return Promise.reject(error);
  }
);

export const mlAPI = {
  /**
   * Retrieves ML service health and model statistics.
   *
   * Endpoint:
   * GET /health
   *
   * Authentication:
   * Public
   *
   * @returns Health status and stats
   */
  getHealth: async () => {
    try {
      const response = await mlAxios.get('/health');
      return response.data;
    } catch (e) {
      return { status: 'DOWN', error: e.message };
    }
  },

  /**
   * Retrieves supported cities for prediction models.
   *
   * Endpoint:
   * GET /cities
   *
   * Authentication:
   * Public
   *
   * @returns Array of supported city strings
   */
  getCities: async () => {
    const response = await mlAxios.get('/cities');
    return response.data;
  },

  /**
   * Direct ML rent prediction.
   * Note: The standard architecture routes this through Spring Boot (aiAPI.predictRent).
   * This is exposed here to comply with service boundaries.
   *
   * Endpoint:
   * POST /predict
   *
   * Authentication:
   * Public
   *
   * @param {Object} payload Prediction features (bhk, sqft, city, etc.)
   * @returns Prediction response
   */
  predict: async (payload) => {
    const response = await mlAxios.post('/predict', payload);
    return response.data;
  }
};
