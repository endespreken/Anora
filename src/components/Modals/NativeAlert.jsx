import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function NativeAlert({ isOpen, message, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface/90 backdrop-blur-xl border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-up flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-text mb-2">Peringatan</h3>
        <p className="text-textMuted mb-6 whitespace-pre-wrap leading-relaxed">{message}</p>
        <button 
          onClick={onClose}
          className="w-full bg-primary hover:bg-primaryHover text-white py-3 rounded-full font-bold active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
}
