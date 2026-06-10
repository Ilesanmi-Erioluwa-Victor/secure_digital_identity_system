import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import OTPInput from '../../components/features/OTPInput';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api';

export default function OTPVerify() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expirySeconds, setExpirySeconds] = useState(600);
  const [resendCooldown, setResendCooldown] = useState(0);
  const expiryTimer = useRef(null);
  const resendTimer = useRef(null);

  const email = state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    expiryTimer.current = setInterval(() => {
      setExpirySeconds((prev) => {
        if (prev <= 1) {
          clearInterval(expiryTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(expiryTimer.current);
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      resendTimer.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(resendTimer.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(resendTimer.current);
    }
  }, [resendCooldown]);

  const handleVerify = useCallback(async (code) => {
    setLoading(true);
    setError('');
    try {
      const user = await verifyOtp(email, code);
      const role = user.role;
      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'librarian') {
        navigate('/librarian/dashboard', { replace: true });
      } else {
        navigate('/user/dashboard', { replace: true });
      }
      toast.success('Verification successful!');
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid verification code';
      setError(message);
      toast.error(message);
      setOtp('');
    } finally {
      setLoading(false);
    }
  }, [email, verifyOtp, navigate]);

  useEffect(() => {
    if (otp.length === 6 && !loading) {
      handleVerify(otp);
    }
  }, [otp, loading, handleVerify]);

  const handleResend = async () => {
    try {
      await api.login(email, '');
      setResendCooldown(60);
      setExpirySeconds(600);
      toast.success('New code sent to your email');
    } catch {
      toast.error('Failed to resend code');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!email) return null;

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-primary-dark">Enter Verification Code</h2>
        <p className="text-sm text-neutral-400 mt-2">
          A 6-digit code was sent to <span className="font-medium text-neutral-600">{email}</span>
        </p>
      </div>

      <div className="space-y-6">
        <OTPInput
          length={6}
          value={otp}
          onChange={setOtp}
          error={error}
          disabled={loading}
        />

        <div className="text-center">
          <p className={`text-sm font-medium ${expirySeconds <= 60 ? 'text-status-revoked' : 'text-neutral-400'}`}>
            OTP expires in {formatTime(expirySeconds)}
          </p>
        </div>

        <div className="text-center">
          {resendCooldown > 0 ? (
            <p className="text-sm text-neutral-400">
              Resend code in {formatTime(resendCooldown)}
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-sm text-primary hover:text-primary-light font-medium"
              disabled={expirySeconds === 0}
            >
              Resend OTP
            </button>
          )}
        </div>

        <div className="text-center border-t border-neutral-200 pt-4">
          <button
            type="button"
            onClick={() => navigate('/verify-totp', { state: { email } })}
            className="text-sm text-primary hover:text-primary-light font-medium"
          >
            Use Authenticator App instead
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
