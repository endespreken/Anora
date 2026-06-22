import React, { useEffect, useState } from 'react';
import { Hash, Radar, UserPlus, Zap, MapPin, X, Lock, Pin, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchFriends } from '../../services/dbServices';

export default function Sidebar({ 
  currentChannel, changeChannel, openPinModal, openNearbyModal, 
  unreadCounts = {}, privateChannels = [], closePrivateChannel, 
  joinedSpaces = ['random'], closeSpace, activeMobileTab = 'pms', 
  onMarkAsRead, pinnedChannels = [], onPinChat, globalTyping = {},
  globalOnlineUsers = []
}) {
  const { user, pseudo } = useAuth();
  const [friends, setFriends] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);

  const sortedSpaces = [...joinedSpaces].sort((a, b) => {
    const aPinned = pinnedChannels.includes(a);
    const bPinned = pinnedChannels.includes(b);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  const sortedPMs = [...privateChannels].sort((a, b) => {
    const aPinned = pinnedChannels.includes(a);
    const bPinned = pinnedChannels.includes(b);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  const isLongPress = React.useRef(false);
  const pressTimer = React.useRef(null);

  const startPress = (channel, isSpace) => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50); // Haptic feedback on mobile
      }
      setContextMenu({ channel, isSpace });
    }, 600); // 600ms hold
  };

  const endPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  const handleChannelClick = (channel) => {
    if (!isLongPress.current) {
      changeChannel(channel);
    }
  };

  useEffect(() => {
    if (user) {
      const loadFriends = async () => {
        const friendIds = await fetchFriends(user.id);
        setFriends(friendIds);
      };
      loadFriends();
    }
  }, [user]);

  return (
    <div className="w-full md:w-72 glass-panel h-[100dvh] flex flex-col border-r border-border border-y-0 border-l-0">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap size={20} className="text-white" />
          </div>
          <h1 className="font-bold text-2xl tracking-tight text-text">Anora</h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 md:space-y-8 pb-20 md:pb-4">
        
        {/* SPACES */}
        <div className={activeMobileTab === 'spaces' ? 'block' : 'hidden md:block'}>
          <h2 className="hidden md:block text-xs font-bold uppercase tracking-wider text-textMuted mb-3 px-2">
            Spaces
          </h2>
          <ul className="space-y-1">
            {sortedSpaces.map(channel => {
              const isActive = currentChannel === channel;
              const unreadCount = unreadCounts[channel] || 0;
              const isUnread = unreadCount > 0;
              const isPinned = pinnedChannels.includes(channel);
              const isTyping = globalTyping[channel] && globalTyping[channel].length > 0;
              
              return (
                <li key={channel} className="group relative">
                  <button 
                    onClick={() => handleChannelClick(channel)}
                    onTouchStart={() => startPress(channel, true)}
                    onTouchEnd={endPress}
                    onTouchMove={endPress}
                    onMouseDown={() => startPress(channel, true)}
                    onMouseUp={endPress}
                    onMouseLeave={endPress}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`w-full flex items-center px-3 py-2 rounded-xl transition-all duration-200 pr-8 select-none ${
                      isActive 
                      ? 'bg-primary/10 text-primary font-semibold shadow-sm' 
                      : isUnread 
                        ? 'text-accent bg-accent/10 font-bold'
                        : 'text-textMuted hover:bg-secondary/50 hover:text-text'
                    }`}
                  >
                    <Hash size={18} className={`mr-3 flex-shrink-0 ${isActive ? 'text-primary' : 'text-textMuted'}`} /> 
                    <div className="flex flex-col items-start overflow-hidden mr-2 flex-1 text-left">
                      <div className="flex items-center w-full">
                        <span className="capitalize truncate">{channel}</span>
                        {isPinned && <Pin size={12} className="ml-1.5 text-primary flex-shrink-0" />}
                        <div className="ml-auto flex items-center space-x-1 pl-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
                          <span className="text-[10px] font-medium opacity-80">{channel === 'random' ? globalOnlineUsers.length : globalOnlineUsers.filter(u => u.spaces?.includes(channel)).length}</span>
                        </div>
                      </div>
                      {isTyping && <span className="text-[10px] text-green-500 font-medium animate-pulse mt-0.5">Typing...</span>}
                    </div>
                    {isUnread && (
                      <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] h-[20px] flex items-center justify-center shadow-sm flex-shrink-0">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {channel !== 'random' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeSpace && closeSpace(channel);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-textMuted hover:text-accent hover:bg-secondary/80 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="Leave Space"
                    >
                      <X size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* PMs */}
        <div className={activeMobileTab === 'pms' ? 'block' : 'hidden md:block'}>
          <h2 className="hidden md:block text-xs font-bold uppercase tracking-wider text-textMuted mb-3 px-2">
            Private Messages
          </h2>
          {privateChannels.length === 0 && (
            <div className="px-4 py-6 text-center bg-secondary/30 rounded-2xl border border-dashed border-border mt-2 flex flex-col items-center mx-2 animate-fade-in">
              <MessageCircle size={32} className="text-textMuted mb-3 opacity-50" />
              <p className="text-sm text-textMuted mb-4">Belum ada obrolan private.</p>
              <button 
                onClick={openNearbyModal} 
                className="px-4 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl text-xs hover:opacity-90 transition-opacity shadow-lg shadow-primary/30 w-full"
              >
                Cari Teman Sekitar
              </button>
            </div>
          )}
          {privateChannels.length > 0 && (
            <ul className="space-y-1">
              {sortedPMs.map(channel => {
                const isActive = currentChannel === channel;
                const unreadCount = unreadCounts[channel] || 0;
                const isUnread = unreadCount > 0;
                const isPinned = pinnedChannels.includes(channel);
                const isTyping = globalTyping[channel] && globalTyping[channel].length > 0;
                
                const parts = channel.replace('@', '').split('-');
                const targetUser = parts.find(p => p !== pseudo) || parts[0];

                return (
                  <li key={channel} className="group relative">
                    <button 
                      onClick={() => handleChannelClick(channel)}
                      onTouchStart={() => startPress(channel, false)}
                      onTouchEnd={endPress}
                      onTouchMove={endPress}
                      onMouseDown={() => startPress(channel, false)}
                      onMouseUp={endPress}
                      onMouseLeave={endPress}
                      onContextMenu={(e) => e.preventDefault()}
                      className={`w-full flex items-center px-3 py-2 rounded-xl transition-all duration-200 pr-8 select-none ${
                        isActive 
                        ? 'bg-primary/10 text-primary font-semibold shadow-sm' 
                        : isUnread 
                          ? 'text-accent bg-accent/10 font-bold'
                          : 'text-textMuted hover:bg-secondary/50 hover:text-text'
                      }`}
                    >
                      <Lock size={16} className={`mr-3 flex-shrink-0 ${isActive ? 'text-primary' : 'text-textMuted'}`} /> 
                      <div className="flex flex-col items-start overflow-hidden mr-2 flex-1 text-left">
                        <div className="flex items-center w-full">
                          <span className="capitalize truncate">{targetUser}</span>
                          {isPinned && <Pin size={12} className="ml-1.5 text-primary flex-shrink-0" />}
                        </div>
                        {isTyping && <span className="text-[10px] text-green-500 font-medium animate-pulse mt-0.5">Typing...</span>}
                      </div>
                      {isUnread && (
                        <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] h-[20px] flex items-center justify-center shadow-sm flex-shrink-0">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closePrivateChannel(channel);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-textMuted hover:text-accent hover:bg-secondary/80 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="Close"
                    >
                      <X size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* CONNECTIONS */}
        <div className={activeMobileTab === 'connections' ? 'block' : 'hidden md:block'}>
          <div className="flex items-center justify-between mb-3 px-2 md:mt-0 mt-2">
            <h2 className="hidden md:block text-xs font-bold uppercase tracking-wider text-textMuted">
              Connections
            </h2>
            <div className="flex items-center space-x-1">
              <button 
                onClick={openNearbyModal}
                className="text-textMuted hover:text-primary transition-colors bg-secondary/50 p-1.5 rounded-lg"
                title="Nearby Users"
              >
                <MapPin size={16} />
              </button>
              <button 
                onClick={openPinModal}
                className="text-textMuted hover:text-primary transition-colors bg-secondary/50 p-1.5 rounded-lg"
                title="Add Connection"
              >
                <UserPlus size={16} />
              </button>
            </div>
          </div>
          {friends.length === 0 ? (
            <div className="px-3 py-4 text-sm text-textMuted text-center bg-secondary/30 rounded-xl border border-dashed border-border">
              No connections yet.
            </div>
          ) : (
            <ul className="space-y-1">
              {friends.map((friendId, idx) => (
                <li key={idx} className="px-3 py-2 rounded-xl text-sm text-text flex items-center hover:bg-secondary/30 transition-colors cursor-default">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-border flex items-center justify-center mr-3 shadow-inner">
                    <Radar size={14} className="text-textMuted" />
                  </div>
                  User_{friendId.substring(0, 4)}
                  <span className="ml-auto w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="hidden md:flex p-4 border-t border-border items-center justify-between text-xs text-textMuted">
        <span>Anora Web</span>
        <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5"></span> Online</span>
      </div>

      {/* Context Menu Modal */}
      {contextMenu && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setContextMenu(null)}>
          <div className="w-full sm:w-80 bg-surface border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-border rounded-full mx-auto mb-4 sm:hidden"></div>
            <h3 className="text-lg font-bold text-text mb-4 capitalize text-center">
              {contextMenu.channel.replace('@', '').split('-').find(p => p !== pseudo) || contextMenu.channel}
            </h3>
            <div className="space-y-2">
              <button 
                onClick={() => {
                  if (onPinChat) onPinChat(contextMenu.channel);
                  setContextMenu(null);
                }}
                className="w-full flex items-center px-4 py-3 bg-secondary/30 hover:bg-secondary/50 text-text rounded-xl transition-colors font-medium"
              >
                {pinnedChannels.includes(contextMenu.channel) ? 'Unpin Chat' : 'Pin Chat'}
              </button>
              <button 
                onClick={() => {
                  if (onMarkAsRead) onMarkAsRead(contextMenu.channel);
                  setContextMenu(null);
                }}
                className="w-full flex items-center px-4 py-3 bg-secondary/30 hover:bg-secondary/50 text-text rounded-xl transition-colors font-medium"
              >
                Tandai sudah dibaca
              </button>
              <button 
                onClick={() => {
                  if (contextMenu.isSpace) {
                    if (closeSpace && contextMenu.channel !== 'random') closeSpace(contextMenu.channel);
                  } else {
                    closePrivateChannel(contextMenu.channel);
                  }
                  setContextMenu(null);
                }}
                className="w-full flex items-center px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors font-bold"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
