import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/services/apiClient';
import type { User, AuthResponse, RegisterCredentials, LoginCredentials } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signup: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app launch
  useEffect(() => {
    apiClient.setUnauthorizedHandler(() => setUser(null));
    void restoreSession();
    return () => apiClient.setUnauthorizedHandler(null);
  }, []);

  const restoreSession = async () => {
    try {
      const isAuth = await apiClient.isAuthenticated();
      if (isAuth) {
        // Fetch current user data
        const userData = await apiClient.get<User>('/auth/me');
        setUser(userData);
      }
    } catch {
      // A 401 clears the token in the API client's response interceptor.
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', credentials);
    await apiClient.setAccessToken(response.access_token);
    setUser(response.user);
    return response;
  };

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    await apiClient.setAccessToken(response.access_token);
    setUser(response.user);
    return response;
  };

  const logout = async () => {
    await apiClient.clearAuthTokens();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await apiClient.get<User>('/auth/me');
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
