import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Mail, ShieldCheck, ArrowLeft, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../lib/apiCalls';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const result = forgotPasswordSchema.safeParse({ email });
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
      await authAPI.forgotPassword(email);
      setSuccess(true);
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
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
              <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider">Account Recovery</span>
            </div>
            <h2 className="font-display font-bold text-2xl text-text-primary">
              Forgot Password
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Enter your registered email and we will send you a secure link to reset your password.
            </p>
          </div>

          {/* Form / Success State */}
          {success ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-brand-primary/10 rounded-full">
                  <ShieldCheck size={48} className="text-brand-accent" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-text-primary">Check Your Email</h3>
                <p className="text-sm text-text-secondary">
                  If an account exists for <span className="font-bold text-text-primary">{email}</span>, you will receive password reset instructions.
                </p>
              </div>
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/login')}
                className="mt-6 shadow-md"
              >
                Return to Login
              </Button>
            </div>
          ) : (
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

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                className="mt-6 shadow-md"
              >
                Send Reset Link
              </Button>
            </form>
          )}

          {/* Footer link */}
          {!success && (
            <div className="mt-6 text-center text-xs text-text-secondary">
              Remembered your password?{' '}
              <Link to="/login" className="text-brand-accent hover:underline font-semibold flex items-center justify-center gap-1 mt-2">
                <ArrowLeft size={12} /> Back to Login
              </Link>
            </div>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
}
