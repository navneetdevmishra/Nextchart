'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, accessToken } = res.data;

      if (user.role !== 'ADMIN') {
        setError('Access denied. Administrator privileges required.');
        setLoading(false);
        return;
      }

      setAuth(user, accessToken);
      router.push('/admin');
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0e1621] text-white p-4">
      <div className="w-full max-w-md bg-[#17212B] border border-[#2b394a] rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#2AABEE]/10 text-[#2AABEE] flex items-center justify-center border border-[#2AABEE]/30 shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">NexChat Admin Portal</h1>
          <p className="text-xs text-gray-400">Sign in with administrator credentials</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@nexchat.io"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0e1621] border border-[#2b394a] text-sm focus:outline-none focus:border-[#2AABEE]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0e1621] border border-[#2b394a] text-sm focus:outline-none focus:border-[#2AABEE]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#2AABEE] hover:bg-[#2297d6] text-white font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-[#2AABEE]/20 transition-all disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Sign In to Admin Portal</span>
          </button>
        </form>
      </div>
    </div>
  );
}
