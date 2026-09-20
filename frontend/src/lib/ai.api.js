import api from './axios';

export const aiAPI = {
  predictRent: async (features) => {
    const payload = {
      bhk: Number(features.bhk) || 2,
      sqft: Number(features.sqft) || 1000,
      floor: Number(features.floor) || 0,
      furnished: typeof features.furnished === 'number' ? features.furnished :
        features.furnished === 'Furnished' ? 2 :
        features.furnished === 'Semi-Furnished' ? 1 : 0,
      bathrooms: Number(features.bathrooms) || Number(features.bhk) || 2,
      city: features.city || '',
      locality: features.locality || ''
    };
    const response = await api.post('/api/ai/predict-rent', payload);
    return response.data;
  }
};
