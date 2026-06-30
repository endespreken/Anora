import React, { useState, useRef, useEffect } from 'react';
import { Users, Moon, Sun, Hash, Menu, MessageCircle, ArrowLeft, Lock, Settings, MoreVertical, Bookmark, BookmarkCheck, BadgeCheck } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../Shared/UserAvatar';

export default function Header({ 
  currentChannel, onlineUsers = [], onMenuClick, onUserClick, 
  isMobileChatOpen, onBack, onShowMembers, onSettingsClick,
  isFollowing, onToggleFollow, onProfileClick
}) {
  const { theme, toggleTheme } = useTheme();
  const { pseudo, isRegistered } = useAuth();

  const isPrivateChannel = currentChannel.startsWith('@');
  const displayChannelName = isPrivateChannel
    ? (currentChannel.replace('@', '').split('-').find(p => p !== pseudo) || currentChannel.replace('@', '').split('-')[0])
    : currentChannel;



  return (
    <header className="h-20 glass-header flex items-center justify-between px-4 md:px-8 z-10 sticky top-0">
      <div className="flex items-center space-x-3 md:space-x-4">
        {isMobileChatOpen ? (
          <button 
            onClick={onBack}
            className="md:hidden p-2 -ml-2 text-textMuted hover:text-text hover:bg-secondary/50 rounded-lg transition-colors"
            title="Back to list"
          >
            <ArrowLeft size={24} />
          </button>
        ) : (
          <button 
            onClick={onMenuClick}
            className="hidden p-2 -ml-2 text-textMuted hover:text-text hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
        )}
        <div className="flex items-center text-text">
          {isPrivateChannel ? (
            <UserAvatar nickname={displayChannelName} className="w-8 h-8 mr-2 md:mr-3 text-xs shadow-sm" />
          ) : (
            <Hash size={20} className="text-primary mr-1.5 md:mr-2 md:w-6 md:h-6" />
          )}
          <div className="flex flex-col">
            <h1 
              className={`text-lg md:text-xl font-bold capitalize tracking-tight leading-none flex items-center ${isPrivateChannel ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
              onClick={() => isPrivateChannel && onProfileClick && onProfileClick(displayChannelName)}
            >
              {displayChannelName}
              {currentChannel === 'random' && (
                <BadgeCheck size={18} className="ml-1.5 text-blue-500 flex-shrink-0" />
              )}
            </h1>
            {!isPrivateChannel && (
              <button 
                onClick={onShowMembers}
                className="flex items-center mt-1 text-[11px] text-textMuted hover:text-text transition-colors text-left"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
                {onlineUsers.length} Online
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="hidden md:flex items-center space-x-2 text-sm bg-secondary/30 px-3 py-1.5 rounded-full border border-border">
          <span className="text-textMuted">As</span>
          <span className="font-semibold text-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {pseudo}
          </span>
        </div>
        
        {isRegistered && (
          <button 
            onClick={onToggleFollow}
            disabled={currentChannel === 'random'}
            className={`p-2 rounded-full transition-all duration-200 border shadow-sm active:scale-95 ${
              currentChannel === 'random' 
                ? 'bg-primary/20 text-primary border-primary/30 opacity-70 cursor-not-allowed'
                : isFollowing 
                  ? 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30' 
                  : 'bg-secondary/30 text-textMuted border-transparent hover:text-text hover:border-border hover:bg-secondary/50'
            }`}
            title={
              currentChannel === 'random' ? "Official Channel (Selalu Diikuti)" : 
              isPrivateChannel ? (isFollowing ? "Unfollow Teman" : "Add Friend") :
              isFollowing ? "Unfollow Channel" : "Follow Channel"
            }
          >
            {currentChannel === 'random' || isFollowing ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
        )}

        <button 
          onClick={onSettingsClick}
          className="p-2.5 rounded-full hover:bg-secondary/50 text-textMuted hover:text-text transition-all duration-200 border border-transparent hover:border-border shadow-sm"
          title="Pengaturan"
        >
          <Settings size={18} className="hidden md:block" />
          <MoreVertical size={20} className="block md:hidden" />
        </button>
      </div>
    </header>
  );
}
