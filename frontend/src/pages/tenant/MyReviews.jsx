import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { reviewAPI } from '../../lib/apiCalls';
import { 
  Star, Edit2, Trash2, Calendar, MapPin, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyReviews() {
  const navigate = useNavigate();
  
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editModal, setEditModal] = useState({ isOpen: false, data: null, submitting: false });
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  const fetchMyReviews = async () => {
    setLoading(true);
    try {
      const data = await reviewAPI.getMyReviews();
      setReviews(data);
    } catch (err) {
      toast.error('Failed to load your reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReviews();
  }, []);

  const handleEditClick = (review) => {
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditModal({ isOpen: true, data: review, submitting: false });
  };

  const handleUpdateReview = async () => {
    if (!editComment.trim()) {
      toast.error('Review comment cannot be empty.');
      return;
    }
    setEditModal(prev => ({ ...prev, submitting: true }));
    try {
      await reviewAPI.update(editModal.data.id, {
        propertyId: editModal.data.propertyId,
        rating: editRating,
        comment: editComment
      });
      toast.success('Review updated successfully.');
      setEditModal({ isOpen: false, data: null, submitting: false });
      fetchMyReviews();
    } catch (err) {
      toast.error('Failed to update review.');
      setEditModal(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewAPI.delete(reviewId);
      toast.success('Review deleted.');
      fetchMyReviews();
    } catch (err) {
      toast.error('Failed to delete review.');
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
          <Badge variant="primary" className="mb-2">Feedback</Badge>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-text-primary">
            My Reviews
          </h2>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Manage your feedback and ratings for properties you've rented.
          </p>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            title="No Reviews Yet"
            description="You have not left any property reviews yet."
            actionText="Browse Listings"
            onActionClick={() => navigate('/search')}
          />
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <Card 
                key={review.id}
                className="p-6 bg-surface-raised/40 border border-white/5 space-y-4 hover:border-white/10 transition-colors"
                enableTilt={false}
              >
                
                {/* Top info row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
                  <div className="flex gap-4 items-center">
                    <div>
                      <h3 className="font-display font-bold text-base text-text-primary group-hover:text-brand-accent transition-colors flex items-center gap-2">
                        {review.propertyTitle || 'Property Listing'}
                      </h3>
                      <p className="text-xs text-text-secondary font-semibold mt-1 flex items-center gap-1">
                        <Calendar size={12} />
                        Reviewed on: <span className="font-mono">{new Date(review.createdAt || Date.now()).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      icon={Edit2}
                      onClick={() => handleEditClick(review)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      icon={Trash2}
                      onClick={() => handleDeleteReview(review.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="pt-2 flex flex-col space-y-3 text-left">
                  <div className="flex items-center gap-1 text-brand-accent">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        size={16} 
                        className={star <= review.rating ? "fill-brand-accent text-brand-accent" : "text-white/20"} 
                      />
                    ))}
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    "{review.comment}"
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Review Modal */}
{editModal.isOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <Card
      className="w-full max-w-md p-6 bg-[#0B0B14] border border-white/10 space-y-6"
      onMouseMove={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <h3 className="font-display font-bold text-lg text-text-primary flex items-center gap-2">
          <Edit2 size={20} className="text-brand-accent" />
          Edit Review
        </h3>
        <button
          onClick={() => setEditModal({ isOpen: false, data: null, submitting: false })}
          className="text-text-muted hover:text-text-primary transition"
          disabled={editModal.submitting}
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4 text-left">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-secondary">Rating</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setEditRating(star)}
                className="focus:outline-none transition-transform"
              >
                <Star
                  size={24}
                  className={star <= editRating ? "fill-brand-accent text-brand-accent" : "text-white/20"}
                />
              </button>
            ))}
          </div>
        </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary">Comment</label>
                <textarea
                  className="w-full bg-white border border-white/10 rounded-xl p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-primary outline-none transition"
                  rows={4}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Share your experience..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setEditModal({ isOpen: false, data: null, submitting: false })}
                  disabled={editModal.submitting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  className="flex-1"
                  onClick={handleUpdateReview}
                  loading={editModal.submitting}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

    </PageWrapper>
  );
}
