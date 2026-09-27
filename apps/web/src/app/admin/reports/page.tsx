'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    setLoading(true);
    api
      .get(`/admin/reports?status=${status}`)
      .then((res: any) => setReports(res.data.items))
      .catch((err: any) => console.error('Failed to load reports:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, [status]);

  const handleResolve = async (reportId: string, resolution: 'RESOLVED' | 'DISMISSED') => {
    try {
      await api.post(`/admin/reports/${reportId}/resolve`, { resolution });
      fetchReports();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update report status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">User Reports & Moderation</h1>
          <p className="text-xs text-gray-400 mt-1">Review user abuse reports and moderation flags</p>
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#17212B] border border-[#2b394a] text-xs text-white focus:outline-none"
        >
          <option value="PENDING">Pending Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-gray-400 py-10 text-center">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#17212B] border border-[#2b394a] text-center text-gray-400 text-sm">
            No {status.toLowerCase()} reports found
          </div>
        ) : (
          reports.map((rep) => (
            <div
              key={rep.id}
              className="p-5 rounded-2xl bg-[#17212B] border border-[#2b394a] flex items-center justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 uppercase">
                    Report #{rep.id.substring(0, 8)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(rep.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="text-sm">
                  <span className="text-gray-400">Reporter:</span>{' '}
                  <span className="font-semibold text-white">@{rep.reporter?.username}</span>{' '}
                  <span className="text-gray-400 font-normal">reported</span>{' '}
                  <span className="font-semibold text-red-400">@{rep.reportedUser?.username}</span>
                </div>

                <p className="text-xs bg-[#0e1621] p-3 rounded-xl border border-[#2b394a] text-gray-300 font-mono">
                  "{rep.reason}"
                </p>
              </div>

              {rep.status === 'PENDING' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleResolve(rep.id, 'RESOLVED')}
                    className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-semibold border border-green-500/30 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Resolve</span>
                  </button>
                  <button
                    onClick={() => handleResolve(rep.id, 'DISMISSED')}
                    className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 text-xs font-semibold border border-gray-500/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Dismiss</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
