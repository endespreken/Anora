import React, { useEffect, useState } from 'react';
import { Hash, Radar, UserPlus, Zap, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchFriends } from '../../services/dbServices';

export default function Sidebar({ currentChannel, changeChannel, openPinModal, openNearbyModal, unreadMentions = [] }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  
  const channels = ['general', 'tech', 'random', 'help'];

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
    <div className="w-72 glass-panel h-full flex flex-col z-10 animate-fade-in border-r border-border border-y-0 border-l-0">
      <div className="p-6 border-b border-border flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
          <Zap size={20} className="text-white" />
        </div>
        <h1 className="font-bold text-2xl tracking-tight text-text">Anora</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-textMuted mb-3 px-2">
            Spaces
          </h2>
          <ul className="space-y-1">
            {channels.map(channel => {
              const isActive = currentChannel === channel;
              const isUnread = unreadMentions.includes(channel);
              
              return (
                <li key={channel}>
                  <button 
                    onClick={() => changeChannel(channel)}
                    className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive 
                      ? 'bg-primary/10 text-primary font-semibold shadow-sm' 
                      : isUnread 
                        ? 'text-accent animate-pulse bg-accent/10 font-bold'
                        : 'text-textMuted hover:bg-secondary/50 hover:text-text'
                    }`}
                  >
                    <Hash size={18} className={`mr-3 ${isActive ? 'text-primary' : 'text-textMuted'}`} /> 
                    <span className="capitalize">{channel}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-textMuted">
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
      
      <div className="p-4 border-t border-border flex items-center justify-between text-xs text-textMuted">
        <span>Anora Web</span>
        <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5"></span> Online</span>
      </div>
    </div>
  );
}
