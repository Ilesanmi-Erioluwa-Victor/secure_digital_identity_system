import Badge from '../common/Badge';

const actionStyles = {
  login: 'bg-blue-100 text-blue-800',
  logout: 'bg-neutral-100 text-neutral-700',
  verify: 'bg-green-100 text-green-800',
  issue: 'bg-purple-100 text-purple-800',
  revoke: 'bg-red-100 text-red-800',
  suspend: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
};

const outcomeStyles = {
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  suspicious: 'bg-amber-100 text-amber-800',
  denied: 'bg-red-100 text-red-800',
};

function formatTimestamp(ts) {
  if (!ts) return 'N/A';
  const d = new Date(ts);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function summarizeUserAgent(ua) {
  if (!ua) return 'Unknown';
  if (ua.includes('Mobile')) return 'Mobile Browser';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Browser';
}

export default function AccessLogRow({ log }) {
  if (!log) return null;

  const outcome = log.outcome || '';
  const isSuspicious = outcome === 'suspicious' || outcome === 'failed';

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 text-sm transition-colors hover:bg-neutral-50 ${
        isSuspicious ? 'border-l-4 border-l-status-suspended bg-amber-50/30' : ''
      }`}
    >
      <div className="flex-shrink-0 w-36 text-neutral-400 text-xs">
        {formatTimestamp(log.timestamp)}
      </div>

      <div className="flex-shrink-0">
        <span
          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
            actionStyles[log.action] || 'bg-neutral-100 text-neutral-600'
          }`}
        >
          {log.action ? log.action.charAt(0).toUpperCase() + log.action.slice(1) : 'N/A'}
        </span>
      </div>

      <div className="flex-shrink-0">
        <Badge
          variant={outcome === 'success' ? 'active' : outcome === 'suspicious' ? 'suspended' : 'revoked'}
          size="sm"
        >
          {outcome ? outcome.charAt(0).toUpperCase() + outcome.slice(1) : 'N/A'}
        </Badge>
      </div>

      <div className="flex-shrink-0 w-28 text-neutral-500 text-xs font-mono">
        {log.ipAddress || 'N/A'}
      </div>

      <div className="flex-1 text-neutral-400 text-xs truncate">
        {summarizeUserAgent(log.userAgent)}
      </div>

      {log.details && (
        <div className="flex-shrink-0 text-neutral-400 text-xs max-w-[120px] truncate">
          {log.details}
        </div>
      )}
    </div>
  );
}
