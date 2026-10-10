import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth.js';

const AuthContext = createContext(null);

const ROLE_HOME = {
  student: '/student',
  parent: '/parent',
  teacher: '/teacher',
  principal: '/principal',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback((token, nextUser) => {
    if (token) localStorage.setItem('gf_token', token);
    setUser(nextUser);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem('gf_token');
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('gf_token');
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .fetchMe()
      .then((data) => setUser(data.user))
      .catch(() => clear())
      .finally(() => setLoading(false));
  }, [clear]);

  const signup = useCallback(
    async (payload) => {
      const data = await authApi.signup(payload);
      persist(data.token, data.user);
      return data;
    },
    [persist]
  );

  const login = useCallback(
    async (payload) => {
      const data = await authApi.login(payload);
      persist(data.token, data.user);
      return data;
    },
    [persist]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clear();
    }
  }, [clear]);

  const refreshUser = useCallback(async () => {
    const data = await authApi.fetchMe();
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signup,
      login,
      logout,
      refreshUser,
      isAuthenticated: Boolean(user),
      homePath: user ? ROLE_HOME[user.role] : '/',
    }),
    [user, loading, signup, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ROLE_HOME };
