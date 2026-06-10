import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { PencilSquareIcon, LockOpenIcon, NoSymbolIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import PageWrapper from '../../components/layout/PageWrapper';
import SearchInput from '../../components/common/SearchInput';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate } from '../../utils/formatDate';
import api from '../../api';

const LIMIT = 15;
const ROLE_OPTIONS = ['', 'student', 'staff', 'librarian', 'admin'];
const STATUS_OPTIONS = ['', 'active', 'inactive', 'locked'];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [mfaFilter, setMfaFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '', email: '', role: 'student', department: '', matricId: '', staffId: '', phone: '', password: '',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      if (mfaFilter) params.mfaEnabled = mfaFilter;
      const res = await api.getAllUsers(params);
      setUsers(res.users || res.data || []);
      setTotalPages(res.totalPages || res.pages || Math.ceil((res.total || 0) / LIMIT) || 1);
    } catch {
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, mfaFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ fullName: '', email: '', role: 'student', department: '', matricId: '', staffId: '', phone: '', password: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      role: user.role || 'student',
      department: user.department || '',
      matricId: user.matricId || '',
      staffId: user.staffId || '',
      phone: user.phone || '',
      password: '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingUser) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await api.updateUser(editingUser._id || editingUser.id, payload);
        toast.success('User updated');
      } else {
        await api.createUser(formData);
        toast.success('User created');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlock = async (userId) => {
    try {
      await api.unlockUser(userId);
      toast.success('User unlocked');
      fetchUsers();
    } catch { toast.error('Failed to unlock user'); }
  };

  const handleDeactivate = async (userId) => {
    try {
      await api.deactivateUser(userId);
      toast.success('User deactivated');
      fetchUsers();
    } catch { toast.error('Failed to deactivate user'); }
  };

  const columns = [
    {
      key: 'photo',
      label: 'Photo',
      render: (_, row) => (
        <div className="h-9 w-9 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center">
          {row.photoUrl ? <img src={row.photoUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-sm font-bold text-primary">{(row.fullName || '?').charAt(0)}</span>}
        </div>
      ),
    },
    { key: 'fullName', label: 'Name' },
    { key: 'role', label: 'Role', render: (v) => <Badge variant={v?.toLowerCase()}>{v || 'N/A'}</Badge> },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department' },
    { key: 'matricId', label: 'Matric/Staff ID', render: (v) => v || 'N/A' },
    { key: 'mfaEnabled', label: 'MFA', render: (v) => <Badge variant={v ? 'active' : 'expired'}>{v ? 'Enabled' : 'Disabled'}</Badge> },
    { key: 'status', label: 'Account Status', render: (v) => <Badge variant={v?.toLowerCase() || 'pending'}>{v || 'N/A'}</Badge> },
    { key: 'createdAt', label: 'Created', render: (v) => formatDate(v, 'PP') },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setViewingUser(row)} className="p-1.5 text-neutral-400 hover:text-primary rounded-lg hover:bg-neutral-50" title="View"><PencilSquareIcon className="h-4 w-4" /></button>
          <button onClick={() => handleOpenEdit(row)} className="p-1.5 text-neutral-400 hover:text-primary rounded-lg hover:bg-neutral-50" title="Edit"><PencilSquareIcon className="h-4 w-4" /></button>
          {row.status === 'locked' && (
            <button onClick={() => setConfirmAction({ id: row._id || row.id, action: 'unlock', name: row.fullName })} className="p-1.5 text-status-suspended hover:text-amber-700 rounded-lg hover:bg-amber-50" title="Unlock"><LockOpenIcon className="h-4 w-4" /></button>
          )}
          {row.status !== 'inactive' && (
            <button onClick={() => setConfirmAction({ id: row._id || row.id, action: 'deactivate', name: row.fullName })} className="p-1.5 text-status-revoked hover:text-red-700 rounded-lg hover:bg-red-50" title="Deactivate"><NoSymbolIcon className="h-4 w-4" /></button>
          )}
        </div>
      ),
    },
  ];

  const handleConfirm = async (userId, action) => {
    if (action === 'unlock') await handleUnlock(userId);
    if (action === 'deactivate') await handleDeactivate(userId);
    setConfirmAction(null);
  };

  return (
    <PageWrapper title="User Management" role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">User Management</h1>
            <p className="text-sm text-neutral-400 mt-1">Manage system users and accounts</p>
          </div>
          <Button variant="primary" onClick={handleOpenAdd}>
            <UserPlusIcon className="h-4 w-4" /> Add New User
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 space-y-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, or ID..." />
          <div className="flex flex-wrap gap-4">
            <div className="w-36">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Role</label>
              <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">All Roles</option>
                {ROLE_OPTIONS.filter(Boolean).map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Status</label>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.filter(Boolean).map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-neutral-500 mb-1">MFA</label>
              <select value={mfaFilter} onChange={(e) => { setMfaFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">All</option>
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
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
                    {users.length === 0 ? (
                      <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-neutral-400">No users found</td></tr>
                    ) : users.map((row, i) => (
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

      <Modal isOpen={!!viewingUser} onClose={() => setViewingUser(null)} title="User Details" size="md">
        {viewingUser && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-neutral-100 border-2 border-neutral-200 overflow-hidden flex items-center justify-center">
                {viewingUser.photoUrl ? <img src={viewingUser.photoUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-2xl font-bold text-primary">{viewingUser.fullName?.charAt(0)}</span>}
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">{viewingUser.fullName}</h3>
                <p className="text-neutral-400">{viewingUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-neutral-400">Role</span><p className="font-medium capitalize">{viewingUser.role || 'N/A'}</p></div>
              <div><span className="text-neutral-400">Department</span><p className="font-medium">{viewingUser.department || 'N/A'}</p></div>
              <div><span className="text-neutral-400">Matric/Staff ID</span><p className="font-medium">{viewingUser.matricId || viewingUser.staffId || 'N/A'}</p></div>
              <div><span className="text-neutral-400">Phone</span><p className="font-medium">{viewingUser.phone || 'N/A'}</p></div>
              <div><span className="text-neutral-400">MFA</span><p className="font-medium">{viewingUser.mfaEnabled ? 'Enabled' : 'Disabled'}</p></div>
              <div><span className="text-neutral-400">Status</span><p className="font-medium capitalize">{viewingUser.status || 'N/A'}</p></div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Edit User' : 'Add New User'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name *</label>
              <input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Email *</label>
              <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} type="email" className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Role *</label>
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="librarian">Librarian</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Department *</label>
              <input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            {formData.role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Matric ID</label>
                <input value={formData.matricId} onChange={(e) => setFormData({ ...formData, matricId: e.target.value })} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            )}
            {(formData.role === 'staff' || formData.role === 'librarian' || formData.role === 'admin') && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Staff ID</label>
                <input value={formData.staffId} onChange={(e) => setFormData({ ...formData, staffId: e.target.value })} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
              <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            {!editingUser && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Password {!editingUser && '*'}</label>
                <input value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} type="password" className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>{editingUser ? 'Update' : 'Create'} User</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => handleConfirm(confirmAction?.id, confirmAction?.action)}
        title={`${confirmAction?.action === 'unlock' ? 'Unlock' : 'Deactivate'} User`}
        message={`Are you sure you want to ${confirmAction?.action} ${confirmAction?.name || 'this user'}?`}
        confirmText={confirmAction?.action === 'unlock' ? 'Unlock' : 'Deactivate'}
        variant={confirmAction?.action === 'unlock' ? 'warning' : 'danger'}
      />
    </PageWrapper>
  );
}
