import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  loginCustomer,
  registerCustomer,
  logoutCustomer,
  refreshToken as refreshTokenService,
  type LoginPayload,
  type RegisterPayload,
  type AuthResponse,
} from '@/services/authService';
import { getAccessToken, getRefreshToken, clearTokens } from '@/lib/tokenManager';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'zenvix_user';

function userFromResponse(res: AuthResponse): User {
  return {
    id: res.customer.id,
    name: res.customer.name,
    email: res.customer.email,
    phone: res.customer.phone,
  };
}

function persistUser(user: User): void {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // localStorage unavailable
  }
}

function loadPersistedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearPersistedUser(): void {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // silent
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Restore user from localStorage on mount if token exists
    const token = getAccessToken();
    if (token) {
      return loadPersistedUser();
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Attempt to validate the session on mount if we have a token but no user
  useEffect(() => {
    const token = getAccessToken();
    const refresh = getRefreshToken();
    if (token && !user && refresh) {
      // Try to refresh token to validate the session
      setIsLoading(true);
      refreshTokenService(refresh)
        .then((res) => {
          const restored = userFromResponse(res);
          setUser(restored);
          persistUser(restored);
        })
        .catch(() => {
          // Token invalid — clear everything
          clearTokens();
          clearPersistedUser();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await loginCustomer(payload);
      const u = userFromResponse(res);
      setUser(u);
      persistUser(u);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const res = await registerCustomer(payload);
      const u = userFromResponse(res);
      setUser(u);
      persistUser(u);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    logoutCustomer();
    clearTokens();
    clearPersistedUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
