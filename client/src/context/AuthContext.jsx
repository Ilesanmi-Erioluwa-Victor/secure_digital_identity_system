import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mfaData, setMfaData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api
        .getMe()
        .then((res) => setUser(res.user))
        .catch(() => {
          localStorage.removeItem('accessToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    if (data.mfaRequired) {
      setMfaData({ email, method: data.method });
      return { mfaRequired: true, method: data.method, email };
    }
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    return { mfaRequired: false, user: data.user };
  }, []);

  const verifyOtp = useCallback(async (email, otp) => {
    const data = await api.verifyOtp(email, otp);
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    setMfaData(null);
    return data.user;
  }, []);

  const verifyTotp = useCallback(async (email, totp) => {
    const data = await api.verifyTotp(email, totp);
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    setMfaData(null);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('accessToken');
    setUser(null);
    setMfaData(null);
  }, []);

  const isAuthenticated = !!user;
  const userRole = user?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        verifyOtp,
        verifyTotp,
        logout,
        mfaData,
        isAuthenticated,
        userRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
