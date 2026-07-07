import React, { useState, useEffect, useRef } from 'react';
import { X, Hash, ArrowRight } from 'lucide-react';

export default function JoinChannelModal({ isOpen, onClose, onJoin }) {
  const [channelName, setChannelName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setChannelName('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (channelName.trim()) {
      onJoin(channelName.trim().toLowerCase());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="glass-panel w-full max-w-[95vw] md:max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-text flex items-center gap-2">
            <Hash size={24} className="text-primary" />
            Join Channel
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-textMuted hover:text-text hover:bg-secondary/50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">
              Nama Channel
            </label>
            <input
              ref={inputRef}
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
              placeholder="contoh: gaming"
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-text placeholder:text-textMuted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={!channelName.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl disabled:opacity-50 transition-opacity"
          >
            Join Sekarang <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
