import React, { useState, useRef } from 'react';
import { Send, Command } from 'lucide-react';

export default function ChatInput({ onSendMessage, broadcastTyping }) {
  const [text, setText] = useState('');
  const typingTimeoutRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const success = await onSendMessage(text);
    if (success) {
      setText('');
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (broadcastTyping) {
      if (!typingTimeoutRef.current) {
        broadcastTyping();
        typingTimeoutRef.current = setTimeout(() => {
          typingTimeoutRef.current = null;
        }, 2000);
      }
    }
  };

  return (
    <div className="p-4 md:p-6 bg-transparent">
      <form onSubmit={handleSubmit} className="relative max-w-5xl mx-auto flex items-center">
        <div className="absolute left-4 text-textMuted pointer-events-none">
          <Command size={20} />
        </div>
        
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder="Message or type /help for commands..."
          className="w-full bg-surface backdrop-blur-xl border border-border text-text placeholder-textMuted rounded-full py-4 pl-12 pr-16 shadow-lg shadow-black/5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
          autoComplete="off"
        />
        
        <button 
          type="submit"
          disabled={!text.trim()}
          className="absolute right-2 p-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          <Send size={18} className="ml-0.5" />
        </button>
      </form>
    </div>
  );
}
