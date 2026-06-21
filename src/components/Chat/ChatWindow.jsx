import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquareDashed } from 'lucide-react';

export default function ChatWindow({ messages, loading }) {
  const { pseudo } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center space-y-4 animate-pulse">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <div className="text-textMuted font-medium tracking-wide">Syncing Space...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scroll-smooth">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-textMuted space-y-4 animate-fade-in">
          <div className="w-20 h-20 bg-secondary/30 rounded-full flex items-center justify-center mb-2">
            <MessageSquareDashed size={32} className="text-primary/60" />
          </div>
          <p className="text-lg font-medium text-text">It's quiet in here.</p>
          <p className="text-sm">Be the first to send a message.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-5xl mx-auto">
          {messages.map((msg) => (
            <MessageBubble 
              key={msg.id || msg.created_at + Math.random()} 
              message={msg} 
              isOwn={msg.user_pseudo === pseudo}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
