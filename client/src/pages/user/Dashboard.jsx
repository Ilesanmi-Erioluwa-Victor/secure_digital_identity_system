import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRightIcon, ArrowDownTrayIcon, ClockIcon } from '@heroicons/react/24/outline';
import PageWrapper from '../../components/layout/PageWrapper';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, isExpired, daysUntil } from '../../utils/formatDate';
import { getStatusLabel, getStatusColor } from '../../utils/identityStatus';
import api from '../../api';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [identity, setIdentity] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    api.getMyIdentity()
      .then((res) => setIdentity(res.identity || res))
      .catch(() => setIdentity(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.getMyLogs({ limit: 5, page: 1 })
      .then((res) => setRecentActivity(res.logs || res.data || []))
      .catch(() => setRecentActivity([]))
      .finally(() => setActivityLoading(false));
  }, []);

  const handleDownload = async () => {
    if (!identity) return;
    try {
      const blob = await api.downloadIDCard(identity._id || identity.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ID_Card_${identity.digitalId || 'download'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch {
      toast.error('Failed to download ID card');
    }
  };

  const identityStatus = identity?.status || 'pending';
  const expiryDate = identity?.expiryDate;

  const renderStatusCard = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      );
    }

    if (!identity) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
          <p className="text-neutral-400">No identity record found.</p>
          <p className="text-sm text-neutral-400 mt-1">Contact administration to issue your digital identity.</p>
        </div>
      );
    }

    if (identityStatus === 'active') {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden">
          <div className="bg-status-active/10 px-6 py-4 border-b border-green-100">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-status-active shadow-lg shadow-status-active/30" />
              <h3 className="font-semibold text-neutral-900">Identity Status: Active</h3>
            </div>
          </div>
          <div className="px-6 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Digital ID</span>
              <span className="text-sm font-mono font-medium text-neutral-700">{identity.digitalId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Issued</span>
              <span className="text-sm text-neutral-700">{formatDate(identity.issueDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Expires</span>
              <span className={`text-sm font-medium ${isExpired(expiryDate) ? 'text-status-revoked' : 'text-neutral-700'}`}>
                {formatDate(expiryDate)}
                {!isExpired(expiryDate) && daysUntil(expiryDate) && (
                  <span className="text-neutral-400 ml-1">({daysUntil(expiryDate)} days)</span>
                )}
              </span>
            </div>
            <Button
              variant="primary"
              className="w-full mt-2"
              onClick={() => navigate('/user/my-id')}
            >
              View My ID Card
            </Button>
          </div>
        </div>
      );
    }

    if (identityStatus === 'expired') {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-300 overflow-hidden">
          <div className="bg-status-expired/10 px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-status-expired" />
              <h3 className="font-semibold text-neutral-900">Identity Status: Expired</h3>
            </div>
          </div>
          <div className="px-6 py-4 text-center">
            <p className="text-sm text-neutral-600 mb-2">Your identity has expired.</p>
            <p className="text-xs text-neutral-400">Please contact administration to renew your identity.</p>
          </div>
        </div>
      );
    }

    if (identityStatus === 'suspended') {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
          <div className="bg-status-suspended/10 px-6 py-4 border-b border-amber-100">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-status-suspended" />
              <h3 className="font-semibold text-neutral-900">Identity Status: Suspended</h3>
            </div>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-neutral-600 mb-1">Your identity has been suspended.</p>
            {identity.suspensionReason && (
              <p className="text-xs text-neutral-400">Reason: {identity.suspensionReason}</p>
            )}
            <p className="text-xs text-neutral-400 mt-2">Contact administration for more information.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
        <p className="text-neutral-400">Identity status: {getStatusLabel(identityStatus)}</p>
      </div>
    );
  };

  const activityColumns = [
    { key: 'timestamp', label: 'Timestamp', render: (val) => formatDate(val, 'PP HH:mm') },
    { key: 'action', label: 'Action', render: (val) => <Badge variant={val?.toLowerCase()}>{val}</Badge> },
    { key: 'outcome', label: 'Outcome', render: (val) => (
      <Badge variant={val === 'success' || val === 'granted' ? 'active' : 'revoked'}>{val}</Badge>
    )},
    { key: 'ipAddress', label: 'IP Address' },
    { key: 'device', label: 'Device' },
  ];

  return (
    <PageWrapper title="Dashboard" role="user">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Welcome, {user?.fullName || 'User'}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Here is an overview of your digital identity</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">{renderStatusCard()}</div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/user/my-id')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary bg-primary-pale rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <span className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </span>
                  <span className="flex-1 text-left">View My ID Card</span>
                  <ArrowRightIcon className="h-4 w-4 text-primary" />
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  <span className="flex-shrink-0 h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                    <ArrowDownTrayIcon className="h-4 w-4 text-neutral-500" />
                  </span>
                  <span className="flex-1 text-left">Download ID Card PDF</span>
                  <ArrowRightIcon className="h-4 w-4 text-neutral-400" />
                </button>
                <button
                  onClick={() => navigate('/user/access-history')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  <span className="flex-shrink-0 h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                    <ClockIcon className="h-4 w-4 text-neutral-500" />
                  </span>
                  <span className="flex-1 text-left">View Access History</span>
                  <ArrowRightIcon className="h-4 w-4 text-neutral-400" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5">
              <h3 className="text-sm font-semibold text-neutral-700 mb-1">Account Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Role</span>
                  <span className="text-neutral-700 capitalize">{user?.role || 'User'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Email</span>
                  <span className="text-neutral-700">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Department</span>
                  <span className="text-neutral-700">{user?.department || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="px-6 py-4 border-b border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-700">Recent Activity</h3>
          </div>
          <div className="p-6">
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-sm text-neutral-400">
                No recent activity
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-100">
                  <thead className="bg-neutral-50">
                    <tr>
                      {activityColumns.map((col) => (
                        <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {recentActivity.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-neutral-50 transition-colors">
                        {activityColumns.map((col) => (
                          <td key={col.key} className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                            {col.render ? col.render(row[col.key], row) : row[col.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
