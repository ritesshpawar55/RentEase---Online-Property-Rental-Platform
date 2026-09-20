import React, { useEffect, useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { adminAPI, healthAPI, propertyAPI } from '../../lib/apiCalls';
import { 
  Shield, Users, Home, Calendar, Trash2, ShieldCheck, 
  UserMinus, Ban, LayoutGrid, CheckCircle2, Search, 
  Activity, Server, Cpu, MapPin, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // System Health States
  const [springHealth, setSpringHealth] = useState(null);
  const [mlHealth, setMlHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const loadAdminData = async () => {
  setLoading(true);
  try {
    const statsData = await adminAPI.getStats();
    setStats(statsData);

    const usersData = await adminAPI.getUsers(roleFilter || null);
    setUsersList(usersData);

    // Use city filter to avoid empty param 400 error
    // Fetch properties with explicit params
    const props = await propertyAPI.getAll({
      page: 0,
      size: 50,
      sortBy: 'newest'
    });
    const propsArr = Array.isArray(props) ? props : [];
    setProperties(propsArr);

  } catch (err) {
    toast.error('Failed to load system metrics.');
  } finally {
    setLoading(false);
  }
};

  const loadHealthStatus = async () => {
    setHealthLoading(true);
    try {
      const [sbRes, mlRes] = await Promise.all([
        healthAPI.getSpringBootHealth(),
        healthAPI.getFlaskMlHealth()
      ]);
      setSpringHealth(sbRes);
      setMlHealth(mlRes);
    } catch (e) {
      console.error('Health check failed:', e);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    loadHealthStatus();
  }, [roleFilter]);

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      const usersData = await adminAPI.getUsers(roleFilter || null);
      setUsersList(usersData);
      return;
    }
    try {
      const results = await adminAPI.searchUsers(searchQuery.trim());
      setUsersList(results);
    } catch (err) {
      toast.error('User search failed.');
    }
  };

  // Optimistic User Status Toggle with Rollback
  const handleUserStatusChange = async (usr) => {
    const originalStatus = usr.enabled;
    const newEnabled = !usr.enabled;

    // Optimistic UI update
    setUsersList(prev => prev.map(u => u.id === usr.id ? { ...u, enabled: newEnabled } : u));
    
    try {
      await adminAPI.toggleUserStatus(usr.id);
      toast.success(`User ${usr.name} ${newEnabled ? 'activated' : 'suspended'}!`);
    } catch (err) {
      // Rollback on failure
      setUsersList(prev => prev.map(u => u.id === usr.id ? { ...u, enabled: originalStatus } : u));
      toast.error(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  // Optimistic Property Suspension with Rollback
  const handleSuspendProperty = async (propId) => {
    const reason = window.prompt('Enter suspension reason for this property:', 'Violated platform policies');
    if (reason === null) return;

    const originalProps = [...properties];
    // Optimistic removal
    setProperties(prev => prev.filter(p => p.id !== propId));

    try {
      await adminAPI.suspendProperty(propId, reason);
      toast.success('Property suspended successfully.');
      loadAdminData();
    } catch (err) {
      // Rollback
      setProperties(originalProps);
      toast.error(err.response?.data?.message || 'Could not suspend property.');
    }
  };

  if (loading) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="relative min-h-screen px-4 md:px-8">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-base via-[#090914] to-[#07070E] z-0 pointer-events-none">
        <div className="absolute top-10 left-1/3 w-[450px] h-[450px] bg-brand-primary/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col space-y-6 pt-6 text-left">
        
        {/* Title */}
        <div>
          <Badge variant="danger" className="mb-2">Security Console</Badge>
          <h2 className="font-display font-bold text-2xl md:text-4xl text-text-primary flex items-center gap-2">
            <Shield className="text-[#ef4444]" />
            RentEase Admin Panel
          </h2>
          <p className="text-xs md:text-sm text-text-secondary mt-1">
            Moderate registered accounts, review properties compliance, and audit payments.
          </p>
        </div>

        {/* System Health & Microservices Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="p-5 bg-surface-raised/40 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server size={16} className="text-brand-primary" />
                <span className="text-xs font-bold text-text-primary">Spring Boot Core</span>
              </div>
              <Badge variant={springHealth?.status === 'UP' ? 'success' : 'danger'}>
                {springHealth?.status || 'CHECKING'}
              </Badge>
            </div>
            <p className="text-[10px] text-text-muted">Main REST Backend API & Database Service</p>
          </Card>

          <Card className="p-5 bg-surface-raised/40 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu size={16} className="text-brand-secondary" />
                <span className="text-xs font-bold text-text-primary">Flask ML Service</span>
              </div>
              <Badge variant={mlHealth?.status === 'UP' ? 'success' : 'danger'}>
                {mlHealth?.status || 'CHECKING'}
              </Badge>
            </div>
            <p className="text-[10px] text-text-muted">Rent Valuation & Forecast Prediction Index</p>
          </Card>

          <Card className="p-5 bg-surface-raised/40 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="text-brand-accent" />
                <span className="text-xs font-bold text-text-primary">Supported Cities</span>
              </div>
              <span className="text-xs font-mono font-bold text-brand-accent">
                {stats?.listingsByCity ? stats.listingsByCity.length : 4} Active
              </span>
            </div>
            <p className="text-[10px] text-text-muted truncate">
              {stats?.listingsByCity ? stats.listingsByCity.map(c => c.city).join(', ') : 'Mumbai, Pune, Bengaluru, Delhi'}
            </p>
          </Card>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="p-5 bg-surface-raised/40 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total Users</p>
                <h3 className="font-display font-bold text-2xl text-text-primary mt-1">{stats.totalUsers}</h3>
              </div>
              <div className="p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-accent">
                <Users size={20} />
              </div>
            </Card>

            <Card className="p-5 bg-surface-raised/40 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Landlords</p>
                <h3 className="font-display font-bold text-2xl text-brand-secondary mt-1">{stats.totalLandlords || stats.landlords || 0}</h3>
              </div>
              <div className="p-3 rounded-xl bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary">
                <ShieldCheck size={20} />
              </div>
            </Card>

            <Card className="p-5 bg-surface-raised/40 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Live Listings</p>
                <h3 className="font-display font-bold text-2xl text-text-primary mt-1">{stats.activeProperties || stats.totalProperties || 0}</h3>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-text-secondary">
                <Home size={20} />
              </div>
            </Card>

            <Card className="p-5 bg-surface-raised/40 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total Bookings</p>
                <h3 className="font-display font-bold text-2xl text-success mt-1">{stats.totalBookings || stats.bookings || 0}</h3>
              </div>
              <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-success">
                <Calendar size={20} />
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* User Accounts Moderation */}
          <Card className="p-6 bg-surface-raised/40 border border-white/5 text-left space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
              <h3 className="font-display font-bold text-sm text-text-primary flex items-center gap-1.5">
                <Users size={16} className="text-brand-primary" />
                User Accounts Moderation ({usersList.length})
              </h3>
              
              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-surface-raised text-xs text-text-secondary border border-white/5 rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-primary"
              >
                <option value="">All Roles</option>
                <option value="TENANT">Tenants</option>
                <option value="LANDLORD">Landlords</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchUsers} className="flex gap-2">
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-surface-raised border border-white/5 px-3 py-1.5 rounded-lg text-xs outline-none focus:border-brand-primary text-text-primary"
              />
              <Button type="submit" variant="primary" size="sm" icon={Search}>
                Search
              </Button>
            </form>

            <div className="overflow-x-auto max-h-80 overflow-y-auto custom-scrollbar">
              <table className="w-full text-xs text-text-secondary">
                <thead>
                  <tr className="border-b border-white/5 text-text-muted uppercase font-bold tracking-wide sticky top-0 bg-surface-raised z-10">
                    <th className="py-2 text-left">User Name</th>
                    <th className="py-2 text-center">Role</th>
                    <th className="py-2 text-center">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((usr) => {
                    const isEnabled = usr.enabled !== undefined ? usr.enabled : (usr.status === 'ACTIVE');

                    return (
                      <tr key={usr.id} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                        <td className="py-3 text-left">
                          <div>
                            <p className="font-semibold text-text-primary">{usr.name}</p>
                            <p className="text-[10px] text-text-muted mt-0.5">{usr.email}</p>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant={usr.role === 'LANDLORD' ? 'secondary' : usr.role === 'ADMIN' ? 'accent' : 'info'}>
                            {usr.role}
                          </Badge>
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant={isEnabled ? 'success' : 'danger'}>
                            {isEnabled ? 'ACTIVE' : 'SUSPENDED'}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {usr.role !== 'ADMIN' && (
                              <button
                                onClick={() => handleUserStatusChange(usr)}
                                className={`p-1.5 rounded border transition-colors ${
                                  isEnabled
                                    ? 'bg-white/5 text-text-secondary hover:text-red-400 hover:bg-red-500/10 border-white/5'
                                    : 'bg-white/5 text-text-secondary hover:text-[#22c55e] hover:bg-[#22c55e]/10 border-white/5'
                                }`}
                                title={isEnabled ? 'Suspend account' : 'Activate account'}
                              >
                                {isEnabled ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Property Listings Moderation */}
          <Card className="p-6 bg-surface-raised/40 border border-white/5 text-left space-y-4">
            <h3 className="font-display font-bold text-sm text-text-primary flex items-center gap-1.5 border-b border-white/5 pb-3">
              <LayoutGrid size={16} className="text-brand-secondary" />
              Property Listings Auditing ({properties.length})
            </h3>

            <div className="overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">
              <table className="w-full text-xs text-text-secondary">
                <thead>
                  <tr className="border-b border-white/5 text-text-muted uppercase font-bold tracking-wide sticky top-0 bg-surface-raised z-10">
                    <th className="py-2 text-left">Property</th>
                    <th className="py-2 text-right">Rent</th>
                    <th className="py-2 text-center">Status</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.filter(p => p.status !== 'DELETED').map((prop) => (
                    <tr key={prop.id} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                      <td className="py-3 text-left">
                        <div>
                          <p className="font-semibold text-text-primary line-clamp-1">{prop.title}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{prop.locality}, {prop.city}</p>
                        </div>
                      </td>
                      <td className="py-3 text-right font-semibold font-mono text-text-primary">₹{prop.rent.toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <Badge variant={prop.status === 'SUSPENDED' ? 'danger' : 'success'}>
                          {prop.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleSuspendProperty(prop.id)}
                          className="p-1.5 rounded bg-white/5 text-text-secondary hover:text-red-400 hover:bg-red-500/10 border border-white/5"
                          title="Suspend Property Listing"
                        >
                          <Ban size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
      </div>
    </PageWrapper>
  );
}
