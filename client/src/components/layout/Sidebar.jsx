import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  IdentificationIcon,
  UserPlusIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ChartBarSquareIcon,
  Cog6ToothIcon,
  QrCodeIcon,
  ClockIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const adminLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/identities', label: 'Identities', icon: IdentificationIcon },
  { to: '/issue-identity', label: 'Issue Identity', icon: UserPlusIcon },
  { to: '/users', label: 'Users', icon: UsersIcon },
  { to: '/access-logs', label: 'Access Logs', icon: ClipboardDocumentListIcon },
  { to: '/reports', label: 'Reports', icon: ChartBarSquareIcon },
  { to: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

const librarianLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/scan-verify', label: 'Scan & Verify', icon: QrCodeIcon },
  { to: '/identities', label: 'Identities', icon: IdentificationIcon },
  { to: '/access-logs', label: 'Access Logs', icon: ClipboardDocumentListIcon },
];

const userLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/my-id-card', label: 'My ID Card', icon: IdentificationIcon },
  { to: '/access-history', label: 'Access History', icon: ClockIcon },
  { to: '/security', label: 'Security', icon: ShieldCheckIcon },
  { to: '/profile', label: 'Profile', icon: UserCircleIcon },
];

const roleLinks = {
  admin: adminLinks,
  librarian: librarianLinks,
  user: userLinks,
};

export default function Sidebar({ role = 'admin', isOpen, onClose }) {
  const links = roleLinks[role] || userLinks;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-primary-dark flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">
              D
            </div>
            <div className="text-white">
              <p className="text-sm font-semibold leading-tight">DSPoly</p>
              <p className="text-xs text-white/60 leading-tight">Library</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-white/60 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-light text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <link.icon className="h-5 w-5 flex-shrink-0" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors w-full">
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
