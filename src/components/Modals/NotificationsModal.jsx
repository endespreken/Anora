import React, { useState } from 'react';
import { X, UserPlus, Check, X as XIcon, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { acceptFriendRequest, rejectFriendRequest } from '../../services/dbServices';
import { timeAgo } from '../../utils/timeAgo';
import UserAvatar from '../Shared/UserAvatar';

export default function NotificationsModal({ isOpen, onClose }) {
  const { pendingRequests, setPendingRequests, registeredProfiles } = useAuth();
  const [processingId, setProcessingId] = useState(null);

  if (!isOpen) return null;

  const handleAccept = async (request) => {
    setProcessingId(request.id);
    const success = await acceptFriendRequest(request.id);
    if (success) {
      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
    } else {
      alert("Gagal menerima permintaan pertemanan.");
    }
    setProcessingId(null);
  };

  const handleReject = async (request) => {
    setProcessingId(request.id);
    const success = await rejectFriendRequest(request.id);
    if (success) {
      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
    } else {
      alert("Gagal menolak permintaan pertemanan.");
    }
    setProcessingId(null);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in px-4">
      <div className="bg-surface w-full max-w-[95vw] md:max-w-md rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col max-h-[85vh] animate-scale-in relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-r from-surface to-secondary/30 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Notifikasi</h2>
              <p className="text-xs text-white/60">Permintaan Pertemanan</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center text-white/30 mb-4 border border-white/5">
                <User size={32} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Belum Ada Permintaan</h3>
              <p className="text-sm text-white/50 max-w-[250px]">
                Saat ini belum ada orang yang mengirimi Anda permintaan pertemanan.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(req => {
                const profile = registeredProfiles?.[req.sender_nickname?.toLowerCase()];
                const isProcessing = processingId === req.id;
                
                return (
                  <div key={req.id} className="bg-secondary/20 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:bg-secondary/30">
                    
                    {/* User Info */}
                    <div className="flex items-center space-x-4 w-full sm:w-auto">
                      <div className="flex-shrink-0 relative">
                        <UserAvatar 
                          nickname={req.sender_nickname} 
                          avatarUrl={profile?.avatar_url}
                          size="lg"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-surface animate-pulse"></div>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="font-bold text-white text-base truncate">{req.sender_nickname}</h4>
                        <p className="text-xs text-white/50">{timeAgo(req.created_at)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <button 
                        onClick={() => handleReject(req)}
                        disabled={isProcessing}
                        className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 rounded-xl text-white/80 font-semibold transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'bg-white/5 hover:bg-red-500/20 hover:text-red-400 active:bg-red-500/30'}`}
                      >
                        <XIcon size={18} className="mr-1.5" />
                        Tolak
                      </button>
                      <button 
                        onClick={() => handleAccept(req)}
                        disabled={isProcessing}
                        className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 rounded-xl text-white font-semibold shadow-lg transition-all ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'bg-primary hover:opacity-90 active:scale-95 shadow-primary/30'}`}
                      >
                        <Check size={18} className="mr-1.5" />
                        Terima
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
