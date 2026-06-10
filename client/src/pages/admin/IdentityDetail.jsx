import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline';
import PageWrapper from '../../components/layout/PageWrapper';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DigitalIDCard from '../../components/features/DigitalIDCard';
import { formatDate, daysUntil, isExpired } from '../../utils/formatDate';
import { getStatusLabel } from '../../utils/identityStatus';
import api from '../../api';

export default function IdentityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessLogs, setAccessLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getIdentity(id)
      .then((res) => setIdentity(res.identity || res))
      .catch(() => toast.error('Failed to load identity'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (activeTab === 'logs') {
      setLogsLoading(true);
      api.getAllLogs({ identityId: id, limit: 50, page: 1 })
        .then((res) => setAccessLogs(res.logs || res.data || []))
        .catch(() => setAccessLogs([]))
        .finally(() => setLogsLoading(false));
    }
  }, [activeTab, id]);

  const handleAction = async (action, reason) => {
    setActionLoading(true);
    try {
      if (action === 'suspend') {
        const res = await api.suspendIdentity(id, reason);
        setIdentity(res.identity || res);
        toast.success('Identity suspended');
      } else if (action === 'activate') {
        const res = await api.activateIdentity(id);
        setIdentity(res.identity || res);
        toast.success('Identity activated');
      } else if (action === 'revoke') {
        const res = await api.revokeIdentity(id, reason);
        setIdentity(res.identity || res);
        toast.success('Identity revoked');
      } else if (action === 'renew') {
        const res = await api.renewIdentity(id);
        setIdentity(res.identity || res);
        toast.success('Identity renewed');
      }
      setConfirmAction(null);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} identity`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Identity Detail" role="admin">
        <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>
      </PageWrapper>
    );
  }

  if (!identity) {
    return (
      <PageWrapper title="Identity Detail" role="admin">
        <div className="text-center py-16">
          <p className="text-neutral-400">Identity not found</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/admin/identities')}>Back to Identities</Button>
        </div>
      </PageWrapper>
    );
  }

  const status = (identity.status || 'active').toLowerCase();
  const expiryDate = identity.expiryDate;
  const dUntil = daysUntil(expiryDate);

  const actionButtons = [];
  if (status === 'active') {
    actionButtons.push(
      { label: 'Suspend', action: 'suspend', variant: 'secondary', className: 'text-status-suspended border-status-suspended hover:bg-amber-50' },
      { label: 'Revoke', action: 'revoke', variant: 'danger' },
      { label: 'Renew', action: 'renew', variant: 'primary' },
    );
  } else if (status === 'suspended') {
    actionButtons.push(
      { label: 'Activate', action: 'activate', variant: 'primary' },
      { label: 'Revoke', action: 'revoke', variant: 'danger' },
    );
  } else if (status === 'expired') {
    actionButtons.push({ label: 'Renew', action: 'renew', variant: 'primary' });
  }

  const lifecycleHistory = identity.lifecycleHistory || identity.history || [];

  const logColumns = [
    { key: 'timestamp', label: 'Timestamp', render: (v) => formatDate(v, 'PP HH:mm') },
    { key: 'action', label: 'Action', render: (v) => <Badge variant={v?.toLowerCase()}>{v || 'N/A'}</Badge> },
    { key: 'outcome', label: 'Outcome', render: (v) => {
      const c = v === 'success' ? 'active' : v === 'suspicious' ? 'suspended' : 'revoked';
      return <Badge variant={c}>{v || 'N/A'}</Badge>;
    }},
    { key: 'ipAddress', label: 'IP', render: (v) => <span className="font-mono text-xs">{v || 'N/A'}</span> },
    { key: 'details', label: 'Details' },
  ];

  return (
    <PageWrapper title="Identity Detail" role="admin">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/identities')} className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
            <ArrowLeftIcon className="h-5 w-5 text-neutral-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{identity.fullName || 'Identity Detail'}</h1>
            <p className="text-sm text-neutral-400 font-mono">{identity.digitalId || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <DigitalIDCard identity={identity} showActions />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-sm font-semibold text-neutral-700 mb-4">Identity Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-400 text-xs">User Account</span>
                  <p className="font-medium text-neutral-700">{identity.user?.fullName || identity.fullName || 'N/A'}</p>
                  <p className="text-xs text-neutral-400">{identity.user?.email || identity.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-neutral-400 text-xs">Contact</span>
                  <p className="font-medium text-neutral-700">{identity.phone || 'N/A'}</p>
                  <p className="text-xs text-neutral-400">{identity.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-neutral-400 text-xs">Status</span>
                  <div className="mt-1"><Badge variant={status}>{getStatusLabel(status)}</Badge></div>
                </div>
                <div>
                  <span className="text-neutral-400 text-xs">Expiry Countdown</span>
                  <p className={`font-medium ${isExpired(expiryDate) ? 'text-status-revoked' : dUntil !== null && dUntil <= 30 ? 'text-status-suspended' : 'text-neutral-700'}`}>
                    {isExpired(expiryDate) ? 'Expired' : dUntil !== null ? `${dUntil} days remaining` : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-400 text-xs">Department</span>
                  <p className="font-medium text-neutral-700">{identity.department || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-neutral-400 text-xs">Role / Access Level</span>
                  <p className="font-medium text-neutral-700 capitalize">{identity.role || 'N/A'} — Level {identity.accessLevel || 'N/A'}</p>
                </div>
              </div>
            </div>

            {actionButtons.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <h3 className="text-sm font-semibold text-neutral-700 mb-4">Actions</h3>
                <div className="flex flex-wrap gap-3">
                  {actionButtons.map((btn) => (
                    <Button
                      key={btn.action}
                      variant={btn.variant}
                      className={btn.className || ''}
                      onClick={() => setConfirmAction({ action: btn.action, label: btn.label })}
                      loading={actionLoading && confirmAction?.action === btn.action}
                    >
                      {btn.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
              <div className="border-b border-neutral-100">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Lifecycle History
                  </button>
                  <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'logs' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Access Log
                  </button>
                </div>
              </div>

              {activeTab === 'details' ? (
                <div className="p-6">
                  {lifecycleHistory.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-4">No lifecycle history available</p>
                  ) : (
                    <div className="space-y-3">
                      {lifecycleHistory.map((event, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <div className="flex-shrink-0 mt-0.5">
                            <ClockIcon className="h-4 w-4 text-neutral-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-neutral-700">
                              <span className="font-medium capitalize">{event.action || event.event || 'Update'}</span>
                              {event.reason && <span className="text-neutral-400"> — {event.reason}</span>}
                            </p>
                            <p className="text-xs text-neutral-400">{formatDate(event.timestamp || event.date, 'PPP HH:mm')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {logsLoading ? (
                    <div className="flex items-center justify-center py-8"><Spinner /></div>
                  ) : accessLogs.length === 0 ? (
                    <div className="text-center py-8 text-sm text-neutral-400">No access logs found</div>
                  ) : (
                    <table className="min-w-full divide-y divide-neutral-100">
                      <thead className="bg-neutral-50">
                        <tr>
                          {logColumns.map((c) => <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{c.label}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {accessLogs.map((row, i) => (
                          <tr key={row.id || i} className="hover:bg-neutral-50 transition-colors">
                            {logColumns.map((c) => (
                              <td key={c.key} className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                                {c.render ? c.render(row[c.key], row) : row[c.key] || 'N/A'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={(reason) => handleAction(confirmAction?.action, reason)}
        title={`${confirmAction?.label || 'Confirm'} Identity`}
        message={`Are you sure you want to ${confirmAction?.action || 'perform this action'} for ${identity.fullName}?`}
        requireReason={confirmAction?.action === 'suspend' || confirmAction?.action === 'revoke'}
        confirmText={confirmAction?.label || 'Confirm'}
        variant={confirmAction?.action === 'renew' || confirmAction?.action === 'activate' ? 'warning' : 'danger'}
      />
    </PageWrapper>
  );
}
