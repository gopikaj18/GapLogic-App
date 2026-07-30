'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiFetch, saveAuthToken, clearAuthToken, getAuthToken } from './api-config';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface SessionContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: (email: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

async function parseJsonResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadSession = useCallback(async () => {
    try {
      // If there's a stored token, verify it's still valid via /api/auth/me
      // apiFetch will automatically attach the Bearer header
      if (!getAuthToken()) {
        setUser(null);
        setLoading(false);
        // Redirect to login client-side (localStorage not accessible server-side/middleware)
        const isPublic = ['/login', '/register'].includes(window.location.pathname);
        if (!isPublic) router.push('/login');
        return;
      }
      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
        if (!data.user) {
          clearAuthToken();
          router.push('/login');
        }
      } else {
        setUser(null);
        clearAuthToken();
        router.push('/login');
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = async (email: string, password: string) => {
    const data = await parseJsonResponse(
      await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
    );
    if (data.token) saveAuthToken(data.token);
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const data = await parseJsonResponse(
      await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
    );
    if (data.token) saveAuthToken(data.token);
    setUser(data.user);
  };

  const loginWithGoogle = async (email: string, name: string) => {
    const data = await parseJsonResponse(
      await apiFetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })
    );
    if (data.token) saveAuthToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    clearAuthToken();
    setUser(null);
    router.push('/login');
  };

  return (
    <SessionContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
