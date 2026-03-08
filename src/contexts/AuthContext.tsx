import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  loginCustomer,
  registerCustomer,
  logoutCustomer,
  type LoginPayload,
  type RegisterPayload,
  type AuthResponse,
} from '@/services/authService';
import { getAccessToken, clearTokens } from '@/lib/tokenManager';

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

function userFromResponse(res: AuthResponse): User {
  return {
    id: res.customer.id,
    name: res.customer.name,
    email: res.customer.email,
    phone: res.customer.phone,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Restore session from token on mount
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      // Token exists — we have an active session but no user object cached.
      // A full restore would call /auth/me. For now we mark as "possibly authenticated"
      // and let the next authenticated API call handle 401 refresh.
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await loginCustomer(payload);
      setUser(userFromResponse(res));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const res = await registerCustomer(payload);
      setUser(userFromResponse(res));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    logoutCustomer();
    clearTokens();
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
