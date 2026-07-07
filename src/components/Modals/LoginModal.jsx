import React, { useState, useEffect, useRef } from 'react';
import { X, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { verifyNickname } from '../../services/dbServices';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { changePseudo } = useAuth();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setNickname('');
      setPassword('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nickname || !password) {
      setError('Masukkan nickname dan password.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const isVerified = await verifyNickname(nickname, password);
      if (isVerified) {
        changePseudo(nickname, true);
        if (onLoginSuccess) onLoginSuccess();
        onClose();
      } else {
        setError('Nickname atau password salah.');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login.');
      console.error(err);
    } finally {
      setLoading(false);
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
            <LogIn size={24} className="text-primary" />
            Log in Akun
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
            <input
              ref={inputRef}
              type="text"
              placeholder="Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-text placeholder:text-textMuted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-text placeholder:text-textMuted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {error && <p className="text-red-500 text-sm animate-fade-in">{error}</p>}

          <button
            type="submit"
            disabled={!nickname || !password || loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl disabled:opacity-50 transition-opacity"
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>Login <ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
