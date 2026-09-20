import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useBookingStore } from '../../store/bookingStore';
import { subscribeToBookingStream } from '../../lib/sse';
import { paymentAPI } from '../../lib/apiCalls';
import { 
  Calendar, CheckCircle2, ChevronRight, HelpCircle, 
  MapPin, Clock, DollarSign, RefreshCcw, BellRing, FileText, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyBookings() {
  const navigate = useNavigate();
  
  const bookings = useBookingStore((state) => state.bookings);
  const loading = useBookingStore((state) => state.loading);
  const fetchTenantBookings = useBookingStore((state) => state.fetchTenantBookings);
  const respondToCounterStore = useBookingStore((state) => state.respondToCounter);
  const cancelBookingStore = useBookingStore((state) => state.cancelBooking);
  const applyBookingUpdate = useBookingStore((state) => state.applyBookingUpdate);

  const [sseNotifications, setSseNotifications] = useState([]);
  const [receiptModal, setReceiptModal] = useState({ isOpen: false, data: null, loading: false });

  useEffect(() => {
    fetchTenantBookings();
  }, []);

  // SSE Booking updates listener
  useEffect(() => {
    const unsubscribe = subscribeToBookingStream((update) => {
      const { bookingId, status, counterOffer } = update;
      
      // Update store
      applyBookingUpdate(update);

      // Add to local notify banner
      setSseNotifications((prev) => [{ id: Date.now(), bookingId, status, counterOffer }, ...prev]);
      
      toast((t) => (
        <div className="flex items-center space-x-2 text-xs">
          <BellRing size={16} className="text-brand-secondary animate-bounce" />
          <span>
            Booking #{bookingId} status changed to <b>{status}</b>!
          </span>
        </div>
      ), { icon: '📢', duration: 6000 });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleAcceptCounter = async (bookingId) => {
    try {
      await respondToCounterStore(bookingId, 'ACCEPTED');
      toast.success('Counter offer accepted! Ready to pay deposit.');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to accept counter offer.');
    }
  };

  const handleDeclineCounter = async (bookingId) => {
    try {
      await respondToCounterStore(bookingId, 'REJECTED');
      toast.success('Counter offer declined.');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to decline counter offer.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) return;
    try {
      await cancelBookingStore(bookingId);
      toast.success('Booking application cancelled.');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const handleViewReceipt = async (bookingId) => {
    setReceiptModal({ isOpen: true, data: null, loading: true });
    try {
      const details = await paymentAPI.getByBooking(bookingId);
      setReceiptModal({ isOpen: true, data: details, loading: false });
    } catch (err) {
      toast.error('Could not fetch receipt details.');
      setReceiptModal({ isOpen: false, data: null, loading: false });
    }
  };

  // Helper to resolve stepper progress index
  const getStepIndex = (status) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'ACCEPTED': return 1;
      case 'COMPLETED':
      case 'CONFIRMED': return 2;
      default: return 0;
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'ACCEPTED': return 'accent';
      case 'COMPLETED':
      case 'CONFIRMED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'info';
    }
  };

  return (
    <PageWrapper className="relative min-h-screen px-4 md:px-8">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-base via-[#090914] to-[#07070E] z-0 pointer-events-none">
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-brand-primary/5 rounded-full blur-[110px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col space-y-6 pt-6 text-left">
        <div>
          <Badge variant="primary" className="mb-2">Tenancy Lock</Badge>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-text-primary">
            My Rent Applications
          </h2>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Track applications, negotiate offers, and secure your lease deposit.
          </p>
        </div>

        {/* Real-time SSE notify logs banner */}
        {sseNotifications.length > 0 && (
          <div className="w-full p-3.5 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5 text-xs text-text-secondary">
              <Clock className="text-brand-accent animate-pulse" size={16} />
              <span>Real-time booking updates received inside active session.</span>
            </div>
            <button
              onClick={() => setSseNotifications([])}
              className="text-[10px] font-bold text-text-muted hover:text-text-primary uppercase tracking-wider"
            >
              Clear
            </button>
          </div>
        )}

        {/* Content list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            title="No Bookings Yet"
            description="You have not submitted any property booking requests yet. Browse properties and click Apply to get started."
            actionText="Browse Listings"
            onActionClick={() => navigate('/search')}
          />
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const currentStep = getStepIndex(booking.status);
              const isRejected = booking.status === 'REJECTED';

              return (
                <Card 
                  key={booking.id}
                  className="p-6 bg-surface-raised/40 border border-white/5 space-y-6 hover:border-white/10 transition-colors"
                  enableTilt={false}
                >
                  
                  {/* Top info row */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex gap-4 items-center">
                      <img
                        src={booking.propertyImage}
                        alt={booking.propertyTitle}
                        className="w-20 h-15 object-cover rounded-xl border border-white/5"
                      />
                      <div>
                        <h3 className="font-display font-bold text-base text-text-primary group-hover:text-brand-accent transition-colors">
                          {booking.propertyTitle}
                        </h3>
                        <p className="text-xs text-text-secondary font-semibold mt-1">Requested on: <span className="font-mono">{booking.requestedOn}</span></p>
                      </div>
                    </div>

                    <div className="flex items-start md:items-end flex-col">
                      <Badge variant={getStatusBadgeVariant(booking.status)} className="shadow-sm">
                        {booking.status}
                      </Badge>
                      <p className="text-base font-display font-bold text-brand-accent mt-1.5">₹{booking.rent.toLocaleString()}/mo</p>
                    </div>
                  </div>

                  {/* Stepper Progress (Timeline) */}
                  {!isRejected && (
                    <div className="py-4 px-2 bg-white/[0.01] border border-white/5 rounded-2xl">
                      <div className="relative flex justify-between items-center w-full max-w-xl mx-auto">
                        
                        {/* Stepper connection lines */}
                        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-white/5 z-0">
                          <div 
                            className="h-full bg-brand-accent transition-all duration-500"
                            style={{
                              width: currentStep === 1 ? '50%' : currentStep === 2 ? '100%' : '0%'
                            }}
                          ></div>
                        </div>

                        {/* Step 1 */}
                        <div className="flex flex-col items-center z-10 relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                            currentStep >= 0 
                              ? 'bg-brand-primary text-text-primary border-brand-primary' 
                              : 'bg-surface-raised text-text-muted border-white/10'
                          }`}>
                            1
                          </div>
                          <span className="text-[10px] text-text-secondary mt-1 font-semibold">Applied</span>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center z-10 relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                            currentStep >= 1 
                              ? 'bg-brand-primary text-text-primary border-brand-primary' 
                              : 'bg-surface-raised text-text-muted border-white/10'
                          }`}>
                            2
                          </div>
                          <span className="text-[10px] text-text-secondary mt-1 font-semibold">Approved</span>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center z-10 relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                            currentStep >= 2 
                              ? 'bg-brand-primary text-text-primary border-brand-primary' 
                              : 'bg-surface-raised text-text-muted border-white/10'
                          }`}>
                            3
                          </div>
                          <span className="text-[10px] text-text-secondary mt-1 font-semibold">Lease Secured</span>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* Application Message / Negotiations Details */}
                  <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl text-xs space-y-3 text-left">
                    <div>
                      <p className="font-bold text-text-muted uppercase tracking-wider text-[10px]">Your message:</p>
                      <p className="text-text-secondary mt-0.5 font-medium leading-relaxed">"{booking.message}"</p>
                    </div>
                    {booking.landlordResponse && (
                      <div className="border-t border-white/5 pt-2.5">
                        <p className="font-bold text-text-muted uppercase tracking-wider text-[10px]">Landlord response:</p>
                        <p className="text-text-primary mt-0.5 font-medium leading-relaxed">"{booking.landlordResponse}"</p>
                      </div>
                    )}

                    {/* Counter Offer state representation */}
                    {booking.counterOffer && booking.status === 'PENDING' && (
                      <div className="border-t border-white/5 pt-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div>
                          <p className="text-xs font-bold text-brand-secondary">Landlord Counter Offer Proximity</p>
                          <p className="text-text-secondary text-[11px] mt-0.5">The landlord is willing to rent the property for <b>₹{booking.counterOffer.toLocaleString()}/month</b>.</p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <button
                            onClick={() => handleDeclineCounter(booking.id)}
                            className="px-3.5 py-1.5 text-xs rounded-lg border border-white/5 hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all font-semibold"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAcceptCounter(booking.id)}
                            className="px-3.5 py-1.5 text-xs rounded-lg bg-brand-primary text-text-primary font-semibold hover:bg-brand-primary/95 transition-all shadow-md"
                          >
                            Accept Offer
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Pending booking cancellation CTA */}
                    {booking.status === 'PENDING' && (
                      <div className="border-t border-white/5 pt-3 flex justify-end">
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="text-xs text-red-400 hover:text-red-300 hover:underline transition-colors font-medium"
                        >
                          Cancel Application Request
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Checkout CTA */}
                  {booking.status === 'ACCEPTED' && (
                    <div className="border-t border-white/5 pt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-left">
                      <div>
                        <p className="text-xs font-bold text-success flex items-center gap-1">
                          <CheckCircle2 size={14} />
                          Application Approved!
                        </p>
                        <p className="text-[10px] text-text-secondary mt-0.5">Please pay the security deposit to lock the tenancy and fetch lease keys.</p>
                      </div>
                      <Button
                        onClick={() => navigate(`/tenant/confirm-booking/${booking.id}`)}
                        variant="secondary"
                        size="sm"
                        icon={ChevronRight}
                        iconPosition="right"
                        className="w-full md:w-auto"
                      >
                        Proceed to Payment
                      </Button>
                    </div>
                  )}

                  {booking.status === 'COMPLETED' && (
                    <div className="border-t border-white/5 pt-4 flex items-center justify-between text-left">
                      <div>
                        <p className="text-xs font-bold text-brand-accent flex items-center gap-1">
                          <CheckCircle2 size={14} />
                          Payment Processed
                        </p>
                        <p className="text-[10px] text-text-secondary mt-0.5">Lease is successfully secured. Landlord has been notified. Ready to arrange move-in date.</p>
                      </div>
                      <Button
                        onClick={() => handleViewReceipt(booking.id)}
                        variant="outline"
                        size="sm"
                        icon={FileText}
                      >
                        View Receipt
                      </Button>
                    </div>
                  )}

                </Card>
              );
            })}
          </div>
        )}

      </div>

      {/* Payment Receipt Modal */}
      {receiptModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm p-6 bg-[#0B0B14] border border-white/10 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="font-display font-bold text-lg text-text-primary flex items-center gap-2">
                <FileText size={20} className="text-brand-accent" />
                Payment Receipt
              </h3>
              <button 
                onClick={() => setReceiptModal({ isOpen: false, data: null, loading: false })}
                className="text-text-muted hover:text-text-primary transition"
              >
                <X size={20} />
              </button>
            </div>
            
            {receiptModal.loading ? (
              <div className="py-8 flex justify-center"><Spinner size="md" /></div>
            ) : receiptModal.data ? (
              <div className="space-y-4 text-sm text-left">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-text-secondary">Amount</span>
                  <span className="font-bold text-text-primary text-lg">
                    {receiptModal.data.currency} {receiptModal.data.amount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Status</span>
                  <Badge variant="success">SUCCESS</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Order ID</span>
                  <span className="font-mono text-xs text-text-muted">{receiptModal.data.razorpayOrderId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Payment ID</span>
                  <span className="font-mono text-xs text-text-muted">{receiptModal.data.razorpayPaymentId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Date</span>
                  <span className="text-text-primary">
                    {receiptModal.data.createdAt ? new Date(receiptModal.data.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-text-secondary">Failed to load receipt</div>
            )}
          </Card>
        </div>
      )}

    </PageWrapper>
  );
}
