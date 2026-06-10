import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowRightIcon, UserGroupIcon, CheckBadgeIcon, ExclamationTriangleIcon, ClockIcon, XCircleIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { formatDate } from '../../utils/formatDate';
import api from '../../api';

const METRIC_ICONS = {
  total: UserGroupIcon,
  active: CheckBadgeIcon,
  suspended: ExclamationTriangleIcon,
  expired: ClockIcon,
  revoked: XCircleIcon,
  scans: QrCodeIcon,
};

const METRIC_COLORS = {
  total: 'bg-blue-500',
  active: 'bg-status-active',
  suspended: 'bg-status-suspended',
  expired: 'bg-status-expired',
  revoked: 'bg-status-revoked',
  scans: 'bg-primary',
};

const PIE_COLORS = ['#16A34A', '#D97706', '#6B7280', '#DC2626', '#0891B2'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [monthlyIssuance, setMonthlyIssuance] = useState([]);
  const [roleBreakdown, setRoleBreakdown] = useState([]);
  const [dailyScans, setDailyScans] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, monthlyRes, accessRes, roleRes, logsRes] = await Promise.all([
          api.getSummary(),
          api.getMonthlyIssuance(),
          api.getAccessSummary(),
          api.getRoleBreakdown(),
          api.getAllLogs({ limit: 10, page: 1 }),
        ]);
        setSummary(summaryRes.summary || summaryRes);
        setMonthlyIssuance(monthlyRes.data || monthlyRes || []);
        setRoleBreakdown(roleRes.data || roleRes || []);
        setDailyScans(accessRes.dailyScans || accessRes.data || accessRes || []);
        setRecentLogs(logsRes.logs || logsRes.data || []);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <PageWrapper title="Dashboard" role="admin">
        <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>
      </PageWrapper>
    );
  }

  const s = summary || {};
  const totalIdentities = s.totalIdentities || s.total || 0;
  const active = s.activeIdentities || s.active || 0;
  const suspended = s.suspendedIdentities || s.suspended || 0;
  const expired = s.expiredIdentities || s.expired || 0;
  const revoked = s.revokedIdentities || s.revoked || 0;
  const todaysScans = s.todaysScans || s.qrScansToday || 0;
  const expiringSoon = s.expiringSoon || s.expiringWithin30Days || 0;
  const expiredToday = s.expiredToday || 0;

  const metrics = [
    { key: 'total', label: 'Total Identities', value: totalIdentities },
    { key: 'active', label: 'Active', value: active },
    { key: 'suspended', label: 'Suspended', value: suspended },
    { key: 'expired', label: 'Expired', value: expired },
    { key: 'revoked', label: 'Revoked', value: revoked },
    { key: 'scans', label: "Today's QR Scans", value: todaysScans },
  ];

  const statusPieData = [
    { name: 'Active', value: active },
    { name: 'Suspended', value: suspended },
    { name: 'Expired', value: expired },
    { name: 'Revoked', value: revoked },
    { name: 'Pending', value: Math.max(0, totalIdentities - active - suspended - expired - revoked) },
  ].filter(d => d.value > 0);

  const logColumns = [
    { key: 'timestamp', label: 'Timestamp', render: (v) => formatDate(v, 'PP HH:mm') },
    { key: 'action', label: 'Action', render: (v) => (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-100 text-neutral-700 capitalize">{v || 'N/A'}</span>
    )},
    { key: 'outcome', label: 'Outcome', render: (v) => {
      const c = v === 'success' ? 'text-status-active bg-status-active/10' : v === 'suspicious' ? 'text-status-suspended bg-status-suspended/10' : 'text-status-revoked bg-status-revoked/10';
      return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${c}`}>{v || 'N/A'}</span>;
    }},
    { key: 'ipAddress', label: 'IP' },
    { key: 'details', label: 'Details' },
  ];

  return (
    <PageWrapper title="Dashboard" role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Delta State Polytechnic Library — Identity Management</h1>
          <p className="text-sm text-neutral-400 mt-1">System overview and key metrics</p>
        </div>

        {expiringSoon > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <ExclamationTriangleIcon className="h-5 w-5 text-status-suspended flex-shrink-0" />
            <span className="text-amber-800 flex-1">{expiringSoon} identities expiring within 30 days — </span>
            <button onClick={() => navigate('/admin/identities?filter=expiring')} className="text-amber-700 font-medium underline hover:no-underline flex-shrink-0">View</button>
          </div>
        )}

        {expiredToday > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm">
            <XCircleIcon className="h-5 w-5 text-status-revoked flex-shrink-0" />
            <span className="text-red-800 flex-1">{expiredToday} identities expired today — </span>
            <button onClick={() => navigate('/admin/identities?filter=expired')} className="text-red-700 font-medium underline hover:no-underline flex-shrink-0">Renew Now</button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map((m) => {
            const Icon = METRIC_ICONS[m.key];
            return (
              <div key={m.key} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{m.label}</span>
                  <div className={`h-8 w-8 rounded-lg ${METRIC_COLORS[m.key]} bg-opacity-10 flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 text-white`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{m.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">Identity Status Breakdown</h3>
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-neutral-400 text-center py-16">No identity data available</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">Identities Issued Per Month (Last 12)</h3>
            {monthlyIssuance.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyIssuance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F8" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0A3D6B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-neutral-400 text-center py-16">No issuance data available</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">Daily QR Scan Activity (Last 14 Days)</h3>
            {dailyScans.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailyScans}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F8" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="scans" fill="#1565A8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-neutral-400 text-center py-16">No scan data available</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">Identities by Role</h3>
            {Array.isArray(roleBreakdown) && roleBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={roleBreakdown} cx="50%" cy="50%" outerRadius={100} dataKey="count" nameKey="role" label={({ role, count }) => `${role} (${count})`}>
                    {roleBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-neutral-400 text-center py-16">No role data available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-700">Recent Access Log</h3>
            <button onClick={() => navigate('/admin/logs')} className="text-xs font-medium text-primary hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-100">
              <thead className="bg-neutral-50">
                <tr>
                  {logColumns.map((c) => (
                    <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentLogs.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">No recent activity</td></tr>
                ) : recentLogs.map((row, i) => (
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
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => navigate('/admin/identities/new')}>
              Issue Identity <ArrowRightIcon className="h-4 w-4" />
            </Button>
            <Button variant="secondary" onClick={() => navigate('/admin/identities')}>
              View Identities <ArrowRightIcon className="h-4 w-4" />
            </Button>
            <Button variant="secondary" onClick={() => navigate('/admin/logs')}>
              View Logs <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
