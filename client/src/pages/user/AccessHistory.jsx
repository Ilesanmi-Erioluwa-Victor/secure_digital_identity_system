import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import PageWrapper from '../../components/layout/PageWrapper';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import { formatDate } from '../../utils/formatDate';
import api from '../../api';

export default function AccessHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const limit = 15;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (actionFilter) params.action = actionFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await api.getMyLogs(params);
      setLogs(res.logs || res.data || []);
      setTotalPages(res.totalPages || res.pages || Math.ceil((res.total || 0) / limit) || 1);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilter = () => {
    setPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setActionFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (val) => formatDate(val, 'PP HH:mm'),
    },
    {
      key: 'action',
      label: 'Action',
      render: (val) => <Badge variant={val?.toLowerCase()}>{val}</Badge>,
    },
    {
      key: 'outcome',
      label: 'Outcome',
      render: (val) => (
        <Badge variant={val === 'success' || val === 'granted' ? 'active' : val === 'denied' || val === 'failed' ? 'revoked' : 'pending'}>
          {val}
        </Badge>
      ),
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (val) => <span className="font-mono text-xs">{val || 'N/A'}</span>,
    },
    {
      key: 'device',
      label: 'Device',
      render: (val) => val || 'N/A',
    },
  ];

  const actionOptions = [
    'login',
    'logout',
    'verify',
    'access',
    'update',
    'view',
    'download',
    'print',
  ];

  return (
    <PageWrapper title="Access History" role="user">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Access History</h1>
          <p className="text-sm text-neutral-400 mt-1">View your access and activity logs</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-40">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">All Actions</option>
                {actionOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="w-44">
              <label className="block text-xs font-medium text-neutral-500 mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="w-44">
              <label className="block text-xs font-medium text-neutral-500 mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleFilter}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
              >
                Apply Filters
              </button>
              {(actionFilter || dateFrom || dateTo) && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <Table columns={columns} data={logs} />
              <div className="px-6 py-3 border-t border-neutral-100">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
