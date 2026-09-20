import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { 
  Search, MapPin, Sparkles, Send, ShieldCheck, 
  Users, TrendingUp, HelpCircle 
} from 'lucide-react';

// Local city images (src/assets/cities/)
import hyderabadImg from '../../assets/cities/hyderabadImg.png';
import mumbaiImg from '../../assets/cities/mumbaiImg.png';
import bangaloreImg from '../../assets/cities/bangaloreImg.png';
import delhiImg from '../../assets/cities/delhiImg.png';
import puneImg from '../../assets/cities/puneImg.png';
import chennaiImg from '../../assets/cities/chennaiImg.png';

const mockCities = [
  { name: 'Hyderabad', image: hyderabadImg, count: '2.4k+' },
  { name: 'Mumbai',    image: mumbaiImg,    count: '3.1k+' },
  { name: 'Bangalore', image: bangaloreImg, count: '2.8k+' },
  { name: 'Delhi',     image: delhiImg,     count: '1.9k+' },
  { name: 'Pune',      image: puneImg,      count: '1.5k+' },
  { name: 'Chennai',   image: chennaiImg,   count: '1.8k+' }
];

const mockPlatformStats = {
  listings: '12k+',
  tenants: '45k+',
  landlords: '8k+',
  cities: '15+'
};

