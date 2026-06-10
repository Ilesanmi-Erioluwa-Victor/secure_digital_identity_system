import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { isValidEmail } from '../../utils/validators';
import api from '../../api';

export default function SignUp() {
  const { control, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role,
        department: data.department,
        phone: data.phone,
      };
      if (data.role === 'student') payload.matricNumber = data.matricNumber;
      if (data.role === 'staff') payload.staffID = data.staffID;

      await api.register(payload);
      toast.success('Account created! An admin will issue your digital identity.');
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="fullName"
          control={control}
          rules={{ required: 'Full name is required' }}
          render={({ field }) => (
            <Input label="Full Name" placeholder="Enter your full name" error={errors.fullName?.message} {...field} />
          )}
        />
        <Controller
          name="email"
          control={control}
          rules={{
            required: 'Email is required',
            validate: (v) => isValidEmail(v) || 'Invalid email format',
          }}
          render={({ field }) => (
            <Input label="Email Address" type="email" placeholder="Enter your email" error={errors.email?.message} {...field} />
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="password"
            control={control}
            rules={{
              required: 'Password is required',
              minLength: { value: 8, message: 'Min 8 characters' },
            }}
            render={({ field }) => (
              <Input label="Password" type="password" placeholder="Min 8 chars" error={errors.password?.message} {...field} />
            )}
          />
          <Controller
            name="confirmPassword"
            control={control}
            rules={{
              required: 'Confirm your password',
              validate: (v) => v === watch('password') || 'Passwords do not match',
            }}
            render={({ field }) => (
              <Input label="Confirm Password" type="password" placeholder="Re-enter password" error={errors.confirmPassword?.message} {...field} />
            )}
          />
        </div>
        <Controller
          name="role"
          control={control}
          rules={{ required: 'Select a role' }}
          render={({ field }) => (
            <div className="w-full">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Role <span className="text-status-revoked">*</span></label>
              <select
                {...field}
                className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20"
              >
                <option value="">Select role</option>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>
              {errors.role && <p className="mt-1 text-sm text-status-revoked">{errors.role.message}</p>}
            </div>
          )}
        />
        {selectedRole && (
          <Controller
            name={selectedRole === 'student' ? 'matricNumber' : 'staffID'}
            control={control}
            rules={{ required: `${selectedRole === 'student' ? 'Matric' : 'Staff'} ID is required` }}
            render={({ field }) => (
              <Input
                label={selectedRole === 'student' ? 'Matric Number' : 'Staff ID'}
                placeholder={selectedRole === 'student' ? 'e.g. DSP/CS/2022/001' : 'e.g. STAFF-0042'}
                error={errors[selectedRole === 'student' ? 'matricNumber' : 'staffID']?.message}
                {...field}
              />
            )}
          />
        )}
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="department"
            control={control}
            render={({ field }) => (
              <Input label="Department" placeholder="e.g. Computer Science" {...field} />
            )}
          />
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Input label="Phone" type="tel" placeholder="e.g. 080..." {...field} />
            )}
          />
        </div>
        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          Create Account
        </Button>
        <p className="text-center text-sm text-neutral-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary-light font-medium">Sign In</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
