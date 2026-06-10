import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import PageWrapper from '../../components/layout/PageWrapper';
import QRScanner from '../../components/features/QRScanner';
import VerifyResult from '../../components/features/VerifyResult';
import Spinner from '../../components/common/Spinner';
import api from '../../api';

export default function ScanVerify() {
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  const handleScanSuccess = useCallback(async (decodedText) => {
    setVerifying(true);
    try {
      const res = await api.verifyQRToken(decodedText);
      setResult(res);
      if (res.status === 'VALID') {
        toast.success('Identity verified successfully');
      } else if (res.status === 'EXPIRED') {
        toast.error('Identity has expired');
      } else if (res.status === 'SUSPENDED') {
        toast.error('Identity is suspended');
      } else if (res.status === 'REVOKED') {
        toast.error('Identity has been revoked');
      } else {
        toast.error('Identity could not be verified');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      toast.error(msg);
      setResult({ status: 'INVALID', message: msg });
    } finally {
      setVerifying(false);
    }
  }, []);

  const handleScanError = useCallback((err) => {
    if (err?.name !== 'NotFoundException') {
      console.error('Scan error:', err);
    }
  }, []);

  const handleReset = () => {
    setResult(null);
  };

  return (
    <PageWrapper title="Scan & Verify" role="librarian">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Scan & Verify</h1>
          <p className="text-sm text-neutral-400 mt-1">Verify a library member&apos;s digital identity by scanning their QR code</p>
        </div>

        {!result && (
          <div className="max-w-lg mx-auto text-center">
            <QRScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />
            {verifying && (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-neutral-500">
                <Spinner size="sm" /> Verifying identity...
              </div>
            )}
            <p className="text-sm text-neutral-400 mt-4">
              Point the camera at the QR code on the member&apos;s digital ID card
            </p>
          </div>
        )}

        {result && <VerifyResult result={result} onReset={handleReset} />}
      </div>
    </PageWrapper>
  );
}
