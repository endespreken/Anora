import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function PinGeneratorModal({ isOpen, onClose }) {
  const { isRegistered, permanentPin } = useAuth();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (permanentPin) {
      navigator.clipboard.writeText(permanentPin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-surface backdrop-blur-xl border border-border w-full max-w-[95vw] md:max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-slide-up flex flex-col max-h-[85vh] overflow-y-auto">
        
        <div className="h-2 w-full bg-gradient-to-r from-primary to-accent"></div>
        
        <div className="p-8">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-secondary/50 text-textMuted hover:text-text hover:bg-secondary transition-all active:scale-95"
          >
            <X size={18} />
          </button>
          
          <h2 className="text-2xl font-bold text-text mb-2 tracking-tight">
            Add Connection
          </h2>
          <p className="text-sm text-textMuted mb-8">
            {isRegistered ? 
              <>Share your Permanent PIN. Tell your friend to type <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">/addfriend [PIN]</span> or use the Follow button in Private Message.</> :
              "Create a permanent PIN to start adding friends."
            }
          </p>

          <div className="bg-secondary/20 border border-border rounded-2xl p-8 flex flex-col items-center justify-center min-h-[160px] relative group">
            {!isRegistered ? (
              <div className="text-center animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-500 text-xl font-bold">!</span>
                </div>
                <h3 className="text-text font-bold text-lg mb-2">Nickname Anonim</h3>
                <p className="text-textMuted text-sm font-medium px-2 leading-relaxed">
                  Silakan registrasi nickname terlebih dahulu dengan mengetik <span className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded">/register [nama] [pass] [email]</span> di chat untuk mendapatkan PIN permanen.
                </p>
                <p className="text-textMuted text-xs mt-3 opacity-80">
                  Dengan PIN permanen, kamu bisa mem-follow dan menambahkan teman ke dalam daftar Connection-mu.
                </p>
              </div>
            ) : permanentPin ? (
              <div className="text-center w-full animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="text-green-500" size={24} />
                </div>
                <div className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Permanent PIN</div>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent tracking-[0.2em] mb-4">
                  {permanentPin}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <button 
                    onClick={handleCopy}
                    className="flex items-center space-x-2 bg-secondary/50 hover:bg-primary/20 text-textMuted hover:text-primary transition-colors px-4 py-2 rounded-full active:scale-95"
                    title="Copy PIN"
                  >
                    {copied ? (
                      <>
                        <Check size={16} className="text-green-500" />
                        <span className="text-sm font-medium text-green-500">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span className="text-sm font-medium">Salin PIN</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-3">
                  <span className="text-textMuted text-xl font-medium">?</span>
                </div>
                <p className="text-textMuted text-sm font-medium">Memuat PIN...</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="text-sm text-textMuted hover:text-text transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
