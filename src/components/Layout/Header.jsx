import React, { useState, useRef, useEffect } from 'react';
import { Users, Moon, Sun, Hash, Menu, MessageCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export default function Header({ currentChannel, onlineUsers = [], onMenuClick, onUserClick }) {
  const { theme, toggleTheme } = useTheme();
  const { pseudo } = useAuth();
  const [showMembers, setShowMembers] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMembers(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-20 glass-header flex items-center justify-between px-4 md:px-8 z-10 sticky top-0">
      <div className="flex items-center space-x-3 md:space-x-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-textMuted hover:text-text hover:bg-secondary/50 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center text-text">
          <Hash size={20} className="text-primary mr-1.5 md:mr-2 md:w-6 md:h-6" />
          <h1 className="text-lg md:text-xl font-bold capitalize tracking-tight">{currentChannel}</h1>
        </div>
        <div className="h-6 w-px bg-border mx-2"></div>
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowMembers(!showMembers)}
            className="flex items-center text-textMuted hover:text-text text-sm font-medium transition-colors px-2 py-1 rounded hover:bg-secondary/30"
          >
            <Users size={16} className="mr-1.5" />
            {onlineUsers.length} {onlineUsers.length === 1 ? 'Member' : 'Members'}
          </button>

          {showMembers && (
            <div className="absolute top-full left-0 mt-3 w-56 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-slide-up">
              <div className="px-4 py-2 bg-secondary/20 border-b border-border text-xs font-semibold text-textMuted uppercase tracking-wider">
                Online Users
              </div>
              <ul className="max-h-64 overflow-y-auto py-1">
                {onlineUsers.map((u, idx) => (
                  <li key={idx}>
                    <button 
                      onClick={() => {
                        setShowMembers(false);
                        if (u.user !== pseudo) {
                          onUserClick(u.user);
                        }
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/40 transition-colors text-left group"
                    >
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-400 mr-3 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                        <span className={`text-sm ${u.user === pseudo ? 'font-semibold text-text' : 'text-textMuted group-hover:text-text'}`}>
                          {u.user} {u.user === pseudo && '(You)'}
                        </span>
                      </div>
                      {u.user !== pseudo && (
                        <MessageCircle size={14} className="text-textMuted opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="hidden md:flex items-center space-x-2 text-sm bg-secondary/30 px-3 py-1.5 rounded-full border border-border">
          <span className="text-textMuted">As</span>
          <span className="font-semibold text-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {pseudo}
          </span>
        </div>
        
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-full hover:bg-secondary/50 text-textMuted hover:text-text transition-all duration-200 border border-transparent hover:border-border shadow-sm"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  );
}
