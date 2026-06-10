import { CheckBadgeIcon, XCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/solid';
import Badge from '../common/Badge';
import Button from '../common/Button';

const statusConfig = {
  VALID: {
    icon: CheckBadgeIcon,
    bg: 'bg-status-valid',
    title: 'IDENTITY VERIFIED',
    subtitle: 'Access Granted',
    iconColor: 'text-white',
  },
  EXPIRED: {
    icon: ClockIcon,
    bg: 'bg-status-expired',
    title: 'IDENTITY EXPIRED',
    subtitle: null,
    iconColor: 'text-white',
  },
  SUSPENDED: {
    icon: ExclamationTriangleIcon,
    bg: 'bg-status-suspended',
    title: 'IDENTITY SUSPENDED',
    subtitle: null,
    iconColor: 'text-white',
  },
  REVOKED: {
    icon: XCircleIcon,
    bg: 'bg-status-revoked',
    title: 'IDENTITY REVOKED',
    subtitle: 'This identity has been permanently revoked',
    iconColor: 'text-white',
  },
  INVALID: {
    icon: XCircleIcon,
    bg: 'bg-status-revoked',
    title: 'INVALID IDENTITY',
    subtitle: 'This identity appears to be tampered with',
    iconColor: 'text-white',
  },
};

export default function VerifyResult({ result, onReset }) {
  if (!result) return null;

  const { status, identity } = result;
  const config = statusConfig[status] || statusConfig.INVALID;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className={`${config.bg} px-6 py-8 text-center`}>
          <Icon className={`h-16 w-16 mx-auto mb-3 ${config.iconColor}`} />
          <h2 className="text-2xl font-bold text-white">{config.title}</h2>
          {config.subtitle && (
            <p className="text-white/80 mt-1 text-sm">{config.subtitle}</p>
          )}
          {status === 'EXPIRED' && identity?.expiryDate && (
            <p className="text-white/80 mt-1 text-sm">
              Expired on: {new Date(identity.expiryDate).toLocaleDateString('en-GB')}
            </p>
          )}
          {status === 'SUSPENDED' && result.reason && (
            <p className="text-white/80 mt-1 text-sm">Reason: {result.reason}</p>
          )}
        </div>

        {identity && (
          <div className="px-6 py-6">
            <div className="flex flex-col items-center mb-6">
              <div className="h-20 w-20 rounded-full bg-neutral-100 border-2 border-neutral-200 overflow-hidden flex items-center justify-center mb-3">
                {identity.photoUrl ? (
                  <img
                    src={identity.photoUrl}
                    alt={identity.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    {identity.fullName?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-neutral-900">
                {identity.fullName || 'Unknown'}
              </h3>
              <p className="text-sm font-mono text-neutral-400">
                {identity.digitalId || 'N/A'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={status === 'VALID' ? 'active' : status.toLowerCase()} size="sm">
                  {identity.role || 'N/A'}
                </Badge>
                <span className="text-xs text-neutral-400">
                  {identity.accessLevel || 'N/A'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-400 text-xs">Department</span>
                <p className="font-medium text-neutral-700">
                  {identity.department || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-neutral-400 text-xs">Matric/Staff ID</span>
                <p className="font-medium text-neutral-700">
                  {identity.matricId || 'N/A'}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-neutral-400 text-xs">Expiry Date</span>
                <p className="font-medium text-neutral-700">
                  {identity.expiryDate
                    ? new Date(identity.expiryDate).toLocaleDateString('en-GB')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t border-neutral-100 flex justify-center">
          <Button variant="primary" onClick={onReset}>
            Scan Another
          </Button>
        </div>
      </div>
    </div>
  );
}
