import Spinner from './Spinner';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  onClick,
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-light focus:ring-primary',
    secondary:
      'bg-white text-primary border border-primary hover:bg-primary-pale focus:ring-primary',
    danger: 'bg-status-revoked text-white hover:bg-red-700 focus:ring-red-500',
    ghost:
      'bg-transparent text-neutral-600 hover:bg-neutral-100 focus:ring-neutral-300',
    outline:
      'bg-transparent text-primary border border-primary hover:bg-primary-pale focus:ring-primary',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
