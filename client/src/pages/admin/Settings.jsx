import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import api from '../../api';

const DEFAULT_ACCESS_LEVELS = {
  1: 'Basic Access — Library entry only',
  2: 'Standard Access — Borrowing privileges + entry',
  3: 'Extended Access — Digital resources + borrowing + entry',
  4: 'Full Access — All services including archives',
};

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    institutionName: 'Delta State Polytechnic Library',
    institutionAddress: '',
    institutionPhone: '',
    defaultExpiryMonths: 12,
    expiryWarningDays: 30,
    finalWarningDays: 7,
    requireMfaForAll: false,
    allowTotp: true,
    loginRateLimit: 5,
    accountLockoutDuration: 30,
    accessLevelDescriptions: DEFAULT_ACCESS_LEVELS,
  });

  useEffect(() => {
    api.getSettings()
      .then((res) => {
        const data = res.settings || res;
        if (data) {
          setSettings((prev) => ({
            ...prev,
            ...data,
            accessLevelDescriptions: {
              ...DEFAULT_ACCESS_LEVELS,
              ...(data.accessLevelDescriptions || {}),
            },
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleLevelChange = (level, value) => {
    setSettings((prev) => ({
      ...prev,
      accessLevelDescriptions: { ...prev.accessLevelDescriptions, [level]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings(settings);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Settings" role="admin">
        <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Settings" role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">System Settings</h1>
          <p className="text-sm text-neutral-400 mt-1">Configure system-wide parameters and defaults</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-4">Institution Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Institution Name</label>
              <input value={settings.institutionName} onChange={(e) => handleChange('institutionName', e.target.value)} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Address</label>
              <textarea value={settings.institutionAddress} onChange={(e) => handleChange('institutionAddress', e.target.value)} rows={2} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
              <input value={settings.institutionPhone} onChange={(e) => handleChange('institutionPhone', e.target.value)} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-4">Identity Defaults</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Default Expiry (Months)</label>
              <input type="number" min={1} max={60} value={settings.defaultExpiryMonths} onChange={(e) => handleChange('defaultExpiryMonths', parseInt(e.target.value) || 12)} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Expiry Warning Days</label>
              <input type="number" min={1} max={90} value={settings.expiryWarningDays} onChange={(e) => handleChange('expiryWarningDays', parseInt(e.target.value) || 30)} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Final Warning Days</label>
              <input type="number" min={1} max={30} value={settings.finalWarningDays} onChange={(e) => handleChange('finalWarningDays', parseInt(e.target.value) || 7)} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-4">Security Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-700">Require MFA For All Users</p>
                <p className="text-xs text-neutral-400">Enforce multi-factor authentication for every account</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('requireMfaForAll', !settings.requireMfaForAll)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.requireMfaForAll ? 'bg-primary' : 'bg-neutral-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.requireMfaForAll ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-700">Allow TOTP Authentication</p>
                <p className="text-xs text-neutral-400">Enable Time-based One-Time Password as an MFA method</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('allowTotp', !settings.allowTotp)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.allowTotp ? 'bg-primary' : 'bg-neutral-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.allowTotp ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Login Rate Limit (attempts)</label>
                <input type="number" min={1} max={20} value={settings.loginRateLimit} onChange={(e) => handleChange('loginRateLimit', parseInt(e.target.value) || 5)} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Account Lockout Duration (minutes)</label>
                <input type="number" min={1} max={1440} value={settings.accountLockoutDuration} onChange={(e) => handleChange('accountLockoutDuration', parseInt(e.target.value) || 30)} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-4">Access Level Descriptions</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((level) => (
              <div key={level}>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Level {level}</label>
                <input
                  value={settings.accessLevelDescriptions?.[level] || ''}
                  onChange={(e) => handleLevelChange(level, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="primary" size="lg" onClick={handleSave} loading={saving}>
            Save Settings
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
