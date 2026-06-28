import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Send, Heart, Flame, Smile, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { recordVibeView } from '../../services/dbServices';
import { timeAgo } from '../../utils/timeAgo';

export default function VibeViewerModal({ isOpen, onClose, vibesList, initialIndex, onReply }) {
  const { pseudo, allRegisteredNicks } = useAuth();
  const [currentUserIndex, setCurrentUserIndex] = useState(initialIndex);
  const [currentVibeIndex, setCurrentVibeIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showViews, setShowViews] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const currentUserObj = vibesList[currentUserIndex];
  const currentVibe = currentUserObj?.vibes[currentVibeIndex];

  useEffect(() => {
    if (!isOpen || !currentVibe) return;

    // Record view if not my vibe
    if (pseudo && currentUserObj.nickname !== pseudo) {
      recordVibeView(currentVibe.id, pseudo);
    }

    setProgress(0);
    setReplyText('');
    setShowViews(false);
  }, [currentUserIndex, currentVibeIndex, isOpen]);

  // Pause timer when typing reply or showing views
  const isPaused = replyText.length > 0 || showViews || isInputFocused;

  useEffect(() => {
    if (!isOpen || !currentVibe || isPaused) return;

    const duration = 10000; // 10 seconds per vibe for comfortable reading
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev + step >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [currentUserIndex, currentVibeIndex, isOpen, isPaused]);

  if (!isOpen || !currentUserObj || !currentVibe) return null;

  const handleNext = () => {
    if (currentVibeIndex < currentUserObj.vibes.length - 1) {
      setCurrentVibeIndex(prev => prev + 1);
    } else if (currentUserIndex < vibesList.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentVibeIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentVibeIndex > 0) {
      setCurrentVibeIndex(prev => prev - 1);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      setCurrentVibeIndex(vibesList[currentUserIndex - 1].vibes.length - 1);
    }
  };

  const handleSendReply = (text = replyText) => {
    if (!text.trim()) return;
    const msg = `[Membalas Vibe: "${currentVibe.content}"]\n${text.trim()}`;
    if (onReply) {
      onReply(currentUserObj.nickname, msg);
    }
    onClose();
  };

  const isMyVibe = currentUserObj.nickname === pseudo;

  return (
    <div className="fixed inset-0 z-[400] bg-black flex flex-col animate-fade-in touch-none">
      
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 w-full pt-4 px-2 flex space-x-1 z-10">
        {currentUserObj.vibes.map((v, i) => (
          <div key={v.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-75 ease-linear"
              style={{ 
                width: i < currentVibeIndex ? '100%' : i === currentVibeIndex ? `${progress}%` : '0%' 
              }}
            ></div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-0 w-full px-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-text border border-white/20">
            {currentUserObj.nickname.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1">
              <span className="font-bold text-white shadow-sm drop-shadow-md">
                {currentUserObj.nickname}
              </span>
              {allRegisteredNicks?.includes(currentUserObj.nickname.toLowerCase()) && (
                <BadgeCheck size={16} className="text-blue-400 drop-shadow-md" />
              )}
            </div>
            <span className="text-xs text-white/80 drop-shadow-sm font-medium">
              {timeAgo(currentVibe.created_at)}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-white/80 hover:text-white rounded-full">
          <X size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 w-full h-full flex items-center justify-center p-8 ${currentVibe.bg_color}`}>
        <p className="text-white text-3xl font-bold text-center leading-relaxed whitespace-pre-wrap break-words drop-shadow-lg">
          {currentVibe.content}
        </p>
      </div>

      {/* Touch Areas for Navigation (disabled if views or reply active) */}
      {!showViews && (
        <div className="absolute inset-0 z-0 flex pt-20 pb-24">
          <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev}></div>
          <div className="w-2/3 h-full cursor-pointer" onClick={handleNext}></div>
        </div>
      )}

      {/* Overlay to close views when tapping anywhere outside */}
      {showViews && (
        <div 
          className="absolute inset-0 z-10" 
          onClick={() => setShowViews(false)}
        ></div>
      )}

      {/* Bottom Area: Views (if owner) OR Reply (if other) */}
      <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none">
        {isMyVibe ? (
          <div className="w-full flex flex-col items-center pointer-events-auto">
            <button 
              onClick={() => setShowViews(!showViews)}
              className="flex items-center space-x-2 text-white/90 hover:text-white pb-6 pt-4 px-4 font-semibold drop-shadow-md transition-transform active:scale-95"
            >
              <Eye size={20} />
              <span>{currentVibe.views?.length || 0} Dilihat</span>
            </button>
            
            {showViews && (
              <div className="w-full md:max-w-md mx-auto bg-surface/95 backdrop-blur-md rounded-t-3xl md:rounded-3xl md:mb-6 p-6 max-h-[50vh] overflow-y-auto shadow-[0_-10px_40px_rgba(0,0,0,0.3)] animate-slide-up border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-text flex items-center">
                    <Eye size={18} className="mr-2 text-primary" />
                    Penonton ({currentVibe.views?.length || 0})
                  </h3>
                  <button onClick={() => setShowViews(false)} className="hidden md:flex p-1 bg-secondary/50 hover:bg-secondary rounded-full text-textMuted transition-colors"><X size={16} /></button>
                </div>
                
                {currentVibe.views?.length === 0 ? (
                  <p className="text-textMuted text-sm text-center py-6">Belum ada yang melihat.</p>
                ) : (
                  <ul className="space-y-3">
                    {currentVibe.views?.map((view, i) => (
                      <li key={i} className="flex justify-between items-center bg-secondary/10 p-3 rounded-2xl border border-border">
                        <div className="flex items-center space-x-1">
                          <span className="font-bold text-text">{view.viewer_nickname}</span>
                          {allRegisteredNicks?.includes(view.viewer_nickname.toLowerCase()) && (
                            <BadgeCheck size={14} className="text-blue-500" />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-white bg-black/40 px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm">{timeAgo(view.viewed_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
            <div className="flex items-center space-x-3 max-w-lg mx-auto">
              <input 
                type="text"
                placeholder="Balas Vibe ini..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                className="flex-1 bg-white/20 text-white placeholder:text-white/60 border border-white/30 rounded-full px-5 py-3 outline-none focus:bg-white/30 transition-colors backdrop-blur-md shadow-lg"
              />
              {replyText.trim() ? (
                <button 
                  onClick={() => handleSendReply()}
                  className="p-3 bg-primary text-white rounded-full active:scale-95 transition-transform shadow-lg"
                >
                  <Send size={20} />
                </button>
              ) : (
                <div className="flex items-center space-x-2 text-2xl">
                  <button onClick={() => handleSendReply("❤️")} className="hover:scale-125 transition-transform drop-shadow-md">❤️</button>
                  <button onClick={() => handleSendReply("😂")} className="hover:scale-125 transition-transform drop-shadow-md">😂</button>
                  <button onClick={() => handleSendReply("🔥")} className="hover:scale-125 transition-transform drop-shadow-md">🔥</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Arrows (Visible everywhere) */}
      {currentVibeIndex > 0 && (
        <button 
          onClick={handlePrev} 
          className="flex absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-black/20 hover:bg-black/40 rounded-full items-center justify-center text-white z-10 transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
      )}
      <button 
        onClick={handleNext} 
        className="flex absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-black/20 hover:bg-black/40 rounded-full items-center justify-center text-white z-10 transition-colors"
      >
        <ChevronRight size={28} />
      </button>

    </div>
  );
}
