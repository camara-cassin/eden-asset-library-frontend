import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { setAuthToken, getAuthToken } from '../api/client';
import { login as apiLogin, signup as apiSignup, getMe } from '../api/auth';
import type { User, LoginRequest, SignupRequest } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const fetchUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await getMe();
      setUser(userData);
    } catch {
      setAuthToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (data: LoginRequest) => {
    const response = await apiLogin(data);
    setAuthToken(response.access_token);
    const userData = await getMe();
    setUser(userData);
  };

  const signup = async (data: SignupRequest) => {
    const response = await apiSignup(data);
    setAuthToken(response.access_token);
    setUser(response.user);
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
