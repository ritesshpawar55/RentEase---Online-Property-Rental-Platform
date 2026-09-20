import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Lock, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../lib/apiCalls';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token.');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const result = resetPasswordSchema.safeParse({ newPassword, confirmPassword });
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
      await authAPI.resetPassword({ token, newPassword, confirmPassword });
      setSuccess(true);
      toast.success('Password successfully reset.');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to reset password. The link might be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper className="relative min-h-screen flex items-center justify-center py-16 px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-base via-[#090915] to-[#07070F] z-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="p-8 bg-surface-raised/50 backdrop-blur-lg border-white/10 shadow-elevated">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/30 mb-4">
              <Sparkles size={12} className="text-brand-accent animate-pulse" />
              <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider">Secure Access</span>
            </div>
            <h2 className="font-display font-bold text-2xl text-text-primary">
              Set New Password
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Choose a strong password with at least 6 characters to secure your account.
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-brand-primary/10 rounded-full">
                  <ShieldCheck size={48} className="text-brand-accent" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-text-primary">Password Reset Successful</h3>
                <p className="text-sm text-text-secondary">
                  Your password has been securely updated. You can now login with your new credentials.
                </p>
              </div>
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/login')}
                className="mt-6 shadow-md"
                icon={ArrowRight}
                iconPosition="right"
              >
                Proceed to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={formErrors.newPassword}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={formErrors.confirmPassword}
                required
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                className="mt-6 shadow-md"
              >
                Reset Password
              </Button>
            </form>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
}
