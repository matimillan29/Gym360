import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, GymConfig } from '../types';
import { authService } from '../services/auth';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  gymConfig: GymConfig | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsSetup: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginEntrenado: (email: string, password: string) => Promise<void>;
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshConfig: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [gymConfig, setGymConfig] = useState<GymConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const loadGymConfig = async () => {
    try {
      const response = await api.get<{ data: GymConfig | null; is_configured: boolean }>('/config');
      setGymConfig(response.data.data);
      setNeedsSetup(!response.data.is_configured);
    } catch {
      // Cualquier error (404, 500, tabla no existe) = no está configurado
      setNeedsSetup(true);
    }
  };

  const loadUser = async () => {
    if (!authService.isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch {
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadGymConfig();
      await loadUser();
    };
    init();
  }, []);

  // Actualizar favicon cuando cambia el logo del gym
  useEffect(() => {
    if (gymConfig?.logo) {
      const favicon = document.getElementById('dynamic-favicon') as HTMLLinkElement;
      if (favicon) {
        // El logo viene como path relativo desde storage
        const logoUrl = gymConfig.logo.startsWith('http')
          ? gymConfig.logo
          : `/storage/${gymConfig.logo}`;
        favicon.href = logoUrl;
      }
    }
  }, [gymConfig?.logo]);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setUser(response.user);
  };

  const loginEntrenado = async (email: string, password: string) => {
    const response = await authService.loginEntrenado(email, password);
    setUser(response.user);
  };

  const requestOtp = async (email: string) => {
    await authService.requestOtp(email);
  };

  const verifyOtp = async (email: string, code: string) => {
    const response = await authService.verifyOtp(email, code);
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  };

  const refreshConfig = async () => {
    await loadGymConfig();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        gymConfig,
        isLoading,
        isAuthenticated: !!user,
        needsSetup,
        login,
        loginEntrenado,
        requestOtp,
        verifyOtp,
        logout,
        refreshUser,
        refreshConfig,
      }}
    >
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
