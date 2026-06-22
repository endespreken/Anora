import React, { useMemo } from 'react';
import { X, MapPin, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { calculateDistance, formatDistance } from '../../utils/geo';

export default function NearbyUsersModal({ isOpen, onClose, onlineUsers, onUserClick }) {
  const { user } = useAuth();

  const nearbyUsers = useMemo(() => {
    if (!user || !onlineUsers) return [];

    // Find current user's location
    const currentUserPresence = onlineUsers.find(u => u.user_id === user.id);
    if (!currentUserPresence || currentUserPresence.lat == null) return [];

    const { lat: myLat, lng: myLng } = currentUserPresence;

    // Filter others and calculate distance
    const others = onlineUsers
      .filter(u => u.user_id !== user.id && u.lat != null && u.lng != null)
      .map(u => {
        const dist = calculateDistance(myLat, myLng, u.lat, u.lng);
        return { ...u, distance: dist };
      })
      .sort((a, b) => a.distance - b.distance);

    return others;
  }, [onlineUsers, user]);

  const currentUserPresence = onlineUsers.find(u => u?.user_id === user?.id);
  const locationEnabled = currentUserPresence?.lat != null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-surface backdrop-blur-xl border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-slide-up flex flex-col max-h-[80vh]">
        
        <div className="h-2 w-full bg-gradient-to-r from-primary to-accent shrink-0"></div>
        
        <div className="p-8 pb-4 shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-secondary/50 text-textMuted hover:text-text hover:bg-secondary transition-all"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin size={20} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-text tracking-tight">
              Nearby Users
            </h2>
          </div>
          <p className="text-sm text-textMuted mb-4">
            See who's currently online around you.
          </p>
        </div>

        <div className="px-8 pb-8 overflow-y-auto">
          {!locationEnabled ? (
            <div className="bg-secondary/20 border border-border rounded-2xl p-6 text-center">
              <p className="text-sm text-textMuted">
                Please allow location access in your browser to see nearby users.
              </p>
            </div>
          ) : nearbyUsers.length === 0 ? (
            <div className="bg-secondary/20 border border-border rounded-2xl p-6 text-center">
              <p className="text-sm text-textMuted">
                No other users found nearby.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {nearbyUsers.map(u => (
                <li key={u.user_id}>
                  <button 
                    onClick={() => {
                      if (onUserClick) {
                        onUserClick(u.pseudo);
                        onClose();
                      }
                    }}
                    className="w-full text-left bg-secondary/10 border border-border rounded-xl p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-border flex items-center justify-center font-bold text-textMuted shadow-inner group-hover:text-text transition-colors">
                        {u.pseudo ? u.pseudo.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <div className="font-semibold text-text group-hover:text-primary transition-colors">{u.pseudo}</div>
                        <div className="text-xs text-green-400 flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
                          Online
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-primary">
                          {formatDistance(u.distance)}
                        </div>
                        <div className="text-xs text-textMuted">away</div>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary/50 group-hover:bg-primary/20 text-textMuted group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                        <MessageCircle size={18} />
                      </div>
                    </div>
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
