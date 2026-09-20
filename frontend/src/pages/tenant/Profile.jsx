import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuthStore } from '../../store/authStore';
import { landlordAPI, bookingAPI, reviewAPI, wishlistAPI } from '../../lib/apiCalls';
import { 
  User, Mail, Phone, Lock, ShieldCheck, 
  Settings, Save, KeyRound 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuthStore();
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    totalListings: 0,
    pendingRequests: 0,
    totalRequests: 0,
    totalBookings: 0,
    wishlistCount: 0,
    reviewsWritten: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const isLandlord = user?.role === 'LANDLORD';

  // Fetch real stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        if (isLandlord) {
          // Landlord — get dashboard stats
          const data = await landlordAPI.getDashboard();
          setStats({
            totalListings: data.totalListings || 0,
            pendingRequests: data.pendingRequests || 0,
            totalRequests: data.totalRequests || 0,
          });
        } else {
          // Tenant — get bookings, wishlist, reviews in parallel
          const [bookings, reviews, wishlist] = await Promise.allSettled([
            bookingAPI.getTenantBookings(),
            reviewAPI.getMyReviews(),
            wishlistAPI.get(),
          ]);

          setStats({
            totalBookings: bookings.status === 'fulfilled'
              ? bookings.value.length : 0,
            reviewsWritten: reviews.status === 'fulfilled'
              ? reviews.value.length : 0,
            wishlistCount: wishlist.status === 'fulfilled'
              ? wishlist.value.length : 0,
          });
        }
      } catch (err) {
        console.error('Failed to load profile stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [isLandlord]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await updateProfile({ name, phone });
      toast.success('Profile details updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update details.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Confirm password does not match.');
      return;
    }
    setSecurityLoading(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Account password updated securely.');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update password.');
    } finally {
      setSecurityLoading(false);
    }
  };

  // Stat display config per role
  const statItems = isLandlord
    ? [
        { value: stats.totalListings, label: 'Listings' },
        { value: stats.pendingRequests, label: 'Pending' },
        { value: stats.totalRequests, label: 'Requests' },
      ]
    : [
        { value: stats.totalBookings, label: 'Applied' },
        { value: stats.wishlistCount, label: 'Wishlist' },
        { value: stats.reviewsWritten, label: 'Reviews' },
      ];

  return (
    <PageWrapper className="relative min-h-screen px-4 md:px-8">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-base via-[#090914] to-[#07070E] z-0 pointer-events-none">
        <div className="absolute bottom-20 left-1/4 w-[400px] h-[400px] bg-brand-primary/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col space-y-6 pt-6 text-left">
        <div>
          <Badge variant="primary" className="mb-2">Account Settings</Badge>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-text-primary">
            My Profile Dashboard
          </h2>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Manage your personal verification details, contact numbers, and security credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left panel */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="p-6 bg-surface-raised/40 border border-white/5 space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-brand-primary/20 border border-brand-primary/50 text-brand-accent text-xl font-bold flex items-center justify-center mx-auto shadow-md shadow-brand-primary/10">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>

              <div>
                <h3 className="font-display font-bold text-base text-text-primary">{user?.name}</h3>
                <p className="text-xs text-text-secondary mt-0.5">{user?.email}</p>
                <Badge variant="accent" className="mt-2 text-[9px]">{user?.role}</Badge>
              </div>

              {/* Real stats */}
              <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-5 text-center text-xs">
                {statItems.map((stat, i) => (
                  <div key={i}>
                    <p className="font-display font-bold text-brand-accent text-lg">
                      {statsLoading ? (
                        <span className="inline-block w-6 h-5 bg-white/10 rounded animate-pulse" />
                      ) : stat.value}
                    </p>
                    <p className="text-[9px] text-text-muted uppercase tracking-wider font-semibold mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="p-4 bg-success/5 border border-success/20 rounded-2xl flex items-start space-x-3 text-xs text-text-secondary">
              <ShieldCheck className="text-[#22c55e] mt-0.5 flex-shrink-0" size={16} />
              <div>
                <p className="font-semibold text-text-primary">Identity Verified</p>
                <p className="mt-0.5">
                  {isLandlord
                    ? 'Your email is verified. You can list properties on RentEase.'
                    : 'Your email identity is verified. Ready to apply for listings.'}
                </p>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 md:p-8 bg-surface-raised/40 border border-white/5 text-left">
              <div className="flex items-center space-x-2 border-b border-white/5 pb-4 mb-6">
                <Settings size={18} className="text-brand-primary" />
                <h3 className="font-display font-bold text-base text-text-primary">Personal Details</h3>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    type="text"
                    icon={User}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    icon={Phone}
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setPhone(val)
                    }}
                    required
                  />
                </div>

                <Input
                  label="Registered Email (Read-Only)"
                  type="email"
                  icon={Mail}
                  value={email}
                  disabled
                  className="!bg-white !text-black !border-gray-300 opacity-100 cursor-not-allowed"
                />

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={profileLoading}
                    icon={Save}
                  >
                    Save Details
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="p-6 md:p-8 bg-surface-raised/40 border border-white/5 text-left">
              <div className="flex items-center space-x-2 border-b border-white/5 pb-4 mb-6">
                <KeyRound size={18} className="text-brand-secondary" />
                <h3 className="font-display font-bold text-base text-text-primary">Security Settings</h3>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  icon={Lock}
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="New Password"
                    type="password"
                    icon={Lock}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    icon={Lock}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="secondary"
                    loading={securityLoading}
                    icon={Save}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}