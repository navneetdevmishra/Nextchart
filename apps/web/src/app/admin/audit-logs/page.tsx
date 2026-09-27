'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Shield } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/audit-logs')
      .then((res: any) => setLogs(res.data.items))
      .catch((err: any) => console.error('Failed to load audit logs:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Audit Logs</h1>
        <p className="text-xs text-gray-400 mt-1">Immutable administrative action history and audit trails</p>
      </div>

      <div className="bg-[#17212B] border border-[#2b394a] rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#2b394a] bg-[#0e1621]/50 text-xs font-semibold uppercase text-gray-400">
              <th className="p-4">Admin</th>
              <th className="p-4">Action</th>
              <th className="p-4">Target</th>
              <th className="p-4">Details</th>
              <th className="p-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2b394a] text-sm">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  No audit logs recorded yet
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-semibold text-white">
                    @{log.admin?.username || 'System'}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#2AABEE]/20 text-[#2AABEE] border border-[#2AABEE]/30 uppercase">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-mono text-gray-300">
                    {log.targetType}: {log.targetId.substring(0, 8)}
                  </td>
                  <td className="p-4 text-xs text-gray-300">
                    {log.details || 'N/A'}
                  </td>
                  <td className="p-4 text-right text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleString()}
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
