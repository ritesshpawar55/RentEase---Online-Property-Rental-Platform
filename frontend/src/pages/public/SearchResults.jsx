import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import SkeletonCard from '../../components/ui/SkeletonCard';
import { propertyAPI, mlAPI } from '../../lib/apiCalls';
import { subscribeToListingsStream } from '../../lib/sse';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';

import { 
  SlidersHorizontal, Heart, MapPin, 
  BedDouble, Maximize2, Sofa, Sparkles, BellRing
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  // Wishlist store connections
  const wishlistItems = useWishlistStore((state) => state.items);
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const isWishlisted = useWishlistStore((state) => state.isWishlisted);

  // States
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time properties queued from SSE
  const [sseProperties, setSseProperties] = useState([]);

  // Filter States
  const [city, setCity] = useState(searchParams.get('city') || 'Hyderabad');
  const [type, setType] = useState(searchParams.get('type') || 'All');
  const [furnished, setFurnished] = useState(searchParams.get('furnished') || 'All');
  const [bhk, setBhk] = useState(searchParams.get('bhk') || '');
  const [minRent, setMinRent] = useState(searchParams.get('minRent') || '');
  const [maxRent, setMaxRent] = useState(searchParams.get('maxRent') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [availableCities, setAvailableCities] = useState(['Hyderabad', 'Mumbai', 'Bangalore', 'Delhi', 'Pune', 'Chennai']);

  useEffect(() => {
    mlAPI.getCities()
      .then(res => {
        const cities = Array.isArray(res) ? res : (res.cities || res);
        if (cities && cities.length > 0) setAvailableCities(cities);
      })
      .catch(err => console.error('Failed to load dynamic cities for search:', err));
  }, []);

  // Load Properties on filters/params changes
  const loadProperties = async () => {
  setLoading(true);
  setSseProperties([]);
  try {
    const filters = {
      city: city || '',
      type: type === 'All' ? '' : type,
      furnished: furnished === 'All' ? '' : furnished,
      bhk: bhk ? Number(bhk) : '',
      minRent: minRent ? Number(minRent) : '',
      maxRent: maxRent ? Number(maxRent) : '',
      sortBy: 'newest',
    };
    const data = await propertyAPI.getAll(filters);
    setProperties(Array.isArray(data) ? data : []);
  } catch (err) {
    toast.error('Could not fetch listings.');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadProperties();
  }, [city, type, furnished, bhk, minRent, maxRent, searchQuery]);

  // Subscribe to SSE Listing updates
  useEffect(() => {
    const unsubscribe = subscribeToListingsStream((newListing) => {
  if (newListing.city?.toLowerCase() === city.toLowerCase()) {

    // Normalize the raw SSE listing to match existing property shape
    const normalized = {
      ...newListing,
      type: { 'FLAT': 'Flat', 'VILLA': 'Villa', 'INDEPENDENT_HOUSE': 'Independent House' }[newListing.propertyType] || newListing.propertyType || 'Flat',
      furnished: { 'FURNISHED': 'Furnished', 'SEMI_FURNISHED': 'Semi-Furnished', 'UNFURNISHED': 'Unfurnished' }[newListing.furnishingStatus] || 'Unfurnished',
      avgRating: newListing.averageRating || 0,
      reviewCount: newListing.totalReviews || 0,
      aiSuggested: newListing.aiSuggestedRent || newListing.rent,
      landlordName: newListing.landlord?.name || 'Landlord',
      landlordPhone: newListing.landlord?.phone || '',
      images: newListing.imageUrls || [],
      amenities: (newListing.amenities || []).map(a => typeof a === 'string' ? a : a.name),
      isRealtime: true  // keeps the "Live Update" badge working
    }

    setSseProperties((prev) => [normalized, ...prev])

    toast((t) => (
      <div className="flex items-center space-x-2 text-xs">
        <BellRing size={16} className="text-brand-accent animate-bounce" />
        <span>Real-time update: <b>{newListing.title}</b> is now available!</span>
      </div>
    ), { duration: 5000, icon: '🔥' })
  }
});

    return () => {
      unsubscribe();
    };
  }, [city]);

  // Merge real-time items to listing grid
  const applyRealtimeListings = () => {
    setProperties((prev) => [...sseProperties, ...prev]);
    setSseProperties([]);
  };

  const handleWishlistToggle = (e, prop) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please login to save properties.');
      navigate('/login');
      return;
    }

    if (isWishlisted(prop.id)) {
      removeFromWishlist(prop.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(prop);
      toast.success('Added to wishlist ❤️');
    }
  };

  const getAIBadge = (rent, suggested) => {
    if (!suggested) return { label: 'Fair Deal', variant: 'fair-deal' };
    const diff = rent / suggested;
    if (diff <= 0.95) return { label: 'Great Value', variant: 'great-value' };
    if (diff > 1.05) return { label: 'Above Market', variant: 'above-market' };
    return { label: 'Fair Deal', variant: 'fair-deal' };
  };

  return (
    <PageWrapper className="relative min-h-screen px-4 md:px-8">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-base via-[#090914] to-[#07070E] z-0 pointer-events-none">
        <div className="absolute top-10 left-1/3 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col space-y-6 pt-6">
        
        {/* Page title and description */}
        <div className="text-left">
          <Badge variant="accent" className="mb-2">Marketplace</Badge>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-text-primary">
            Find Rental Properties
          </h2>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Real-time verified listings, direct smart-negotiation applications.
          </p>
        </div>

        {/* Real-time notification Banner */}
        {sseProperties.length > 0 && (
          <div className="w-full p-4 bg-brand-accent/10 border border-brand-accent/30 rounded-2xl flex items-center justify-between shadow-lg shadow-brand-accent/5 animate-pulse">
            <div className="flex items-center space-x-3 text-left">
              <BellRing className="text-brand-accent animate-bounce" size={20} />
              <div>
                <p className="text-sm font-semibold text-text-primary">New properties available!</p>
                <p className="text-xs text-text-secondary mt-0.5">{sseProperties.length} new listing(s) match your current city filter.</p>
              </div>
            </div>
            <Button
              onClick={applyRealtimeListings}
              variant="accent"
              size="sm"
            >
              Merge Listings
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Sidebar Filter Widget */}
          <aside className="lg:col-span-1 glass-card p-6 bg-surface-raised/40 border border-white/5 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="font-display font-bold text-sm text-text-primary flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-brand-primary" />
                Filters
              </span>
              <button 
                onClick={() => {
                  setCity('Hyderabad');
                  setType('All');
                  setFurnished('All');
                  setBhk('');
                  setMinRent('');
                  setMaxRent('');
                  setSearchQuery('');
                }}
                className="text-[10px] font-bold text-text-muted hover:text-brand-accent uppercase tracking-wider transition-colors"
              >
                Reset
              </button>
            </div>

            {/* City */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-semibold text-text-secondary">City</label>
              <input
                type="text"
                placeholder="e.g. Hyderabad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-surface-raised border border-white/10 px-3 py-2 rounded-xl text-sm focus:border-brand-primary outline-none text-text-primary explore-city-input"
              />
            </div>

            {/* Property Type */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-semibold text-text-secondary">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="bg-surface-raised/60 text-text-primary border border-white/5 px-3 py-2 rounded-xl text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary mt-1"
              >
                <option value="All">All Types</option>
                <option value="FLAT">Flat</option>         
                <option value="VILLA">Villa</option>         
                <option value="INDEPENDENT_HOUSE">Independent House</option>
              </select>
            </div>

            {/* Configuration */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-semibold text-text-secondary">Configuration</label>
              <select
                value={bhk}
                onChange={(e) => setBhk(e.target.value)}
                className="bg-surface-raised/60 text-text-primary border border-white/5 px-3 py-2 rounded-xl text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary mt-1"
              >
                <option value="">Any BHK</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
              </select>
            </div>

            {/* Furnishing Status */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-semibold text-text-secondary">Furnished</label>
              <select
                value={furnished}
                onChange={(e) => setFurnished(e.target.value)}
                className="bg-surface-raised/60 text-text-primary border border-white/5 px-3 py-2 rounded-xl text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary mt-1"
              >
                <option value="All">All</option>
                <option value="FURNISHED">Furnished</option>         
                <option value="SEMI_FURNISHED">Semi-Furnished</option>
                <option value="UNFURNISHED">Unfurnished</option>    
              </select>
            </div>

            {/* Price Range */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold text-text-secondary">Monthly Rent (₹)</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={minRent}
                  onChange={(e) => setMinRent(e.target.value)}
                  className="bg-surface-raised/60 text-text-primary placeholder:text-text-muted border border-white/5 px-3 py-2 rounded-xl text-xs outline-none focus:border-brand-primary"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxRent}
                  onChange={(e) => setMaxRent(e.target.value)}
                  className="bg-surface-raised/60 text-text-primary placeholder:text-text-muted border border-white/5 px-3 py-2 rounded-xl text-xs outline-none focus:border-brand-primary"
                />
              </div>
            </div>
          </aside>

          {/* Results Grid */}
          <main className="lg:col-span-3 space-y-6">
            {/* Listings Rendering */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : properties.length === 0 ? (
              <EmptyState
                title="No Listings Found"
                description="We couldn't find any listings matching your selection. Try clearing filters or changing cities."
                actionText="Reset Filters"
                onActionClick={() => {
                  setCity('Hyderabad');
                  setType('All');
                  setFurnished('All');
                  setBhk('');
                  setMinRent('');
                  setMaxRent('');
                  setSearchQuery('');
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map((prop) => {
                  const aiBadge = getAIBadge(prop.rent, prop.aiSuggested);
                  const isSaved = isWishlisted(prop.id);
                  return (
                    <Card
                      key={prop.id}
                      onClick={() => navigate(`/properties/${prop.id}`)}
                      className="flex flex-col relative overflow-hidden group border border-white/5 hover:border-white/10 p-0 text-left bg-surface-raised/20 hover:scale-[1.01]"
                    >
                      {/* Thumbnail Image */}
                      <div className="w-full h-48 relative overflow-hidden">
                        <img
                          src={prop.imageUrls ? prop.imageUrls[0] : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Gradient shadows */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent"></div>

                        {/* Top floaters */}
                        <div className="absolute top-3 left-3 flex flex-col space-y-1.5 items-start">
                          <Badge variant={aiBadge.variant} className="shadow-lg">
                            <Sparkles size={10} className="mr-1" />
                            {aiBadge.label}
                          </Badge>
                          {prop.isRealtime && (
                            <Badge variant="accent" className="shadow-lg animate-pulse">
                              Live Update
                            </Badge>
                          )}
                        </div>

                        {/* Wishlist toggle */}
                        <button
                          onClick={(e) => handleWishlistToggle(e, prop)}
                          className={`absolute top-3 right-3 p-2 rounded-full border border-white/10 backdrop-blur-md transition-all duration-300 shadow-md ${
                            isSaved 
                              ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                              : 'bg-black/40 text-text-primary hover:bg-black/60'
                          }`}
                        >
                          <Heart size={16} className={isSaved ? 'fill-red-500 scale-110' : 'hover:scale-115 transition-transform'} />
                        </button>

                        {/* Price Tag Overlay */}
                        <div className="absolute bottom-3 left-4">
                          <p className="text-[10px] text-brand-accent font-bold uppercase tracking-wider">Monthly rent</p>
                          <p className="text-xl font-display font-bold text-text-primary">
                            ₹{prop.rent.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Content details */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-display font-bold text-base text-text-primary leading-snug group-hover:text-brand-accent transition-colors">
                            {prop.title}
                          </h4>
                          
                          <div className="flex items-center text-text-secondary text-xs mt-1.5 space-x-1">
                            <MapPin size={12} className="text-text-muted" />
                            <span>{prop.locality}, {prop.city}</span>
                          </div>
                        </div>

                        {/* Specifications divider line */}
                        <div className="border-t border-white/5 my-4"></div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-3 gap-2 text-xs text-text-secondary">
                          <div className="flex items-center space-x-1.5">
                            <BedDouble size={14} className="text-text-muted" />
                            <span>{prop.bhk} BHK</span>
                          </div>
                          
                          <div className="flex items-center space-x-1.5">
                            <Maximize2 size={14} className="text-text-muted" />
                            <span>{prop.sqft} sqft</span>
                          </div>

                          <div className="flex items-center space-x-1.5 justify-end">
                            <Sofa size={14} className="text-text-muted" />
                            <span className="truncate">{prop.furnished.split('-')[0]}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </PageWrapper>
  );
}
