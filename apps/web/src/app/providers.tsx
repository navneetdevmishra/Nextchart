'use client';

import React, { useEffect, useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { apiFetch } from '@/lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const { accessToken, setAuth, logout, setLoading } = useAuthStore();

  useEffect(() => {
    const verifyAuth = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        const data = await apiFetch<any>('/auth/me', {}, accessToken);
        setAuth(data.user, accessToken);
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [accessToken, setAuth, logout, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
