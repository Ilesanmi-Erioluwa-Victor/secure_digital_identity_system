export default function Badge({ children, variant = 'active', size = 'sm' }) {
  const variantClasses = {
    active: 'bg-green-100 text-green-800',
    valid: 'bg-green-100 text-green-800',
    suspended: 'bg-amber-100 text-amber-800',
    expired: 'bg-gray-100 text-gray-800',
    revoked: 'bg-red-100 text-red-800',
    invalid: 'bg-red-100 text-red-800',
    pending: 'bg-cyan-100 text-cyan-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantClasses[variant] || variantClasses.active} ${sizeClasses[size] || sizeClasses.sm}`}
    >
      {children}
    </span>
  );
}
