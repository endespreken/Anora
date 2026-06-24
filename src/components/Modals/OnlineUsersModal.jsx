import React from 'react';
import { Users, X, MessageCircle, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function OnlineUsersModal({ isOpen, onClose, onlineUsers, onUserClick }) {
  const { pseudo, allRegisteredNicks = [], isRegistered } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md animate-fade-in px-4">
      <div className="bg-surface w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-border animate-scale-up">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">Room Members</h2>
              <p className="text-xs text-textMuted">{onlineUsers.length} Online</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-textMuted hover:text-accent bg-secondary/50 hover:bg-accent/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-2 max-h-[50vh] overflow-y-auto">
          {onlineUsers.length === 0 ? (
            <div className="py-8 text-center text-textMuted text-sm">
              Tidak ada user lain.
            </div>
          ) : (
            <ul className="space-y-1">
              {onlineUsers.map((u, idx) => (
                <li key={idx}>
                  <button 
                    onClick={() => {
                      if (u.pseudo !== pseudo) {
                        onUserClick(u.pseudo);
                        onClose();
                      }
                    }}
                    disabled={u.pseudo === pseudo}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors text-left group ${
                      u.pseudo === pseudo ? 'cursor-default opacity-80' : 'hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-3 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                      <span className={`text-sm flex items-center ${u.pseudo === pseudo ? 'font-semibold text-text' : 'text-textMuted group-hover:text-text'}`}>
                        {u.pseudo} {u.pseudo === pseudo && '(You)'}
                        {((u.pseudo === pseudo && isRegistered) || allRegisteredNicks.some(nick => nick.toLowerCase() === u.pseudo.toLowerCase())) && (
                          <BadgeCheck size={14} className="ml-1 text-blue-500 flex-shrink-0" />
                        )}
                      </span>
                    </div>
                    {u.pseudo !== pseudo && (
                      <div className="p-1.5 rounded-lg bg-secondary/50 group-hover:bg-primary/20 text-textMuted group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                        <MessageCircle size={16} />
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
