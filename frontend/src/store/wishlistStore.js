import { create } from 'zustand';
import { wishlistAPI } from '../lib/wishlist.api';

export const useWishlistStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchWishlist: async () => {
    set({ loading: true, error: null });
    try {
      const items = await wishlistAPI.get();
      set({ items, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || err.response?.data?.message || err.message, loading: false });
    }
  },

  checkWishlistStatus: async (propertyId) => {
    try {
      const isSaved = await wishlistAPI.check(propertyId);
      const currentItems = get().items;
      const existsLocally = currentItems.some(p => p.id === propertyId);
      
      if (isSaved && !existsLocally) {
        // If the backend says it's saved but local doesn't have it, add a stub so isWishlisted is true
        set({ items: [...currentItems, { id: propertyId }] });
      } else if (!isSaved && existsLocally) {
        // If the backend says it's not saved but local does, remove it
        set({ items: currentItems.filter(p => p.id !== propertyId) });
      }
      return isSaved;
    } catch (err) {
      console.error('Failed to check wishlist status', err);
      return false;
    }
  },

  toggleWishlist: async (property) => {
    const propertyId = typeof property === 'object' ? property.id : property;
    const currentItems = get().items;
    const exists = currentItems.some(p => p.id === propertyId);

    // Optimistic Update
    if (exists) {
      set({ items: currentItems.filter(p => p.id !== propertyId) });
    } else if (typeof property === 'object') {
      set({ items: [...currentItems, property] });
    }

    try {
      const res = await wishlistAPI.toggle(propertyId);
      // Re-fetch to ensure clean state
      if (!exists && typeof property !== 'object') {
        get().fetchWishlist();
      }
      return res;
    } catch (err) {
      // Revert if API fails
      set({ items: currentItems, error: err.response?.data?.error || err.response?.data?.message || err.message });
      throw err;
    }
  },

  addToWishlist: async (property) => {
    return get().toggleWishlist(property);
  },

  removeFromWishlist: async (propertyId) => {
    return get().toggleWishlist(propertyId);
  },

  isWishlisted: (propertyId) => {
    return get().items.some(p => p.id === propertyId);
  },

  clearWishlist: () => {
    set({ items: [] });
  }
}));
