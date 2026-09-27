'use client';

import React, { useEffect, useState } from 'react';
import { Search, ShieldAlert, CheckCircle, UserX, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [suspendedFilter, setSuspendedFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (role) params.append('role', role);
    if (suspendedFilter) params.append('isSuspended', suspendedFilter);

    api
      .get(`/admin/users?${params.toString()}`)
      .then((res: any) => {
        setUsers(res.data.items);
        setTotal(res.data.total);
      })
      .catch((err: any) => console.error('Failed to load users:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [role, suspendedFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleSuspend = async (userId: string, username: string) => {
    const reason = prompt(`Enter suspension reason for user @${username}:`);
    if (reason === null) return;

    try {
      await api.post(`/admin/users/${userId}/suspend`, { reason });
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to suspend user');
    }
  };

  const handleReinstate = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/reinstate`);
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to reinstate user');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">User Management</h1>
        <p className="text-xs text-gray-400 mt-1">Search, moderate and manage NexChat accounts</p>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#17212B] p-4 rounded-2xl border border-[#2b394a]">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search username or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0e1621] rounded-xl border border-[#2b394a] text-sm text-white focus:outline-none focus:border-[#2AABEE]"
          />
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0e1621] border border-[#2b394a] text-xs text-white focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select
            value={suspendedFilter}
            onChange={(e) => setSuspendedFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0e1621] border border-[#2b394a] text-xs text-white focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="false">Active</option>
            <option value="true">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#17212B] border border-[#2b394a] rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#2b394a] bg-[#0e1621]/50 text-xs font-semibold uppercase text-gray-400">
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">2FA</th>
              <th className="p-4">Joined Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2b394a] text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  No users found matching query
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-[#2AABEE] flex items-center justify-center font-bold text-white">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white">@{u.username}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.isSuspended ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                        <ShieldAlert className="w-3 h-3" />
                        <span>Suspended</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-green-500/20 text-green-400 border border-green-500/30">
                        <CheckCircle className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-xs font-medium text-gray-300">
                    {u.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </td>
                  <td className="p-4 text-xs text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    {u.role !== 'ADMIN' && (
                      u.isSuspended ? (
                        <button
                          onClick={() => handleReinstate(u.id)}
                          className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-semibold transition-colors"
                        >
                          Reinstate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspend(u.id, u.username)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors"
                        >
                          Suspend
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
