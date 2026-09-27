import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';

interface VoiceRecorderProps {
  onSendVoice: (audioBlob: Blob, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopTimer();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      onCancel();
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleStopAndSend = () => {
    stopTimer();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onSendVoice(audioBlob, seconds);
        // Stop all audio tracks
        mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current.stop();
    }
  };

  const handleCancel = () => {
    stopTimer();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    onCancel();
  };

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between w-full px-4 py-2 bg-accent/80 border border-primary/40 rounded-2xl animate-in fade-in duration-150">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
        <span className="text-xs font-mono font-bold text-red-400">{formatTimer(seconds)}</span>

        {/* Live visualizer dots */}
        <div className="flex items-center gap-1">
          <span className="w-1 h-3 bg-primary rounded-full animate-pulse" />
          <span className="w-1 h-5 bg-primary rounded-full animate-pulse [animation-delay:0.15s]" />
          <span className="w-1 h-2 bg-primary rounded-full animate-pulse [animation-delay:0.3s]" />
          <span className="w-1 h-6 bg-primary rounded-full animate-pulse [animation-delay:0.45s]" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleCancel}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition"
          title="Cancel recording"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleStopAndSend}
          className="p-2.5 bg-primary text-primary-foreground rounded-full hover:opacity-90 shadow-md transition"
          title="Send voice note"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
