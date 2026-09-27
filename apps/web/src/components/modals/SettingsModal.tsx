'use client';

import React, { useState, useEffect } from 'react';
import { X, Shield, Lock, Bell, Smartphone, UserX, KeyRound } from 'lucide-react';
import { api } from '@/lib/api';
import { TwoFactorModal } from './TwoFactorModal';

interface SettingsModalProps {
  onClose: () => void;
  user: any;
  onUserUpdate: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  user,
  onUserUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'PRIVACY' | 'SESSIONS' | 'BLOCKED'>('PRIVACY');
  const [showLastSeen, setShowLastSeen] = useState(user?.profile?.showLastSeen ?? true);
  const [showReadReceipts, setShowReadReceipts] = useState(user?.profile?.showReadReceipts ?? true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'SESSIONS') {
      api.get('/privacy/sessions').then((res: any) => setSessions(res.data)).catch(() => {});
    } else if (activeTab === 'BLOCKED') {
      api.get('/privacy/blocked').then((res: any) => setBlockedUsers(res.data)).catch(() => {});
    }
  }, [activeTab]);

  const handleUpdatePrivacy = async (updated: { showLastSeen?: boolean; showReadReceipts?: boolean }) => {
    try {
      await api.put('/privacy/settings', updated);
      onUserUpdate();
    } catch (err) {
      console.error('Failed to update privacy settings:', err);
    }
  };

  const handleUnblock = async (blockedId: string) => {
    try {
      await api.post('/privacy/unblock', { blockedId });
      setBlockedUsers((prev) => prev.filter((b) => b.blockedId !== blockedId));
    } catch (err) {
      console.error('Failed to unblock user:', err);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.delete(`/privacy/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error('Failed to revoke session:', err);
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      await api.delete('/privacy/sessions/other/all');
      setSessions((prev) => prev.filter((s) => s.isCurrent));
    } catch (err) {
      console.error('Failed to revoke other sessions:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#17212B] border border-[#2b394a] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] text-white overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2b394a]">
          <h2 className="text-lg font-bold flex items-center space-x-2">
            <Shield className="w-5 h-5 text-[#2AABEE]" />
            <span>Settings & Privacy</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2b394a] bg-[#0e1621]/40">
          <button
            onClick={() => setActiveTab('PRIVACY')}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-1.5 border-b-2 transition-all ${
              activeTab === 'PRIVACY'
                ? 'border-[#2AABEE] text-[#2AABEE] bg-[#2AABEE]/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Privacy</span>
          </button>
          <button
            onClick={() => setActiveTab('SESSIONS')}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-1.5 border-b-2 transition-all ${
              activeTab === 'SESSIONS'
                ? 'border-[#2AABEE] text-[#2AABEE] bg-[#2AABEE]/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Active Sessions</span>
          </button>
          <button
            onClick={() => setActiveTab('BLOCKED')}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-1.5 border-b-2 transition-all ${
              activeTab === 'BLOCKED'
                ? 'border-[#2AABEE] text-[#2AABEE] bg-[#2AABEE]/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <UserX className="w-4 h-4" />
            <span>Blocked</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'PRIVACY' && (
            <div className="space-y-6">
              {/* Privacy Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e1621] border border-[#2b394a]">
                  <div>
                    <h4 className="font-semibold text-sm">Last Seen & Online Status</h4>
                    <p className="text-xs text-gray-400">Show when you were last active</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showLastSeen}
                    onChange={(e) => {
                      setShowLastSeen(e.target.checked);
                      handleUpdatePrivacy({ showLastSeen: e.target.checked });
                    }}
                    className="w-5 h-5 accent-[#2AABEE] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e1621] border border-[#2b394a]">
                  <div>
                    <h4 className="font-semibold text-sm">Read Receipts</h4>
                    <p className="text-xs text-gray-400">Send read acknowledgements</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showReadReceipts}
                    onChange={(e) => {
                      setShowReadReceipts(e.target.checked);
                      handleUpdatePrivacy({ showReadReceipts: e.target.checked });
                    }}
                    className="w-5 h-5 accent-[#2AABEE] cursor-pointer"
                  />
                </div>
              </div>

              {/* 2FA Section */}
              <div className="p-4 rounded-xl bg-[#0e1621] border border-[#2b394a] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-[#2AABEE]/10 text-[#2AABEE]">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Two-Factor Authentication</h4>
                    <p className="text-xs text-gray-400">
                      {user?.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShow2FAModal(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2AABEE] hover:bg-[#2297d6] text-white transition-colors"
                >
                  Configure
                </button>
              </div>
            </div>
          )}

          {activeTab === 'SESSIONS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Active logins on your account</p>
                <button
                  onClick={handleRevokeOtherSessions}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold"
                >
                  Terminate All Other Sessions
                </button>
              </div>

              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e1621] border border-[#2b394a]"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm">{sess.deviceInfo}</span>
                      {sess.isCurrent && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400 font-bold uppercase">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      IP: {sess.ipAddress || 'Unknown'} • Created: {new Date(sess.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(sess.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'BLOCKED' && (
            <div className="space-y-3">
              {blockedUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No blocked users</div>
              ) : (
                blockedUsers.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e1621] border border-[#2b394a]"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-[#2AABEE] flex items-center justify-center text-white font-bold">
                        {b.blocked?.avatarUrl ? (
                          <img src={b.blocked.avatarUrl} alt={b.blocked.username} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          b.blocked?.username?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      <span className="font-semibold text-sm">{b.blocked?.username || 'User'}</span>
                    </div>
                    <button
                      onClick={() => handleUnblock(b.blockedId)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors"
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {show2FAModal && (
        <TwoFactorModal
          onClose={() => setShow2FAModal(false)}
          is2FAEnabled={!!user?.isTwoFactorEnabled}
          onSuccess={onUserUpdate}
        />
      )}
    </div>
  );
};
