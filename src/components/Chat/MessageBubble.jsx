import React from 'react';
import { Radio, Check, CheckCheck } from 'lucide-react';
import emoji from 'react-easy-emoji';

export default function MessageBubble({ message, isOwn }) {
  const { user_pseudo, content, created_at, is_system_msg } = message;
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

  return (
    <div className={`mb-6 flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up group`}>
      <div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="text-[11px] text-textMuted mb-1.5 flex items-center space-x-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
      </div>
    </div>
  );
}
