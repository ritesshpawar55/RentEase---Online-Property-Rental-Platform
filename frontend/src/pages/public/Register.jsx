import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { 
  User, Mail, Phone, Lock, Sparkles, ArrowRight,
  ShieldCheck, Home
} from 'lucide-react';
import toast from 'react-hot-toast';

import { authAPI } from '../../lib/auth.api';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number (10 digits starting with 6-9)'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState('TENANT'); // TENANT or LANDLORD
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const result = registerSchema.safeParse({ name, email, phone, password });
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setFormErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register({ name, email, phone, password, role });
      setLoading(false);
      toast.success(response.message || 'OTP verification code sent to your email.');
      // Redirect to OTP verification screen with userId
      navigate(`/otp-verify?userId=${response.userId}&email=${encodeURIComponent(email)}&role=${role}`);
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <PageWrapper className="relative min-h-screen flex items-center justify-center py-16 px-4">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-base via-[#090915] to-[#07070F] z-0">
        <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-brand-primary/10 rounded-full blur-[110px] pointer-events-none"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="p-8 bg-surface-raised/50 backdrop-blur-lg border-white/10 shadow-elevated">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-secondary/10 border border-brand-secondary/30 mb-4">
              <Sparkles size={12} className="text-brand-secondary animate-pulse" />
              <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider">Join RentEase</span>
            </div>
            <h2 className="font-display font-bold text-2xl text-text-primary">
              Create Account
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Select your role profile type to register.
            </p>
          </div>

          {/* Role selector switches */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('TENANT')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 ${
                role === 'TENANT'
                  ? 'bg-brand-primary/10 border-brand-primary/80 text-brand-primary shadow-lg shadow-brand-primary/5'
                  : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10'
              }`}
            >
              <User size={18} className="mb-1" />
              <span className="text-xs font-bold uppercase tracking-wider">Tenant</span>
              <span className="text-[9px] text-text-muted mt-0.5">Looking to rent</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('LANDLORD')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 ${
                role === 'LANDLORD'
                  ? 'bg-brand-secondary/15 border-brand-secondary/80 text-brand-secondary shadow-lg shadow-brand-secondary/5'
                  : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10'
              }`}
            >
              <Home size={18} className="mb-1" />
              <span className="text-xs font-bold uppercase tracking-wider">Landlord</span>
              <span className="text-[9px] text-text-muted mt-0.5">Want to list rooms</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              icon={User}
              placeholder="e.g. Aditya Ingale"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={formErrors.name}
              required
            />

            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="e.g. aditya@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={formErrors.email}
              required
            />

            <Input
              label="Phone Number"
              type="tel"                        // ← change type from "text" to "tel"
              icon={Phone}
              placeholder="e.g. 9876543210"    // ← remove +91 from placeholder (confusing)
              value={phone}
              onChange={(e) => {
                // Only allow digits, max 10
                const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                setPhone(val)
              }}
              error={formErrors.phone}
              required
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={formErrors.password}
              required
            />

            <Button
              type="submit"
              variant={role === 'LANDLORD' ? 'secondary' : 'primary'}
              fullWidth
              loading={loading}
              className="mt-6"
              icon={ArrowRight}
              iconPosition="right"
            >
              Generate Verification Code
            </Button>
          </form>

          {/* Footer link */}
          <div className="mt-6 text-center text-xs text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-accent hover:underline font-semibold">
              Sign In Here
            </Link>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
