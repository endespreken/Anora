import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function NativeConfirm({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Ya', cancelText = 'Tidak' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface/90 backdrop-blur-xl border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-up flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4">
          <HelpCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-text mb-2">{title || 'Konfirmasi'}</h3>
        <p className="text-textMuted mb-8 whitespace-pre-wrap leading-relaxed">{message}</p>
        <div className="flex space-x-3 w-full">
          <button 
            onClick={onCancel}
            className="flex-1 bg-secondary/50 hover:bg-secondary text-text py-3 rounded-full font-bold active:scale-95 transition-all"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 bg-primary hover:bg-primaryHover text-white py-3 rounded-full font-bold active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
