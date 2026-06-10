import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { isValidEmail } from '../../utils/validators';

export default function Login() {
  const { control, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.mfaRequired) {
        navigate('/verify-otp', { state: { email: result.email } });
      }
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'Login failed';
      if (status === 423) {
        toast.error('Account temporarily locked. Please try again later or contact administration.');
      } else if (status === 429) {
        toast.error('Too many attempts. Please wait before trying again.');
      } else if (status === 401) {
        toast.error('Invalid email or password.');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="email"
          control={control}
          rules={{
            required: 'Email is required',
            validate: (v) => isValidEmail(v) || 'Invalid email format',
          }}
          render={({ field }) => (
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              error={errors.email?.message}
              {...field}
            />
          )}
        />
        <Controller
          name="password"
          control={control}
          rules={{ required: 'Password is required' }}
          render={({ field }) => (
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...field}
            />
          )}
        />
        <div className="flex justify-end">
          <a
            href="/forgot-password"
            className="text-sm text-primary hover:text-primary-light font-medium"
          >
            Forgot Password?
          </a>
        </div>
        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          Sign In
        </Button>
        <p className="text-center text-sm text-neutral-500">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:text-primary-light font-medium">Create Account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
