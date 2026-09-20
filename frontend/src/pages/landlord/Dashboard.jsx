import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { analyticsAPI, propertyAPI } from '../../lib/apiCalls';
import { 
  PlusCircle, Calendar, Home, IndianRupee, Users, 
  Trash2, Edit, TrendingUp, Sparkles, LayoutGrid, ListCollapse 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load landlord stats
      const statsData = await analyticsAPI.getLandlordStats();
      setStats(statsData);

      // Load properties owned by this landlord
      const landlordProps = await propertyAPI.getMyListings();
      setProperties(landlordProps);
    } catch (err) {
      toast.error('Could not load landlord metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleDeleteProperty = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this listing?')) return;
    
    try {
      await propertyAPI.delete(id);
      toast.success('Listing deleted successfully');
      loadDashboardData();
    } catch (err) {
      toast.error('Could not delete listing.');
    }
  };

  if (loading) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </PageWrapper>
    );
  }

  // Create revenue chart data based on properties
  const chartData = properties.map(p => ({
    name: p.title.split(' ')[0] || 'Room',
    Rent: p.rent,
  }));

  return (
    <PageWrapper className="relative min-h-screen px-4 md:px-8">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-base via-[#090914] to-[#07070E] z-0 pointer-events-none">
        <div className="absolute top-10 right-1/3 w-[450px] h-[450px] bg-brand-primary/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col space-y-6 pt-6 text-left">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Badge variant="secondary" className="mb-2">Landlord Desk</Badge>
            <h2 className="font-display font-bold text-2xl md:text-4xl text-text-primary">
              Landlord Dashboard
            </h2>
            <p className="text-xs md:text-sm text-text-secondary mt-1">
              Monitor active listings, rent collections, and booking applications.
            </p>
          </div>
          
          <Button
            onClick={() => navigate('/landlord/add-property')}
            variant="secondary"
            icon={PlusCircle}
          >
            List New Property
          </Button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="p-5 bg-surface-raised/40 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Active Listings</p>
                <h3 className="font-display font-bold text-2xl text-text-primary mt-1">{stats.activeListings ?? stats.totalListings ?? 0}</h3>
              </div>
              <div className="p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-accent">
                <Home size={20} />
              </div>
            </Card>

            <Card className="p-5 bg-surface-raised/40 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Pending Requests</p>
                <h3 className="font-display font-bold text-2xl text-brand-secondary mt-1">{stats.pendingRequests ?? 0}</h3>
              </div>
              <div className="p-3 rounded-xl bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary">
                <Calendar size={20} />
              </div>
            </Card>

            <Card className="p-5 bg-surface-raised/40 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Occupancy Rate</p>
                <h3 className="font-display font-bold text-2xl text-text-primary mt-1">
                  {stats.occupancyRate ? Math.round(stats.occupancyRate) : (stats.totalUnits > 0 ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100) : 0)}%
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-text-secondary">
                <Users size={20} />
              </div>
            </Card>

            <Card className="p-5 bg-surface-raised/40 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Monthly Potential</p>
                <h3 className="font-display font-bold text-2xl text-success mt-1">₹{(stats.totalMonthlyRentPotential || stats.monthlyRevenue || 0).toLocaleString()}</h3>
              </div>
              <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-success">
                <IndianRupee size={20} />
              </div>
            </Card>
          </div>
        )}

        {/* Charts & Listings row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Revenue Chart */}
          <Card className="lg:col-span-1 p-6 bg-surface-raised/40 border border-white/5 space-y-6">
            <h3 className="font-display font-bold text-sm text-text-primary flex items-center gap-1.5">
              <TrendingUp size={16} className="text-brand-accent animate-pulse" />
              Monthly Revenue Potentials
            </h3>

            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-text-muted">
                No active properties listed yet.
              </div>
            ) : (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="name" stroke="#9898B8" fontSize={9} />
                    <YAxis stroke="#9898B8" fontSize={9} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#12121F', border: '1px solid rgba(255,255,255,0.08)' }} 
                      labelStyle={{ color: '#F0F0FF' }}
                    />
                    <Bar dataKey="Rent" fill="#6C47FF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Listings Management */}
          <Card className="lg:col-span-2 p-6 bg-surface-raised/40 border border-white/5 space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-display font-bold text-sm text-text-primary flex items-center gap-1.5">
                <LayoutGrid size={16} className="text-brand-primary" />
                Active Property Listings ({properties.length})
              </h3>
              
              <Link 
                to="/landlord/bookings"
                className="text-xs text-brand-accent font-semibold hover:underline"
              >
                Manage Booking Inboxes
              </Link>
            </div>

            {properties.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-muted space-y-4">
                <p>You haven't listed any properties yet.</p>
                <Button
                  onClick={() => navigate('/landlord/add-property')}
                  variant="outline"
                  size="sm"
                >
                  Create First Listing
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-text-secondary select-none">
                  <thead>
                    <tr className="border-b border-white/5 text-text-muted font-bold uppercase tracking-wider">
                      <th className="py-3 text-left">Property Details</th>
                      <th className="py-3 text-center">BHK</th>
                      <th className="py-3 text-right">Rent</th>
                      <th className="py-3 text-center">Status</th>
                      <th className="py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((prop) => (
                      <tr 
                        key={prop.id}
                        onClick={() => navigate(`/properties/${prop.id}`)}
                        className="border-b border-white/[0.02] hover:bg-white/[0.01] cursor-pointer transition-colors"
                      >
                        <td className="py-4">
                          <div className="flex items-center space-x-3 text-left">
                            <img
                              src={
                                    (prop.images && prop.images.length > 0)
                                      ? prop.images[0]
                                      : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100'
                                  }
                              alt=""
                              className="w-10 h-8 object-cover rounded-md border border-white/5"
                            />
                            <div>
                              <p className="font-semibold text-text-primary line-clamp-1">{prop.title}</p>
                              <p className="text-[10px] text-text-muted mt-0.5">{prop.locality}, {prop.city}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center font-semibold text-text-primary">{prop.bhk} BHK</td>
                        <td className="py-4 text-right font-semibold text-text-primary">₹{prop.rent.toLocaleString()}</td>
                        <td className="py-4 text-center">
                          <Badge variant={prop.status === 'ACTIVE' ? 'success' 
       : prop.status === 'SUSPENDED' ? 'danger' 
       : 'info'}>
                            {prop.status}
                          </Badge>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/landlord/edit-property/${prop.id}`);
                              }}
                              className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-brand-primary/30 hover:text-brand-accent transition"
                              title="Edit listing details"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteProperty(e, prop.id)}
                              className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-red-500/30 hover:text-red-400 transition"
                              title="Delete Listing"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

        </div>
      </div>
    </PageWrapper>
  );
}
