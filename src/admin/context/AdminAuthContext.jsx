import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as adminApi from '../services/adminApi';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const login = useCallback((email, password) => adminApi.login(email, password), []);

  const verifyOtp = useCallback(async (otp) => {
    const result = await adminApi.verifyOtp(otp);
    setAdmin(result.admin);
    return result;
  }, []);

  const resendOtp = useCallback(() => adminApi.resendOtp(), []);

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } finally {
      setAdmin(null);
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
