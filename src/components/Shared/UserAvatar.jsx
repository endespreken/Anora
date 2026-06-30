import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function UserAvatar({ nickname, className = "w-10 h-10 text-lg", style }) {
  const { registeredProfiles } = useAuth();
  
  // Ambil URL avatar dari context
  let avatarUrl = null;
  if (nickname && registeredProfiles) {
    const profile = registeredProfiles[nickname.toLowerCase()];
    if (profile && profile.avatar_url) {
      avatarUrl = profile.avatar_url;
    }
  }

  // Format URL sama seperti ProfileModal
  const formatUrl = (url) => {
    if (!url) return '';
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) return 'https://' + cleanUrl.replace(/^:\/\//, '');
    return cleanUrl;
  };

  const initial = nickname ? nickname.charAt(0).toUpperCase() : '?';

  if (avatarUrl) {
    return (
      <div className={`rounded-full overflow-hidden bg-secondary border border-white/20 flex-shrink-0 flex items-center justify-center ${className}`} style={style}>
        <img 
          src={formatUrl(avatarUrl)} 
          alt={nickname} 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover bg-surface"
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = `https://ui-avatars.com/api/?name=${nickname}&background=random`; 
          }} 
        />
      </div>
    );
  }

  // Fallback (Belum upload avatar)
  return (
    <div 
      className={`rounded-full bg-secondary flex items-center justify-center font-bold text-text border border-white/20 flex-shrink-0 ${className}`}
      style={style}
    >
      {initial}
    </div>
  );
}
