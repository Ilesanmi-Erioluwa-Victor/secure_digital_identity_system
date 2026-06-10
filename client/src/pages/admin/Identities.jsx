import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { EllipsisVerticalIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import PageWrapper from '../../components/layout/PageWrapper';
import SearchInput from '../../components/common/SearchInput';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate, daysUntil, isExpired } from '../../utils/formatDate';
import { getStatusLabel, getStatusColor } from '../../utils/identityStatus';
import api from '../../api';

const LIMIT = 15;

const STATUS_OPTIONS = ['', 'active', 'suspended', 'expired', 'revoked', 'pending'];
const ROLE_OPTIONS = ['', 'student', 'staff', 'librarian', 'admin'];
const ACCESS_LEVEL_OPTIONS = ['', '1', '2', '3', '4'];

export default function Identities() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [identities, setIdentities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('filter') || '');
  const [roleFilter, setRoleFilter] = useState('');
  const [accessFilter, setAccessFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchIdentities = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;
      if (accessFilter) params.accessLevel = accessFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await api.getAllIdentities(params);
      setIdentities(res.identities || res.data || []);
      setTotalPages(res.totalPages || res.pages || Math.ceil((res.total || 0) / LIMIT) || 1);
    } catch {
      toast.error('Failed to load identities');
      setIdentities([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, roleFilter, accessFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  useEffect(() => {
    if (searchParams.get('filter')) {
      setStatusFilter(searchParams.get('filter'));
    }
  }, [searchParams]);

  const handleAction = async (identityId, action, reason) => {
    try {
      if (action === 'suspend') {
        await api.suspendIdentity(identityId, reason);
        toast.success('Identity suspended');
      } else if (action === 'revoke') {
        await api.revokeIdentity(identityId, reason);
        toast.success('Identity revoked');
      } else if (action === 'renew') {
        await api.renewIdentity(identityId);
        toast.success('Identity renewed');
      }
      setConfirmAction(null);
      fetchIdentities();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} identity`);
    }
  };

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

  const handleExportPdf = async () => {
    try {
      const blob = await api.exportIdentitiesReport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Identity_Register.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch {
      toast.error('Failed to export register');
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
      key: 'photo',
      label: 'Photo',
      render: (_, row) => (
        <div className="h-10 w-10 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center">
          {row.photoUrl ? (
            <img src={row.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-primary">{(row.fullName || '?').charAt(0)}</span>
          )}
        </div>
      ),
    },
    { key: 'digitalIDNumber', label: 'Digital ID Number', render: (v) => <span className="font-mono text-xs">{v || 'N/A'}</span> },
    { key: 'fullName', label: 'Full Name' },
    {
      key: 'role',
      label: 'Role',
      render: (v) => <Badge variant={v?.toLowerCase()}>{v || 'N/A'}</Badge>,
    },
    { key: 'department', label: 'Department' },
    {
      key: 'accessLevel',
      label: 'Access Level',
      render: (v) => <Badge variant="pending">{`Level ${v}`}</Badge>,
    },
    {
      key: 'issueDate',
      label: 'Issue Date',
      render: (v) => formatDate(v, 'PP'),
    },
    {
      key: 'expiryDate',
      label: 'Expiry Date',
      render: (v) => (
        <span className={getExpiryStyle(v)}>
          {formatDate(v, 'PP')}
          {v && daysUntil(v) !== null && !isExpired(v) && (
            <span className="text-neutral-400 ml-1 text-xs">({daysUntil(v)}d)</span>
          )}
          {isExpired(v) && <span className="text-status-revoked ml-1 text-xs">(Expired)</span>}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <Badge variant={v?.toLowerCase() || 'pending'}>{getStatusLabel(v)}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === row._id || openMenu === row.id ? null : row._id || row.id); }}
            className="p-1 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <EllipsisVerticalIcon className="h-5 w-5 text-neutral-400" />
          </button>
          {(openMenu === row._id || openMenu === row.id) && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 z-20 py-1">
                <button onClick={() => { setOpenMenu(null); navigate(`/admin/identities/${row._id || row.id}`); }} className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50">View</button>
                {(row.status === 'active' || row.status === 'Active') && (
                  <>
                    <button onClick={() => { setOpenMenu(null); setConfirmAction({ id: row._id || row.id, action: 'suspend', name: row.fullName }); }} className="w-full px-4 py-2 text-left text-sm text-status-suspended hover:bg-neutral-50">Suspend</button>
                    <button onClick={() => { setOpenMenu(null); setConfirmAction({ id: row._id || row.id, action: 'revoke', name: row.fullName }); }} className="w-full px-4 py-2 text-left text-sm text-status-revoked hover:bg-neutral-50">Revoke</button>
                  </>
                )}
                {row.status !== 'active' && row.status !== 'Active' && row.status !== 'revoked' && row.status !== 'Revoked' && (
                  <button onClick={() => { setOpenMenu(null); setConfirmAction({ id: row._id || row.id, action: 'renew', name: row.fullName }); }} className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-neutral-50">Renew</button>
                )}
                <button onClick={() => { setOpenMenu(null); handleDownload(row._id || row.id, row.digitalIDNumber); }} className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50">Download ID Card</button>
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageWrapper title="Identity Register" role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Identity Register</h1>
            <p className="text-sm text-neutral-400 mt-1">Manage all digital identities</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleExportPdf}>
              <DocumentArrowDownIcon className="h-4 w-4" /> Export PDF
            </Button>
            <Button variant="primary" onClick={() => navigate('/admin/identities/new')}>
              Issue New Identity
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 space-y-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, DID, matric, or staff ID..." />
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-36">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Status</label>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.filter(Boolean).map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Role</label>
              <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">All Roles</option>
                {ROLE_OPTIONS.filter(Boolean).map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Access Level</label>
              <select value={accessFilter} onChange={(e) => { setAccessFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">All Levels</option>
                {ACCESS_LEVEL_OPTIONS.filter(Boolean).map((o) => <option key={o} value={o}>Level {o}</option>)}
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
            {(statusFilter || roleFilter || accessFilter || dateFrom || dateTo) && (
              <button onClick={() => { setStatusFilter(''); setRoleFilter(''); setAccessFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }} className="px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">Clear</button>
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
                    <tr>
                      {columns.map((col) => (
                        <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wider">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {identities.length === 0 ? (
                      <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-neutral-400">No identities found</td></tr>
                    ) : identities.map((row, i) => (
                      <tr key={row._id || row.id || i} className="hover:bg-neutral-50 transition-colors">
                        {columns.map((col) => (
                          <td key={col.key} className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                            {col.render ? col.render(row[col.key], row) : row[col.key] || 'N/A'}
                          </td>
                        ))}
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

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={(reason) => handleAction(confirmAction?.id, confirmAction?.action, reason)}
        title={`${confirmAction?.action ? confirmAction.action.charAt(0).toUpperCase() + confirmAction.action.slice(1) : ''} Identity`}
        message={`Are you sure you want to ${confirmAction?.action || 'perform this action'} ${confirmAction?.name ? `for ${confirmAction.name}` : ''}?`}
        requireReason={confirmAction?.action === 'suspend' || confirmAction?.action === 'revoke'}
        confirmText={confirmAction?.action ? confirmAction.action.charAt(0).toUpperCase() + confirmAction.action.slice(1) : 'Confirm'}
        variant={confirmAction?.action === 'renew' ? 'warning' : 'danger'}
      />
    </PageWrapper>
  );
}
