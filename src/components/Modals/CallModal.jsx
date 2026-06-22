import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, User } from 'lucide-react';
import { soundManager } from '../../utils/SoundManager';

export default function CallModal({ 
  callState, 
  caller, 
  callTarget, 
  remoteStream, 
  isMuted, 
  acceptCall, 
  endCall, 
  toggleMute 
}) {
  const audioRef = useRef(null);
  const ringIntervalRef = useRef(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (callState === 'ringing' && caller) {
      // Play ringing sound for incoming call
      soundManager.playRingtone();
      ringIntervalRef.current = setInterval(() => {
        soundManager.playRingtone();
      }, 2000);
    } else if (callState === 'calling') {
      // Play dial tone for outgoing call
      soundManager.playDialTone();
      ringIntervalRef.current = setInterval(() => {
        soundManager.playDialTone();
      }, 2000);
    } else {
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
    }

    return () => {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    };
  }, [callState, caller]);

  useEffect(() => {
    let timer;
    if (callState === 'connected') {
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState]);

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(e => console.error("Audio play error", e));
    }
  }, [remoteStream, callState]);

  if (callState === 'idle') return null;

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const displayName = caller || callTarget;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md animate-fade-in px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-3xl shadow-2xl p-6 flex flex-col items-center relative overflow-hidden">
        {/* Animated background rings */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="w-64 h-64 border-4 border-primary rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
        </div>

        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 mb-6 z-10">
          <User size={48} className="text-white" />
        </div>

        <h2 className="text-2xl font-bold text-text mb-2 z-10">{displayName}</h2>
        
        <p className="text-textMuted mb-8 z-10">
          {callState === 'calling' && 'Calling...'}
          {callState === 'ringing' && 'Incoming Call...'}
          {callState === 'connected' && formatDuration(duration)}
        </p>

        <div className="flex items-center justify-center space-x-6 z-10">
          {callState === 'ringing' && (
            <button
              onClick={acceptCall}
              className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110"
            >
              <Phone size={24} />
            </button>
          )}

          {callState === 'connected' && (
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 ${
                isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-secondary/80 hover:bg-secondary text-text'
              }`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
          )}

          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110"
          >
            <PhoneOff size={24} />
          </button>
        </div>

        {/* Hidden audio element to play the remote stream */}
        <audio ref={audioRef} autoPlay />
      </div>
    </div>
  );
}
