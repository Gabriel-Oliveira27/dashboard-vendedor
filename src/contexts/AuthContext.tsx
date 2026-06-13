"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Usuario } from "@/types";
import { API } from "@/lib/api";

const USER_KEY = "sublime_user";

interface AuthContextValue {
  user: Usuario | null;
  loading: boolean;
  setUser: (u: Usuario) => void;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  canView: (secao: string) => boolean;
  canEdit: (secao: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore from sessionStorage first
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      if (raw) {
        setUserState(JSON.parse(raw));
        setLoading(false);
        return;
      }
    } catch {}

    // Validate cookie via /api/auth/me
    API.me()
      .then((data) => {
        if (data?.usuario) {
          sessionStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
          setUserState(data.usuario);
        } else {
          window.location.replace("/");
        }
      })
      .catch(() => {
        window.location.replace("/");
      })
      .finally(() => setLoading(false));
  }, []);

  const setUser = useCallback((u: Usuario) => {
    sessionStorage.setItem(USER_KEY, JSON.stringify(u));
    setUserState(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      await API.logout();
    } catch {}
    sessionStorage.removeItem(USER_KEY);
    window.location.replace("/");
  }, []);

  const isAdmin = useCallback(() => !!user?.isAdmin, [user]);

  const canView = useCallback(
    (secao: string) => {
      if (!user) return false;
      if (user.isAdmin) return true;
      return !!(user.permissoes?.[secao as keyof typeof user.permissoes]?.ver);
    },
    [user]
  );

  const canEdit = useCallback(
    (secao: string) => {
      if (!user) return false;
      if (user.isAdmin) return true;
      return !!(user.permissoes?.[secao as keyof typeof user.permissoes]?.editar);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, setUser, logout, isAdmin, canView, canEdit }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
