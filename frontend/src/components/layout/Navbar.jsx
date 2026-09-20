import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useThemeStore } from '../../store/themeStore';
import { 
  Menu, X, Home, Heart, Calendar, LayoutDashboard, PlusCircle, 
  LogOut, User, Shield, Search, Sun, Moon, Star
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const wishlistItems = useWishlistStore((state) => state.items);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  // Nav links based on role
  const getNavLinks = () => {
    if (!isAuthenticated) {
      return [
        { label: 'Search', path: '/search', icon: Search },
      ];
    }

    if (user?.role === 'ADMIN') {
      return [
        { label: 'Admin Panel', path: '/admin', icon: Shield },
      ];
    }

    if (user?.role === 'LANDLORD') {
      return [
        { label: 'Dashboard', path: '/landlord/dashboard', icon: LayoutDashboard },
        { label: 'Manage Bookings', path: '/landlord/bookings', icon: Calendar },
        { label: 'Add Property', path: '/landlord/add-property', icon: PlusCircle },
        { label: 'Profile', path: '/tenant/profile', icon: User },  // ← ADD THIS
      ];
    }

    // Default TENANT
    return [
      { label: 'Explore', path: '/search', icon: Search },
      { label: 'My Bookings', path: '/tenant/bookings', icon: Calendar },
      { label: 'My Reviews', path: '/tenant/reviews', icon: Star },
      { 
        label: 'Wishlist', 
        path: '/tenant/wishlist', 
        icon: Heart,
        badge: wishlistItems.length > 0 ? wishlistItems.length : null 
      },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4 md:px-8">
      {/* Container with Glassmorphism */}
      <div className="max-w-7xl mx-auto glass-card flex items-center justify-between px-6 py-3 border border-white/10 bg-[var(--nav-bg)]/95 backdrop-blur-md rounded-2xl shadow-xl">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center font-display font-bold text-xl text-white shadow-lg shadow-brand-primary/30 group-hover:scale-105 transition-transform duration-300">
            RE
          </div>
          <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent group-hover:text-white/80 transition-colors duration-300">
            RentEase
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 rounded-xl flex items-center space-x-1.5 font-sans font-medium text-sm transition-all duration-300 ${
                  active 
                    ? 'text-white bg-white/10 border border-white/15' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} className={active ? 'text-white' : 'text-white/70'} />
                <span>{link.label}</span>
                {link.badge !== undefined && link.badge !== null && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-secondary text-text-primary text-[10px] font-bold shadow-md shadow-brand-secondary/30">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User Account Section */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="px-3.5 py-2 rounded-xl bg-white text-[#273338] hover:bg-white/90 text-xs font-bold flex items-center gap-2 transition-all duration-300 shadow-sm"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <>
                <Moon size={14} className="text-text-muted" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun size={14} className="text-brand-primary" />
                <span>Light</span>
              </>
            )}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <Link 
                to="/tenant/profile"
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-brand-primary/20 border border-brand-primary/50 flex items-center justify-center text-brand-accent text-sm font-semibold">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="text-left leading-none">
                  <p className="text-xs font-semibold text-text-primary">{user?.name}</p>
                  <p className="text-[10px] text-text-secondary font-mono tracking-wide mt-0.5">{user?.role}</p>
                </div>
              </Link>
              
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-text-secondary hover:text-red-400 transition-all duration-300"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-text-primary bg-brand-primary hover:bg-brand-primary/90 border border-brand-primary/20 hover:scale-[1.02] active:scale-95 shadow-md shadow-brand-primary/20 rounded-xl transition-all duration-200"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="md:hidden flex items-center space-x-2">
          {isAuthenticated && user?.role === 'TENANT' && (
            <Link 
              to="/tenant/wishlist" 
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-text-secondary relative"
            >
              <Heart size={18} />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-secondary text-text-primary text-[9px] font-bold flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
          )}
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-text-secondary hover:text-text-primary"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 max-w-7xl mx-auto glass-card border border-white/10 bg-surface-overlay/95 backdrop-blur-lg rounded-2xl shadow-2xl p-4 transition-all duration-300">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-xl font-medium text-sm ${
                    isActive(link.path)
                      ? 'bg-brand-primary/10 text-text-primary border-l-2 border-brand-accent pl-2'
                      : 'text-text-secondary hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={18} />
                    <span>{link.label}</span>
                  </div>
                  {link.badge !== undefined && link.badge !== null && (
                    <span className="w-5 h-5 rounded-full bg-brand-secondary text-text-primary text-[10px] font-bold flex items-center justify-center">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Mobile Theme Toggle Button */}
            <button 
              onClick={() => {
                toggleTheme();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-between p-3 rounded-xl font-medium text-sm text-text-secondary hover:bg-white/5 text-left"
            >
              <div className="flex items-center space-x-3">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                <span>{theme === 'light' ? 'Dark Theme' : 'Light Theme'}</span>
              </div>
            </button>

            <hr className="border-white/5 my-2" />

            {isAuthenticated ? (
              <div className="flex flex-col space-y-3 pt-2">
                <div className="flex items-center space-x-3 px-3">
                  <div className="w-10 h-10 rounded-full bg-brand-primary/20 border border-brand-primary/50 flex items-center justify-center text-brand-accent font-semibold text-lg">
                    {user?.name ? user.name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{user?.name}</h4>
                    <p className="text-xs text-text-secondary font-mono">{user?.role}</p>
                  </div>
                </div>
                
                {(user?.role === 'TENANT' || user?.role === 'LANDLORD') && (
                  <Link to="/tenant/profile" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 p-3 rounded-xl text-text-secondary hover:bg-white/5 text-sm font-medium"
                  >
                    <User size={18} />
                    <span>Edit Profile</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10 text-sm font-medium text-left"
                >
                  <LogOut size={18} />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 text-center text-sm font-medium text-text-secondary hover:text-text-primary border border-white/5 hover:border-white/10 rounded-xl bg-white/5"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 text-center text-sm font-semibold text-text-primary bg-brand-primary rounded-xl"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
