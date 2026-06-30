import React, { useState, useEffect, useRef } from 'react';
import { X, Edit, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { checkNicknameExists } from '../../services/dbServices';

export default function ChangeNicknameModal({ isOpen, onClose }) {
  const [newNickname, setNewNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { pseudo, changePseudo, isRegistered } = useAuth();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setNewNickname(pseudo || '');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, pseudo]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = newNickname.trim();
    if (!trimmed) {
      setError('Nickname tidak boleh kosong');
      return;
    }
    if (trimmed.toLowerCase() === pseudo.toLowerCase()) {
      onClose();
      return;
    }
    if (trimmed.length > 15) {
      setError('Nickname maksimal 15 karakter');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const exists = await checkNicknameExists(trimmed);
      if (exists) {
        setError('Nickname sudah digunakan oleh pengguna terdaftar.');
        setLoading(false);
        return;
      }
      
      changePseudo(trimmed, false);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text flex items-center gap-2">
            <Edit size={24} className="text-primary" />
            Ganti Nickname
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-textMuted hover:text-text hover:bg-secondary/50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {isRegistered && (
          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-sm text-yellow-600 dark:text-yellow-400">
            <strong>Perhatian:</strong> Anda saat ini login sebagai pengguna terdaftar. Mengganti nickname akan membuat Anda beralih menjadi pengguna anonim.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">
              Nickname Baru
            </label>
            <input
              ref={inputRef}
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="Masukkan nickname baru"
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-text placeholder:text-textMuted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {error && <p className="text-red-500 text-sm animate-fade-in">{error}</p>}

          <button
            type="submit"
            disabled={!newNickname.trim() || loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl disabled:opacity-50 transition-opacity"
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>Simpan Nickname <ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
