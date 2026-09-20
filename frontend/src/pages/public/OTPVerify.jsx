import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../lib/auth.api';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { KeyRound, RefreshCw, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OTPVerify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registerAction = useAuthStore((state) => state.register);
  const verifyOtpAction = useAuthStore((state) => state.verifyOtp);

  // Extract registration parameters from redirect URL query params
  const email = searchParams.get('email') || '';
  const role = searchParams.get('role') || 'TENANT';
  const name = searchParams.get('name') || '';
  const phone = searchParams.get('phone') || '';
  const password = searchParams.get('password') || '';
  const userId = searchParams.get('userId') || '';

  // 6 digit split input
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  
  // Refs for each input box
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  // Countdown timer logic
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handle key typing
  const handleChange = (index, value) => {
    // Only accept numeric digits
    if (value !== '' && !/^[0-9]$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next box if digit typed
    if (value !== '' && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  // Handle backspaces & arrow keys
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        // Clear previous and focus it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs[index - 1].current.focus();
      } else {
        // Just clear current
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1].current.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  // Submit code
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    
    const codeString = otp.join('');
    if (codeString.length < 6) {
      toast.error('Please input all 6 digits.');
      return;
    }

    setLoading(true);
    try {
      const user = await verifyOtpAction(Number(userId), codeString);
      toast.success(`Account verified! Welcome, ${user.name}`);
      
      // Redirect based on role
      if (user.role === 'LANDLORD') {
        navigate('/landlord/dashboard');
      } else {
        navigate('/search');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (timer > 0) return;
    setOtp(['', '', '', '', '', '']);
    setTimer(60);
    inputRefs[0].current.focus();
    
    toast.promise(
      authAPI.resendOtp(email),
      {
        loading: 'Resending OTP...',
        success: 'OTP resent successfully!',
        error: (err) => err.response?.data?.message || 'Failed to resend OTP.'
      }
    );
  };

  return (
    <PageWrapper className="relative min-h-screen flex items-center justify-center py-16 px-4">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-base via-[#090915] to-[#07070F] z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="p-8 bg-surface-raised/50 backdrop-blur-lg border-white/10 shadow-elevated text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent mx-auto mb-5 shadow-sm">
            <KeyRound size={22} />
          </div>

          <h2 className="font-display font-bold text-2xl text-text-primary">
            Verify Email
          </h2>
          
          <p className="text-xs text-text-secondary mt-2 px-4 leading-relaxed">
            We have sent a 6-digit confirmation code to <br />
            <span className="text-brand-accent font-semibold">{email || 'your email'}</span>.
          </p>

          <form onSubmit={handleVerify} className="mt-8 space-y-6">
            {/* 6 Grid Input boxes */}
            <div className="flex justify-between items-center gap-2 max-w-sm mx-auto">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-13 md:w-12 md:h-14 bg-white text-black border border-gray-300 rounded-xl text-center text-xl font-bold font-mono outline-none placeholder:text-gray-400 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-150"                />
              ))}
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              icon={CheckCircle2}
            >
              Verify Code
            </Button>
          </form>

          {/* Resend Timer Widget */}
          <div className="mt-8 flex items-center justify-center text-xs">
            {timer > 0 ? (
              <p className="text-text-secondary">
                Resend code in <span className="text-brand-secondary font-semibold font-mono">{timer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="flex items-center space-x-1.5 text-brand-accent hover:text-brand-accent/80 font-semibold transition-colors"
              >
                <RefreshCw size={12} className="animate-spin-slow" />
                <span>Resend Verification Code</span>
              </button>
            )}
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
