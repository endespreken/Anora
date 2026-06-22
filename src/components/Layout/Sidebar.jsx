import React, { useEffect, useState } from 'react';
import { Hash, Radar, UserPlus, Zap, MapPin, X, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchFriends } from '../../services/dbServices';

export default function Sidebar({ currentChannel, changeChannel, openPinModal, openNearbyModal, unreadCounts = {}, privateChannels = [], closePrivateChannel, joinedSpaces = ['random'], closeSpace, activeMobileTab = 'pms' }) {
  const { user, pseudo } = useAuth();
  const [friends, setFriends] = useState([]);

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
            {joinedSpaces.map(channel => {
              const isActive = currentChannel === channel;
              const unreadCount = unreadCounts[channel] || 0;
              const isUnread = unreadCount > 0;
              
              return (
                <li key={channel} className="group relative">
                  <button 
                    onClick={() => changeChannel(channel)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive 
                      ? 'bg-primary/10 text-primary font-semibold shadow-sm' 
                      : isUnread 
                        ? 'text-accent animate-pulse bg-accent/10 font-bold'
                        : 'text-textMuted hover:bg-secondary/50 hover:text-text'
                    }`}
                  >
                    <div className="flex items-center">
                      <Hash size={18} className={`mr-3 ${isActive ? 'text-primary' : 'text-textMuted'}`} /> 
                      <span className="capitalize">{channel}</span>
                    </div>
                    {isUnread && (
                      <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
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
          {privateChannels.length > 0 && (
            <h2 className="hidden md:block text-xs font-bold uppercase tracking-wider text-textMuted mb-3 px-2">
              Private Messages
            </h2>
          )}
          {privateChannels.length === 0 && (
            <div className="md:hidden px-3 py-4 text-sm text-textMuted text-center bg-secondary/30 rounded-xl border border-dashed border-border mt-2">
              Belum ada obrolan private.
            </div>
          )}
          {privateChannels.length > 0 && (
            <ul className="space-y-1">
              {privateChannels.map(channel => {
                const isActive = currentChannel === channel;
                const unreadCount = unreadCounts[channel] || 0;
                const isUnread = unreadCount > 0;
                
                const parts = channel.replace('@', '').split('-');
                const targetUser = parts.find(p => p !== pseudo) || parts[0];

                return (
                  <li key={channel} className="group relative">
                    <button 
                      onClick={() => changeChannel(channel)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive 
                        ? 'bg-primary/10 text-primary font-semibold shadow-sm' 
                        : isUnread 
                          ? 'text-accent animate-pulse bg-accent/10 font-bold'
                          : 'text-textMuted hover:bg-secondary/50 hover:text-text'
                      }`}
                    >
                      <div className="flex items-center">
                        <Lock size={16} className={`mr-3 ${isActive ? 'text-primary' : 'text-textMuted'}`} /> 
                        <span className="capitalize">{targetUser}</span>
                      </div>
                      {isUnread && (
                        <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
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
    </div>
  );
}
