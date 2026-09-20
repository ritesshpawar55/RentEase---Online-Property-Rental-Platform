import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { propertyAPI, reviewAPI, aiAPI, adminAPI } from '../../lib/apiCalls';
import { useAuthStore } from '../../store/authStore';
import { useBookingStore } from '../../store/bookingStore';
import { useWishlistStore } from '../../store/wishlistStore';
import {
  Heart, Sparkles, MapPin, BedDouble, Maximize2, Sofa,
  Layers, Calendar, Calculator, ShieldCheck, FileText,
  Users, CheckCircle2, Star, ChevronLeft, ChevronRight, MessageSquare, Send, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const createBooking = useBookingStore((state) => state.createBookingRequest);

  // Wishlist store
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const isWishlisted = useWishlistStore((state) => state.isWishlisted);
  const checkWishlistStatus = useWishlistStore((state) => state.checkWishlistStatus);

  // States
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Upfront Calculator States
  const [depositMonths, setDepositMonths] = useState(2);
  const [includeBrokerage, setIncludeBrokerage] = useState(false);

  // Booking Modal States
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [coApplicantsCount, setCoApplicantsCount] = useState(0);
  const [coApplicants, setCoApplicants] = useState([]);

  // Checklist documents
  const [checkedDocs, setCheckedDocs] = useState({
    aadhaar: false,
    salarySlip: false,
    companyId: false,
    panCard: false,
  });

  // Review States
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadProperty = async () => {
    setLoading(true);
    try {
      const data = await propertyAPI.getById(id);
      setProperty(data);
      setCounterPrice(data.rent.toString());

      // Fetch reviews for this property
      try {
        const revs = await reviewAPI.getByProperty(id);
        setReviews(revs);
      } catch (e) {
        console.error('Could not load reviews:', e);
      }

      // Check real-time wishlist state
      if (isAuthenticated) {
        await checkWishlistStatus(id);
      }

      // Fetch AI prediction forecast
      try {
        const aiData = await aiAPI.predictRent({
          bhk: data.bhk,
          sqft: data.sqft,
          floor: data.floor,
          furnished: data.furnished,
          city: data.city,
          locality: data.locality,
          rent: data.rent
        });
        if (aiData) {
          setProperty(prev => ({
            ...prev,
            aiPrediction: {
              minRent: aiData.minRent || Math.floor(data.rent * 0.9),
              suggested: aiData.suggested || data.rent,
              maxRent: aiData.maxRent || Math.ceil(data.rent * 1.1)
            }
          }));
        }
      } catch (e) {
        console.error('Could not load AI forecast:', e);
      }
    } catch (err) {
      toast.error('Listing not found');
      navigate('/search');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdminReview = async (reviewId) => {
    if (!window.confirm("Admin: Are you sure you want to delete this review?")) return;
    try {
      await adminAPI.deleteReview(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast.success("Review deleted successfully by admin.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete review.");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Sign in to leave a review.');
      navigate('/login');
      return;
    }
    if (!newComment.trim()) {
      toast.error('Please write a review comment.');
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewAPI.create({
        propertyId: Number(id),
        rating: Number(newRating),
        comment: newComment.trim()
      });
      toast.success('Review submitted successfully! ⭐');
      setNewComment('');
      setNewRating(5);
      const revs = await reviewAPI.getByProperty(id);
      setReviews(revs);
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    loadProperty();
  }, [id]);

  if (loading) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-[70vh]">
        <Spinner size="lg" />
      </PageWrapper>
    );
  }

  if (!property) return null;

  // Calculations for Move-in cost
  const calculatedDeposit = property.rent * depositMonths;
  const calculatedBrokerage = includeBrokerage ? Math.floor(property.rent * 0.5) : 0;
  const calculatedTotal = calculatedDeposit + property.rent + calculatedBrokerage;

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      toast.error('Login to save properties.');
      navigate('/login');
      return;
    }

    if (isWishlisted(property.id)) {
      removeFromWishlist(property.id);
      toast.success('Removed from wishlist 😓');
    } else {
      addToWishlist(property);
      toast.success('Added to wishlist ❤️');
    }
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      toast.error('Sign in to submit rent applications');
      navigate('/login');
      return;
    }
    if (user?.role !== 'TENANT') {
      toast.error('Only Tenant profiles can apply for listings.');
      return;
    }
    setIsApplyModalOpen(true);
  };

  const handleCoApplicantChange = (idx, field, val) => {
    const updated = [...coApplicants];
    if (!updated[idx]) updated[idx] = {};
    updated[idx][field] = val;
    setCoApplicants(updated);
  };

  const handleApplicantsCountChange = (val) => {
    const count = Math.min(Number(val), 3); // Max 3 co-applicants (total 4)
    setCoApplicantsCount(count);

    // Resize array
    const newApplicants = Array.from({ length: count }).map((_, idx) =>
      coApplicants[idx] || { name: '', email: '', phone: '' }
    );
    setCoApplicants(newApplicants);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    try {
      await createBooking({
        propertyId: property.id,
        rent: Number(counterPrice) || property.rent,
        moveInDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks out
        message: bookingMessage,
        counterOffer: Number(counterPrice) !== property.rent ? Number(counterPrice) : null,
        coApplicants,
        requiredDocuments: Object.keys(checkedDocs),
      });

      toast.success('Rent application submitted successfully! 🚀');
      setIsApplyModalOpen(false);
      navigate('/tenant/bookings');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Could not submit application.');
    }
  };

  // AI Price comparison calculations
  const predicted = property.aiPrediction || { minRent: property.rent * 0.9, suggested: property.rent, maxRent: property.rent * 1.1 };
  const getAIValuationStatus = () => {
    const ratio = property.rent / predicted.suggested;
    if (ratio <= 0.95) return { text: 'Great Value (Underpriced)', variant: 'great-value', desc: 'Current rent is significantly below the AI suggested fair value index.' };
    if (ratio > 1.05) return { text: 'Above Suggested Rent', variant: 'above-market', desc: 'Current rent is higher than typical models. Consider negotiating.' };
    return { text: 'Fair Deal Market Valuation', variant: 'fair-deal', desc: 'Listing rent perfectly matches standard valuation for this configuration.' };
  };

  const valuation = getAIValuationStatus();

  return (
    <PageWrapper className="relative min-h-screen px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col space-y-8 pt-6">

        {/* Photo Gallery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Photo Display */}
          <div className="lg:col-span-2 relative h-96 bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-lg group">
            <img
              src={property.imageUrls[activePhotoIdx]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            {/* Gallery Controls */}
            {property.imageUrls.length > 1 && (
              <>
                <button
                  onClick={() => setActivePhotoIdx(prev => (prev === 0 ? property.imageUrls.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-text-primary rounded-full hover:bg-black/60 backdrop-blur-md transition"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setActivePhotoIdx(prev => (prev === property.imageUrls.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-text-primary rounded-full hover:bg-black/60 backdrop-blur-md transition"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Index tags indicator */}
            <div className="absolute bottom-4 right-4 bg-black/55 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg text-xs font-mono text-text-primary select-none">
              {activePhotoIdx + 1} / {property.imageUrls.length}
            </div>
          </div>

          {/* Sub Thumbnails selection */}
          <div className="flex lg:flex-col gap-3 h-24 lg:h-96 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto hide-scrollbar">
            {property.imageUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => setActivePhotoIdx(index)}
                className={`flex-shrink-0 w-28 h-20 lg:w-full lg:h-[118px] bg-white/5 rounded-xl overflow-hidden border-2 transition-all ${activePhotoIdx === index ? 'border-brand-accent' : 'border-transparent hover:border-white/15'
                  }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">

          {/* Left / Center: Details & AI Valuation */}
          <div className="lg:col-span-2 space-y-6">

            {/* Base Info Card */}
            <div className="glass-card p-6 md:p-8 bg-surface-raised/40 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={valuation.variant} className="shadow-md">
                      <Sparkles size={11} className="mr-1" />
                      {valuation.text}
                    </Badge>
                    {property.type && <Badge variant="info">{property.type}</Badge>}
                  </div>

                  <h1 className="font-display font-bold text-2xl md:text-3xl text-text-primary mt-3 leading-snug">
                    {property.title}
                  </h1>

                  <div className="flex items-center text-text-secondary text-sm mt-2 space-x-1">
                    <MapPin size={14} className="text-text-muted" />
                    <span>{property.locality}, {property.city}</span>
                  </div>
                </div>

                <div className="flex items-end flex-col">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Monthly rent</span>
                  <span className="text-3xl font-display font-bold text-brand-accent">
                    ₹{property.rent.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-text-secondary font-semibold mt-1">Available immediately</span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                  <BedDouble className="text-brand-primary mx-auto mb-1" size={18} />
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Configuration</p>
                  <p className="text-sm font-bold text-text-primary mt-0.5">{property.bhk} BHK</p>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                  <Maximize2 className="text-brand-accent mx-auto mb-1" size={18} />
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Size (Sqft)</p>
                  <p className="text-sm font-bold text-text-primary mt-0.5">{property.sqft} sqft</p>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                  <Sofa className="text-brand-secondary mx-auto mb-1" size={18} />
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Furnished</p>
                  <p className="text-sm font-bold text-text-primary mt-0.5 truncate">{property.furnished}</p>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                  <Layers className="text-text-secondary mx-auto mb-1" size={18} />
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Floor Level</p>
                  <p className="text-sm font-bold text-text-primary mt-0.5">Floor {property.floor} of {property.totalFloors}</p>
                </div>
              </div>

              {/* Description */}
              <div className="border-t border-white/5 pt-6 text-left space-y-2.5">
                <h4 className="font-display font-semibold text-text-primary text-sm">Listing Description</h4>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {property.description}
                </p>
              </div>

              {/* Amenities */}
              <div className="border-t border-white/5 pt-6 text-left space-y-3">
                <h4 className="font-display font-semibold text-text-primary text-sm">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <span
                      key={a}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-text-secondary font-semibold"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Valuation Detail panel */}
            <div className="glass-card p-6 md:p-8 bg-surface-raised/40 border border-white/5 text-left space-y-6">
              <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
                <div className="p-1.5 rounded-lg bg-brand-primary/10 border border-brand-primary/30 text-brand-accent">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-text-primary">AI Valuation Pricing Model</h3>
                  <p className="text-[10px] text-text-secondary">Random Forest valuation estimate index</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="max-w-md">
                    <p className="text-sm font-semibold text-text-primary">{valuation.text}</p>
                    <p className="text-xs text-text-secondary mt-1">{valuation.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Suggested Index</p>
                    <p className="text-lg font-bold text-text-primary font-mono mt-0.5">₹{predicted.suggested.toLocaleString()}</p>
                  </div>
                </div>

                {/* Range Slider Visualization */}
                <div className="pt-4 space-y-2">
                  <div className="h-2 w-full bg-white/5 rounded-full relative">
                    {/* Valuations range bar */}
                    <div
                      className="absolute top-0 bottom-0 bg-brand-primary/30 rounded-full border-l border-r border-brand-primary/50"
                      style={{
                        left: '10%',
                        right: '10%',
                      }}
                    ></div>
                    {/* Current Rent marker */}
                    <div
                      className={`absolute -top-1.5 w-5 h-5 rounded-full border-2 border-surface-raised bg-brand-accent flex items-center justify-center shadow-lg shadow-brand-accent/20 cursor-default`}
                      style={{
                        left: `${Math.min(Math.max(((property.rent - predicted.minRent) / (predicted.maxRent - predicted.minRent)) * 80 + 10, 5), 95)}%`
                      }}
                      title="Current rent"
                    >
                      <div className="w-1.5 h-1.5 bg-surface-raised rounded-full"></div>
                    </div>
                  </div>

                  {/* Slider limits labels */}
                  <div className="flex justify-between text-[10px] font-mono text-text-muted pt-1">
                    <span>Min: ₹{predicted.minRent.toLocaleString()}</span>
                    <span className="text-brand-accent font-semibold">Suggested: ₹{predicted.suggested.toLocaleString()}</span>
                    <span>Max: ₹{predicted.maxRent.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Landlord information */}
            <div className="glass-card p-6 bg-surface-raised/40 border border-white/5 flex items-center justify-between text-left">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-brand-secondary/10 border border-brand-secondary/30 flex items-center justify-center text-brand-secondary text-lg font-bold">
                  {property.landlordName ? property.landlordName.charAt(0) : 'L'}
                </div>
                <div>
                  <p className="text-xs text-text-muted font-semibold uppercase tracking-wider">Property Landlord</p>
                  <h4 className="font-display font-semibold text-text-primary text-sm mt-0.5">{property.landlordName}</h4>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <Star size={14} className="text-brand-secondary fill-brand-secondary" />
                <span className="text-xs font-bold text-text-primary">{property.landlordRating || '4.5'}</span>
                <span className="text-[10px] text-text-muted">Landlord Rating</span>
              </div>
            </div>

            {/* Property Tenant Reviews Section */}
            <div className="glass-card p-6 md:p-8 bg-surface-raised/40 border border-white/5 text-left space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="text-brand-primary" size={18} />
                  <h3 className="font-display font-bold text-base text-text-primary">Tenant Reviews ({reviews.length})</h3>
                </div>
                <div className="flex items-center space-x-1 bg-white/5 px-3 py-1 rounded-xl">
                  <Star size={14} className="text-brand-secondary fill-brand-secondary" />
                  <span className="text-xs font-bold text-text-primary">{property.avgRating || '4.8'}</span>
                </div>
              </div>

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <p className="text-xs text-text-muted italic py-2">No reviews written for this listing yet. Be the first to share your experience!</p>
              ) : (
                <div className="space-y-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-primary">{rev.tenantName}</span>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} size={12} className="text-brand-secondary fill-brand-secondary" />
                          ))}
                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={() => handleDeleteAdminReview(rev.id)}
                              className="ml-2 text-text-muted hover:text-red-400 p-1"
                              title="Admin: Delete Review"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">{rev.comment}</p>
                      <p className="text-[10px] text-text-muted font-mono">{rev.createdAt}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Review Form for Authenticated Users */}
              {isAuthenticated && (
                <form onSubmit={handleReviewSubmit} className="pt-4 border-t border-white/5 space-y-4">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Leave a Verified Review</h4>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-text-secondary font-semibold">Rating:</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            size={18}
                            className={star <= newRating ? 'text-brand-secondary fill-brand-secondary' : 'text-text-muted'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
  type="text"
  placeholder="Share your living experience, maintenance quality, or neighborhood feedback..."
  value={newComment}
  onChange={(e) => setNewComment(e.target.value)}
  className="flex-1 bg-white border border-white/5 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-brand-primary !text-black placeholder:text-gray-400"
/>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      loading={submittingReview}
                      icon={Send}
                    >
                      Post
                    </Button>
                  </div>
                </form>
              )}
            </div>

          </div>

          {/* Right Column: Cost Calculator & CTA Button */}
          <div className="space-y-6">

            {/* Cost Calculator Widget */}
            <Card className="p-6 bg-surface-raised/50 border-white/10 space-y-6">
              <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
                <Calculator className="text-brand-secondary" size={18} />
                <h3 className="font-display font-bold text-base text-text-primary">Upfront Cost Calculator</h3>
              </div>

              <div className="space-y-4">
                {/* Deposit month multiplier select */}
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Security Deposit Multiplier</label>
                  <select
                    value={depositMonths}
                    onChange={(e) => setDepositMonths(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white text-black border border-gray-300 text-xs outline-none focus:border-brand-primary focus:ring-0"                  >
                    <option value={1}>1 Month Deposit</option>
                    <option value={2}>2 Months Deposit (Recommended)</option>
                    <option value={3}>3 Months Deposit</option>
                    <option value={4}>4 Months Deposit</option>
                  </select>
                </div>

                {/* Brokerage checkbox */}
                <label className="flex items-center space-x-2 py-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeBrokerage}
                    onChange={(e) => setIncludeBrokerage(e.target.checked)}
                    className="rounded bg-surface-raised border-white/10 text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-xs font-semibold text-text-secondary">Include Brokerage (0.5 Month)</span>
                </label>

                {/* Breakdown details */}
                <div className="space-y-2 pt-2 border-t border-white/5 text-xs text-text-secondary">
                  <div className="flex justify-between">
                    <span>1st Month Rent:</span>
                    <span className="font-mono">₹{property.rent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security Deposit ({depositMonths}x):</span>
                    <span className="font-mono">₹{calculatedDeposit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Brokerage Commission:</span>
                    <span className="font-mono">₹{calculatedBrokerage.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-text-primary pt-2 border-t border-white/5 text-sm">
                    <span>Total Upfront Cost:</span>
                    <span className="font-mono text-brand-accent">₹{calculatedTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Action buttons */}
            <div className="flex flex-col space-y-3">
              <Button
                onClick={handleApplyClick}
                variant="primary"
                size="lg"
                fullWidth
                className="py-4 shadow-xl"
              >
                Apply to Rent Property
              </Button>

              <Button
                onClick={handleWishlistToggle}
                variant="outline"
                size="md"
                fullWidth
                className="py-3"
                icon={Heart}
              >
                {isWishlisted(property.id) ? 'Saved to Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>

          </div>
        </div>
      </div>

      {/* Applying Modal Form (Joint roommate options + checklist) */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Rental Application"
        size="md"
      >
        <form onSubmit={handleBookingSubmit} className="space-y-5 text-left pt-2">

          {/* Price Negotiation (Counter Offer) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary flex items-center justify-between">
              <span>Proposed Monthly Rent (₹)</span>
              <span className="text-[10px] text-text-muted font-bold uppercase">Original: ₹{property.rent.toLocaleString()}</span>
            </label>
            <Input
              type="number"
              placeholder="e.g. 17500"
              value={counterPrice}
              onChange={(e) => setCounterPrice(e.target.value)}
              className="bg-white text-black border border-gray-300 focus:border-brand-primary focus:ring-0"
              required
            />
            <p className="text-[10px] text-text-muted leading-relaxed">
              Negotiation helper: Propose a counter-price if you find standard valuations too high. The landlord can review and reply.
            </p>
          </div>

          {/* Co-Applicants (Roommate friendly feature) */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-text-secondary flex justify-between items-center">
              <span>Flatmate/Co-applicants (Joint Request)</span>
              <Badge variant="accent">Up to 4 occupants</Badge>
            </label>

            <select
              value={coApplicantsCount}
              onChange={(e) => handleApplicantsCountChange(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-300 bg-white text-black text-xs outline-none focus:border-brand-primary focus:ring-0"
            >
              <option value={0}>Individual Application (Self only)</option>
              <option value={1}>1 Co-applicant (Total 2 occupants)</option>
              <option value={2}>2 Co-applicants (Total 3 occupants)</option>
              <option value={3}>3 Co-applicants (Total 4 occupants)</option>
            </select>

            {coApplicants.map((applicant, idx) => (
              <div key={idx} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-3 mt-2">
                <p className="text-[10px] font-bold text-text-muted uppercase">Co-occupant #{idx + 1} Details</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={applicant.name}
                    onChange={(e) => handleCoApplicantChange(idx, 'name', e.target.value)}
                    className="bg-surface-raised text-xs text-text-primary px-3 py-2 border border-white/5 rounded-xl w-full"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={applicant.email}
                    onChange={(e) => handleCoApplicantChange(idx, 'email', e.target.value)}
                    className="bg-surface-raised text-xs text-text-primary px-3 py-2 border border-white/5 rounded-xl w-full"
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Application Cover Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Message to Landlord</label>
            <textarea
              placeholder="Tell the landlord about yourself, your occupation, and why you want to rent this property..."
              value={bookingMessage}
              onChange={(e) => setBookingMessage(e.target.value)}
              rows={3}
              className="w-full bg-white text-gray-900 placeholder-gray-400 border border-white/5 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-brand-primary"
              required
            />
          </div>

          {/* Document Checklist verification */}
          <div className="space-y-3 border-t border-white/5 pt-4">
            <label className="text-xs font-semibold text-text-secondary flex items-center space-x-1.5">
              <FileText size={14} className="text-brand-secondary" />
              <span>Verify Required Documents Readiness</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <label className="flex items-center space-x-2 bg-white/[0.01] hover:bg-white/[0.03] p-2.5 rounded-xl border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkedDocs.aadhaar}
                  onChange={(e) => setCheckedDocs({ ...checkedDocs, aadhaar: e.target.checked })}
                  className="rounded text-brand-primary focus:ring-brand-primary bg-surface-raised border-white/10"
                />
                <span className="text-xs text-text-secondary font-medium">Aadhaar Card copy</span>
              </label>

              <label className="flex items-center space-x-2 bg-white/[0.01] hover:bg-white/[0.03] p-2.5 rounded-xl border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkedDocs.salarySlip}
                  onChange={(e) => setCheckedDocs({ ...checkedDocs, salarySlip: e.target.checked })}
                  className="rounded text-brand-primary focus:ring-brand-primary bg-surface-raised border-white/10"
                />
                <span className="text-xs text-text-secondary font-medium">Last 3 Months Salary Slip</span>
              </label>

              <label className="flex items-center space-x-2 bg-white/[0.01] hover:bg-white/[0.03] p-2.5 rounded-xl border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkedDocs.companyId}
                  onChange={(e) => setCheckedDocs({ ...checkedDocs, companyId: e.target.checked })}
                  className="rounded text-brand-primary focus:ring-brand-primary bg-surface-raised border-white/10"
                />
                <span className="text-xs text-text-secondary font-medium">Corporate Employee ID</span>
              </label>

              <label className="flex items-center space-x-2 bg-white/[0.01] hover:bg-white/[0.03] p-2.5 rounded-xl border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkedDocs.panCard}
                  onChange={(e) => setCheckedDocs({ ...checkedDocs, panCard: e.target.checked })}
                  className="rounded text-brand-primary focus:ring-brand-primary bg-surface-raised border-white/10"
                />
                <span className="text-xs text-text-secondary font-medium">PAN Card copy</span>
              </label>
            </div>
            <p className="text-[10px] text-text-muted leading-relaxed mt-1">
              Note: Ticking these flags declares that you possess verified copies of these documents to submit upon request.
            </p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            className="mt-4"
            icon={CheckCircle2}
          >
            Submit Rent Application
          </Button>

        </form>
      </Modal>

    </PageWrapper>
  );
}
