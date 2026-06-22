import React, { useState } from 'react';
import { Radio, Check, CheckCheck, Reply as ReplyIcon, ChevronDown } from 'lucide-react';
import emoji from 'react-easy-emoji';
import { useAuth } from '../../contexts/AuthContext';

export default function MessageBubble({ message, isOwn, onReply, onReact, allMessages = [] }) {
  const [showMenu, setShowMenu] = useState(false);
  const { pseudo } = useAuth();
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
  
  const repliedMessage = reply_to_id ? allMessages.find(m => m.id === reply_to_id) : null;
  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <div 
      className={`mb-6 flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up group`}
      onMouseLeave={() => setShowMenu(false)}
    >
      <div className={`max-w-[75%] flex flex-col relative group ${isOwn ? 'items-end' : 'items-start'}`}>
        
        {/* Toggle Button */}
        {!is_system_msg && (
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className={`absolute top-2 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-textMuted hover:text-text bg-surface/50 hover:bg-surface rounded-full p-1 z-10 shadow-sm border border-transparent hover:border-border`}
          >
            <ChevronDown size={14} />
          </button>
        )}

        {/* Action Menu */}
        {!is_system_msg && showMenu && (
          <div className={`absolute top-0 ${isOwn ? 'right-full mr-8' : 'left-full ml-8'} flex items-center space-x-1 bg-surface border border-border rounded-full shadow-lg p-1 z-20 animate-fade-in`}>
            {quickReactions.map(emo => (
              <button 
                key={emo} 
                onClick={() => {
                  if (onReact) onReact(emo);
                  setShowMenu(false);
                }}
                className="w-7 h-7 flex items-center justify-center hover:bg-secondary rounded-full transition-colors"
                title="React"
              >
                {emoji(emo)}
              </button>
            ))}
            <div className="w-px h-4 bg-border mx-1"></div>
            <button 
              onClick={() => {
                if (onReply) onReply();
                setShowMenu(false);
              }}
              className="w-7 h-7 flex items-center justify-center text-textMuted hover:text-primary hover:bg-secondary rounded-full transition-colors"
              title="Reply"
            >
              <ReplyIcon size={14} />
            </button>
          </div>
        )}

        <div className="text-[11px] text-textMuted mb-1.5 flex items-center space-x-2 px-1 transition-opacity duration-200">
          {isOwn ? (
            <>
              <span>{time}</span>
              <span className="font-semibold text-text">{user_pseudo}</span>
            </>
          ) : (
            <>
              <span className="font-semibold text-text">{user_pseudo}</span>
              <span>{time}</span>
            </>
          )}
        </div>
        
        <div className={`px-5 py-3 shadow-md relative overflow-hidden ${
          isBeacon 
            ? 'bg-surface border border-accent text-text rounded-2xl animate-pulse-slow shadow-accent/20'
            : isOwn 
              ? 'bg-gradient-to-br from-primary to-primaryHover text-white rounded-2xl rounded-tr-sm shadow-primary/20' 
              : 'bg-surface border border-border text-text rounded-2xl rounded-tl-sm'
        }`}>
          {isBeacon && (
            <div className="absolute inset-0 bg-accent/5 pointer-events-none"></div>
          )}
          
          {reply_to_id && (
            <div className={`mb-2 pl-2 border-l-2 text-xs opacity-80 ${isOwn ? 'border-white/50' : 'border-primary/50'}`}>
              <div className="font-semibold mb-0.5">{repliedMessage ? repliedMessage.user_pseudo : 'Unknown User'}</div>
              <div className="truncate max-w-[200px]">
                {repliedMessage ? repliedMessage.content : 'Message not found'}
              </div>
            </div>
          )}
          
          <div className="relative z-10 flex items-end justify-between space-x-3">
            <div className="flex items-start">
              {isBeacon && <Radio size={16} className="text-accent mr-2 mt-0.5 shrink-0" />}
              <span className={`leading-relaxed whitespace-pre-wrap ${isBeacon ? 'font-medium' : ''}`}>
                {isBeacon ? emoji(content.replace('[BEACON SIGNAL]:', '').trim()) : emoji(content)}
              </span>
            </div>
            {isOwn && (
              <div className="shrink-0 flex items-center pt-2">
                {message.is_read ? (
                  <CheckCheck size={14} className="text-blue-300 drop-shadow-sm" />
                ) : (
                  <Check size={14} className="text-white/60" />
                )}
              </div>
            )}
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
