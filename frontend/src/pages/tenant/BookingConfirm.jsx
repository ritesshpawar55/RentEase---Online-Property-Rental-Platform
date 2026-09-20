import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { bookingAPI, paymentAPI } from '../../lib/apiCalls';
import { 
  CreditCard, ShieldCheck, Sparkles, CheckCircle2, 
  ArrowRight, ShieldAlert, FileText, Landmark 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingConfirm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [breakdown, setBreakdown] = useState(null);
  
  // Confetti / Payment success screen state
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [txDetails, setTxDetails] = useState(null);

  const loadBookingDetails = async () => {
    setLoading(true);
    try {
      // Get all tenant bookings and find this ID
      const list = await bookingAPI.getTenantBookings();
      const match = list.find(b => b.id === Number(id));
      if (!match) throw new Error('Booking not found');
      
      setBooking(match);
      
      // Fetch payment order breakdown
      try {
        const order = await paymentAPI.createOrder(match.id);
        if (order.breakdown) {
          setBreakdown(order.breakdown);
        } else {
          // Fallback breakdown — use the negotiated/agreed rent, not the original listing price
          const rent = match.agreedRent || match.rent || 15000;
          setBreakdown({
            firstMonth: rent,
            deposit: rent * 2,
            brokerage: 0,
            total: rent * 3
          });
        }
      } catch (e) {
        console.error('Order creation error:', e);
      }
    } catch (err) {
      toast.error('Booking request details not found.');
      navigate('/tenant/bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookingDetails();
  }, [id]);

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    
    // 1. Load Script
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      toast.error('Razorpay SDK failed to load. Check your network.');
      setPaymentLoading(false);
      return;
    }

    try {
      // 2. Create payment order on server
      const order = await paymentAPI.createOrder(booking.id);
      
      // 3. Configure Razorpay checkout options
      const options = {
        key: order.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_renteasekey',
        // Always charge exactly what the breakdown panel shows the user (1st month + deposit +
        // brokerage, reflecting the negotiated rent) rather than trusting order.amount in isolation —
        // that value can be stale/out of sync if the backend computed it off the original listing rent.
        amount: breakdown?.total
          ? breakdown.total * 100
          : (order.amount ? (order.amount > 100000 ? order.amount : order.amount * 100) : (booking.agreedRent || booking.rent) * 100),
        currency: order.currency || 'INR',
        name: 'RentEase Rentals',
        description: `Security Deposit for ${booking.propertyTitle}`,
        order_id: order.razorpayOrderId && !order.razorpayOrderId.startsWith('order_mock_') ? order.razorpayOrderId : undefined,
        handler: async (response) => {
          setPaymentLoading(true);
          try {
            // Verify payment signature
            const result = await paymentAPI.verifyPayment({
              bookingId: booking.id,
              razorpayPaymentId: response.razorpay_payment_id || 'pay_mock_' + Math.random().toString(36).substr(2, 9),
              razorpayOrderId: response.razorpay_order_id || order.razorpayOrderId || 'order_mock_1',
              razorpaySignature: response.razorpay_signature || 'sig_mock_XYZ',
            });
            
            if (result.status === 'SUCCESS' || result.status === 'COMPLETED' || result.paymentStatus === 'SUCCESS') {
              setTxDetails(result);
              setPaymentSuccess(true);
              toast.success('Lease deposit paid successfully! 🎉');
            } else {
              toast.error('Payment verification failed.');
            }
          } catch (err) {
            toast.error(err.response?.data?.error || err.response?.data?.message || 'Payment verification failed.');
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: order.tenantName || 'Aditya Ingale',
          email: order.tenantEmail || 'aditya@email.com',
          contact: '+91 98765 43210'
        },
        notes: {
          booking_id: booking.id.toString(),
          property_id: booking.propertyId ? booking.propertyId.toString() : '1',
        },
        theme: {
          color: '#6C47FF'
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
            toast.error('Payment cancelled by user.');
          }
        }
      };

      // 4. Open Razorpay Widget
      // In mock mode or mock order, simulate payment success directly
      if (!order.razorpayOrderId || order.razorpayOrderId.startsWith('order_mock_')) {
        setTimeout(async () => {
          try {
            const result = await paymentAPI.verifyPayment({
              bookingId: booking.id,
              razorpayPaymentId: 'pay_mock_' + Math.random().toString(36).substr(2, 9),
              razorpayOrderId: order.razorpayOrderId || 'order_mock_1',
              razorpaySignature: 'sig_mock_XYZ',
            });
            setTxDetails(result);
            setPaymentSuccess(true);
            toast.success('Lease deposit paid successfully (MOCK SUCCESS)! 🎉');
          } catch (err) {
            toast.error('Mock verification failed.');
          } finally {
            setPaymentLoading(false);
          }
        }, 1200);
      } else {
        const rzp = new window.Razorpay(options);
        rzp.open();
      }

    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Payment initialisation failed.');
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </PageWrapper>
    );
  }

  // Success view
  if (paymentSuccess) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <Card className="p-8 bg-surface-raised/50 border border-white/10 shadow-elevated">
            <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>

            <Badge variant="success" className="mb-2">Confirmed</Badge>
            <h2 className="font-display font-bold text-2xl text-text-primary">
              Lease Secured!
            </h2>
            <p className="text-xs text-text-secondary mt-2 px-3 leading-relaxed">
              We have processed your deposit payment. Your booking status has been updated to <b>PAID</b> and the lease is now locked.
            </p>

            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-left text-xs space-y-2.5 mt-6 font-mono text-text-secondary">
              <div className="flex justify-between">
                <span>Transaction ID:</span>
                <span className="text-text-primary select-all">{txDetails?.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span>Lease Property:</span>
                <span className="text-text-primary truncate max-w-[200px]">{booking.propertyTitle}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid Rent:</span>
                <span className="text-text-primary">₹{(booking.agreedRent || booking.rent).toLocaleString()}/mo</span>
              </div>
            </div>

            <Button
              onClick={() => navigate('/tenant/bookings')}
              variant="primary"
              fullWidth
              className="mt-8"
              icon={ArrowRight}
              iconPosition="right"
            >
              My Bookings Dashboard
            </Button>
          </Card>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="relative min-h-screen px-4 md:px-8">
      <div className="max-w-4xl mx-auto flex flex-col space-y-6 pt-6 text-left">
        
        {/* Title */}
        <div>
          <Badge variant="secondary" className="mb-2">Checkout</Badge>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-text-primary">
            Confirm & Pay Deposit
          </h2>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Deposit payments are held securely in escrow to secure your tenancy lock.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Left panel: Breakdown & Details */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 bg-surface-raised/40 border border-white/5 space-y-5">
              <h3 className="font-display font-bold text-base text-text-primary flex items-center gap-1.5">
                <FileText size={16} className="text-brand-primary" />
                Lease Details
              </h3>
              
              <div className="flex gap-4">
                <img
                  src={booking.propertyImage}
                  alt={booking.propertyTitle}
                  className="w-24 h-18 object-cover rounded-xl border border-white/5"
                />
                <div className="text-left">
                  <h4 className="font-display font-semibold text-text-primary text-sm line-clamp-1">
                    {booking.propertyTitle}
                  </h4>
                  <p className="text-xs text-text-secondary mt-1">Status: <b className="text-brand-accent">{booking.status}</b></p>
                  <p className="text-[10px] text-text-muted mt-0.5">Move-in Scheduled: {booking.moveInDate}</p>
                </div>
              </div>

              {/* Price Breakdown */}
              {breakdown && (
                <div className="border-t border-white/5 pt-5 space-y-3 text-xs text-text-secondary">
                  <p className="font-display font-bold text-xs text-text-primary uppercase tracking-wide">Upfront Fee Breakdown</p>
                  <div className="flex justify-between">
                    <span>1st Month Rent:</span>
                    <span className="font-mono text-text-primary">₹{breakdown.firstMonth.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security Deposit (2 Months):</span>
                    <span className="font-mono text-text-primary">₹{breakdown.deposit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Brokerage Commission:</span>
                    <span className="font-mono text-text-primary">₹{breakdown.brokerage.toLocaleString()}</span>
                  </div>
                  
                  <div className="border-t border-white/5 pt-3 flex justify-between font-bold text-text-primary text-sm">
                    <span>Total Checkout Amount:</span>
                    <span className="font-mono text-brand-accent text-base">₹{breakdown.total.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Escrow note */}
            <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl flex items-start space-x-3 text-xs text-text-secondary leading-relaxed">
              <ShieldCheck className="text-brand-accent mt-0.5 flex-shrink-0" size={16} />
              <div>
                <p className="font-semibold text-text-primary">Escrow Safety Guaranteed</p>
                <p className="mt-0.5">Your deposit is not released to the landlord immediately. It remains locked in our secure escrow wallet until you complete move-in keys exchange.</p>
              </div>
            </div>
          </div>

          {/* Right panel: Payment CTAs */}
          <div className="space-y-6">
            <Card className="p-6 bg-surface-raised/40 border border-white/5 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-brand-secondary/10 border border-brand-secondary/30 flex items-center justify-center text-brand-secondary mx-auto">
                  <Landmark size={18} />
                </div>
                <h4 className="font-display font-bold text-sm text-text-primary">Payment Gateways</h4>
                <p className="text-[10px] text-text-muted">Instant validation, secure payments</p>
              </div>

              <Button
                onClick={handlePayment}
                variant="secondary"
                size="lg"
                fullWidth
                loading={paymentLoading}
                className="py-3.5 shadow-lg shadow-brand-secondary/20"
                icon={CreditCard}
              >
                Pay Deposit (Razorpay)
              </Button>

              <div className="flex items-center justify-center space-x-2 text-[10px] text-text-muted">
                <ShieldCheck size={12} className="text-brand-accent" />
                <span>PCI-DSS Compliant 256-bit SSL Escrow</span>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </PageWrapper>
  );
}