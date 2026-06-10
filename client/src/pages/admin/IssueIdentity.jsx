import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import DigitalIDCard from '../../components/features/DigitalIDCard';
import api from '../../api';

const ACCESS_LEVELS = [
  { value: '1', label: 'Level 1 - Basic Access (Library entry only)' },
  { value: '2', label: 'Level 2 - Standard Access (Borrowing + entry)' },
  { value: '3', label: 'Level 3 - Extended Access (Digital resources + borrowing)' },
  { value: '4', label: 'Level 4 - Full Access (All services including archives)' },
];

export default function IssueIdentity() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('new');
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [result, setResult] = useState(null);
  const [autoPassword, setAutoPassword] = useState('');
  const fileInputRef = useRef(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      role: 'student',
      department: '',
      matricId: '',
      staffId: '',
      phone: '',
      password: '',
      accessLevel: '1',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
    },
  });

  const watchRole = watch('role');
  const watchAccessLevel = watch('accessLevel');
  const watchFullName = watch('fullName');
  const watchDepartment = watch('department');
  const watchIssueDate = watch('issueDate');

  useEffect(() => {
    if (watchIssueDate) {
      const d = new Date(watchIssueDate);
      d.setFullYear(d.getFullYear() + 1);
      setValue('expiryDate', d.toISOString().split('T')[0]);
    }
  }, [watchIssueDate, setValue]);

  useEffect(() => {
    api.getDepartments()
      .then((res) => setDepartments(res.departments || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === 'existing') {
      setUsersLoading(true);
      api.getAllUsers({ limit: 200 })
        .then((res) => setUsers(res.users || res.data || []))
        .catch(() => toast.error('Failed to load users'))
        .finally(() => setUsersLoading(false));
    }
  }, [mode]);

  useEffect(() => {
    const pwd = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
    setAutoPassword(pwd);
    setValue('password', pwd);
  }, [setValue]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleExistingUserSelect = (e) => {
    const userId = e.target.value;
    setSelectedUserId(userId);
    const user = users.find((u) => u._id === userId || u.id === userId);
    if (user) {
      setValue('fullName', user.fullName || '');
      setValue('email', user.email || '');
      setValue('role', user.role || 'student');
      setValue('department', user.department || '');
      setValue('matricId', user.matricId || '');
      setValue('staffId', user.staffId || '');
    }
  };

  const previewIdentity = {
    fullName: watchFullName || 'Full Name',
    digitalId: 'DID-XXXX-XXXXX',
    role: watchRole || 'Student',
    accessLevel: `Level ${watchAccessLevel}`,
    department: watchDepartment || 'Department',
    photoUrl: photoPreview || null,
    issueDate: watchIssueDate || new Date().toISOString().split('T')[0],
    status: 'active',
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      if (mode === 'existing' && selectedUserId) formData.append('userId', selectedUserId);
      formData.append('fullName', data.fullName);
      formData.append('email', data.email);
      formData.append('role', data.role);
      formData.append('department', data.department);
      if (data.role === 'student') formData.append('matricId', data.matricId);
      if (data.role === 'staff' || data.role === 'librarian') formData.append('staffId', data.staffId);
      formData.append('phone', data.phone);
      formData.append('accessLevel', data.accessLevel);
      formData.append('issueDate', data.issueDate);
      formData.append('expiryDate', data.expiryDate);
      if (mode === 'new') formData.append('password', data.password);
      if (photoFile) formData.append('photo', photoFile);

      const res = await api.issueIdentity(formData);
      setResult(res.identity || res);
      toast.success('Identity issued successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue identity');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <PageWrapper title="Issue Identity" role="admin">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-status-active/10 flex items-center justify-center">
              <CheckCircleIcon className="h-8 w-8 text-status-active" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-neutral-900">Identity Issued Successfully</h2>
          <DigitalIDCard identity={result} showActions />
          <div className="flex gap-3 justify-center">
            <Button variant="primary" onClick={() => { setResult(null); setPhotoFile(null); setPhotoPreview(''); }}>
              Issue Another
            </Button>
            <Button variant="secondary" onClick={() => navigate('/admin/identities')}>
              Done
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Issue Identity" role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Issue New Identity</h1>
          <p className="text-sm text-neutral-400 mt-1">Create a new digital identity for a library member</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <h3 className="text-sm font-semibold text-neutral-700 mb-4">User Details</h3>

                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm text-neutral-500">Select Existing User</span>
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'new' ? 'existing' : 'new')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${mode === 'existing' ? 'bg-primary' : 'bg-neutral-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mode === 'existing' ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-sm text-neutral-500">Create New User</span>
                </div>

                {mode === 'existing' ? (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Select User</label>
                    {usersLoading ? (
                      <Spinner />
                    ) : (
                      <select
                        value={selectedUserId}
                        onChange={handleExistingUserSelect}
                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="">-- Select User --</option>
                        {users.map((u) => (
                          <option key={u._id || u.id} value={u._id || u.id}>
                            {u.fullName} ({u.email}) - {u.role}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name <span className="text-status-revoked">*</span></label>
                      <input {...register('fullName', { required: 'Full name is required' })} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      {errors.fullName && <p className="mt-1 text-xs text-status-revoked">{errors.fullName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Email <span className="text-status-revoked">*</span></label>
                      <input {...register('email', { required: 'Email is required' })} type="email" className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      {errors.email && <p className="mt-1 text-xs text-status-revoked">{errors.email.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Role <span className="text-status-revoked">*</span></label>
                      <select {...register('role', { required: true })} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                        <option value="student">Student</option>
                        <option value="staff">Staff</option>
                        <option value="librarian">Librarian</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Department <span className="text-status-revoked">*</span></label>
                      <select {...register('department', { required: 'Department is required' })} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                        <option value="">Select department</option>
                        {departments.map((d) => (
                          <option key={d._id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                      {errors.department && <p className="mt-1 text-xs text-status-revoked">{errors.department.message}</p>}
                    </div>
                    {watchRole === 'student' && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Matric/Reg Number</label>
                        <input {...register('matricId')} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      </div>
                    )}
                    {(watchRole === 'staff' || watchRole === 'librarian') && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Staff ID</label>
                        <input {...register('staffId')} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
                      <input {...register('phone')} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
                      <div className="flex gap-2">
                        <input {...register('password')} className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono" />
                        <button type="button" onClick={() => { const pwd = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase(); setAutoPassword(pwd); setValue('password', pwd); }} className="p-2 text-neutral-400 hover:text-primary rounded-lg hover:bg-neutral-50">
                          <ArrowPathIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <h3 className="text-sm font-semibold text-neutral-700 mb-4">Identity Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Access Level <span className="text-status-revoked">*</span></label>
                    <select {...register('accessLevel', { required: true })} className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                      {ACCESS_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Profile Photo</label>
                    <div className="flex items-center gap-4">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="h-16 w-16 rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden"
                      >
                        {photoPreview ? (
                          <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-2xl font-bold text-neutral-300">+</span>
                        )}
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                      <span className="text-xs text-neutral-400">Click to upload photo</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Issue Date</label>
                    <input {...register('issueDate')} readOnly className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-400 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Expiry Date</label>
                    <input {...register('expiryDate', { required: 'Expiry date is required' })} type="date" className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    {errors.expiryDate && <p className="mt-1 text-xs text-status-revoked">{errors.expiryDate.message}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 sticky top-24">
                <h3 className="text-sm font-semibold text-neutral-700 mb-4">Preview</h3>
                <DigitalIDCard identity={previewIdentity} />
                <div className="mt-6">
                  <Button type="submit" variant="primary" className="w-full" loading={loading}>
                    {loading ? 'Issuing...' : 'Issue Identity'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}
