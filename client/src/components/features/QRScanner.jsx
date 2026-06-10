import { useState, useRef, useEffect, useCallback } from 'react';
import { CameraIcon, StopIcon, KeyIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';

export default function QRScanner({ onScanSuccess, onScanError }) {
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const videoRef = useRef(null);

  const cleanup = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          cleanup();
          setScanning(false);
          onScanSuccess?.(decodedText);
        },
        (err) => {
          onScanError?.(err);
        }
      );
      setScanning(true);
    } catch (err) {
      setError('Camera access denied or not available');
      setScanning(false);
    }
  }, [cleanup, onScanSuccess, onScanError]);

  const stopCamera = useCallback(() => {
    cleanup();
    setScanning(false);
  }, [cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const handleManualVerify = () => {
    if (!manualCode.trim()) {
      setError('Please enter a code');
      return;
    }
    onScanSuccess?.(manualCode.trim());
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">QR Scanner</h3>
          <button
            onClick={() => {
              setManualMode(!manualMode);
              if (!manualMode) stopCamera();
              setError('');
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-light transition-colors"
          >
            {manualMode ? (
              <CameraIcon className="h-4 w-4" />
            ) : (
              <KeyIcon className="h-4 w-4" />
            )}
            {manualMode ? 'Camera Scan' : 'Manual Entry'}
          </button>
        </div>

        {!manualMode ? (
          <div className="p-4">
            <div
              id="qr-reader"
              ref={videoRef}
              className={`${scanning ? '' : 'hidden'}`}
            />
            {!scanning && (
              <div className="aspect-square bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-3">
                <CameraIcon className="h-10 w-10 text-neutral-300" />
                <p className="text-sm text-neutral-400 text-center px-4">
                  Point camera at the QR code
                </p>
              </div>
            )}
            {error && (
              <p className="mt-2 text-sm text-status-revoked text-center">{error}</p>
            )}
            <div className="mt-4 flex justify-center">
              {scanning ? (
                <Button variant="danger" onClick={stopCamera}>
                  <StopIcon className="h-4 w-4" />
                  Stop Camera
                </Button>
              ) : (
                <Button variant="primary" onClick={startCamera}>
                  <CameraIcon className="h-4 w-4" />
                  Start Camera
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Enter Digital ID Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value);
                  setError('');
                }}
                placeholder="e.g. DID-2024-00001"
                className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <Button variant="primary" onClick={handleManualVerify}>
                Verify
              </Button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-status-revoked">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
