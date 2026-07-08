import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Send, Heart, Flame, Smile, BadgeCheck, MoreVertical, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { recordVibeView, deleteVibe, fetchMessages, sendMessage } from '../../services/dbServices';
import { timeAgo } from '../../utils/timeAgo';
import UserAvatar from '../Shared/UserAvatar';
import { VIBE_FONTS } from './VibeUploadModal';

export default function VibeViewerModal({ isOpen, onClose, vibesList, initialIndex, onReply, onVibeDeleted, onProfileClick }) {
  const { pseudo, allVerifiedNicks = [], permanentPin } = useAuth();
  const [currentUserIndex, setCurrentUserIndex] = useState(initialIndex);
  const [currentVibeIndex, setCurrentVibeIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showViews, setShowViews] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [pollVotes, setPollVotes] = useState({ opt1: 0, opt2: 0, total: 0, userVote: null });

  const currentUserObj = vibesList[currentUserIndex];
  const currentVibe = currentUserObj?.vibes[currentVibeIndex];

  let parsedContent = currentVibe?.content || '';
  let textPos = null;
  let vibeCaption = '';
  let vibeFontIndex = 0;
  let vibePoll = null;
  try {
    const data = JSON.parse(parsedContent);
    if (data && data.text !== undefined) {
      parsedContent = data.text;
      textPos = data.pos || { x: 50, y: 50 };
      if (data.caption) vibeCaption = data.caption;
      if (data.font !== undefined) vibeFontIndex = data.font;
      if (data.poll) vibePoll = data.poll;
    }
  } catch (e) {
    // legacy format, keep as is
  }

  useEffect(() => {
    if (isOpen && currentVibe) {
      // Record view if not my vibe
      if (pseudo && currentUserObj.nickname !== pseudo) {
        recordVibeView(currentVibe.id, pseudo);
      }
    }

    setPollVotes({ opt1: 0, opt2: 0, total: 0, userVote: null });
    
    if (isOpen && currentVibe && vibePoll) {
      const channelName = `vibe_poll_${currentVibe.id}`;
      fetchMessages(channelName, 500).then(msgs => {
        let opt1Count = 0;
        let opt2Count = 0;
        let myVote = null;
        
        // We iterate from oldest to newest. But fetchMessages returns newest first.
        // Wait, fetchMessages returns newest first? It says reverse() in dbServices.
        // Let's just take the first vote per user to prevent duplicate votes, or last vote.
        // Easiest is to just tally all (assuming users only vote once, since we disable buttons).
        const votedUsers = new Set();
        
        msgs.forEach(msg => {
          if (!votedUsers.has(msg.user_pseudo)) {
            votedUsers.add(msg.user_pseudo);
            if (msg.content === 'VOTE:0') opt1Count++;
            else if (msg.content === 'VOTE:1') opt2Count++;
            
            if (msg.user_pseudo === pseudo) {
              myVote = msg.content === 'VOTE:0' ? 0 : 1;
            }
          }
        });
        
        setPollVotes({
          opt1: opt1Count,
          opt2: opt2Count,
          total: opt1Count + opt2Count,
          userVote: myVote
        });
      });
    }

    setProgress(0);
    setReplyText('');
    setShowViews(false);
  }, [currentUserIndex, currentVibeIndex, isOpen]);

  // Pause timer when typing reply or showing views or deleting
  const isPaused = replyText.length > 0 || showViews || isDeleting || isInputFocused;

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

  const handleVote = async (optIndex) => {
    if (pollVotes.userVote !== null || !pseudo) return; // already voted
    
    // Optimistic update
    setPollVotes(prev => ({
      ...prev,
      [optIndex === 0 ? 'opt1' : 'opt2']: prev[optIndex === 0 ? 'opt1' : 'opt2'] + 1,
      total: prev.total + 1,
      userVote: optIndex
    }));
    
    const channelName = `vibe_poll_${currentVibe.id}`;
    await sendMessage(channelName, pseudo, `VOTE:${optIndex}`, true);
  };

  const handleSendReply = (text = replyText) => {
    if (!text.trim()) return;
    
    // Format payload for rich Vibe reply rendering
    const vibeSnippet = {
      bg_color: currentVibe.bg_color,
      content: parsedContent,
      caption: vibeCaption
    };
    
    const msg = `[VIBE_REPLY]:${JSON.stringify(vibeSnippet)}\n${text.trim()}`;
    
    if (onReply) {
      onReply(currentUserObj.nickname, msg);
    }
    onClose();
  };

  const isMyVibe = pseudo && currentUserObj.nickname.toLowerCase() === pseudo.toLowerCase();

  const handleDeleteClick = async (e) => {
    if (e) e.stopPropagation();
    
    if (!permanentPin) {
      alert("PIN tidak ditemukan. Harap muat ulang aplikasi.");
      return;
    }

    setIsDeleting(true);

    try {
      const success = await deleteVibe(currentVibe.id, permanentPin);
      if (success) {
        if (onVibeDeleted) onVibeDeleted();
        setIsDeleting(false);
        onClose(); // Langsung tutup setelah berhasil
      } else {
        alert("Gagal menghapus dari database.");
        setIsDeleting(false);
      }
    } catch (err) {
      alert("Error jaringan: " + err.message);
      setIsDeleting(false);
    }
  };

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
          <UserAvatar nickname={currentUserObj.nickname} className="w-10 h-10 border border-white/20 font-bold" />
          <div className="flex flex-col">
            <div className="flex items-center space-x-1">
              <span className="font-bold text-white shadow-sm drop-shadow-md">
                {currentUserObj.nickname}
              </span>
              {allVerifiedNicks && allVerifiedNicks.some(nick => nick.toLowerCase() === currentUserObj.nickname.toLowerCase()) && (
                <BadgeCheck size={16} className="text-blue-400 drop-shadow-md" />
              )}
            </div>
            <span className="text-xs text-white/80 drop-shadow-sm font-medium">
              {timeAgo(currentVibe.created_at)}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
              {isMyVibe && (
                <button 
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors ${isDeleting ? 'bg-red-500/50 cursor-wait' : 'bg-black/40 backdrop-blur-md hover:bg-red-500/80 active:bg-red-500'}`}
                  title="Hapus Vibe"
                >
                  <Trash2 size={20} className={isDeleting ? 'animate-pulse' : ''} />
                </button>
              )}
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white rounded-full pointer-events-auto">
            <X size={24} className="drop-shadow-md" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-0 sm:p-8 pointer-events-none z-0">
        <div 
          className={`w-full aspect-[9/16] max-h-full sm:max-w-sm rounded-none sm:rounded-3xl mx-auto flex items-center justify-center relative overflow-hidden ${!(currentVibe.bg_color || '').startsWith('img:') ? currentVibe.bg_color : 'bg-black'}`}
          style={(currentVibe.bg_color || '').startsWith('img:') ? { backgroundImage: `url(${(currentVibe.bg_color || '').substring(4).replace('pub-f591f14e39f84bdc80676d77036d98b2.r2.dev', 'media.anorachat.com')})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' } : {}}
        >
          {(currentVibe.bg_color || '').startsWith('img:') && (
            <div className="absolute inset-0 bg-black/10 rounded-none sm:rounded-3xl backdrop-blur-[1px]"></div>
          )}
          
          <div 
            className={`w-full px-8 z-10 ${textPos ? 'absolute' : 'relative'}`}
            style={textPos ? {
              top: `${textPos.y}%`,
              left: `${textPos.x}%`,
              transform: 'translate(-50%, -50%)'
            } : {}}
          >
            <p className={`text-white text-3xl font-bold text-center leading-relaxed whitespace-pre-wrap break-words ${VIBE_FONTS[vibeFontIndex]?.class || ''} ${(currentVibe.bg_color || '').startsWith('img:') && vibeFontIndex !== 2 ? 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]' : ''}`}>
              {parsedContent && parsedContent !== ' ' ? (
                parsedContent.split(/(@[a-zA-Z0-9_.-]+)/g).map((part, i) => {
                  if (part.startsWith('@')) {
                    const nickname = part.substring(1);
                    return (
                      <span 
                        key={i} 
                        className="text-blue-300 font-bold cursor-pointer hover:underline relative z-50 pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onProfileClick) onProfileClick(nickname);
                          onClose();
                        }}
                      >
                        {part}
                      </span>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })
              ) : null}
            </p>
          </div>
          
          {vibePoll && (
            <div className="absolute w-[80%] left-1/2 top-[70%] -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto bg-black/40 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-2xl">
              <h4 className="text-white text-center font-bold mb-4 drop-shadow-md text-lg">{vibePoll.question}</h4>
              <div className="space-y-3">
                {[0, 1].map((optIndex) => {
                  const optText = vibePoll.options[optIndex];
                  const optVotes = optIndex === 0 ? pollVotes.opt1 : pollVotes.opt2;
                  const total = pollVotes.total || 1;
                  const percent = pollVotes.total > 0 ? Math.round((optVotes / pollVotes.total) * 100) : 0;
                  const isVoted = pollVotes.userVote === optIndex;
                  const hasVoted = pollVotes.userVote !== null;
                  
                  return (
                    <button
                      key={optIndex}
                      onClick={(e) => { e.stopPropagation(); handleVote(optIndex); }}
                      disabled={hasVoted}
                      className={`relative w-full overflow-hidden rounded-2xl p-3 text-white font-bold transition-all border ${isVoted ? 'border-primary bg-primary/30' : 'border-white/20 bg-white/10 hover:bg-white/20'} ${hasVoted ? 'cursor-default' : 'active:scale-95'}`}
                    >
                      {hasVoted && (
                        <div 
                          className={`absolute left-0 top-0 h-full transition-all duration-1000 ease-out ${isVoted ? 'bg-primary/50' : 'bg-white/20'}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      )}
                      <div className="relative flex justify-between items-center z-10 px-2 drop-shadow-md">
                        <span>{optText}</span>
                        {hasVoted && <span>{percent}%</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="text-center text-white/50 text-xs mt-3 font-medium drop-shadow-sm">
                {pollVotes.total} suara
              </div>
            </div>
          )}
        </div>
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

      {/* Bottom Area: Caption + Views/Reply */}
      <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none flex flex-col justify-end">
        
        {/* Caption Display */}
        {vibeCaption && (
          <div className="w-full text-center px-6 pb-2 animate-fade-in pointer-events-auto">
            <p className="text-white text-sm sm:text-base font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] inline-block bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl max-w-sm w-full mx-auto break-words whitespace-pre-wrap border border-white/10">
              {vibeCaption}
            </p>
          </div>
        )}

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
                          {allVerifiedNicks && allVerifiedNicks.some(nick => nick.toLowerCase() === view.viewer_nickname.toLowerCase()) && (
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
            <div className="flex items-center space-x-2 sm:space-x-3 max-w-lg mx-auto">
              <input 
                type="text"
                placeholder="Balas Vibe ini..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                className="flex-1 min-w-0 bg-white/20 text-white placeholder:text-white/60 border border-white/30 rounded-full px-4 sm:px-5 py-2.5 sm:py-3 outline-none focus:bg-white/30 transition-colors backdrop-blur-md shadow-lg text-sm sm:text-base"
              />
              {replyText.trim() ? (
                <button 
                  onClick={() => handleSendReply()}
                  className="flex-shrink-0 p-2.5 sm:p-3 bg-primary text-white rounded-full active:scale-95 transition-transform shadow-lg mx-1"
                >
                  <Send size={18} className="sm:w-5 sm:h-5" />
                </button>
              ) : (
                <div className="flex items-center space-x-3 sm:space-x-4 text-xl sm:text-2xl flex-shrink-0 px-2">
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
