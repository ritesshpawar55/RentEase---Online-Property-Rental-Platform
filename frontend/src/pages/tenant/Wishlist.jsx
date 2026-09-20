import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useWishlistStore } from '../../store/wishlistStore';
import { Heart, MapPin, BedDouble, Maximize2, Sofa, Trash2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const navigate = useNavigate();
  
  const wishlist = useWishlistStore((state) => state.items);
  const loading = useWishlistStore((state) => state.loading);
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = (e, propId) => {
    e.stopPropagation();
    removeFromWishlist(propId);
    toast.success('Removed from wishlist');
  };

  return (
    <PageWrapper className="relative min-h-screen px-4 md:px-8">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-base via-[#090914] to-[#07070E] z-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-brand-primary/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col space-y-6 pt-6 text-left">
        <div>
          <Badge variant="primary" className="mb-2">Favorites</Badge>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-text-primary">
            Saved Properties
          </h2>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Keep track of homes you like and compare configurations or AI valuations.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : wishlist.length === 0 ? (
          <EmptyState
            title="Wishlist is Empty"
            description="Explore our listings catalog and click the heart icon on any listing to save them here."
            actionText="Find Properties"
            onActionClick={() => navigate('/search')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {wishlist.map((prop) => (
              <Card
                key={prop.id}
                onClick={() => navigate(`/properties/${prop.id}`)}
                className="flex flex-col relative overflow-hidden group border border-white/5 hover:border-white/10 p-0 text-left bg-surface-raised/20 hover:scale-[1.01]"
              >
                {/* Visual Image */}
                <div className="w-full h-44 relative overflow-hidden">
                  <img
                    src={prop.imageUrls ? prop.imageUrls[0] : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'}
                    alt={prop.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

                  {/* Remove CTA */}
                  <button
                    onClick={(e) => handleRemove(e, prop.id)}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/40 hover:bg-red-500/20 text-text-primary hover:text-red-400 border border-white/10 backdrop-blur-sm transition-all"
                    title="Remove from Saved"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="absolute bottom-3 left-4">
                    <p className="text-lg font-display font-bold text-text-primary">
                      ₹{prop.rent?.toLocaleString() ?? "0"}/mo
                    </p>
                  </div>
                </div>

                {/* Info details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-semibold text-sm text-text-primary line-clamp-1 group-hover:text-brand-accent transition-colors">
                      {prop.title}
                    </h4>
                    
                    <div className="flex items-center text-text-secondary text-[11px] mt-1 space-x-1">
                      <MapPin size={10} className="text-text-muted" />
                      <span>{prop.locality}, {prop.city}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/5 my-4"></div>

                  {/* Row specs */}
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span className="flex items-center gap-1.5"><BedDouble size={14} className="text-text-muted" />{prop.bhk} BHK</span>
                    <span className="flex items-center gap-1.5"><Maximize2 size={14} className="text-text-muted" />{prop.sqft} sqft</span>
                    <span className="flex items-center gap-1.5">
  <Sofa size={14} className="text-text-muted" />
  {prop.furnished?.split("-")[0] ?? "N/A"}
</span>
                  </div>
                </div>

              </Card>
            ))}
          </div>
        )}

      </div>
    </PageWrapper>
  );
}
