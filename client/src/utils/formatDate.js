export function formatDate(date, format = 'PPP') {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const options = {
    PPP: {
      year: 'numeric', month: 'long', day: 'numeric',
    },
    PP: {
      year: 'numeric', month: 'short', day: 'numeric',
    },
    P: {
      year: 'numeric', month: '2-digit', day: '2-digit',
    },
    'PP HH:mm': {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    },
    'PPP HH:mm': {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    },
    HHmm: {
      hour: '2-digit', minute: '2-digit',
    },
    yyyyMM: {
      year: 'numeric', month: '2-digit',
    },
  }[format] || { year: 'numeric', month: 'short', day: 'numeric' };

  return d.toLocaleDateString('en-US', options);
}

export function formatRelativeDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date, 'PP');
}

export function isExpired(date) {
  if (!date) return false;
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  return d < new Date();
}

export function daysUntil(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const diffMs = d - now;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
