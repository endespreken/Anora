import React, { useState, useRef, useEffect } from 'react';
import { Radio, Check, CheckCheck, Reply as ReplyIcon, SmilePlus, BadgeCheck } from 'lucide-react';
import emoji from 'react-easy-emoji';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import LinkPreview from './LinkPreview';
import { QuizCard, WikiCard, CryptoCard, KursCard, WeatherCard, MemeCard, TranslateCard } from './ChatCards';

const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
};

export default function MessageBubble({ message, isOwn, onReply, onReact, allMessages = [], onUserClick, onProfileClick, isTargetOnline }) {
  const [showMobileReact, setShowMobileReact] = useState(false);
  const [showWebReact, setShowWebReact] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const { pseudo, allRegisteredNicks = [], allVerifiedNicks = [], isRegistered } = useAuth();
  const { vibrationEnabled } = useSettings();
  
  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const touchCurrent = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef(null);

  const { user_pseudo, content, created_at, is_system_msg, reply_to_id, reactions } = message;
  const time = new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (is_system_msg) {
    if (content.startsWith('[QUIZ]:') && safeJsonParse(content.substring(7))) {
      return (
        <div className="flex justify-center my-6 animate-fade-in w-full px-4">
          <QuizCard data={safeJsonParse(content.substring(7))} currentChannel={message.channel_name} pseudo={pseudo} />
        </div>
      );
    }
    
    if (content.startsWith('[QUIZ_WIN]:')) {
      return (
        <div className="flex justify-center my-4 animate-fade-in px-4">
          <div className="text-sm font-semibold text-green-400 bg-green-500/10 border border-green-500/30 px-6 py-2.5 rounded-full shadow-[0_0_15px_rgba(74,222,128,0.2)] text-center">
            {emoji(content.substring(11))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-center my-6 animate-fade-in px-4 text-center">
        <span className="text-xs font-medium text-textMuted bg-secondary/30 backdrop-blur-sm border border-border px-4 py-1.5 rounded-full shadow-sm leading-relaxed inline-block">
          {emoji(content)}
        </span>
      </div>
    );
  }

  const isBeacon = content.startsWith('[BEACON SIGNAL]:');
  const isPrivate = message.channel_name && message.channel_name.startsWith('@');
  
  const repliedMessage = reply_to_id ? allMessages.find(m => m.id === reply_to_id) : null;
  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  const isMentioned = !isOwn && pseudo && content && (() => {
    const matches = content.match(/@([a-zA-Z0-9_]+)/g);
    if (!matches) return false;
    return matches.some(match => match.substring(1).toLowerCase() === pseudo.toLowerCase());
  })();

  const extractUrls = (text) => {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const urlsInMessage = extractUrls(content);
  const firstUrl = urlsInMessage.length > 0 ? urlsInMessage[0] : null;

  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getSpotifyId = (url) => {
    const regExp = /spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/;
    const match = url.match(regExp);
    return match ? { type: match[1], id: match[2] } : null;
  };



  const renderMessageContent = (text) => {
    if (!text) return null;
    
    // Split text by URL
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
      // If the part is a URL
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-400 hover:text-blue-300 underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      
      // If not URL, split by mentions
      const mentionParts = part.split(/(@[a-zA-Z0-9_]+)/g);
      
      return mentionParts.map((mPart, j) => {
        if (mPart.startsWith('@') && mPart.length > 1) {
          const mentionedNick = mPart.substring(1);
          const isMe = pseudo && mentionedNick.toLowerCase() === pseudo.toLowerCase();
          
          return (
            <span key={`${i}-${j}`} className={`font-semibold rounded-sm px-1.5 py-0.5 mx-0.5 ${isMe ? (isOwn ? 'bg-white/20 text-white' : 'bg-yellow-500/40 text-yellow-800 dark:text-yellow-300') : (isOwn ? 'text-white/90 bg-white/10' : 'text-primary bg-primary/10')}`}>
              {emoji(mPart)}
            </span>
          );
        }
        return <React.Fragment key={`${i}-${j}`}>{emoji(mPart)}</React.Fragment>;
      });
    });
  };

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
                onClick={() => onProfileClick ? onProfileClick(user_pseudo) : (onUserClick && onUserClick(user_pseudo))}
                className="font-semibold text-text hover:text-primary hover:underline transition-colors focus:outline-none"
              >
                {user_pseudo}
              </button>
            )}
            {allVerifiedNicks && allVerifiedNicks.some(nick => nick.toLowerCase() === user_pseudo.toLowerCase()) && (
              <BadgeCheck size={13} className="ml-1 text-blue-500 flex-shrink-0" />
            )}
            {isMentioned && (
              <span className="ml-2 text-yellow-600 dark:text-yellow-500 font-bold flex items-center bg-yellow-500/20 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider border border-yellow-500/30">
                Mentioned You
              </span>
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
                : isMentioned 
                  ? 'bg-yellow-500/10 border-2 border-yellow-500/50 text-text rounded-2xl rounded-tl-sm shadow-yellow-500/20'
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
              <div className="flex flex-col pr-4">
                <div className="flex items-start">
                  {isBeacon && <Radio size={16} className="text-accent mr-2 mt-0.5 shrink-0" />}
                  {content.startsWith('[QUIZ]:') && safeJsonParse(content.substring(7)) ? (
                    <QuizCard data={safeJsonParse(content.substring(7))} currentChannel={message.channel_name} pseudo={pseudo} />
                  ) : content.startsWith('[WIKI]:') && safeJsonParse(content.substring(7)) ? (
                    <WikiCard data={safeJsonParse(content.substring(7))} />
                  ) : content.startsWith('[CRYPTO]:') && safeJsonParse(content.substring(9)) ? (
                    <CryptoCard data={safeJsonParse(content.substring(9))} />
                  ) : content.startsWith('[KURS]:') && safeJsonParse(content.substring(7)) ? (
                    <KursCard data={safeJsonParse(content.substring(7))} />
                  ) : content.startsWith('[WEATHER]:') && safeJsonParse(content.substring(10)) ? (
                    <WeatherCard data={safeJsonParse(content.substring(10))} />
                  ) : content.startsWith('[MEME]:') && safeJsonParse(content.substring(7)) ? (
                    <MemeCard data={safeJsonParse(content.substring(7))} />
                  ) : content.startsWith('[TRANSLATE]:') && safeJsonParse(content.substring(12)) ? (
                    <TranslateCard data={safeJsonParse(content.substring(12))} />
                  ) : content.startsWith('[QUIZ_WIN]:') ? (
                    <span className="leading-relaxed whitespace-pre-wrap break-words font-medium text-green-400">
                      {renderMessageContent(content.substring(11))}
                    </span>
                  ) : (
                    <span className={`leading-relaxed whitespace-pre-wrap break-words ${isBeacon ? 'font-medium' : ''}`}>
                      {isBeacon ? renderMessageContent(content.replace('[BEACON SIGNAL]:', '').trim()) : renderMessageContent(content)}
                    </span>
                  )}
                </div>
                {firstUrl && !content.startsWith('[QUIZ]') && !content.startsWith('[WIKI]') && !content.startsWith('[CRYPTO]') && !content.startsWith('[KURS]') && !content.startsWith('[WEATHER]') && !content.startsWith('[MEME]') && !content.startsWith('[TRANSLATE]') && (
                  <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                    {getYouTubeId(firstUrl) ? (
                      <div className="relative w-full sm:w-80 rounded-xl overflow-hidden bg-black aspect-video">
                        <iframe
                          className="absolute top-0 left-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${getYouTubeId(firstUrl)}`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : getSpotifyId(firstUrl) ? (
                      <iframe 
                        className="rounded-xl w-full sm:w-80" 
                        src={`https://open.spotify.com/embed/${getSpotifyId(firstUrl).type}/${getSpotifyId(firstUrl).id}?utm_source=generator&theme=0`} 
                        width="100%" 
                        height={getSpotifyId(firstUrl).type === 'track' ? "152" : "352"} 
                        frameBorder="0" 
                        allowFullScreen="" 
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        loading="lazy"
                      ></iframe>
                    ) : (
                      <LinkPreview url={firstUrl} />
                    )}
                  </div>
                )}
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
