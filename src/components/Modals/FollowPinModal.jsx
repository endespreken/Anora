import React, { useState } from 'react';
import { X, Lock, UserPlus } from 'lucide-react';

export default function FollowPinModal({ isOpen, onClose, targetUserNick, onSubmitPin }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('PIN tidak boleh kosong');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const success = await onSubmitPin(pin.trim());
    if (success) {
      setPin('');
      onClose();
    } else {
      setError('PIN tidak valid atau pengguna salah.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-background/80 backdrop-blur-md animate-fade-in p-4" onClick={onClose}>
      <div className="bg-surface w-full max-w-sm flex flex-col rounded-3xl shadow-2xl overflow-hidden border border-border animate-scale-up" onClick={e => e.stopPropagation()}>
        
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center space-x-2">
            <UserPlus size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-text">Follow {targetUserNick}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-textMuted hover:text-accent hover:bg-secondary/50 rounded-full transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-textMuted mb-4">
            Masukkan PIN rahasia dari <strong>{targetUserNick}</strong> untuk menambahkannya ke daftar teman dan mem-follow percakapan ini.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2 ml-1">PIN Pengguna</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-textMuted">
                  <Lock size={18} />
                </div>
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Contoh: a1b2c3"
                  className="w-full bg-secondary border border-border text-text text-sm rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent block pl-11 p-3.5 transition-all outline-none"
                  maxLength={6}
                />
              </div>
              {error && <p className="text-red-500 text-xs mt-2 ml-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !pin.trim()}
              className="w-full bg-gradient-to-r from-primary to-primaryHover hover:from-primaryHover hover:to-primary text-white font-semibold py-3.5 px-4 rounded-2xl transition-all shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? 'Memverifikasi...' : 'Follow & Tambah Teman'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
