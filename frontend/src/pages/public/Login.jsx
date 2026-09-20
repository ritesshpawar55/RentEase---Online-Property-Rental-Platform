import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// Yes! Doing:
// const { register, handleSubmit, formState: { errors } } = useForm();
// and doing manual Zod parsing is extremely safe and doesn't require installing extra packages!
// Or even simpler: use regular react-hook-form validations, or manually parse inside handleSubmit.
// Let's implement manual Zod validation inside onSubmit, or use standard HTML5/react-hook-form rules.
// Let's use Zod schema and trigger setError manually or run safeParse.
// For example:
// const loginSchema = z.object({
//   email: z.string().email('Invalid email address'),
//   password: z.string().min(6, 'Password must be at least 6 characters')
// });
// In onSubmit: const result = loginSchema.safeParse(data); if (!result.success) { ... }
// This is extremely robust and avoids resolving package mismatches.
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { LogIn, Mail, Lock, ShieldAlert, Sparkles, User, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  
  const [formErrors, setFormErrors] = useState({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message;
      });
      setFormErrors(fieldErrors);
      return;
    }

    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      
      // Redirect based on role
      if (user.role === 'LANDLORD') {
        navigate('/landlord/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/search');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Login failed. Invalid credentials.');
    }
  };

  // Helper for quick logins
  const handleQuickLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password');
    
    try {
      const user = await login(demoEmail, 'password');
      toast.success(`Logged in as ${user.role}: ${user.name}`);
      
      if (user.role === 'LANDLORD') {
        navigate('/landlord/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/search');
      }
    } catch (err) {
      toast.error('Quick login failed.');
    }
  };

  return (
    <PageWrapper className="relative min-h-screen flex items-center justify-center py-16 px-4">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-base via-[#090915] to-[#07070F] z-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="p-8 bg-surface-raised/50 backdrop-blur-lg border-white/10 shadow-elevated">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/30 mb-4">
              <Sparkles size={12} className="text-brand-accent animate-pulse" />
              <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider">Access RentEase</span>
            </div>
            <h2 className="font-display font-bold text-2xl text-text-primary">
              Welcome Back
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Enter details below or select a quick access role profile.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
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

            <div className="space-y-2">
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
              <div className="flex justify-end">
                <Link 
                  to="/forgot-password" 
                  className="text-xs text-brand-accent hover:underline font-semibold"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="mt-6 shadow-md"
              icon={LogIn}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-8 border-t border-white/5 pt-6 text-left">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center">
              <ShieldAlert size={12} className="text-brand-secondary mr-1" />
              Quick Demo Access Profile Selection
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickLogin('aditya@email.com')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-brand-primary/10 border border-white/5 hover:border-brand-primary/30 transition-all text-center group"
              >
                <User size={16} className="text-brand-accent mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-text-primary">TENANT</span>
                <span className="text-[9px] text-text-muted mt-0.5 font-mono">Aditya</span>
              </button>
              
              <button
                onClick={() => handleQuickLogin('ravi@email.com')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-brand-secondary/10 border border-white/5 hover:border-brand-secondary/30 transition-all text-center group"
              >
                <User size={16} className="text-brand-secondary mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-text-primary">LANDLORD</span>
                <span className="text-[9px] text-text-muted mt-0.5 font-mono">Ravi</span>
              </button>

              <button
                onClick={() => handleQuickLogin('admin@email.com')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-center group"
              >
                <Shield size={16} className="text-text-secondary mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-text-primary">ADMIN</span>
                <span className="text-[9px] text-text-muted mt-0.5 font-mono">System</span>
              </button>
            </div>
          </div>

          {/* Footer link */}
          <div className="mt-6 text-center text-xs text-text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-accent hover:underline font-semibold">
              Register Here
            </Link>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
