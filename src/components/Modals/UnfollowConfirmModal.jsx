import React, { useState } from 'react';
import { UserMinus, AlertTriangle, Hash } from 'lucide-react';

export default function UnfollowConfirmModal({ isOpen, onClose, targetUserNick, isSpace = false, onConfirm }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-background/80 backdrop-blur-md animate-fade-in p-4" onClick={onClose}>
      <div className="bg-surface w-full max-w-xs flex flex-col rounded-3xl shadow-2xl overflow-hidden border border-border animate-scale-up" onClick={e => e.stopPropagation()}>
        
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4">
            {isSpace ? <Hash size={32} /> : <UserMinus size={32} />}
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Unfollow {targetUserNick}?</h2>
          <p className="text-sm text-textMuted mb-6">
            {isSpace 
              ? `Apakah kamu yakin ingin berhenti mengikuti space ${targetUserNick}?`
              : `Apakah kamu yakin ingin berhenti mengikuti percakapan ini dan menghapus ${targetUserNick} dari daftar temanmu?`}
          </p>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-2xl border border-border text-text font-medium hover:bg-secondary/50 transition-all active:scale-95 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-2xl bg-accent hover:bg-red-600 text-white font-medium transition-all shadow-lg hover:shadow-accent/25 active:scale-95 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? 'Memproses...' : 'Unfollow'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
