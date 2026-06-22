import React, { useState, useRef, useEffect } from 'react';
import { Send, Command, Smile, X, Reply } from 'lucide-react';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';

export default function ChatInput({ onSendMessage, broadcastTyping, replyingTo, onCancelReply }) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const typingTimeoutRef = useRef(null);
  const emojiRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmoji(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const success = await onSendMessage(text);
    if (success) {
      setText('');
      setShowEmoji(false);
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

  const onEmojiClick = (emojiObject) => {
    setText(prev => prev + emojiObject.emoji);
  };

  return (
    <div className="p-4 md:p-6 bg-transparent relative">
      <div className="max-w-5xl mx-auto relative">
        {replyingTo && (
          <div className="absolute bottom-full mb-2 left-2 right-2 bg-surface/90 backdrop-blur-md border border-primary/30 px-4 py-2.5 rounded-2xl flex justify-between items-center shadow-lg animate-slide-up z-40">
            <div className="flex items-center space-x-3 overflow-hidden">
              <Reply size={16} className="text-primary flex-shrink-0" />
              <div className="flex flex-col overflow-hidden text-sm">
                <span className="font-semibold text-primary truncate">Replying to {replyingTo.user_pseudo}</span>
                <span className="text-textMuted truncate max-w-[200px] sm:max-w-xs">{replyingTo.content.substring(0, 60)}{replyingTo.content.length > 60 ? '...' : ''}</span>
              </div>
            </div>
            <button type="button" onClick={onCancelReply} className="text-textMuted hover:text-red-400 p-1.5 bg-secondary/50 hover:bg-secondary rounded-full transition-colors flex-shrink-0">
              <X size={16} />
            </button>
          </div>
        )}
        
        {showEmoji && (
          <div ref={emojiRef} className="absolute bottom-full mb-4 right-0 z-50 animate-slide-up shadow-2xl rounded-2xl overflow-hidden border border-border">
            <EmojiPicker 
              onEmojiClick={onEmojiClick} 
              theme="dark"
              emojiStyle={EmojiStyle.TWEMOJI}
              searchDisabled={true}
              skinTonesDisabled={true}
              height={350}
              width={320}
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <div className="absolute left-4 text-textMuted pointer-events-none">
            <Command size={20} />
          </div>
          
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="Message or type /help for commands..."
            className="w-full bg-surface backdrop-blur-xl border border-border text-text placeholder-textMuted rounded-full py-4 pl-12 pr-28 shadow-lg shadow-black/5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
            autoComplete="off"
          />
          
          <div className="absolute right-2 flex items-center space-x-1">
            <button 
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className={`p-2.5 rounded-full transition-all duration-200 focus:outline-none ${showEmoji ? 'text-primary bg-primary/10' : 'text-textMuted hover:text-primary hover:bg-secondary/50'}`}
            >
              <Smile size={20} />
            </button>
            <button 
              type="submit"
              disabled={!text.trim()}
              className="p-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
