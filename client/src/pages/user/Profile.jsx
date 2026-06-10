import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PencilSquareIcon, CameraIcon } from '@heroicons/react/24/outline';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api';

export default function Profile() {
  const { user } = useAuth();
  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm();
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
      });
      if (user.photoUrl) {
        setPhotoUrl(user.photoUrl);
      }
    }
  }, [user, reset]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setPhotoUrl(event.target.result);
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (userId) => {
    if (!photoFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      const res = await api.updateIdentityPhoto(userId, formData);
      if (res.photoUrl) setPhotoUrl(res.photoUrl);
      toast.success('Photo updated');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const userId = user._id || user.id;
      await api.updateUser(userId, {
        fullName: data.fullName,
        phone: data.phone,
        department: data.department,
      });
      if (photoFile) {
        await uploadPhoto(userId);
      }
      toast.success('Profile updated successfully');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper title="My Profile" role="user">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Profile</h1>
          <p className="text-sm text-neutral-400 mt-1">View and edit your profile information</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="px-6 py-6">
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full bg-neutral-100 border-4 border-neutral-200 overflow-hidden flex items-center justify-center">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-primary">
                      {user?.fullName?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary-light transition-colors"
                >
                  <CameraIcon className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-neutral-400 mt-2">Click the camera icon to update your photo</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Controller
                name="fullName"
                control={control}
                rules={{ required: 'Full name is required' }}
                render={({ field }) => (
                  <Input
                    label="Full Name"
                    type="text"
                    placeholder="Enter your full name"
                    error={errors.fullName?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="Email"
                    error={errors.email?.message}
                    disabled
                    {...field}
                  />
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="Phone Number"
                      type="text"
                      placeholder="Enter phone number"
                      error={errors.phone?.message}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label="Department"
                      type="text"
                      placeholder="Enter your department"
                      error={errors.department?.message}
                      {...field}
                    />
                  )}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="primary" loading={loading} disabled={!isDirty && !photoFile}>
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    reset({
                      fullName: user?.fullName || '',
                      email: user?.email || '',
                      phone: user?.phone || '',
                      department: user?.department || '',
                    });
                    setPhotoUrl(user?.photoUrl || null);
                    setPhotoFile(null);
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
