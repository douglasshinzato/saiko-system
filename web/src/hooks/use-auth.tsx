'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Carrega dados salvos no primeiro render
    const storedToken = localStorage.getItem('@saiko:token');
    const storedUser = localStorage.getItem('@saiko:user');

    if (storedToken && storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  // Monitora rotas para redirecionar se não estiver autenticado
  useEffect(() => {
    if (loading) return;

    const isPublicRoute = pathname === '/login';

    if (!user && !isPublicRoute) {
      router.push('/login');
    } else if (user && isPublicRoute) {
      router.push('/dashboard');
    }
  }, [user, pathname, loading, router]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: loggedUser } = response.data;

      localStorage.setItem('@saiko:token', token);
      localStorage.setItem('@saiko:user', JSON.stringify(loggedUser));

      setUser(loggedUser);
      toast.success(`Bem-vindo, ${loggedUser.name}!`);
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao fazer login. Tente novamente.';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('@saiko:token');
    localStorage.removeItem('@saiko:user');
    setUser(null);
    toast.info('Sessão encerrada.');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
