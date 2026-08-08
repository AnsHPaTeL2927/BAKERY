import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as adminApi from '../services/adminApi';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otpSessionToken, setOtpSessionToken] = useState(null);

  const refreshSession = useCallback(async () => {
    try {
      const { admin: current } = await adminApi.getMe();
      setAdmin(current);
      return current;
    } catch {
      setAdmin(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setLoading(false));
  }, [refreshSession]);

  const login = useCallback(async (email, password) => {
    const result = await adminApi.login(email, password);
    setOtpSessionToken(result.otpSessionToken || null);
    return result;
  }, []);

  const verifyOtp = useCallback(async (otp) => {
    const result = await adminApi.verifyOtp(otp, otpSessionToken);
    setAdmin(result.admin);
    return result;
  }, [otpSessionToken]);

  const resendOtp = useCallback(() => adminApi.resendOtp(otpSessionToken), [otpSessionToken]);

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } finally {
      setAdmin(null);
      setOtpSessionToken(null);
    }
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, verifyOtp, resendOtp, logout, refreshSession }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
