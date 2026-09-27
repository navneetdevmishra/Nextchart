'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthResponseDto } from '@nexchat/shared';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await apiFetch<AuthResponseDto>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setAuth(data.user, data.accessToken);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg mb-2">
            <MessageCircle className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Welcome back to NexChat</h1>
          <p className="text-xs text-muted-foreground">Sign in to access your chats and broadcast channels</p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-xs text-destructive text-center font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                required
                placeholder="alex@nexchat.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-accent/40 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-accent/40 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Accounts Quick Login */}
        <div className="pt-2 border-t border-border/50 text-center space-y-2">
          <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">
            Or Quick Login Demo Accounts:
          </span>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => { setEmail('alex@nexchat.io'); setPassword('Password123!'); }}
              className="px-3 py-1.5 bg-accent/50 hover:bg-accent rounded-lg text-xs font-medium border border-border/50"
            >
              @alex_dev
            </button>
            <button
              onClick={() => { setEmail('sarah@nexchat.io'); setPassword('Password123!'); }}
              className="px-3 py-1.5 bg-accent/50 hover:bg-accent rounded-lg text-xs font-medium border border-border/50"
            >
              @sarah_m
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Don't have a NexChat account?{' '}
          <Link href="/register" className="text-primary font-bold hover:underline">
            Register handle
          </Link>
        </p>
      </div>
    </div>
  );
}
