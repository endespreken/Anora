import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadVibe } from '../../services/dbServices';

const BG_COLORS = [
  'bg-gradient-to-br from-primary to-accent',
  'bg-gradient-to-tr from-pink-500 to-rose-500',
  'bg-gradient-to-bl from-blue-500 to-cyan-400',
  'bg-gradient-to-t from-emerald-500 to-teal-400',
  'bg-gradient-to-r from-amber-400 to-orange-500',
  'bg-gradient-to-b from-indigo-500 to-purple-500',
  'bg-gradient-to-br from-gray-700 to-gray-900',
];

export default function VibeUploadModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [colorIndex, setColorIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!content.trim() || !user) return;
    setLoading(true);
    const success = await uploadVibe(user.id, content.trim(), BG_COLORS[colorIndex]);
    setLoading(false);
    if (success) {
      onClose();
    } else {
      alert("Gagal mengunggah Vibe. Silakan coba lagi.");
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 flex flex-col animate-fade-in p-4 sm:p-8">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onClose} className="p-2 text-white/80 hover:text-white rounded-full bg-white/10 active:scale-95 transition-all">
          <X size={24} />
        </button>
        <button 
          onClick={handleUpload}
          disabled={loading || !content.trim()}
          className="flex items-center space-x-2 bg-primary hover:bg-primaryHover text-white px-5 py-2 rounded-full font-bold active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{loading ? 'Posting...' : 'Share Vibe'}</span>
          <Send size={16} />
        </button>
      </div>

      {/* Main Canvas */}
      <div className={`flex-1 rounded-3xl w-full max-w-lg mx-auto flex items-center justify-center p-8 transition-colors duration-300 shadow-2xl relative ${BG_COLORS[colorIndex]}`}>
        <textarea
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's your vibe today?"
          maxLength={150}
          className="w-full bg-transparent text-white text-3xl font-bold text-center resize-none outline-none placeholder:text-white/50 drop-shadow-md"
          rows={5}
        />
        <div className="absolute bottom-4 right-6 text-white/60 text-sm font-medium">
          {content.length}/150
        </div>
      </div>

      {/* Color Picker */}
      <div className="mt-8 flex items-center justify-center space-x-3 overflow-x-auto py-2">
        {BG_COLORS.map((bg, idx) => (
          <button
            key={idx}
            onClick={() => setColorIndex(idx)}
            className={`w-10 h-10 rounded-full flex-shrink-0 transition-transform ${bg} ${
              colorIndex === idx ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-black' : 'hover:scale-110 opacity-70 hover:opacity-100'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
