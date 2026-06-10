import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCodeIcon, CheckBadgeIcon, ExclamationTriangleIcon, UserGroupIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PageWrapper from '../../components/layout/PageWrapper';
import Spinner from '../../components/common/Spinner';
import { formatDate } from '../../utils/formatDate';
import api from '../../api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, logsRes] = await Promise.all([
          api.getSummary(),
          api.getAllLogs({ limit: 10, page: 1 }),
        ]);
        setSummary(summaryRes.summary || summaryRes);
        setRecentLogs(logsRes.logs || logsRes.data || []);
      } catch {
        setSummary({});
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <PageWrapper title="Dashboard" role="librarian">
        <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>
      </PageWrapper>
    );
  }

  const s = summary || {};
  const metrics = [
    { icon: QrCodeIcon, color: 'bg-primary', label: "Today's QR Scans", value: s.todaysScans || s.qrScansToday || 0 },
    { icon: CheckBadgeIcon, color: 'bg-status-active', label: 'Valid Scans', value: s.validScansToday || s.validScans || 0 },
    { icon: ExclamationTriangleIcon, color: 'bg-status-suspended', label: 'Invalid / Suspicious', value: s.suspiciousScans || s.invalidScans || 0 },
    { icon: UserGroupIcon, color: 'bg-status-expired', label: 'Active Identities', value: s.activeIdentities || s.active || 0 },
  ];

  const logColumns = [
    { key: 'timestamp', label: 'Time', render: (v) => formatDate(v, 'HH:mm') },
    { key: 'identity', label: 'Member', render: (_, r) => r.identity?.fullName || r.user?.fullName || 'N/A' },
    { key: 'action', label: 'Action', render: (v) => <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-neutral-100 text-neutral-700 capitalize">{v || 'N/A'}</span> },
    {
      key: 'outcome',
      label: 'Outcome',
      render: (v) => {
        const c = v === 'success' ? 'text-status-active bg-status-active/10' : v === 'suspicious' ? 'text-status-suspended bg-status-suspended/10' : 'text-status-revoked bg-status-revoked/10';
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${c}`}>{v || 'N/A'}</span>;
      },
    },
    { key: 'details', label: 'Details' },
  ];

  return (
    <PageWrapper title="Dashboard" role="librarian">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Librarian Dashboard</h1>
          <p className="text-sm text-neutral-400 mt-1">Monitor identity verification activity</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{m.label}</span>
                  <div className={`h-8 w-8 rounded-lg ${m.color} flex items-center justify-center`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{m.value}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-700">Recent Scan Activity</h3>
            <button onClick={() => navigate('/librarian/logs')} className="text-xs font-medium text-primary hover:underline">View All</button>
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
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">No recent scans</td></tr>
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
          <button
            onClick={() => navigate('/librarian/verify')}
            className="inline-flex items-center gap-3 px-6 py-4 bg-primary text-white rounded-xl hover:bg-primary-light transition-colors text-sm font-medium"
          >
            <QrCodeIcon className="h-5 w-5" />
            Scan & Verify
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
