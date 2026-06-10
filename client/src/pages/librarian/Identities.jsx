import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageWrapper from '../../components/layout/PageWrapper';
import SearchInput from '../../components/common/SearchInput';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import { formatDate, daysUntil, isExpired } from '../../utils/formatDate';
import { getStatusLabel } from '../../utils/identityStatus';
import api from '../../api';

const LIMIT = 15;

export default function Identities() {
  const navigate = useNavigate();
  const [identities, setIdentities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [accessFilter, setAccessFilter] = useState('');

  const fetchIdentities = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;
      if (accessFilter) params.accessLevel = accessFilter;
      const res = await api.getAllIdentities(params);
      setIdentities(res.identities || res.data || []);
      setTotalPages(res.totalPages || res.pages || Math.ceil((res.total || 0) / LIMIT) || 1);
    } catch {
      toast.error('Failed to load identities');
      setIdentities([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, roleFilter, accessFilter]);

  useEffect(() => { fetchIdentities(); }, [fetchIdentities]);

  const handleDownload = async (identityId, digitalId) => {
    try {
      const blob = await api.downloadIDCard(identityId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ID_Card_${digitalId || 'download'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch {
      toast.error('Failed to download ID card');
    }
  };

  const getExpiryStyle = (date) => {
    if (!date) return 'text-neutral-500';
    const d = daysUntil(date);
    if (d < 0) return 'text-status-revoked font-semibold';
    if (d <= 7) return 'text-status-revoked font-semibold';
    if (d <= 30) return 'text-status-suspended font-semibold';
    return 'text-neutral-700';
  };

  const columns = [
    {
      key: 'photo', label: 'Photo',
      render: (_, row) => (
        <div className="h-10 w-10 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center">
          {row.photoUrl ? <img src={row.photoUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-sm font-bold text-primary">{(row.fullName || '?').charAt(0)}</span>}
        </div>
      ),
    },
    { key: 'digitalId', label: 'Digital ID', render: (v) => <span className="font-mono text-xs">{v || 'N/A'}</span> },
    { key: 'fullName', label: 'Full Name' },
    { key: 'role', label: 'Role', render: (v) => <Badge variant={v?.toLowerCase()}>{v || 'N/A'}</Badge> },
    { key: 'department', label: 'Department' },
    { key: 'accessLevel', label: 'Access Level', render: (v) => <Badge variant="pending">Level {v}</Badge> },
    { key: 'issueDate', label: 'Issue Date', render: (v) => formatDate(v, 'PP') },
    {
      key: 'expiryDate', label: 'Expiry Date',
      render: (v) => (
        <span className={getExpiryStyle(v)}>
          {formatDate(v, 'PP')}
          {v && daysUntil(v) !== null && !isExpired(v) && <span className="text-neutral-400 ml-1 text-xs">({daysUntil(v)}d)</span>}
          {isExpired(v) && <span className="text-status-revoked ml-1 text-xs">(Expired)</span>}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={v?.toLowerCase() || 'pending'}>{getStatusLabel(v)}</Badge> },
    {
      key: 'actions', label: 'Actions', sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => navigate(`/librarian/identities/${row._id || row.id}`)}>View</Button>
          <Button size="sm" variant="ghost" onClick={() => handleDownload(row._id || row.id, row.digitalId)}>Download</Button>
        </div>
      ),
    },
  ];

  return (
    <PageWrapper title="Identities" role="librarian">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Identity Records</h1>
          <p className="text-sm text-neutral-400 mt-1">View registered library members and their digital identities</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 space-y-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, DID, matric, or staff ID..." />
          <div className="flex flex-wrap gap-4">
            <div className="w-36">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Status</label>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">All Statuses</option>
                {['active', 'suspended', 'expired', 'revoked', 'pending'].map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Role</label>
              <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">All Roles</option>
                {['student', 'staff', 'librarian'].map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Access Level</label>
              <select value={accessFilter} onChange={(e) => { setAccessFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">All Levels</option>
                {['1', '2', '3', '4'].map((o) => <option key={o} value={o}>Level {o}</option>)}
              </select>
            </div>
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
                    {identities.length === 0 ? (
                      <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-neutral-400">No identities found</td></tr>
                    ) : identities.map((row, i) => (
                      <tr key={row._id || row.id || i} className="hover:bg-neutral-50 transition-colors">
                        {columns.map((c) => <td key={c.key} className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">{c.render ? c.render(row[c.key], row) : row[c.key] || 'N/A'}</td>)}
                      </tr>
                    ))}
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
