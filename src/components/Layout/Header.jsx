import React from 'react';
import { Users, Moon, Sun, Hash } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export default function Header({ currentChannel, onlineCount }) {
  const { theme, toggleTheme } = useTheme();
  const { pseudo } = useAuth();

  return (
    <header className="h-20 glass-header flex items-center justify-between px-8 z-10 sticky top-0">
      <div className="flex items-center space-x-4">
        <div className="flex items-center text-text">
          <Hash size={24} className="text-primary mr-2" />
          <h1 className="text-xl font-bold capitalize tracking-tight">{currentChannel}</h1>
        </div>
        <div className="h-6 w-px bg-border mx-2"></div>
        <div className="flex items-center text-textMuted text-sm font-medium">
          <Users size={16} className="mr-1.5" />
          {onlineCount} {onlineCount === 1 ? 'Member' : 'Members'}
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
