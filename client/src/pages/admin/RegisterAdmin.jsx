import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import api from '../../api';
import { isValidEmail } from '../../utils/validators';

export default function RegisterAdmin() {
  const { control, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getDepartments()
      .then((res) => setDepartments(res.departments || []))
      .catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.registerAdmin({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
        department: data.department || undefined,
      });
      toast.success('Admin account created successfully');
      navigate('/admin/users');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create admin';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper title="Register New Admin">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-200">
            <div className="p-2 rounded-lg bg-accent-light">
              <ShieldCheckIcon className="h-6 w-6 text-accent-DEFAULT" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">New Administrator</h2>
              <p className="text-sm text-neutral-500">Create an admin account with full system access</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="fullName"
              control={control}
              rules={{ required: 'Full name is required' }}
              render={({ field }) => (
                <Input label="Full Name" placeholder="Enter full name" error={errors.fullName?.message} {...field} />
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
                <Input label="Email Address" type="email" placeholder="admin@dspoly.edu.ng" error={errors.email?.message} {...field} />
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
                  <Input label="Password" type="password" placeholder="Min 8 characters" error={errors.password?.message} {...field} />
                )}
              />
              <Controller
                name="confirmPassword"
                control={control}
                rules={{
                  required: 'Confirm password',
                  validate: (v) => v === watch('password') || 'Passwords do not match',
                }}
                render={({ field }) => (
                  <Input label="Confirm Password" type="password" placeholder="Re-enter password" error={errors.confirmPassword?.message} {...field} />
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <div className="w-full">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Department <span className="text-neutral-400">(optional)</span></label>
                    <select
                      {...field}
                      className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20"
                    >
                      <option value="">Select department</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              />
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input label="Phone (optional)" type="tel" placeholder="e.g. +234 800..." {...field} />
                )}
              />
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
              <Button type="submit" variant="primary" loading={loading}>
                Create Admin Account
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/users')}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
