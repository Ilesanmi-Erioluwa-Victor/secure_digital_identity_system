import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

import Login from '../pages/auth/Login';
import SignUp from '../pages/auth/SignUp';
import OTPVerify from '../pages/auth/OTPVerify';
import TOTPVerify from '../pages/auth/TOTPVerify';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

import AdminDashboard from '../pages/admin/Dashboard';
import AdminIdentities from '../pages/admin/Identities';
import AdminNewIdentity from '../pages/admin/IssueIdentity';
import AdminIdentityDetail from '../pages/admin/IdentityDetail';
import AdminUsers from '../pages/admin/UserManagement';
import AdminLogs from '../pages/admin/AccessLogs';
import AdminReports from '../pages/admin/Reports';
import AdminSettings from '../pages/admin/Settings';

import LibrarianDashboard from '../pages/librarian/Dashboard';
import LibrarianVerify from '../pages/librarian/ScanVerify';
import LibrarianIdentities from '../pages/librarian/Identities';
import LibrarianLogs from '../pages/librarian/AccessLogs';

import UserDashboard from '../pages/user/Dashboard';
import UserMyID from '../pages/user/MyID';
import UserAccessHistory from '../pages/user/AccessHistory';
import UserSecurity from '../pages/user/Security';
import UserProfile from '../pages/user/Profile';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/verify-otp" element={<OTPVerify />} />
      <Route path="/verify-totp" element={<TOTPVerify />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/identities"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminIdentities />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/identities/new"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminNewIdentity />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/identities/:id"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminIdentityDetail />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminUsers />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminLogs />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminReports />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminSettings />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/librarian/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['librarian']}>
              <LibrarianDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/librarian/verify"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['librarian']}>
              <LibrarianVerify />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/librarian/identities"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['librarian']}>
              <LibrarianIdentities />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/librarian/logs"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['librarian']}>
              <LibrarianLogs />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student', 'staff']}>
              <UserDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/my-id"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student', 'staff']}>
              <UserMyID />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/access-history"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student', 'staff']}>
              <UserAccessHistory />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/security"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student', 'staff']}>
              <UserSecurity />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/profile"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student', 'staff']}>
              <UserProfile />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
