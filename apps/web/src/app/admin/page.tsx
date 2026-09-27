'use client';

import React, { useEffect, useState } from 'react';
import { Users, UserX, UsersRound, Radio, PhoneCall, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats').then((r: any) => r.data),
      api.get('/admin/metrics').then((r: any) => r.data),
    ])
      .then(([statsData, metricsData]) => {
        setStats(statsData);
        setMetrics(metricsData);
      })
      .catch((err) => console.error('Failed to load admin stats:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-400 py-10">Loading system metrics...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">System Overview</h1>
        <p className="text-xs text-gray-400 mt-1">Real-time operational metrics for NexChat platform</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-[#17212B] border border-[#2b394a] flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Total Users</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{stats?.totalUsers ?? 0}</h3>
            <p className="text-[11px] text-green-400 mt-1 font-medium">{stats?.onlineUsers ?? 0} online now</p>
          </div>
          <div className="p-3 rounded-xl bg-[#2AABEE]/10 text-[#2AABEE]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Suspended Accounts */}
        <div className="p-5 rounded-2xl bg-[#17212B] border border-[#2b394a] flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Suspended Users</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{stats?.suspendedUsers ?? 0}</h3>
            <p className="text-[11px] text-red-400 mt-1 font-medium">Moderated accounts</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        {/* Total Groups */}
        <div className="p-5 rounded-2xl bg-[#17212B] border border-[#2b394a] flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Active Groups</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{stats?.totalGroups ?? 0}</h3>
            <p className="text-[11px] text-[#2AABEE] mt-1 font-medium">{stats?.totalChannels ?? 0} channels</p>
          </div>
          <div className="p-3 rounded-xl bg-[#2AABEE]/10 text-[#2AABEE]">
            <UsersRound className="w-6 h-6" />
          </div>
        </div>

        {/* Total Calls */}
        <div className="p-5 rounded-2xl bg-[#17212B] border border-[#2b394a] flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase">Total Calls</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{stats?.totalCalls ?? 0}</h3>
            <p className="text-[11px] text-sky-400 mt-1 font-medium">Voice & Video Sessions</p>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
            <PhoneCall className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#17212B] border border-[#2b394a] space-y-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-[#2AABEE]" />
            <h3 className="font-bold text-lg">Server Metrics</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-[#2b394a]">
              <span className="text-gray-400">System Status</span>
              <span className="text-green-400 font-semibold uppercase">{stats?.systemHealth}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#2b394a]">
              <span className="text-gray-400">Memory Usage</span>
              <span className="font-mono text-white">{metrics?.memoryAllocatedMb ?? 0} MB</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#2b394a]">
              <span className="text-gray-400">Uptime</span>
              <span className="font-mono text-white">{metrics?.uptimeSeconds ?? 0} seconds</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Node Runtime</span>
              <span className="font-mono text-white">{metrics?.nodeVersion} ({metrics?.platform})</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-2xl bg-[#17212B] border border-[#2b394a] space-y-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#2AABEE]" />
            <h3 className="font-bold text-lg">Security & Privacy Guard</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Admin accounts operate with zero-knowledge access to private direct messages. All administrative actions (user suspension, report resolution) are recorded in permanent audit logs.
          </p>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
            ⚠️ {stats?.pendingReports ?? 0} user reports pending moderation review.
          </div>
        </div>
      </div>
    </div>
  );
}
