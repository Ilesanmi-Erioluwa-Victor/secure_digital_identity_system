import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { DocumentArrowDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PageWrapper from '../../components/layout/PageWrapper';
import SearchInput from '../../components/common/SearchInput';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import { formatDate } from '../../utils/formatDate';
import api from '../../api';

const LIMIT = 20;
const ACTION_OPTIONS = ['', 'login', 'logout', 'verify', 'issue', 'revoke', 'suspend', 'access', 'failed'];
const OUTCOME_OPTIONS = ['', 'success', 'failed', 'suspicious', 'denied'];

export default function AccessLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      if (outcomeFilter) params.outcome = outcomeFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await api.getAllLogs(params);
      setLogs(res.logs || res.data || []);
      setTotalPages(res.totalPages || res.pages || Math.ceil((res.total || 0) / LIMIT) || 1);
    } catch {
      toast.error('Failed to load access logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, outcomeFilter, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleExport = async () => {
    try {
      const blob = await api.exportAccessLogsReport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Access_Logs_Report.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch {
      toast.error('Failed to export logs');
    }
  };

  const columns = [
    { key: 'timestamp', label: 'Timestamp', render: (v) => formatDate(v, 'PPP HH:mm') },
    {
      key: 'user',
      label: 'User / Identity',
      render: (_, row) => (
        <div>
          <p className="font-medium text-neutral-700">{row.user?.fullName || row.identity?.fullName || 'N/A'}</p>
          <p className="text-xs text-neutral-400 font-mono">{row.identity?.digitalId || row.identityId || ''}</p>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (v) => {
        const c = v === 'login' || v === 'verify' ? 'bg-blue-100 text-blue-800' : v === 'failed' ? 'bg-red-100 text-red-800' : v === 'suspend' ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-700';
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${c}`}>{v ? v.charAt(0).toUpperCase() + v.slice(1) : 'N/A'}</span>;
      },
    },
    {
      key: 'outcome',
      label: 'Outcome',
      render: (v) => {
        const c = v === 'success' ? 'active' : v === 'suspicious' ? 'suspended' : 'revoked';
        return <Badge variant={c}>{v ? v.charAt(0).toUpperCase() + v.slice(1) : 'N/A'}</Badge>;
      },
    },
    { key: 'ipAddress', label: 'IP Address', render: (v) => <span className="font-mono text-xs">{v || 'N/A'}</span> },
    {
      key: 'userAgent',
      label: 'Device / Browser',
      render: (v) => {
        if (!v) return 'Unknown';
        if (v.includes('Mobile')) return 'Mobile Browser';
        if (v.includes('Chrome')) return 'Chrome';
        if (v.includes('Firefox')) return 'Firefox';
        if (v.includes('Safari') && !v.includes('Chrome')) return 'Safari';
        if (v.includes('Edge')) return 'Edge';
        return 'Browser';
      },
    },
    { key: 'details', label: 'Details' },
  ];

  return (
    <PageWrapper title="Access Logs" role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Access Logs</h1>
            <p className="text-sm text-neutral-400 mt-1">Monitor all system access and verification events</p>
          </div>
          <Button variant="secondary" onClick={handleExport}>
            <DocumentArrowDownIcon className="h-4 w-4" /> Export PDF
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 space-y-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by user name or IP address..." />
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-36">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Action Type</label>
              <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">All Actions</option>
                {ACTION_OPTIONS.filter(Boolean).map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Outcome</label>
              <select value={outcomeFilter} onChange={(e) => { setOutcomeFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">All Outcomes</option>
                {OUTCOME_OPTIONS.filter(Boolean).map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
            <div className="w-44">
              <label className="block text-xs font-medium text-neutral-500 mb-1">From</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div className="w-44">
              <label className="block text-xs font-medium text-neutral-500 mb-1">To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            {(actionFilter || outcomeFilter || dateFrom || dateTo || search) && (
              <button onClick={() => { setActionFilter(''); setOutcomeFilter(''); setDateFrom(''); setDateTo(''); setSearch(''); setPage(1); }} className="px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">Clear</button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-100">
                  <thead className="bg-primary-pale">
                    <tr>{columns.map((c) => <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wider">{c.label}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {logs.length === 0 ? (
                      <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-neutral-400">No logs found</td></tr>
                    ) : logs.map((row, i) => {
                      const isHighlighted = row.outcome === 'suspicious' || row.outcome === 'failed';
                      return (
                        <tr key={row.id || i} className={`hover:bg-neutral-50 transition-colors ${isHighlighted ? 'bg-amber-50/40 border-l-4 border-l-status-suspended' : ''}`}>
                          {columns.map((c) => (
                            <td key={c.key} className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                              <span className="flex items-center gap-1">
                                {c.key === 'outcome' && isHighlighted && <ExclamationTriangleIcon className="h-3.5 w-3.5 text-status-suspended" />}
                                {c.render ? c.render(row[c.key], row) : row[c.key] || 'N/A'}
                              </span>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-neutral-100">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
