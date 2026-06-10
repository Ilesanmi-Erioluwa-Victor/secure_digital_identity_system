import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bars3Icon, ChevronDownIcon, UserCircleIcon, ShieldCheckIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

const profileRoutes = {
  admin: '/admin/settings',
  librarian: '/user/security',
  student: '/user/security',
  staff: '/user/security',
};

export default function Navbar({ onToggleSidebar, title = 'Dashboard' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    navigate('/login', { replace: true });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-primary-dark flex items-center justify-between px-4 lg:px-6 shadow-lg">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-primary-light flex items-center justify-center text-white text-sm font-medium">
            {initials}
          </div>
          <span className="hidden sm:block text-sm font-medium">{user?.fullName || 'User'}</span>
          <ChevronDownIcon className="h-4 w-4" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-neutral-200 py-1">
            <div className="px-4 py-2 border-b border-neutral-100">
              <p className="text-sm font-medium text-neutral-900">{user?.fullName || 'User'}</p>
              <p className="text-xs text-neutral-400">{user?.email || ''}</p>
            </div>
            <button
              onClick={() => { setDropdownOpen(false); navigate(profileRoutes[user?.role] || '/user/security'); }}
              className="w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 text-left flex items-center gap-2"
            >
              <ShieldCheckIcon className="h-4 w-4" />
              Security Settings
            </button>
            <hr className="my-1 border-neutral-100" />
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-status-revoked hover:bg-red-50 text-left flex items-center gap-2"
            >
              <ArrowLeftOnRectangleIcon className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
