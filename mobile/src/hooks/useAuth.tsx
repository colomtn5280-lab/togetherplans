import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, saveToken, clearToken, getToken } from '@/services/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithToken: (data: { token: string; refreshToken?: string; user: User }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await getToken();
        if (stored) {
          setToken(stored);
          const res = await authAPI.me();
          setUser(res.data);
        }
      } catch {
        await clearToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password);
    const { token: t, accessToken, refreshToken, user: u } = res.data;
    const tok = accessToken || t;
    await saveToken(tok, refreshToken);
    setToken(tok);
    setUser(u);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const res = await authAPI.register(email, password, displayName);
    const { token: t, accessToken, refreshToken, user: u } = res.data;
    const tok = accessToken || t;
    await saveToken(tok, refreshToken);
    setToken(tok);
    setUser(u);
  };

  const logout = async () => {
    await clearToken();
    setToken(null);
    setUser(null);
  };

  const loginWithToken = async (data: { token: string; refreshToken?: string; user: User }) => {
    const { token: t, refreshToken, user: u } = data;
    await saveToken(t, refreshToken);
    setToken(t);
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
