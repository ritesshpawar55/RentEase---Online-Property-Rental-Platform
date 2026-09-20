import api from './axios';
const normalizeProperty = (p) => {
  if (!p) return null;
  const typeMapping = {
    'FLAT': 'Flat', 'VILLA': 'Villa',
    'INDEPENDENT_HOUSE': 'Independent House',
    'APARTMENT': 'Apartment', 'HOUSE': 'House', 'PENTHOUSE': 'Penthouse'
  };
  const furnishedMapping = {
    'FURNISHED': 'Furnished',
    'SEMI_FURNISHED': 'Semi-Furnished',
    'UNFURNISHED': 'Unfurnished'
  };
  return {
    ...p,
    type: typeMapping[p.propertyType] || p.propertyType || 'Flat',
    furnished: furnishedMapping[p.furnishingStatus] || p.furnishingStatus || 'Unfurnished',
    avgRating: p.averageRating !== undefined ? p.averageRating : 0,
    reviewCount: p.totalReviews !== undefined ? p.totalReviews : 0,
    aiSuggested: p.aiSuggestedRent || p.rent,
    landlordName: p.landlord?.name || 'Landlord',
    landlordPhone: p.landlord?.phone || '',
    images: p.imageUrls || p.images || [],
    amenities: p.amenities ? p.amenities.map(a => typeof a === 'string' ? a : a.name) : []
  };
};

export const propertyAPI = {
  getAll: async (filters = {}) => {
  const params = {};
  if (filters.city) params.city = filters.city;
  if (filters.bhk) params.bhk = Number(filters.bhk);
  if (filters.minRent) params.minRent = Number(filters.minRent);
  if (filters.maxRent) params.maxRent = Number(filters.maxRent);

  // Send directly — dropdowns already send backend enum values
  if (filters.furnished && filters.furnished !== 'All') {
    params.furnished = filters.furnished;  // FURNISHED, SEMI_FURNISHED, UNFURNISHED
  }
  if (filters.type && filters.type !== 'All') {
    params.propertyType = filters.type;  // FLAT, VILLA, INDEPENDENT_HOUSE
  }

  if (filters.sortBy) params.sortBy = filters.sortBy;
  params.page = filters.page || 0;
  params.size = filters.size || 12;

  const response = await api.get('/api/properties', { params });
  const data = response.data;
  const content = data.content || data;
  return Array.isArray(content) ? content.map(normalizeProperty) : [];
},  

  getById: async (id) => {
    const response = await api.get(`/api/properties/${id}`);
    return normalizeProperty(response.data);
  },

  create: async (propertyData) => {
    const payload = {
      title: propertyData.title,
      description: propertyData.description,
      city: propertyData.city,
      locality: propertyData.locality,
      propertyType: propertyData.propertyType || 'FLAT',
      bhk: Number(propertyData.bhk),
      rent: Number(propertyData.rent),
      sqft: Number(propertyData.sqft),
      floor: Number(propertyData.floor),
      totalFloors: Number(propertyData.totalFloors),
      furnishingStatus: propertyData.furnishingStatus || 'SEMI_FURNISHED'
    };
    const response = await api.post('/api/properties', payload);
    return normalizeProperty(response.data);
  },

  update: async (id, propertyData) => {
    const payload = {
      title: propertyData.title,
      description: propertyData.description,
      city: propertyData.city,
      locality: propertyData.locality,
      propertyType: propertyData.propertyType || 'FLAT',
      bhk: Number(propertyData.bhk),
      rent: Number(propertyData.rent),
      sqft: Number(propertyData.sqft),
      floor: Number(propertyData.floor),
      totalFloors: Number(propertyData.totalFloors),
      furnishingStatus: propertyData.furnishingStatus || 'SEMI_FURNISHED'
    };
    const response = await api.put(`/api/properties/${id}`, payload);
    return normalizeProperty(response.data);
  },

  delete: async (id) => {
    await api.delete(`/api/properties/${id}`);
    return true;
  },

  getMyListings: async () => {
    const response = await api.get('/api/properties/my-listings');
    return (response.data || []).map(normalizeProperty);
  },

  // propertyAPI.js
  uploadImages: async (propertyId, files, onProgress) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file)); // ← 'files' not 'images'

  const response = await api.post(                       // ← 'api' not 'axios'
    `/api/properties/${propertyId}/images`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,                                   // ← 2 min timeout
      onUploadProgress: (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        if (onProgress) onProgress(percent);
      },
    }
  );

  return response.data;
},

  deleteImage: async (imageId) => {
    await api.delete(`/api/properties/images/${imageId}`);
    return true;
  },

  predictRent: async (features) => {
    const response = await api.post('/api/ai/predict-rent', features);
    return response.data;
  }
};
