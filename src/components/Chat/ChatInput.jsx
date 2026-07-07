import React, { useState, useRef, useEffect } from 'react';
import { Send, Command, Smile, X, Reply } from 'lucide-react';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import UserAvatar from '../Shared/UserAvatar';

export default function ChatInput({ onSendMessage, broadcastTyping, replyingTo, onCancelReply, onlineUsers = [] }) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const typingTimeoutRef = useRef(null);
  const emojiRef = useRef(null);
  const textareaRef = useRef(null);
  const mentionRef = useRef(null);

  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);

  // Filter unique nicknames that match the search (excluding current user logic if we had pseudo, but here we just show all matches)
  const filteredUsers = [...new Set(
    onlineUsers
      .filter(u => u.pseudo.toLowerCase().startsWith(mentionSearch.toLowerCase()))
      .map(u => u.pseudo)
  )];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [text]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmoji(false);
      }
      if (mentionRef.current && !mentionRef.current.contains(event.target)) {
        setShowMentionPopup(false);
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
    const val = e.target.value;
    setText(val);
    
    // Check for mention triggers
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const match = /(?:^|\s)@([a-zA-Z0-9_]*)$/.exec(textBeforeCursor);
    
    if (match) {
      setMentionSearch(match[1]);
      setShowMentionPopup(true);
      setMentionIndex(0);
      setCursorPos(cursorPosition);
    } else {
      setShowMentionPopup(false);
    }

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

  const insertMention = (nickname) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    const textAfterCursor = text.slice(cursorPos);
    
    const match = /(?:^|\s)@([a-zA-Z0-9_]*)$/.exec(textBeforeCursor);
    if (match) {
      const mentionStart = match.index + (textBeforeCursor[match.index] === ' ' ? 1 : 0);
      const newTextBefore = textBeforeCursor.slice(0, mentionStart) + `@${nickname} `;
      setText(newTextBefore + textAfterCursor);
      setShowMentionPopup(false);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = newTextBefore.length;
          textareaRef.current.selectionEnd = newTextBefore.length;
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const handleKeyDown = (e) => {
    if (showMentionPopup && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredUsers[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowMentionPopup(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) {
        handleSubmit(e);
      }
    }
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

        {showMentionPopup && filteredUsers.length > 0 && (
          <div ref={mentionRef} className="absolute bottom-full mb-4 left-4 z-50 animate-slide-up shadow-2xl rounded-2xl overflow-hidden border border-border bg-surface backdrop-blur-xl max-h-48 overflow-y-auto custom-scrollbar w-64">
            <ul className="py-2">
              {filteredUsers.map((nickname, idx) => (
                <li key={nickname}>
                  <button
                    type="button"
                    onClick={() => insertMention(nickname)}
                    className={`w-full text-left px-4 py-2 hover:bg-secondary/80 transition-colors flex items-center ${idx === mentionIndex ? 'bg-primary/20 text-primary font-bold' : 'text-text'}`}
                  >
                    <UserAvatar nickname={nickname} className="w-8 h-8 text-xs mr-3 shadow-inner flex-shrink-0" />
                    <span className="truncate">{nickname}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <div className="absolute left-4 top-4 text-textMuted pointer-events-none">
            <Command size={20} />
          </div>
          
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="w-full bg-surface backdrop-blur-xl border border-border text-text placeholder-textMuted rounded-3xl py-4 pl-12 pr-28 shadow-lg shadow-black/5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 resize-none custom-scrollbar"
            rows={1}
            style={{ minHeight: '56px', maxHeight: '150px' }}
          />
          
          <div className="absolute right-2 bottom-1.5 flex items-center space-x-1">
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
              className="p-2.5 bg-primary hover:bg-primaryHover text-white rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
