import axiosInstance from './axiosInstance';

const api = {
  // Auth
  register: (data) =>
    axiosInstance.post('/auth/register', data).then((res) => res.data),

  login: (email, password) =>
    axiosInstance.post('/auth/login', { email, password }).then((res) => res.data),

  verifyOtp: (email, otp) =>
    axiosInstance.post('/auth/verify-otp', { email, otp }).then((res) => res.data),

  verifyTotp: (email, totp) =>
    axiosInstance.post('/auth/verify-totp', { email, totp }).then((res) => res.data),

  refreshToken: () =>
    axiosInstance.post('/auth/refresh').then((res) => res.data),

  logout: () =>
    axiosInstance.post('/auth/logout').then((res) => res.data),

  forgotPassword: (email) =>
    axiosInstance.post('/auth/forgot-password', { email }).then((res) => res.data),

  resetPassword: (token, password) =>
    axiosInstance.post('/auth/reset-password', { token, password }).then((res) => res.data),

  getMe: () =>
    axiosInstance.get('/auth/me').then((res) => res.data),

  // Identity
  issueIdentity: (formData) =>
    axiosInstance.post('/identity', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data),

  getAllIdentities: (params) =>
    axiosInstance.get('/identity', { params }).then((res) => res.data),

  getMyIdentity: () =>
    axiosInstance.get('/identity/my').then((res) => res.data),

  getIdentity: (id) =>
    axiosInstance.get(`/identity/${id}`).then((res) => res.data),

  updateIdentity: (id, data) =>
    axiosInstance.put(`/identity/${id}`, data).then((res) => res.data),

  suspendIdentity: (id, reason) =>
    axiosInstance.post(`/identity/${id}/suspend`, { reason }).then((res) => res.data),

  activateIdentity: (id) =>
    axiosInstance.post(`/identity/${id}/activate`).then((res) => res.data),

  revokeIdentity: (id, reason) =>
    axiosInstance.post(`/identity/${id}/revoke`, { reason }).then((res) => res.data),

  renewIdentity: (id) =>
    axiosInstance.post(`/identity/${id}/renew`).then((res) => res.data),

  downloadIDCard: (id) =>
    axiosInstance.get(`/identity/${id}/download`, { responseType: 'blob' }).then((res) => res.data),

  updateIdentityPhoto: (id, formData) =>
    axiosInstance.put(`/identity/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data),

  // Verify
  verifyQRToken: (token) =>
    axiosInstance.get(`/verify/${token}`).then((res) => res.data),

  // Users
  createUser: (data) =>
    axiosInstance.post('/users', data).then((res) => res.data),

  getAllUsers: (params) =>
    axiosInstance.get('/users', { params }).then((res) => res.data),

  getUser: (id) =>
    axiosInstance.get(`/users/${id}`).then((res) => res.data),

  updateUser: (id, data) =>
    axiosInstance.put(`/users/${id}`, data).then((res) => res.data),

  unlockUser: (id) =>
    axiosInstance.post(`/users/${id}/unlock`).then((res) => res.data),

  deactivateUser: (id) =>
    axiosInstance.post(`/users/${id}/deactivate`).then((res) => res.data),

  // TOTP
  getTOTPSetup: () =>
    axiosInstance.get('/auth/totp/setup').then((res) => res.data),

  enableTOTP: (token) =>
    axiosInstance.post('/auth/totp/enable', { token }).then((res) => res.data),

  disableTOTP: (password) =>
    axiosInstance.post('/auth/totp/disable', { password }).then((res) => res.data),

  // Access Logs
  getAllLogs: (params) =>
    axiosInstance.get('/logs', { params }).then((res) => res.data),

  getMyLogs: (params) =>
    axiosInstance.get('/logs/me', { params }).then((res) => res.data),

  exportLogs: () =>
    axiosInstance.get('/logs/export', { responseType: 'blob' }).then((res) => res.data),

  // Reports
  getSummary: () =>
    axiosInstance.get('/reports/summary').then((res) => res.data),

  getMonthlyIssuance: () =>
    axiosInstance.get('/reports/monthly-issuance').then((res) => res.data),

  getAccessSummary: () =>
    axiosInstance.get('/reports/access-summary').then((res) => res.data),

  getRoleBreakdown: () =>
    axiosInstance.get('/reports/role-breakdown').then((res) => res.data),

  exportIdentitiesReport: () =>
    axiosInstance.get('/reports/identities/export', { responseType: 'blob' }).then((res) => res.data),

  exportAccessLogsReport: () =>
    axiosInstance.get('/reports/access-logs/export', { responseType: 'blob' }).then((res) => res.data),

  // Settings
  getSettings: () =>
    axiosInstance.get('/settings').then((res) => res.data),

  updateSettings: (data) =>
    axiosInstance.put('/settings', data).then((res) => res.data),
};

export default api;
