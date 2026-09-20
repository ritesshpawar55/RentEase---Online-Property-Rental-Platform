import React, { useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { bookingAPI } from '../../lib/apiCalls';
import { 
  Calendar, CheckCircle2, XCircle, Send, MessageSquare, 
  DollarSign, FileText, User, Clock
} from 'lucide-react';

import toast from 'react-hot-toast';

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Negotiation Modal States
  const [isNegModalOpen, setIsNegModalOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const [counterRent, setCounterRent] = useState('');
  const [negotiationMessage, setNegotiationMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingAPI.getLandlordBookings();
      setBookings(data);
    } catch (err) {
      toast.error('Could not load tenant requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleStatusChange = async (bookingId, status) => {
    if (!window.confirm(`Are you sure you want to update this application to ${status}?`)) return;
    
    try {
      await bookingAPI.updateStatus(bookingId, status);
      toast.success(`Application updated to ${status}!`);
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to change status.');
    }
  };

  const handleOpenNegotiation = (booking) => {
    setActiveBooking(booking);
    setCounterRent(booking.counterOffer ? booking.counterOffer.toString() : (booking.rent ? booking.rent.toString() : '15000'));
    setNegotiationMessage('');
    setIsNegModalOpen(true);
  };

  const handleNegotiationSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      // Propose counter offer to tenant
      await bookingAPI.updateStatus(activeBooking.id, 'PENDING', {
        counterOffer: Number(counterRent),
        responseMessage: negotiationMessage,
        landlordResponse: negotiationMessage,
      });

      toast.success('Counter offer dispatched to tenant! ✉️');
      setIsNegModalOpen(false);
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to submit counter offer.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'ACCEPTED': return 'accent';
      case 'PAID':
      case 'CONFIRMED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'info';
    }
  };

  return (
    <PageWrapper className="relative min-h-screen px-4 md:px-8">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-base via-[#090914] to-[#07070E] z-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-brand-primary/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col space-y-6 pt-6 text-left">
        <div>
          <Badge variant="secondary" className="mb-2">Landlord Desk</Badge>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-text-primary">
            Manage Incoming Requests
          </h2>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Review tenancy applications, negotiate rental pricing, and accept contracts.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            title="No Applications Yet"
            description="You don't have any incoming rental booking requests on your listings yet."
            icon={Calendar}
          />
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <Card 
                key={booking.id}
                className="p-6 bg-surface-raised/40 border border-white/5 space-y-6 hover:border-white/10 transition-colors"
                enableTilt={false}
              >
                
                {/* Header row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center space-x-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-accent">
                      <User size={18} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-text-primary">
                        Application from {booking.tenantName}
                      </h3>
                      <p className="text-[10px] text-text-muted mt-0.5">Applied on {booking.requestedOn} | Contact: {booking.tenantEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-start md:items-end flex-col">
                    <Badge variant={getStatusBadge(booking.status)}>
                      {booking.status}
                    </Badge>
                    <p className="text-sm font-semibold text-text-secondary mt-1 font-mono">Move-in target: {booking.moveInDate}</p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-text-secondary bg-white/[0.01] p-4 rounded-xl border border-white/5 text-left">
                  <div className="space-y-1">
                    <p className="font-bold text-text-muted uppercase tracking-wider text-[9px]">Target Property</p>
                    <p className="font-semibold text-text-primary text-sm line-clamp-1">{booking.propertyTitle}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-text-muted uppercase tracking-wider text-[9px]">Requested Rent Price</p>
                    <p className="font-bold text-brand-accent text-sm font-mono">₹{booking.rent.toLocaleString()}/month</p>
                  </div>

                  <div className="md:col-span-2 pt-2 border-t border-white/5 space-y-1">
                    <p className="font-bold text-text-muted uppercase tracking-wider text-[9px]">Applicant Message</p>
                    <p className="text-text-secondary leading-relaxed italic">"{booking.message}"</p>
                  </div>

                  {booking.counterOffer && (
                    <div className="md:col-span-2 pt-2 border-t border-brand-secondary/20 space-y-1">
                      <p className="font-bold text-brand-secondary uppercase tracking-wider text-[9px]">Proposed Counter Rent</p>
                      <p className="text-text-primary font-bold font-mono">₹{booking.counterOffer.toLocaleString()}/month</p>
                    </div>
                  )}
                </div>

                {/* Actions row based on PENDING status */}
                {booking.status === 'PENDING' && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <Button
                      onClick={() => handleOpenNegotiation(booking)}
                      variant="outline"
                      size="sm"
                      icon={MessageSquare}
                    >
                      Negotiate Counter Price
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleStatusChange(booking.id, 'REJECTED')}
                        variant="danger"
                        size="sm"
                        icon={XCircle}
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleStatusChange(booking.id, 'ACCEPTED')}
                        variant="primary"
                        size="sm"
                        icon={CheckCircle2}
                      >
                        Approve Application
                      </Button>
                    </div>
                  </div>
                )}

                {booking.status === 'ACCEPTED' && (
                  <div className="text-xs text-text-muted text-left flex items-center space-x-1.5 pt-2">
                    <Clock size={12} className="text-brand-accent animate-pulse" />
                    <span>Approved. Waiting for applicant to process escrow deposit checkout.</span>
                  </div>
                )}

                {booking.status === 'PAID' && (
                  <div className="text-xs text-success text-left flex items-center space-x-1.5 pt-2">
                    <CheckCircle2 size={12} />
                    <span>Deposit paid! Tenancy is secured and locked. Arrange key exchange.</span>
                  </div>
                )}

              </Card>
            ))}
          </div>
        )}

      </div>

      {/* Negotiation Propose Modal */}
      {activeBooking && (
        <Modal
          isOpen={isNegModalOpen}
          onClose={() => setIsNegModalOpen(false)}
          title={`Negotiate with ${activeBooking.tenantName}`}
        >
          <form onSubmit={handleNegotiationSubmit} className="space-y-4 text-left pt-2">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary flex justify-between">
                <span>Propose Counter Rent (₹)</span>
                <span className="text-[10px] text-text-muted font-bold">Current: ₹{activeBooking.rent.toLocaleString()}</span>
              </label>
              <Input
                type="number"
                value={counterRent}
                onChange={(e) => setCounterRent(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Message to Tenant</label>
              <textarea
                placeholder="Write your counter terms or response message..."
                value={negotiationMessage}
                onChange={(e) => setNegotiationMessage(e.target.value)}
                rows={3}
                className="w-full bg-white text-black border border-gray-300 px-4 py-2.5 rounded-xl text-xs outline-none placeholder:text-gray-400 focus:border-brand-primary focus:ring-0 resize-none"                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={actionLoading}
              icon={Send}
            >
              Send Counter Offer
            </Button>

          </form>
        </Modal>
      )}

    </PageWrapper>
  );
}
