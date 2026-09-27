'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { apiFetch, api } from '@/lib/api';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { UserInfoDrawer } from '@/components/chat/UserInfoDrawer';
import { useSocket } from '@/hooks/useSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { usePushNotifications } from '@/hooks/usePushNotifications';

import { IncomingCallModal } from '@/components/calling/IncomingCallModal';
import { CallOverlay } from '@/components/calling/CallOverlay';
import { CallHistoryModal } from '@/components/calling/CallHistoryModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { GlobalSearchModal } from '@/components/chat/GlobalSearchModal';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, accessToken, user } = useAuthStore();
  const {
    chats,
    setChats,
    activeChatId,
    setMessages,
    isInfoDrawerOpen,
    toggleInfoDrawer,
  } = useChatStore();

  const [isCallHistoryOpen, setIsCallHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  useSocket(); // Activate socket connection for real-time events
  const { subscribeToPush } = usePushNotifications();

  const {
    callState,
    activeCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    duration,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  } = useWebRTC();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (isAuthenticated) {
      subscribeToPush().catch(() => {});
    }
  }, [isLoading, isAuthenticated, router, subscribeToPush]);

  // Fetch initial chats list
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const fetchChats = async () => {
      try {
        const data = await apiFetch<any[]>('/chats', {}, accessToken);
        setChats(data);
      } catch (err) {
        console.error('Failed to load chats:', err);
      }
    };

    fetchChats();
  }, [isAuthenticated, accessToken, setChats]);

  // Fetch active chat messages when activeChatId changes
  useEffect(() => {
    if (!activeChatId || !accessToken) return;

    const fetchMessages = async () => {
      try {
        const data = await apiFetch<any[]>(`/chats/${activeChatId}/messages`, {}, accessToken);
        setMessages(activeChatId, data);
      } catch (err) {
        console.error('Failed to load chat messages:', err);
      }
    };

    fetchMessages();
  }, [activeChatId, accessToken, setMessages]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#2AABEE] text-white flex items-center justify-center font-black shadow-lg animate-pulse">
          <MessageCircle className="w-7 h-7 fill-current" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-[#2AABEE]" />
          Connecting to NexChat...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="h-screen w-screen flex bg-background overflow-hidden relative">
      {/* Left Chat Sidebar (Telegram-Style Navigation & Conversation List) */}
      <ChatSidebar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCallHistory={() => setIsCallHistoryOpen(true)}
        onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
      />

      {/* Main Conversation Area */}
      {activeChat ? (
        <ChatArea chat={activeChat} onStartCall={startCall} />
      ) : (
        <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-background/40 p-8 text-center border-r border-border">
          <div className="w-20 h-20 rounded-full bg-accent/60 flex items-center justify-center mb-4 shadow-inner">
            <MessageCircle className="w-10 h-10 text-[#2AABEE]" />
          </div>
          <h2 className="text-xl font-bold mb-1">Select a conversation to start messaging</h2>
          <p className="text-xs text-muted-foreground max-w-sm">
            Choose from your existing chats on the left or search for contacts by handle to start real-time messaging, voice, or video calling.
          </p>
        </div>
      )}

      {/* Right User Info Drawer (Slide-Over Panel) */}
      {activeChat && (
        <UserInfoDrawer
          isOpen={isInfoDrawerOpen}
          onClose={() => toggleInfoDrawer(false)}
          chat={activeChat}
        />
      )}

      {/* Incoming Call Dialog */}
      {callState === 'RINGING' && activeCall && activeCall.isIncoming && (
        <IncomingCallModal
          callerName={activeCall.targetUsername}
          callerAvatar={activeCall.targetAvatarUrl}
          callType={activeCall.type}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* Active Call Overlay (Voice & Video) */}
      {(callState === 'CONNECTED' || callState === 'CALLING') && activeCall && (
        <CallOverlay
          activeCall={activeCall}
          callState={callState}
          localStream={localStream}
          remoteStream={remoteStream}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
          duration={duration}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={toggleScreenShare}
          onEndCall={endCall}
        />
      )}

      {/* Call History Modal */}
      {isCallHistoryOpen && (
        <CallHistoryModal
          onClose={() => setIsCallHistoryOpen(false)}
          onStartCall={(id, name, avatar, type) => {
            setIsCallHistoryOpen(false);
            startCall(id, name, avatar, type);
          }}
          currentUserId={user?.id}
        />
      )}

      {/* Settings & Privacy Modal */}
      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          user={user}
          onUserUpdate={async () => {
            try {
              const updatedUser = await apiFetch<any>('/users/me');
              useAuthStore.getState().setUser(updatedUser);
            } catch (err) {
              console.error('Failed to reload user profile:', err);
            }
          }}
        />
      )}

      {/* Global Search Dialog */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
      />
    </div>
  );
}
