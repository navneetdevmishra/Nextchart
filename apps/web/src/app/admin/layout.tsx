'use client';

import React from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  FileText,
  Activity,
  LogOut,
  Shield,
  MessageCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="h-screen w-screen flex bg-[#0e1621] text-white overflow-hidden select-none">
      {/* Sidebar */}
      <aside className="w-64 bg-[#17212B] border-r border-[#2b394a] flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-[#2b394a] flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#2AABEE] flex items-center justify-center font-bold text-white shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white">NexChat Admin</h1>
            <p className="text-[10px] text-[#2AABEE] font-semibold uppercase tracking-wider">
              Control Panel
            </p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => router.push('/admin')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              pathname === '/admin'
                ? 'bg-[#2AABEE] text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => router.push('/admin/users')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              pathname === '/admin/users'
                ? 'bg-[#2AABEE] text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management</span>
          </button>

          <button
            onClick={() => router.push('/admin/reports')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              pathname === '/admin/reports'
                ? 'bg-[#2AABEE] text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>User Reports</span>
          </button>

          <button
            onClick={() => router.push('/admin/audit-logs')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              pathname === '/admin/audit-logs'
                ? 'bg-[#2AABEE] text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Audit Logs</span>
          </button>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-[#2b394a] flex items-center justify-between">
          <div className="truncate">
            <h5 className="text-xs font-bold text-white truncate">@{user?.username || 'Admin'}</h5>
            <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/admin/login');
            }}
            title="Log Out"
            className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#0e1621] p-8">{children}</main>
    </div>
  );
}
