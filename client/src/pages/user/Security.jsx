import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ShieldCheckIcon, KeyIcon } from '@heroicons/react/24/outline';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import TOTPSetup from '../../components/features/TOTPSetup';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api';

export default function Security() {
  const { user } = useAuth();
  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm();
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [totpStatus, setTotpStatus] = useState(null);
  const [totpLoading, setTotpLoading] = useState(true);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disabling, setDisabling] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState(null);

  const newPassword = watch('newPassword', '');

  useEffect(() => {
    loadTOTPStatus();
  }, []);

  const loadTOTPStatus = async () => {
    setTotpLoading(true);
    try {
      const res = await api.getTOTPSetup();
      setTotpStatus(res);
    } catch {
      setTotpStatus(null);
    } finally {
      setTotpLoading(false);
    }
  };

  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(newPassword);
  const strengthPercent = (strength / 5) * 100;
  const strengthLabel = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['bg-status-revoked', 'bg-status-revoked', 'bg-status-suspended', 'bg-status-suspended', 'bg-status-active', 'bg-status-active'][strength];

  const onChangePassword = async (data) => {
    setPasswordLoading(true);
    try {
      const userId = user._id || user.id;
      await api.updateUser(userId, {
        currentPassword: data.currentPassword,
        password: data.newPassword,
      });
      toast.success('Password changed successfully');
      reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEnableTOTP = async () => {
    try {
      const res = await api.getTOTPSetup();
      setSetupData(res.setup || res);
      setShowSetup(true);
    } catch {
      toast.error('Failed to get TOTP setup data');
    }
  };

  const handleVerifyTOTP = async (token) => {
    try {
      await api.enableTOTP(token, setupData?.secret);
      toast.success('Authenticator app enabled successfully');
      setShowSetup(false);
      setSetupData(null);
      loadTOTPStatus();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to verify code';
      toast.error(message);
      throw err;
    }
  };

  const handleDisableTOTP = async () => {
    if (!disablePassword) {
      toast.error('Please enter your password');
      return;
    }
    setDisabling(true);
    try {
      await api.disableTOTP(disablePassword);
      toast.success('Authenticator app disabled');
      setShowDisableDialog(false);
      setDisablePassword('');
      loadTOTPStatus();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to disable authenticator app';
      toast.error(message);
    } finally {
      setDisabling(false);
    }
  };

  const totpEnabled = totpStatus?.enabled || totpStatus?.totpEnabled || false;

  return (
    <PageWrapper title="Security Settings" role="user">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Security Settings</h1>
          <p className="text-sm text-neutral-400 mt-1">Manage your password and two-factor authentication</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
            <div className="h-8 w-8 rounded-lg bg-primary-pale flex items-center justify-center">
              <KeyIcon className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900">Change Password</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
              <Controller
                name="currentPassword"
                control={control}
                rules={{ required: 'Current password is required' }}
                render={({ field }) => (
                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="Enter current password"
                    error={errors.currentPassword?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                name="newPassword"
                control={control}
                rules={{
                  required: 'New password is required',
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
                      error={errors.newPassword?.message}
                      {...field}
                    />
                    {newPassword && (
                      <div className="mt-2">
                        <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                            style={{ width: `${strengthPercent}%` }}
                          />
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">Password strength: {strengthLabel}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`text-xs ${newPassword.length >= 8 ? 'text-status-active' : 'text-neutral-400'}`}>
                            {newPassword.length >= 8 ? '✓' : '○'} 8+ chars
                          </span>
                          <span className={`text-xs ${/[A-Z]/.test(newPassword) ? 'text-status-active' : 'text-neutral-400'}`}>
                            {/[A-Z]/.test(newPassword) ? '✓' : '○'} Uppercase
                          </span>
                          <span className={`text-xs ${/[a-z]/.test(newPassword) ? 'text-status-active' : 'text-neutral-400'}`}>
                            {/[a-z]/.test(newPassword) ? '✓' : '○'} Lowercase
                          </span>
                          <span className={`text-xs ${/[0-9]/.test(newPassword) ? 'text-status-active' : 'text-neutral-400'}`}>
                            {/[0-9]/.test(newPassword) ? '✓' : '○'} Number
                          </span>
                        </div>
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
                  validate: (v) => v === newPassword || 'Passwords do not match',
                }}
                render={({ field }) => (
                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Confirm new password"
                    error={errors.confirmPassword?.message}
                    {...field}
                  />
                )}
              />
              <Button type="submit" variant="primary" loading={passwordLoading}>
                Update Password
              </Button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
            <div className="h-8 w-8 rounded-lg bg-primary-pale flex items-center justify-center">
              <ShieldCheckIcon className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900">Two-Factor Authentication</h2>
          </div>
          <div className="p-6">
            {totpLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : showSetup && setupData ? (
              <TOTPSetup setupData={setupData} onEnabled={handleVerifyTOTP} />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-neutral-700">
                      {totpEnabled ? 'Authenticator App' : 'Email OTP (Active)'}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {totpEnabled
                        ? 'Using Google Authenticator or similar app'
                        : 'Verification codes are sent to your email'}
                    </p>
                  </div>
                  <Badge variant={totpEnabled ? 'active' : 'valid'}>
                    {totpEnabled ? 'Active' : 'Default'}
                  </Badge>
                </div>
                {totpEnabled ? (
                  <Button
                    variant="danger"
                    onClick={() => setShowDisableDialog(true)}
                  >
                    Disable Authenticator App
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleEnableTOTP}
                  >
                    Enable Authenticator App
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDisableDialog}
        onClose={() => {
          setShowDisableDialog(false);
          setDisablePassword('');
        }}
        title="Disable Authenticator App"
        size="sm"
      >
        <p className="text-sm text-neutral-600 mb-4">
          Are you sure you want to disable two-factor authentication? Please enter your password to confirm.
        </p>
        <div className="space-y-4">
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDisableDialog(false);
                setDisablePassword('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDisableTOTP}
              loading={disabling}
              disabled={!disablePassword}
            >
              Disable
            </Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
