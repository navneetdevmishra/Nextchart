'use client';

import React, { useEffect, useState } from 'react';
import { X, Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { api } from '@/lib/api';

interface CallHistoryModalProps {
  onClose: () => void;
  onStartCall: (targetUserId: string, username: string, avatarUrl: string | null | undefined, type: 'VOICE' | 'VIDEO') => void;
  currentUserId?: string;
}

export const CallHistoryModal: React.FC<CallHistoryModalProps> = ({
  onClose,
  onStartCall,
  currentUserId,
}) => {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/calls/history')
      .then((res: any) => setCalls(res.data))
      .catch((err: any) => console.error('Failed to load call history:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#17212B] border border-[#2b394a] rounded-2xl shadow-2xl flex flex-col max-h-[80vh] text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2b394a]">
          <h2 className="text-lg font-bold flex items-center space-x-2">
            <Phone className="w-5 h-5 text-[#2AABEE]" />
            <span>Call History</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading calls...</div>
          ) : calls.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No call history found.</div>
          ) : (
            calls.map((call) => {
              const isOutgoing = call.callerId === currentUserId;
              const otherUser = isOutgoing ? call.recipient : call.caller;
              const isMissed = call.status === 'MISSED' || call.status === 'REJECTED';

              return (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#0e1621]/60 hover:bg-[#0e1621] border border-[#2b394a]/40 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    {/* User Avatar */}
                    <div className="w-11 h-11 rounded-full bg-[#2AABEE] flex items-center justify-center font-bold text-white text-base overflow-hidden">
                      {otherUser?.avatarUrl ? (
                        <img src={otherUser.avatarUrl} alt={otherUser.username} className="w-full h-full object-cover" />
                      ) : (
                        otherUser?.username?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm">{otherUser?.username || 'User'}</span>
                        {isOutgoing ? (
                          <PhoneOutgoing className="w-3.5 h-3.5 text-[#2AABEE]" />
                        ) : isMissed ? (
                          <PhoneMissed className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <PhoneIncoming className="w-3.5 h-3.5 text-green-500" />
                        )}
                      </div>

                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(call.createdAt).toLocaleDateString()} {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {call.duration ? ` • ${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : ` • ${call.status}`}
                      </p>
                    </div>
                  </div>

                  {/* Call Back Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        onStartCall(
                          otherUser.id,
                          otherUser.username,
                          otherUser.avatarUrl,
                          'VOICE',
                        )
                      }
                      title="Voice Call"
                      className="p-2 rounded-full bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 text-[#2AABEE] transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        onStartCall(
                          otherUser.id,
                          otherUser.username,
                          otherUser.avatarUrl,
                          'VIDEO',
                        )
                      }
                      title="Video Call"
                      className="p-2 rounded-full bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 text-[#2AABEE] transition-colors"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
