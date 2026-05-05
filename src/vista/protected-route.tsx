'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }

    if (!isLoading && user && pathname === '/login') {
      router.push('/dashboard');
    }

    // Role-based access control
    if (user && !isLoading) {
      if (user.role === 'Trabajador' && pathname !== '/movimientos') {
        router.push('/movimientos');
      }
      if (user.role === 'Gestor de Proyecto' && pathname === '/trabajadores') {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/20" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">Iniciando Sistema...</span>
        </div>
      </div>
    );
  }

  if (!user && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}