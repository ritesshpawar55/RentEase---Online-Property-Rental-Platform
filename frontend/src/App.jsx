import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useThemeStore } from './store/themeStore';

// Layouts
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/ScrollToTop';

// Router Guardian
import ProtectedRoute from './router/ProtectedRoute';

// Public Pages
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import OTPVerify from './pages/public/OTPVerify';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';
import SearchResults from './pages/public/SearchResults';
import PropertyDetail from './pages/public/PropertyDetail';
import NotFound from './pages/public/NotFound';

// Tenant Pages
import Wishlist from './pages/tenant/Wishlist';
import MyBookings from './pages/tenant/MyBookings';
import MyReviews from './pages/tenant/MyReviews';
import BookingConfirm from './pages/tenant/BookingConfirm';
import Profile from './pages/tenant/Profile';

// Landlord Pages
import Dashboard from './pages/landlord/Dashboard';
import ManageBookings from './pages/landlord/ManageBookings';
import AddEditProperty from './pages/landlord/AddEditProperty';

// Admin Page
import AdminDashboard from './pages/admin/AdminDashboard';

function AnimatedAppRoutes() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-text-primary font-sans">
      <ScrollToTop />
      <Navbar />
      
      {/* Route transitions */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/otp-verify" element={<OTPVerify />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />

          {/* Tenant Routes */}
          <Route 
            path="/tenant/wishlist" 
            element={
              <ProtectedRoute allowedRoles={['TENANT']}>
                <Wishlist />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tenant/bookings" 
            element={
              <ProtectedRoute allowedRoles={['TENANT']}>
                <MyBookings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tenant/reviews" 
            element={
              <ProtectedRoute allowedRoles={['TENANT']}>
                <MyReviews />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tenant/confirm-booking/:id" 
            element={
              <ProtectedRoute allowedRoles={['TENANT']}>
                <BookingConfirm />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/tenant/profile"
            element={
              <ProtectedRoute allowedRoles={['TENANT', 'LANDLORD']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Landlord Routes */}
          <Route 
            path="/landlord/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['LANDLORD']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/landlord/bookings" 
            element={
              <ProtectedRoute allowedRoles={['LANDLORD']}>
                <ManageBookings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/landlord/add-property" 
            element={
              <ProtectedRoute allowedRoles={['LANDLORD']}>
                <AddEditProperty />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/landlord/edit-property/:id" 
            element={
              <ProtectedRoute allowedRoles={['LANDLORD']}>
                <AddEditProperty />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>

      <Footer />
    </div>
  );
}

export default function App() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Router>
      <AnimatedAppRoutes />
      
      {/* Toast Notification Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'glass-card border border-white/10 bg-surface-overlay/95 backdrop-blur-md text-text-primary',
          style: {
            borderRadius: '14px',
            color: '#F0F0FF',
            background: 'var(--color-surface-overlay)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '13px',
            padding: '12px 18px',
          },
        }}
      />
    </Router>
  );
}