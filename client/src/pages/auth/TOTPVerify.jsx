import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';

export default function TOTPVerify() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { verifyTotp } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const email = state?.email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await verifyTotp(email, code);
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
      const message = err.response?.data?.message || 'Invalid authenticator code';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <AuthLayout>
        <div className="text-center">
          <p className="text-sm text-neutral-400">No email provided.</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-4 text-sm text-primary hover:text-primary-light font-medium"
          >
            Back to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-primary-dark">Authenticator Code</h2>
        <p className="text-sm text-neutral-400 mt-2">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setCode(val);
              setError('');
            }}
            placeholder="000000"
            className={`w-full text-center text-3xl font-bold tracking-[0.5em] px-4 py-4 border rounded-lg bg-white transition-colors ${
              error
                ? 'border-status-revoked focus:ring-red-200 focus:border-status-revoked'
                : 'border-neutral-300 focus:ring-primary/20 focus:border-primary'
            } focus:outline-none focus:ring-2`}
            disabled={loading}
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-status-revoked text-center">{error}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={loading}
          disabled={code.length !== 6}
        >
          Verify
        </Button>

        <div className="text-center border-t border-neutral-200 pt-4">
          <button
            type="button"
            onClick={() => navigate('/verify-otp', { state: { email } })}
            className="text-sm text-primary hover:text-primary-light font-medium"
          >
            Use email OTP instead
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
