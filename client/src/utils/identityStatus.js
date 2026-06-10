export function getStatusColor(status) {
  const colors = {
    active: 'text-status-active bg-status-active/10 border-status-active/20',
    suspended: 'text-status-suspended bg-status-suspended/10 border-status-suspended/20',
    expired: 'text-status-expired bg-status-expired/10 border-status-expired/20',
    revoked: 'text-status-revoked bg-status-revoked/10 border-status-revoked/20',
    pending: 'text-status-pending bg-status-pending/10 border-status-pending/20',
    valid: 'text-status-valid bg-status-valid/10 border-status-valid/20',
    invalid: 'text-status-invalid bg-status-invalid/10 border-status-invalid/20',
  };
  return colors[status?.toLowerCase()] || 'text-neutral-500 bg-neutral-100 border-neutral-200';
}

export function getStatusLabel(status) {
  const labels = {
    active: 'Active',
    suspended: 'Suspended',
    expired: 'Expired',
    revoked: 'Revoked',
    pending: 'Pending',
    valid: 'Valid',
    invalid: 'Invalid',
  };
  return labels[status?.toLowerCase()] || status || 'Unknown';
}

export function getAccessLevelLabel(level) {
  const labels = {
    admin: 'Administrator',
    staff: 'Staff',
    student: 'Student',
    faculty: 'Faculty',
    visitor: 'Visitor',
    guest: 'Guest',
  };
  return labels[level?.toLowerCase()] || level || 'Unknown';
}
