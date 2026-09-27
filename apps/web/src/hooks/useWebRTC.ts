'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';

export interface ActiveCall {
  callId: string;
  targetUserId: string;
  targetUsername: string;
  targetAvatarUrl?: string | null;
  type: 'VOICE' | 'VIDEO';
  isIncoming: boolean;
}

export function useWebRTC() {
  const { socket } = useSocket();
  const [callState, setCallState] = useState<'IDLE' | 'CALLING' | 'RINGING' | 'CONNECTED' | 'ENDED'>('IDLE');
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [duration, setDuration] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up streams & peer connection
  const cleanupCall = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setActiveCall(null);
    setCallState('IDLE');
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setDuration(0);
  }, []);

  // Initialize RTCPeerConnection
  const createPeerConnection = useCallback(
    async (targetUserId: string, callId: string) => {
      try {
        const { iceServers } = await api.get('/calls/ice-servers').then((r: any) => r.data).catch(() => ({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        }));

        const pc = new RTCPeerConnection({ iceServers });

        pc.onicecandidate = (event) => {
          if (event.candidate && socket) {
            socket.emit('call:signal', {
              callId,
              targetUserId,
              candidate: event.candidate,
              type: 'candidate',
            });
          }
        };

        const remoteStreamObj = new MediaStream();
        remoteStreamRef.current = remoteStreamObj;
        setRemoteStream(remoteStreamObj);

        pc.ontrack = (event) => {
          event.streams[0].getTracks().forEach((track) => {
            remoteStreamObj.addTrack(track);
          });
        };

        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            pc.addTrack(track, localStreamRef.current!);
          });
        }

        pcRef.current = pc;
        return pc;
      } catch (err) {
        console.error('Failed to create PeerConnection:', err);
        return null;
      }
    },
    [socket],
  );

  // Start outgoing call
  const startCall = useCallback(
    async (targetUserId: string, targetUsername: string, targetAvatarUrl: string | null | undefined, type: 'VOICE' | 'VIDEO') => {
      try {
        const { data: call } = await api.post('/calls/initiate', { receiverId: targetUserId, type });
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'VIDEO',
        });

        localStreamRef.current = stream;
        setLocalStream(stream);

        setActiveCall({
          callId: call.id,
          targetUserId,
          targetUsername,
          targetAvatarUrl,
          type,
          isIncoming: false,
        });

        setCallState('CALLING');

        if (socket) {
          socket.emit('call:invite', {
            callId: call.id,
            receiverId: targetUserId,
            type,
          });
        }
      } catch (err: any) {
        alert(err?.response?.data?.message || 'Failed to start call');
        cleanupCall();
      }
    },
    [socket, cleanupCall],
  );

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!activeCall || !socket) return;

    try {
      await api.post(`/calls/${activeCall.callId}/status`, { status: 'ACCEPTED' });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: activeCall.type === 'VIDEO',
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = await createPeerConnection(activeCall.targetUserId, activeCall.callId);
      if (!pc) return;

      socket.emit('call:accept', {
        callId: activeCall.callId,
        callerId: activeCall.targetUserId,
      });

      // Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call:signal', {
        callId: activeCall.callId,
        targetUserId: activeCall.targetUserId,
        sdp: offer,
        type: 'offer',
      });

      setCallState('CONNECTED');
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accepting call:', err);
      cleanupCall();
    }
  }, [activeCall, socket, createPeerConnection, cleanupCall]);

  // Reject incoming call
  const rejectCall = useCallback(async () => {
    if (!activeCall || !socket) return;
    await api.post(`/calls/${activeCall.callId}/status`, { status: 'REJECTED' }).catch(() => {});
    socket.emit('call:reject', {
      callId: activeCall.callId,
      callerId: activeCall.targetUserId,
    });
    cleanupCall();
  }, [activeCall, socket, cleanupCall]);

  // End active call
  const endCall = useCallback(async () => {
    if (activeCall) {
      await api.post(`/calls/${activeCall.callId}/status`, { status: 'ENDED' }).catch(() => {});
      if (socket) {
        socket.emit('call:end', {
          callId: activeCall.callId,
          targetUserId: activeCall.targetUserId,
        });
      }
    }
    cleanupCall();
  }, [activeCall, socket, cleanupCall]);

  // Listen for socket signaling events
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: {
      callId: string;
      callerId: string;
      callerUsername: string;
      callerAvatarUrl?: string;
      type: 'VOICE' | 'VIDEO';
    }) => {
      setActiveCall({
        callId: data.callId,
        targetUserId: data.callerId,
        targetUsername: data.callerUsername,
        targetAvatarUrl: data.callerAvatarUrl,
        type: data.type,
        isIncoming: true,
      });
      setCallState('RINGING');
    };

    const handleCallAccepted = async (data: { callId: string; receiverId: string }) => {
      if (!activeCall) return;
      setCallState('CONNECTED');
      await createPeerConnection(data.receiverId, data.callId);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    };

    const handleCallRejected = (data: { callId: string; reason?: string }) => {
      alert(`Call declined: ${data.reason || 'User busy'}`);
      cleanupCall();
    };

    const handleCallEnded = () => {
      cleanupCall();
    };

    const handleCallSignal = async (data: {
      callId: string;
      senderId: string;
      sdp?: RTCSessionDescriptionInit;
      candidate?: RTCIceCandidateInit;
      type?: string;
    }) => {
      if (!pcRef.current) return;

      if (data.type === 'offer' && data.sdp) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);

        socket.emit('call:signal', {
          callId: data.callId,
          targetUserId: data.senderId,
          sdp: answer,
          type: 'answer',
        });
      } else if (data.type === 'answer' && data.sdp) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } else if (data.type === 'candidate' && data.candidate) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate)).catch((err) => {
          console.error('Error adding ICE candidate:', err);
        });
      }
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:busy', handleCallRejected);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:signal', handleCallSignal);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:busy', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:signal', handleCallSignal);
    };
  }, [socket, activeCall, createPeerConnection, cleanupCall]);

  // Controls: Mute, Video, Screen Share
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!pcRef.current) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        const senders = pcRef.current.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');

        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        } else {
          pcRef.current.addTrack(screenTrack, screenStream);
        }

        screenTrack.onended = () => {
          if (localStreamRef.current && videoSender) {
            const cameraTrack = localStreamRef.current.getVideoTracks()[0];
            if (cameraTrack) videoSender.replaceTrack(cameraTrack);
          }
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error starting screen share:', err);
      }
    } else {
      if (localStreamRef.current) {
        const cameraTrack = localStreamRef.current.getVideoTracks()[0];
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender && cameraTrack) {
          videoSender.replaceTrack(cameraTrack);
        }
      }
      setIsScreenSharing(false);
    }
  };

  return {
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
  };
}
