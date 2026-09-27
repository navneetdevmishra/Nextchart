'use client';

import React, { useEffect } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';

interface IncomingCallModalProps {
  callerName: string;
  callerAvatar?: string | null;
  callType: 'VOICE' | 'VIDEO';
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  callerName,
  callerAvatar,
  callType,
  onAccept,
  onReject,
}) => {
  // Keyboard navigation (Enter = Accept, Escape = Reject)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onAccept();
      } else if (e.key === 'Escape') {
        onReject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAccept, onReject]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm p-6 text-center bg-[#17212B] border border-[#2b394a] rounded-2xl shadow-2xl space-y-6 text-white">
        {/* Call Icon & Type */}
        <div className="flex items-center justify-center space-x-2 text-xs font-semibold tracking-wider text-[#2AABEE] uppercase">
          {callType === 'VIDEO' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          <span>Incoming {callType.toLowerCase()} call</span>
        </div>

        {/* Avatar */}
        <div className="relative flex justify-center">
          <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-[#2AABEE]/40 animate-pulse">
            {callerAvatar ? (
              <img src={callerAvatar} alt={callerName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#2AABEE] text-2xl font-bold flex items-center justify-center text-white">
                {callerName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* User Name */}
        <div>
          <h3 className="text-xl font-bold">{callerName}</h3>
          <p className="text-sm text-gray-400 mt-1">NexChat Voice & Video</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center space-x-8 pt-2">
          {/* Decline */}
          <button
            onClick={onReject}
            aria-label="Decline Call"
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all duration-200 transform group-hover:scale-110 shadow-lg shadow-red-600/30">
              <PhoneOff className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-400 group-hover:text-red-400">Decline (Esc)</span>
          </button>

          {/* Accept */}
          <button
            onClick={onAccept}
            aria-label="Accept Call"
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all duration-200 transform group-hover:scale-110 shadow-lg shadow-green-500/30">
              <Phone className="w-6 h-6 text-white animate-bounce" />
            </div>
            <span className="text-xs text-gray-400 group-hover:text-green-400">Accept (Enter)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
