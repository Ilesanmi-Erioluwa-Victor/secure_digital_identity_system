import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import DigitalIDCard from '../../components/features/DigitalIDCard';
import api from '../../api';

export default function MyID() {
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.getMyIdentity()
      .then((res) => setIdentity(res.identity || res))
      .catch((err) => {
        if (err.response?.status !== 404) {
          toast.error('Failed to load your identity');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async () => {
    if (!identity) return;
    setDownloading(true);
    try {
      const blob = await api.downloadIDCard(identity._id || identity.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ID_Card_${identity.digitalId || 'download'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch {
      toast.error('Failed to download ID card');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const statusVariant = identity?.status || 'pending';

  const statusColors = {
    active: 'bg-status-active/10 border-status-active/20 text-status-active',
    suspended: 'bg-status-suspended/10 border-status-suspended/20 text-status-suspended',
    expired: 'bg-status-expired/10 border-status-expired/20 text-status-expired',
    revoked: 'bg-status-revoked/10 border-status-revoked/20 text-status-revoked',
    pending: 'bg-status-pending/10 border-status-pending/20 text-status-pending',
  };

  if (loading) {
    return (
      <PageWrapper title="My ID Card" role="user">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  if (!identity) {
    return (
      <PageWrapper title="My ID Card" role="user">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-neutral-400 mb-4">No identity record found.</p>
          <p className="text-sm text-neutral-400">Contact administration to issue your digital identity.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="My ID Card" role="user">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">My ID Card</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <PrinterIcon className="h-4 w-4" />
              Print
            </Button>
            <Button variant="primary" onClick={handleDownload} loading={downloading}>
              <ArrowDownTrayIcon className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <DigitalIDCard identity={identity} />

        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${statusColors[statusVariant] || 'bg-neutral-50 border-neutral-200 text-neutral-600'}`}>
          <div className={`h-2.5 w-2.5 rounded-full ${statusVariant === 'active' ? 'bg-status-active' : statusVariant === 'suspended' ? 'bg-status-suspended' : statusVariant === 'expired' ? 'bg-status-expired' : 'bg-neutral-400'}`} />
          <div>
            <p className="text-sm font-medium capitalize">{statusVariant} Identity</p>
            {statusVariant === 'suspended' && identity.suspensionReason && (
              <p className="text-xs mt-0.5 opacity-75">Reason: {identity.suspensionReason}</p>
            )}
            {statusVariant === 'expired' && (
              <p className="text-xs mt-0.5 opacity-75">Please contact administration to renew your identity</p>
            )}
          </div>
        </div>

        {identity.expiryDate && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4">
            <h3 className="text-sm font-semibold text-neutral-700 mb-2">ID Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-neutral-400">Digital ID</span>
                <p className="font-mono text-neutral-700">{identity.digitalId}</p>
              </div>
              <div>
                <span className="text-neutral-400">Role</span>
                <p className="text-neutral-700 capitalize">{identity.role}</p>
              </div>
              <div>
                <span className="text-neutral-400">Department</span>
                <p className="text-neutral-700">{identity.department}</p>
              </div>
              <div>
                <span className="text-neutral-400">Access Level</span>
                <p className="text-neutral-700">{identity.accessLevel}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
