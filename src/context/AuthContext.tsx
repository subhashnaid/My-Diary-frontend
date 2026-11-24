import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';
import { profileApi } from '../api/profile';
import { UserProfile, LoginPayload, RegisterPayload } from '../types/user';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: Partial<UserProfile>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on page load
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginPayload) => {
    const data = await authApi.login(credentials);
    const authToken = data.token || data.access_token;
    setToken(authToken);
    setUser(data.user);

    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const register = async (payload: RegisterPayload) => {
    await authApi.register(payload);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (updatedUser: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  };

  const refreshUser = async () => {
    try {
      const data = await profileApi.getProfile();
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } catch (e) {
      console.warn('Could not refresh profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout, updateUser, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
