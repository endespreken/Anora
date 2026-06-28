import React, { useState, useRef, useEffect } from 'react';
import { Radio, Check, CheckCheck, Reply as ReplyIcon, SmilePlus, BadgeCheck } from 'lucide-react';
import emoji from 'react-easy-emoji';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

export default function MessageBubble({ message, isOwn, onReply, onReact, allMessages = [], onUserClick, isTargetOnline }) {
  const [showMobileReact, setShowMobileReact] = useState(false);
  const [showWebReact, setShowWebReact] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const { pseudo, allRegisteredNicks = [], isRegistered } = useAuth();
  const { vibrationEnabled } = useSettings();
  
  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const touchCurrent = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef(null);

  const { user_pseudo, content, created_at, is_system_msg, reply_to_id, reactions } = message;
  const time = new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (is_system_msg) {
    return (
      <div className="flex justify-center my-6 animate-fade-in">
        <span className="text-xs font-medium text-textMuted bg-secondary/30 backdrop-blur-sm border border-border px-4 py-1.5 rounded-full shadow-sm">
          {emoji(content)}
        </span>
      </div>
    );
  }

  const isBeacon = content.startsWith('[BEACON SIGNAL]:');
  const isPrivate = message.channel_name && message.channel_name.startsWith('@');
  
  const repliedMessage = reply_to_id ? allMessages.find(m => m.id === reply_to_id) : null;
  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    touchCurrent.current = { x: touch.clientX, y: touch.clientY };
    
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setShowMobileReact(true);
      if (vibrationEnabled && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500); 
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    touchCurrent.current = { x: touch.clientX, y: touch.clientY };
    
    const dx = touchCurrent.current.x - touchStart.current.x;
    const dy = touchCurrent.current.y - touchStart.current.y;
    
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    }
    
    if (dx > 0 && Math.abs(dy) < 30) {
      setSwipeOffset(Math.min(dx, 60));
    }
  };

  const handleTouchEnd = (e) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    
    const dx = touchCurrent.current.x - touchStart.current.x;
    
    if (dx > 40) {
      if (onReply) onReply();
    }
    setSwipeOffset(0);
  };

  const reactionTrigger = !showWebReact && !showMobileReact && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setShowWebReact(true);
      }}
      className={`hidden md:group-hover:flex absolute top-1/2 -translate-y-1/2 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} items-center justify-center w-8 h-8 bg-surface border border-border rounded-full shadow-lg text-textMuted hover:text-primary transition-colors z-20`}
      title="Add Reaction"
    >
      <SmilePlus size={16} />
    </button>
  );

  const reactionMenu = (
    <div className={`${(showMobileReact || showWebReact) ? 'flex z-50' : 'hidden'} absolute top-1/2 -translate-y-1/2 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} items-center space-x-1 bg-surface border border-border rounded-full shadow-lg p-1 animate-fade-in`}>
      {quickReactions.map(emo => (
        <button 
          key={emo} 
          onClick={(e) => {
            e.stopPropagation();
            if (onReact) onReact(emo);
            setShowMobileReact(false);
            setShowWebReact(false);
          }}
          className="w-7 h-7 flex items-center justify-center hover:bg-secondary rounded-full transition-colors text-text"
          title="React"
        >
          {emoji(emo)}
        </button>
      ))}
    </div>
  );

  return (
    <div 
      className={`mb-6 flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up group relative`}
      onMouseLeave={() => {
        setShowMobileReact(false);
        setShowWebReact(false);
      }}
    >
      {showMobileReact && (
        <div 
          className="fixed inset-0 z-40" 
          onTouchStart={() => setShowMobileReact(false)}
          onClick={() => setShowMobileReact(false)}
        />
      )}

      <div className={`max-w-[75%] flex flex-col relative ${isOwn ? 'items-end' : 'items-start'}`}>
        
        {!isPrivate && (
          <div className={`text-[11px] text-textMuted mb-1 px-1 flex items-center ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {isOwn ? (
              <span className="font-semibold text-text">{user_pseudo}</span>
            ) : (
              <button 
                onClick={() => onUserClick && onUserClick(user_pseudo)}
                className="font-semibold text-text hover:text-primary hover:underline transition-colors focus:outline-none"
              >
                {user_pseudo}
              </button>
            )}
            {allRegisteredNicks.some(nick => nick.toLowerCase() === user_pseudo.toLowerCase()) && (
              <BadgeCheck size={13} className="ml-1 text-blue-500 flex-shrink-0" />
            )}
          </div>
        )}
        
        <div className="relative flex items-center group">
          {reactionTrigger}
          {reactionMenu}

          <div 
            className={`px-4 py-2 pt-3 shadow-md relative w-full ${
              isBeacon 
                ? 'bg-surface border border-accent text-text rounded-2xl animate-pulse-slow shadow-accent/20'
                : isOwn 
                  ? 'bg-gradient-to-br from-primary to-primaryHover text-white rounded-2xl rounded-tr-sm shadow-primary/20' 
                  : 'bg-surface border border-border text-text rounded-2xl rounded-tl-sm'
            }`}
            style={{ 
              transform: `translateX(${swipeOffset}px)`,
              transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none',
              touchAction: 'pan-y'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onContextMenu={(e) => {
              if (window.innerWidth < 768) e.preventDefault();
            }}
          >
            
            {/* Reply arrow button for Web hover */}
            {!is_system_msg && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onReply) onReply();
                }}
                className={`hidden md:group-hover:flex absolute top-1 right-2 text-current hover:opacity-70 p-1 z-20 ${isOwn ? 'text-white' : 'text-textMuted hover:text-primary'}`}
                title="Reply"
              >
                <ReplyIcon size={14} />
              </button>
            )}

            {isBeacon && (
              <div className="absolute inset-0 bg-accent/5 pointer-events-none rounded-[inherit]"></div>
            )}
            
            {reply_to_id && (
              <div className={`mb-2 pl-2 border-l-2 text-xs opacity-80 ${isOwn ? 'border-white/50' : 'border-primary/50'}`}>
                <div className="font-semibold mb-0.5">{repliedMessage ? repliedMessage.user_pseudo : 'Unknown User'}</div>
                <div className="whitespace-pre-wrap">
                  {repliedMessage ? repliedMessage.content : 'Message not found'}
                </div>
              </div>
            )}
            
            <div className="relative z-10 flex flex-col">
              <div className="flex items-start pr-4">
                {isBeacon && <Radio size={16} className="text-accent mr-2 mt-0.5 shrink-0" />}
                <span className={`leading-relaxed whitespace-pre-wrap break-words ${isBeacon ? 'font-medium' : ''}`}>
                  {isBeacon ? emoji(content.replace('[BEACON SIGNAL]:', '').trim()) : emoji(content)}
                </span>
              </div>
              
              <div className={`flex items-center justify-end mt-1 -mb-1 space-x-1 text-[10px] ${isOwn ? 'text-white/70' : 'text-textMuted'}`}>
                <span>{time}</span>
                {isOwn && (
                  message.is_read ? (
                    <CheckCheck size={14} className="text-blue-400 drop-shadow-sm" />
                  ) : (
                    isPrivate && isTargetOnline ? (
                      <CheckCheck size={14} className="text-white/60 drop-shadow-sm" />
                    ) : (
                      <Check size={14} className="text-white/60 drop-shadow-sm" />
                    )
                  )
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Reactions */}
        {reactions && Object.keys(reactions).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(reactions).map(([emo, users]) => (
              <button
                key={emo}
                onClick={() => onReact && onReact(emo)}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] border transition-colors ${
                  users.includes(pseudo) 
                  ? 'bg-primary/20 border-primary/50 text-primary' 
                  : 'bg-surface border-border text-textMuted hover:border-textMuted'
                }`}
                title={users.join(', ')}
              >
                <span>{emoji(emo)}</span>
                <span className="font-medium">{users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
