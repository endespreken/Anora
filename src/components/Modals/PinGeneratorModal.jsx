import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Copy, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { generatePin } from '../../services/dbServices';

export default function PinGeneratorModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [pin, setPin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPin(null);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    setCopied(false);
    const newPin = await generatePin(user.id);
    setPin(newPin);
    setLoading(false);
  };

  const handleCopy = () => {
    if (pin) {
      navigator.clipboard.writeText(pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-surface backdrop-blur-xl border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-slide-up">
        
        <div className="h-2 w-full bg-gradient-to-r from-primary to-accent"></div>
        
        <div className="p-8">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-secondary/50 text-textMuted hover:text-text hover:bg-secondary transition-all"
          >
            <X size={18} />
          </button>
          
          <h2 className="text-2xl font-bold text-text mb-2 tracking-tight">
            New Connection
          </h2>
          <p className="text-sm text-textMuted mb-8">
            Share this secure PIN. Tell your friend to type <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">/addfriend [PIN]</span>.
          </p>

          <div className="bg-secondary/20 border border-border rounded-2xl p-8 flex flex-col items-center justify-center min-h-[160px] relative group">
            {loading ? (
              <RefreshCw className="animate-spin text-primary" size={32} />
            ) : pin ? (
              <div className="text-center w-full">
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent tracking-[0.2em] mb-3">
                  {pin}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xs font-medium text-textMuted bg-secondary/50 px-3 py-1 rounded-full">
                    Valid for 5 minutes
                  </span>
                  <button 
                    onClick={handleCopy}
                    className="text-textMuted hover:text-primary transition-colors p-1.5 rounded-full hover:bg-primary/10"
                    title="Copy PIN"
                  >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-3">
                  <span className="text-textMuted text-xl font-medium">?</span>
                </div>
                <p className="text-textMuted text-sm font-medium">Ready to generate</p>
              </div>
            )}
          </div>

          <div className="mt-8">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-text text-surface py-3.5 rounded-xl font-semibold hover:bg-opacity-90 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 shadow-lg shadow-black/10"
            >
              {pin ? 'Generate New PIN' : 'Generate PIN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
