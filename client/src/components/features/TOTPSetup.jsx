import { useState } from 'react';
import Button from '../common/Button';
import OTPInput from './OTPInput';

export default function TOTPSetup({ setupData, onEnabled }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!setupData) return null;

  const { qrCode: qrCodeUrl, secret } = setupData;

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      onEnabled?.(code);
    } catch {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Set Up Two-Factor Authentication
        </h3>

        <ol className="space-y-4 mb-6">
          <li className="flex gap-3">
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <div>
              <p className="text-sm font-medium text-neutral-700">
                Install Authenticator App
              </p>
              <p className="text-xs text-neutral-400">
                Download Google Authenticator or Authy
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <div>
              <p className="text-sm font-medium text-neutral-700">
                Scan QR Code
              </p>
              <p className="text-xs text-neutral-400 mb-2">
                Open the app and scan this code
              </p>
              <div className="flex justify-center p-3 bg-white border border-neutral-200 rounded-lg">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="TOTP QR Code"
                    className="h-40 w-40"
                  />
                ) : (
                  <div className="h-40 w-40 bg-neutral-100 flex items-center justify-center text-neutral-400 text-sm">
                    No QR Available
                  </div>
                )}
              </div>
              {secret && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-neutral-400 mb-1">
                    Or enter this code manually:
                  </p>
                  <code className="text-xs font-mono bg-neutral-100 px-2 py-1 rounded text-primary">
                    {secret}
                  </code>
                </div>
              )}
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-700">
                Enter the 6-digit code
              </p>
              <p className="text-xs text-neutral-400 mb-3">
                Enter the code shown in your authenticator app
              </p>
              <OTPInput
                length={6}
                value={code}
                onChange={setCode}
                error={error}
              />
            </div>
          </li>
        </ol>

        <Button
          variant="primary"
          className="w-full"
          onClick={handleVerify}
          loading={loading}
          disabled={code.length !== 6}
        >
          Verify & Enable
        </Button>
      </div>
    </div>
  );
}
