import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loginUrl: string;
  /** Stub: call this to simulate login for dev purposes */
  devLogin: () => void;
  devLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Stub login URL — replace with real Zenvix/SSO URL later
const LOGIN_URL = '/login';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const devLogin = useCallback(() => {
    setUser({ id: 'dev-user-1', name: 'Test User', email: 'test@example.com' });
  }, []);

  const devLogout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loginUrl: LOGIN_URL, devLogin, devLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
