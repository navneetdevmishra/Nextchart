'use client';

import React, { useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  PhoneOff,
  Maximize2,
  Minimize2,
  Volume2,
} from 'lucide-react';
import { ActiveCall } from '@/hooks/useWebRTC';

interface CallOverlayProps {
  activeCall: ActiveCall;
  callState: 'IDLE' | 'CALLING' | 'RINGING' | 'CONNECTED' | 'ENDED';
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  duration: number;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({
  activeCall,
  callState,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  isScreenSharing,
  duration,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Attach media streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const togglePip = async () => {
    if (remoteVideoRef.current && document.pictureInPictureEnabled) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await remoteVideoRef.current.requestPictureInPicture();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0e1621] text-white select-none">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#2AABEE] flex items-center justify-center font-bold text-white text-lg overflow-hidden">
            {activeCall.targetAvatarUrl ? (
              <img src={activeCall.targetAvatarUrl} alt={activeCall.targetUsername} className="w-full h-full object-cover" />
            ) : (
              activeCall.targetUsername.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{activeCall.targetUsername}</h3>
            <p className="text-xs text-[#2AABEE] font-medium">
              {callState === 'CONNECTED' ? formatDuration(duration) : 'Connecting...'}
            </p>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePip}
            title="Picture in Picture"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Maximize2 className="w-5 h-5 text-gray-200" />
          </button>
        </div>
      </div>

      {/* Center Stream Display */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-[#17212B]">
        {/* Remote Stream Video */}
        {activeCall.type === 'VIDEO' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          /* Voice Call Avatar Display */
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative w-36 h-36 rounded-full overflow-hidden ring-4 ring-[#2AABEE]/50 shadow-2xl animate-pulse">
              {activeCall.targetAvatarUrl ? (
                <img src={activeCall.targetAvatarUrl} alt={activeCall.targetUsername} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#2AABEE] text-4xl font-bold flex items-center justify-center text-white">
                  {activeCall.targetUsername.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">{activeCall.targetUsername}</h2>
              <p className="text-sm text-gray-400 mt-1">NexChat Voice Call</p>
            </div>
          </div>
        )}

        {/* Local Stream Thumbnail (Pip) */}
        {activeCall.type === 'VIDEO' && (
          <div className="absolute bottom-28 right-6 z-20 w-36 h-52 rounded-xl overflow-hidden shadow-2xl border-2 border-[#2b394a] bg-black">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-center p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent space-x-6">
        {/* Mute Toggle */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          className={`p-4 rounded-full transition-all duration-200 transform hover:scale-105 ${
            isMuted ? 'bg-red-500 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Video Toggle */}
        {activeCall.type === 'VIDEO' && (
          <button
            onClick={onToggleVideo}
            title={isVideoOff ? 'Enable Camera' : 'Disable Camera'}
            className={`p-4 rounded-full transition-all duration-200 transform hover:scale-105 ${
              isVideoOff ? 'bg-red-500 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}

        {/* Screen Share Toggle */}
        <button
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop Screen Share' : 'Screen Share'}
          className={`p-4 rounded-full transition-all duration-200 transform hover:scale-105 ${
            isScreenSharing ? 'bg-[#2AABEE] text-white' : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
        >
          <ScreenShare className="w-6 h-6" />
        </button>

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          title="End Call"
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/40 transition-all duration-200 transform hover:scale-110"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
