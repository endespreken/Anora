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
    if (!cleanUrl.startsWith('http')) cleanUrl = 'https://' + cleanUrl.replace(/^:\/\//, '');
    return cleanUrl.replace('pub-f591f14e39f84bdc80676d77036d98b2.r2.dev', 'media.anorachat.com');
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
            e.target.src = `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(nickname)}`; 
          }} 
        />
      </div>
    );
  }

  // Fallback (Belum upload avatar) - Menggunakan DiceBear
  return (
    <div 
      className={`rounded-full overflow-hidden bg-secondary border border-white/20 flex-shrink-0 flex items-center justify-center ${className}`}
      style={style}
    >
      <img 
        src={`https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(nickname)}`} 
        alt={nickname} 
        className="w-full h-full object-cover bg-surface"
      />
    </div>
  );
}
