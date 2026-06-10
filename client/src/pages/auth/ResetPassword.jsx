import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import api from '../../api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { control, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  const password = watch('password', '');

  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthPercent = (strength / 5) * 100;

  const strengthLabel = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['bg-status-revoked', 'bg-status-revoked', 'bg-status-suspended', 'bg-status-suspended', 'bg-status-active', 'bg-status-active'][strength];

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.resetPassword(token, data.password);
      toast.success('Password reset successful! Please login with your new password.');
      navigate('/login', { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to reset password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-primary-dark">Reset Password</h2>
        <p className="text-sm text-neutral-400 mt-2">Create a new password for your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="password"
          control={control}
          rules={{
            required: 'Password is required',
            minLength: { value: 8, message: 'At least 8 characters' },
            validate: {
              hasUpper: (v) => /[A-Z]/.test(v) || 'Must contain uppercase letter',
              hasLower: (v) => /[a-z]/.test(v) || 'Must contain lowercase letter',
              hasNumber: (v) => /[0-9]/.test(v) || 'Must contain a number',
            },
          }}
          render={({ field }) => (
            <div>
              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                error={errors.password?.message}
                {...field}
              />
              {password && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                      style={{ width: `${strengthPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Password strength: {strengthLabel}</p>
                </div>
              )}
            </div>
          )}
        />
        <Controller
          name="confirmPassword"
          control={control}
          rules={{
            required: 'Please confirm your password',
            validate: (v) => v === password || 'Passwords do not match',
          }}
          render={({ field }) => (
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm new password"
              error={errors.confirmPassword?.message}
              {...field}
            />
          )}
        />
        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          Reset Password
        </Button>
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-sm text-primary hover:text-primary-light font-medium"
          >
            Back to Login
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