export default function Landing() {
  const navigate = useNavigate();
  const [city, setCity] = useState('Hyderabad');
  const [bhk, setBhk] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (bhk) params.set('bhk', bhk);
    if (searchQuery) params.set('search', searchQuery);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <PageWrapper className="relative overflow-x-hidden min-h-screen">

      {/* Hero Content Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-12 md:pt-20 pb-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 shadow-sm">
          <Sparkles size={14} className="text-brand-accent animate-bounce" />
          <span className="text-xs font-semibold text-text-secondary">AI-Optimized Rental Ecosystem</span>
        </div>

        <h1 className="font-display font-bold text-4xl md:text-7xl leading-tight tracking-tight text-text-primary max-w-4xl mb-6">
          Find Your Next Home <br />
          Backed by <span className="bg-gradient-to-r from-brand-accent via-brand-primary to-brand-secondary bg-clip-text text-transparent drop-shadow-md">AI Valuation</span>
        </h1>

        <p className="font-sans text-sm md:text-lg text-text-secondary max-w-2xl mb-10 leading-relaxed">
          Skip the guesswork. RentEase combines live property matches, instant real-time updates, and an ML prediction engine to estimate fair rent ranges.
        </p>

        {/* Dynamic Search Widget */}
        <form 
          onSubmit={handleSearch}
          className="w-full max-w-4xl p-2 bg-surface-raised/60 backdrop-blur-md border border-white/10 rounded-2xl md:rounded-full shadow-2xl flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-0"
        >
          {/* City Selection */}
          <div className="flex-1 flex items-center px-4 py-2 border-b md:border-b-0 md:border-r border-white/5">
            <MapPin className="text-brand-accent mr-3 flex-shrink-0" size={18} />
            <div className="text-left w-full">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">City</label>
              <input
                type="text"
                placeholder="Type a city name..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-transparent text-text-primary landing-search-input text-sm font-semibold border-none outline-none focus:ring-0 mt-0.5"
              />
            </div>
          </div>

          {/* BHK Selection */}
          <div className="flex-1 flex items-center px-4 py-2 border-b md:border-b-0 md:border-r border-white/5">
            <Users className="text-text-secondary mr-3 flex-shrink-0" size={18} />
            <div className="text-left w-full">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">Configuration</label>
              <select
                value={bhk}
                onChange={(e) => setBhk(e.target.value)}
                className="w-full bg-transparent text-text-primary landing-search-input text-sm font-semibold border-none outline-none focus:ring-0 mt-0.5 cursor-pointer"
              >
                <option value="" className="bg-surface-overlay text-text-secondary">Any BHK</option>
                <option value="1" className="bg-surface-overlay text-text-primary">1 BHK</option>
                <option value="2" className="bg-surface-overlay text-text-primary">2 BHK</option>
                <option value="3" className="bg-surface-overlay text-text-primary">3 BHK</option>
              </select>
            </div>
          </div>

          {/* Search Query Input */}
          <div className="flex-[1.5] flex items-center px-4 py-2">
            <Search className="text-text-muted mr-3 flex-shrink-0" size={18} />
            <div className="text-left w-full">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">Locality or Keyword</label>
              <input
                type="text"
                placeholder="e.g. Banjara Hills, Bandra West..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-text-primary landing-search-input placeholder:text-text-muted text-sm font-semibold border-none outline-none focus:ring-0 mt-0.5"
              />
            </div>
          </div>

          {/* Search Submit Button */}
          <div className="p-1 md:pr-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full md:w-auto rounded-xl md:rounded-full px-8 py-3.5 shadow-lg shadow-brand-primary/30"
              icon={Search}
            >
              Search
            </Button>
          </div>
        </form>

        {/* Platform Stat Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 w-full max-w-5xl mt-24">
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center backdrop-blur-sm">
            <h3 className="font-display font-bold text-3xl md:text-5xl text-brand-accent tracking-tight">{mockPlatformStats.listings}</h3>
            <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mt-2">Active Listings</p>
          </div>
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center backdrop-blur-sm">
            <h3 className="font-display font-bold text-3xl md:text-5xl text-brand-primary tracking-tight">{mockPlatformStats.tenants}</h3>
            <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mt-2">Happy Tenants</p>
          </div>
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center backdrop-blur-sm">
            <h3 className="font-display font-bold text-3xl md:text-5xl text-brand-secondary tracking-tight">{mockPlatformStats.landlords}</h3>
            <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mt-2">Landlords registered</p>
          </div>
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center backdrop-blur-sm">
            <h3 className="font-display font-bold text-3xl md:text-5xl text-text-primary tracking-tight">{mockPlatformStats.cities}</h3>
            <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mt-2">Active Cities</p>
          </div>
        </div>
      </section>

      {/* Featured Cities Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
          <div>
            <Badge variant="accent" className="mb-2">Discovery</Badge>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-text-primary">
              Explore Popular Cities
            </h2>
          </div>
          <p className="text-text-secondary text-sm max-w-md mt-4 md:mt-0">
            Browse through hundreds of properties verified and monitored on our AI-assisted rent forecasting database.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {mockCities.map((c) => (
            <Card
              key={c.name}
              onClick={() => navigate(`/search?city=${c.name}`)}
              className="group overflow-hidden rounded-2xl cursor-pointer p-0 relative h-64 border border-white/5 bg-black"
            >
              <div className="w-full h-full flex items-center justify-center ">
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-48 h-52 object-cover rounded-xl group-hover:scale-110 transition-transform duration-500 ease-out "
                />
              </div>

                            

              {/* Content Overlay – name fades from dim to bright white on hover */}
              <div className="absolute inset-0 p-4 flex flex-col justify-end items-center text-center">
                
              <h4
                className="font-display font-bold text-xl tracking-tight
                          text-white
                          transform translate-y-2 group-hover:translate-y-0
                          transition-all duration-500 ease-out
                          drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
              >
                {c.name}
              </h4>

              <p
                className="text-xs text-white/90 font-semibold tracking-wider uppercase mt-1
                          opacity-80 group-hover:opacity-100
                          transform translate-y-2 group-hover:translate-y-0
                          transition-all duration-500 delay-100 ease-out"
              >
                {c.count} Listings
              </p>
            </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Core Selling Points Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="primary" className="mb-2">How It Works</Badge>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-text-primary">
            A Better Way to Rent
          </h2>
          <p className="text-text-secondary text-sm mt-3">
            Say goodbye to overpriced listings and long manual phone discussions. Experience seamless digital real estate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: AI Price Badges */}
          <Card className="flex flex-col text-left space-y-4 p-8 bg-surface-raised/40">
            <div className="w-12 h-12 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
              <Sparkles size={20} />
            </div>
            <h3 className="font-display font-bold text-xl text-text-primary">
              AI Fair Rent Badge
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Every listing is evaluated by our Random Forest model to calculate a fair pricing range. Visual badges highlight premium values and fair deals.
            </p>
          </Card>

          {/* Card 2: SSE Live updates */}
          <Card className="flex flex-col text-left space-y-4 p-8 bg-surface-raised/40">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-display font-bold text-xl text-text-primary">
              Real-time SSE Streams
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Experience zero delay. Landlord listings are broadcasted instantly to tenant search feeds via Server-Sent Events—no refreshes needed.
            </p>
          </Card>

          {/* Card 3: Counter-Offer Negotiation */}
          <Card className="flex flex-col text-left space-y-4 p-8 bg-surface-raised/40">
            <div className="w-12 h-12 rounded-xl bg-brand-secondary/10 border border-brand-secondary/20 flex items-center justify-center text-brand-secondary">
              <Send size={20} />
            </div>
            <h3 className="font-display font-bold text-xl text-text-primary">
              Direct Price Negotiation
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Submit counter-pricing during application. Landlords can review and reply with customized counter-offers directly inside the app.
            </p>
          </Card>
        </div>
      </section>
    </PageWrapper>
  );
}