import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import api from '../../api';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.getDepartments();
      setDepartments(res.departments || []);
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setForm({ name: dept.name, code: dept.code || '', description: dept.description || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Department name is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.updateDepartment(editing._id, form);
        toast.success('Department updated');
      } else {
        await api.createDepartment(form);
        toast.success('Department created');
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Deactivate "${dept.name}"?`)) return;
    try {
      await api.deleteDepartment(dept._id);
      toast.success('Department deactivated');
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate');
    }
  };

  return (
    <PageWrapper title="Departments" role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Departments</h1>
            <p className="text-sm text-neutral-400 mt-1">Manage library departments</p>
          </div>
          <Button variant="primary" onClick={openCreate}>
            <PlusIcon className="h-4 w-4" />
            Add Department
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
          ) : departments.length === 0 ? (
            <div className="text-center py-16 text-sm text-neutral-400">No departments found</div>
          ) : (
            <table className="min-w-full divide-y divide-neutral-100">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {departments.map((d) => (
                  <tr key={d._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-neutral-900">{d.name}</td>
                    <td className="px-4 py-3 text-sm text-neutral-500">{d.code || '—'}</td>
                    <td className="px-4 py-3 text-sm text-neutral-500">{d.description || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(d)} className="p-1.5 text-neutral-400 hover:text-primary rounded-lg hover:bg-neutral-100">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(d)} className="p-1.5 text-neutral-400 hover:text-status-revoked rounded-lg hover:bg-red-50">
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Department' : 'Add Department'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Computer Science"
            required
          />
          <Input
            label="Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="e.g. CSC"
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
