import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import api from '../../api';

const PIE_COLORS = ['#16A34A', '#D97706', '#6B7280', '#DC2626', '#0891B2'];
const METRIC_COLORS = {
  total: 'bg-primary', active: 'bg-status-active', suspended: 'bg-status-suspended',
  expired: 'bg-status-expired', revoked: 'bg-status-revoked', scans: 'bg-accent',
};

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [monthlyIssuance, setMonthlyIssuance] = useState([]);
  const [dailyScans, setDailyScans] = useState([]);
  const [roleBreakdown, setRoleBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [s, m, a, r] = await Promise.all([
          api.getSummary(), api.getMonthlyIssuance(), api.getAccessSummary(), api.getRoleBreakdown(),
        ]);
        setSummary(s.summary || s);
        setMonthlyIssuance(m.data || m || []);
        setDailyScans(a.dailyScans || a.data || a || []);
        setRoleBreakdown(r.roleBreakdown || r.data || []);
      } catch { toast.error('Failed to load report data'); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const s = summary || {};
  const metrics = [
    { key: 'total', label: 'Total Identities', value: s.totalIdentities || s.total || 0 },
    { key: 'active', label: 'Active', value: s.activeIdentities || s.active || 0 },
    { key: 'suspended', label: 'Suspended', value: s.suspendedIdentities || s.suspended || 0 },
    { key: 'expired', label: 'Expired', value: s.expiredIdentities || s.expired || 0 },
    { key: 'revoked', label: 'Revoked', value: s.revokedIdentities || s.revoked || 0 },
    { key: 'scans', label: 'Total QR Scans', value: s.todaysScans || s.qrScansToday || 0 },
  ];

  const statusPieData = [
    { name: 'Active', value: metrics[1].value },
    { name: 'Suspended', value: metrics[2].value },
    { name: 'Expired', value: metrics[3].value },
    { name: 'Revoked', value: metrics[4].value },
    { name: 'Pending', value: Math.max(0, metrics[0].value - metrics[1].value - metrics[2].value - metrics[3].value - metrics[4].value) },
  ].filter(d => d.value > 0);

  const handleExportIdentities = async () => {
    try {
      const blob = await api.exportIdentitiesReport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'Identity_Register.pdf'; a.click();
      URL.revokeObjectURL(url); toast.success('Export started');
    } catch { toast.error('Export failed'); }
  };

  const handleExportLogs = async () => {
    try {
      const blob = await api.exportAccessLogsReport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'Access_Log_Report.pdf'; a.click();
      URL.revokeObjectURL(url); toast.success('Export started');
    } catch { toast.error('Export failed'); }
  };

  const handleExportMonthly = async () => {
    toast.success('Monthly summary export initiated');
  };

  if (loading) {
    return (
      <PageWrapper title="Reports" role="admin">
        <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Reports" role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Reports & Analytics</h1>
            <p className="text-sm text-neutral-400 mt-1">Comprehensive system reports and data export</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 flex flex-wrap items-end gap-4">
          <div className="w-44">
            <label className="block text-xs font-medium text-neutral-500 mb-1">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div className="w-44">
            <label className="block text-xs font-medium text-neutral-500 mb-1">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleExportIdentities}><DocumentArrowDownIcon className="h-4 w-4" /> Identity Register PDF</Button>
            <Button variant="secondary" onClick={handleExportLogs}><DocumentArrowDownIcon className="h-4 w-4" /> Access Log Report PDF</Button>
            <Button variant="secondary" onClick={handleExportMonthly}><DocumentArrowDownIcon className="h-4 w-4" /> Monthly Summary PDF</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map((m) => (
            <div key={m.key} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
              <span className="block text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">{m.label}</span>
              <p className="text-3xl font-bold text-neutral-900">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">Identity Status Distribution</h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={70} outerRadius={120} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-700 mb-4">Monthly Issuance (Last 12 Months)</h3>
            {Array.isArray(monthlyIssuance) && monthlyIssuance.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyIssuance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F8" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
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
            {Array.isArray(dailyScans) && dailyScans.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={dailyScans}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F8" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
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
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={roleBreakdown} cx="50%" cy="50%" outerRadius={120} dataKey="count" nameKey="role" label={({ role, count }) => `${role} (${count})`}>
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
      </div>
    </PageWrapper>
  );
}
