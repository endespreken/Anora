import React, { useState, useEffect } from 'react';
import { X, Shield, CheckCircle, Search, UserPlus, BadgeCheck } from 'lucide-react';
import { fetchUserRoles, appointRole, setChannelVerified, checkIfVerified, setUserVerified, checkIfUserVerified } from '../../services/dbServices';
import { useAuth } from '../../contexts/AuthContext';

export default function FOPortalModal({ isOpen, onClose, onVerifiedUpdated }) {
  const { pseudo, isRegistered } = useAuth();
  const [activeTab, setActiveTab] = useState('roles'); // 'roles' or 'verified'
  const [targetChannel, setTargetChannel] = useState('');
  const [targetNickname, setTargetNickname] = useState('');
  const [roleToAppoint, setRoleToAppoint] = useState('SOP');
  
  const [isVerifiedStatus, setIsVerifiedStatus] = useState(false);
  
  const [targetUserNickname, setTargetUserNickname] = useState('');
  const [isUserVerifiedStatus, setIsUserVerifiedStatus] = useState(false);
  
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const [userAccess, setUserAccess] = useState({ isGlobalFO: false, channelRoles: [] });

  useEffect(() => {
    if (isOpen && pseudo) {
      fetchUserRoles(pseudo).then(res => {
        setUserAccess(res);
      });
      setMessage({ text: '', type: '' });
    }
  }, [isOpen, pseudo]);

  if (!isOpen) return null;

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleAppointRole = async (e) => {
    e.preventDefault();
    if (!targetNickname.trim()) {
      showMessage('Nickname harus diisi', 'error');
      return;
    }
    
    // Check permissions
    if (!userAccess.isGlobalFO) {
       if (targetChannel) {
          const hasSOP = userAccess.channelRoles.some(r => r.channel_name.toLowerCase() === targetChannel.toLowerCase() && (r.role === 'SOP' || r.role === 'FO'));
          if (!hasSOP) {
             showMessage(`Anda tidak memiliki hak untuk mengangkat role di channel ${targetChannel}`, 'error');
             return;
          }
       } else {
          showMessage(`Anda tidak memiliki hak untuk mengangkat FO Global`, 'error');
          return;
       }
    }

    setLoading(true);
    const result = await appointRole(targetChannel.trim(), targetNickname.trim(), roleToAppoint);
    setLoading(false);

    if (result.success) {
      showMessage(result.message, 'success');
      setTargetNickname('');
    } else {
      showMessage(result.message, 'error');
    }
  };

  const handleCheckVerified = async () => {
    if (!targetChannel.trim()) return;
    setLoading(true);
    const isV = await checkIfVerified(targetChannel.trim());
    setIsVerifiedStatus(isV);
    setLoading(false);
  };

  const handleSetVerified = async (e) => {
    e.preventDefault();
    if (!targetChannel.trim()) {
      showMessage('Channel harus diisi', 'error');
      return;
    }

    if (!userAccess.isGlobalFO) {
       showMessage('Hanya FO Global yang bisa mengatur status Verified', 'error');
       return;
    }

    setLoading(true);
    const success = await setChannelVerified(targetChannel.trim(), isVerifiedStatus);
    setLoading(false);

    if (success) {
      showMessage(`Status verified untuk ${targetChannel} berhasil diupdate.`, 'success');
      if (onVerifiedUpdated) onVerifiedUpdated();
    } else {
      showMessage('Gagal mengupdate status verified.', 'error');
    }
  };

  const handleCheckUserVerified = async () => {
    if (!targetUserNickname.trim()) return;
    setLoading(true);
    const result = await checkIfUserVerified(targetUserNickname.trim());
    
    if (!result.isRegistered) {
      showMessage(`User ${targetUserNickname} tidak terdaftar!`, 'error');
      setIsUserVerifiedStatus(false);
    } else {
      setIsUserVerifiedStatus(result.isVerified);
      showMessage(`User ${targetUserNickname} terdaftar. Status verified: ${result.isVerified ? 'Ya' : 'Tidak'}`, 'success');
    }
    setLoading(false);
  };

  const handleSetUserVerified = async (e) => {
    e.preventDefault();
    if (!targetUserNickname.trim()) {
      showMessage('Nickname harus diisi', 'error');
      return;
    }

    if (!userAccess.isGlobalFO) {
       showMessage('Hanya FO Global yang bisa mengatur status Verified User', 'error');
       return;
    }

    setLoading(true);
    // Double check registration
    const result = await checkIfUserVerified(targetUserNickname.trim());
    if (!result.isRegistered) {
      showMessage(`User ${targetUserNickname} tidak terdaftar!`, 'error');
      setLoading(false);
      return;
    }

    const success = await setUserVerified(targetUserNickname.trim(), isUserVerifiedStatus);
    setLoading(false);

    if (success) {
      showMessage(`Status verified untuk user ${targetUserNickname} berhasil diupdate.`, 'success');
      // Perubahan status user verified ditangani lewat realtime DB supabase ke AuthContext, jadi tidak perlu onVerifiedUpdated manual
    } else {
      showMessage('Gagal mengupdate status verified user.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl relative animate-scale-up flex flex-col overflow-hidden max-h-[90vh]">
        <div className="p-4 md:p-6 border-b border-border flex justify-between items-center bg-surface/50 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">FO Portal</h2>
              <p className="text-xs text-textMuted">Manajemen Strata & Channel</p>
            </div>
          </div>
          <button onClick={onClose} className="text-textMuted hover:text-red-400 p-2 bg-secondary/50 hover:bg-secondary rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-border text-sm overflow-x-auto whitespace-nowrap hide-scrollbar">
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-3 font-medium transition-colors ${activeTab === 'roles' ? 'text-primary border-b-2 border-primary' : 'text-textMuted hover:text-text'}`}
          >
            Angkat Role
          </button>
          <button
            onClick={() => setActiveTab('verified')}
            className={`px-4 py-3 font-medium transition-colors ${activeTab === 'verified' ? 'text-primary border-b-2 border-primary' : 'text-textMuted hover:text-text'}`}
          >
            Verified Channel
          </button>
          <button
            onClick={() => setActiveTab('verified_user')}
            className={`px-4 py-3 font-medium transition-colors ${activeTab === 'verified_user' ? 'text-primary border-b-2 border-primary' : 'text-textMuted hover:text-text'}`}
          >
            Verified User
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {message.text && (
            <div className={`mb-4 p-3 rounded-xl text-sm ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
              {message.text}
            </div>
          )}

          {activeTab === 'roles' && (
            <form onSubmit={handleAppointRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Target Channel (opsional untuk FO Global)</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                  <input
                    type="text"
                    value={targetChannel}
                    onChange={(e) => setTargetChannel(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-4 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Contoh: random"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Target Nickname</label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                  <input
                    type="text"
                    value={targetNickname}
                    onChange={(e) => setTargetNickname(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-4 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Nickname pengguna"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Role</label>
                <select
                  value={roleToAppoint}
                  onChange={(e) => setRoleToAppoint(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl py-2.5 px-4 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                >
                  <option value="SOP">SOP (Super Operator)</option>
                  <option value="OP">OP (Operator)</option>
                  {userAccess.isGlobalFO && <option value="FO">FO (Founder)</option>}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primaryHover text-white rounded-xl font-medium transition-all disabled:opacity-50"
              >
                {loading ? 'Memproses...' : 'Angkat Role'}
              </button>
            </form>
          )}

          {activeTab === 'verified' && (
            <form onSubmit={handleSetVerified} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Target Channel</label>
                <div className="relative flex">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                    <input
                      type="text"
                      value={targetChannel}
                      onChange={(e) => setTargetChannel(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-l-xl py-2.5 pl-10 pr-4 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Nama channel"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckVerified}
                    className="bg-secondary border-y border-r border-border hover:bg-border px-4 rounded-r-xl transition-colors text-sm font-medium"
                  >
                    Cek
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-secondary rounded-xl border border-border">
                <input
                  type="checkbox"
                  id="verified-check"
                  checked={isVerifiedStatus}
                  onChange={(e) => setIsVerifiedStatus(e.target.checked)}
                  className="w-5 h-5 rounded bg-background border-border text-primary focus:ring-primary"
                />
                <label htmlFor="verified-check" className="flex-1 flex items-center space-x-2 cursor-pointer">
                  <span className="font-medium">Status Verified</span>
                  {isVerifiedStatus && <CheckCircle size={16} className="text-primary" />}
                </label>
              </div>
              <button
                type="submit"
                disabled={loading || !userAccess.isGlobalFO}
                className="w-full py-3 bg-primary hover:bg-primaryHover text-white rounded-xl font-medium transition-all disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Status'}
              </button>
              {!userAccess.isGlobalFO && (
                 <p className="text-xs text-red-400 text-center mt-2">Hanya FO Global yang bisa mengubah ini.</p>
              )}
            </form>
          )}

          {activeTab === 'verified_user' && (
            <form onSubmit={handleSetUserVerified} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-textMuted mb-1">Target Nickname</label>
                <div className="relative flex">
                  <div className="relative flex-1">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                    <input
                      type="text"
                      value={targetUserNickname}
                      onChange={(e) => setTargetUserNickname(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-l-xl py-2.5 pl-10 pr-4 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Nickname pengguna"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckUserVerified}
                    className="bg-secondary border-y border-r border-border hover:bg-border px-4 rounded-r-xl transition-colors text-sm font-medium"
                  >
                    Cek
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-secondary rounded-xl border border-border">
                <input
                  type="checkbox"
                  id="user-verified-check"
                  checked={isUserVerifiedStatus}
                  onChange={(e) => setIsUserVerifiedStatus(e.target.checked)}
                  className="w-5 h-5 rounded bg-background border-border text-primary focus:ring-primary"
                />
                <label htmlFor="user-verified-check" className="flex-1 flex items-center space-x-2 cursor-pointer">
                  <span className="font-medium">Status Verified User</span>
                  {isUserVerifiedStatus && <BadgeCheck size={16} className="text-blue-500" />}
                </label>
              </div>
              <button
                type="submit"
                disabled={loading || !userAccess.isGlobalFO}
                className="w-full py-3 bg-primary hover:bg-primaryHover text-white rounded-xl font-medium transition-all disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Status User'}
              </button>
              {!userAccess.isGlobalFO && (
                 <p className="text-xs text-red-400 text-center mt-2">Hanya FO Global yang bisa mengubah ini.</p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
