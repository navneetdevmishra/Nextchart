export type CallType = 'VOICE' | 'VIDEO';

export type CallStatus = 'INITIATED' | 'RINGING' | 'ACCEPTED' | 'REJECTED' | 'BUSY' | 'MISSED' | 'ENDED' | 'FAILED';

export interface CallSessionDto {
  id: string;
  callerId: string;
  receiverId: string;
  type: CallType;
  status: CallStatus;
  startedAt?: string | null;
  endedAt?: string | null;
  duration?: number | null;
  createdAt: string;
  caller?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
  receiver?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
}

export interface CallInvitePayload {
  callId: string;
  callerId: string;
  callerUsername: string;
  callerAvatarUrl?: string | null;
  receiverId: string;
  type: CallType;
}

export interface CallSignalPayload {
  callId: string;
  targetUserId: string;
  sdp?: any;
  candidate?: any;
  type?: 'offer' | 'answer' | 'candidate';
}
