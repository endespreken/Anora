import React, { useState, useEffect } from 'react';
import { X, User, Bell, Shield, BadgeCheck, Save, Moon, Sun, Monitor } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchVibesVisibility, updateVibesVisibility } from '../../services/dbServices';
import UserAvatar from '../Shared/UserAvatar';

export default function SettingsModal({ isOpen, onClose }) {
  const { pseudo, isRegistered, allRegisteredNicks, permanentPin } = useAuth();
  const { 
    soundEnabled, setSoundEnabled, 
    incognitoMode, setIncognitoMode,
    friendsOnlyPM, setFriendsOnlyPM,
    vibrationEnabled, setVibrationEnabled
  } = useSettings();
  const { theme, toggleTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [vibesVisibility, setVibesVisibility] = useState('friends_only');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && isRegistered && pseudo) {
      fetchVibesVisibility(pseudo).then(vis => setVibesVisibility(vis));
    }
  }, [isOpen, isRegistered, pseudo]);

  const handleToggleVibes = async (checked) => {
    const newVis = checked ? 'public' : 'friends_only';
    setVibesVisibility(newVis);
    if (isRegistered && pseudo) {
      await updateVibesVisibility(pseudo, newVis);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-background/80 backdrop-blur-md animate-fade-in p-4" onClick={onClose}>
      <div className="bg-surface w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden border border-border animate-scale-up" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-secondary/30">
          <h2 className="text-xl font-bold text-text">Pengaturan</h2>
          <button 
            onClick={onClose}
            className="p-2 text-textMuted hover:text-accent bg-secondary/50 hover:bg-accent/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* Tabs */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-border bg-secondary/10 p-2 md:p-4 flex md:flex-col overflow-x-auto shrink-0 hide-scrollbar space-x-2 md:space-x-0 md:space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 md:w-full flex justify-center md:justify-start items-center p-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-primary/10 text-primary font-bold' : 'text-textMuted hover:bg-secondary/50'}`}
            >
              <User size={18} className="md:mr-2" />
              <span className="text-sm hidden md:inline ml-2">Profil</span>
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 md:w-full flex justify-center md:justify-start items-center p-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'privacy' ? 'bg-primary/10 text-primary font-bold' : 'text-textMuted hover:bg-secondary/50'}`}
            >
              <Shield size={18} className="md:mr-2" />
              <span className="text-sm hidden md:inline ml-2">Privasi</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 md:w-full flex justify-center md:justify-start items-center p-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'notifications' ? 'bg-primary/10 text-primary font-bold' : 'text-textMuted hover:bg-secondary/50'}`}
            >
              <Bell size={18} className="md:mr-2" />
              <span className="text-sm hidden md:inline ml-2">Notifikasi</span>
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex-1 md:w-full flex justify-center md:justify-start items-center p-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'appearance' ? 'bg-primary/10 text-primary font-bold' : 'text-textMuted hover:bg-secondary/50'}`}
            >
              <Monitor size={18} className="md:mr-2" />
              <span className="text-sm hidden md:inline ml-2">Tampilan</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="w-full md:w-2/3 p-4 md:p-6 overflow-y-auto flex-1">
            
            {/* Profil Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="text-xs font-bold uppercase text-textMuted mb-2 block">Nickname Saat Ini</label>
                  <div className="flex items-center p-4 bg-secondary/30 rounded-2xl border border-border">
                    <UserAvatar nickname={pseudo} className="w-12 h-12 text-xl mr-4" />
                    <div>
                      <div className="flex items-center">
                        <span className="font-bold text-lg text-text">{pseudo}</span>
                        {isRegistered && <BadgeCheck size={18} className="ml-1.5 text-blue-500" />}
                      </div>
                      <span className="text-xs text-textMuted">{isRegistered ? 'Akun Terdaftar' : 'Akun Anonim'}</span>
                    </div>
                  </div>
                </div>

                {isRegistered ? (
                  permanentPin ? (
                    <div className="p-4 bg-accent/10 rounded-2xl border border-accent/20">
                      <h3 className="font-bold text-sm text-text mb-2 flex items-center">
                        <BadgeCheck size={16} className="text-accent mr-2" />
                        PIN Permanen Anda
                      </h3>
                      <p className="text-xs text-textMuted mb-3 leading-relaxed">
                        Gunakan PIN ini untuk bertukar kontak dengan teman (Add Connection). PIN ini tidak akan pernah berubah.
                      </p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(permanentPin);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="w-full relative group"
                        title="Klik untuk menyalin PIN"
                      >
                        <div className="flex items-center justify-center p-3 bg-background rounded-xl border border-border shadow-inner group-hover:border-accent transition-colors">
                          <span className="font-mono text-2xl tracking-[0.3em] text-accent font-bold uppercase">{permanentPin}</span>
                        </div>
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity rounded-xl ${copied ? 'bg-green-500/90 opacity-100' : 'bg-background/80 opacity-0 group-hover:opacity-100'}`}>
                          <span className={`text-sm font-bold flex items-center ${copied ? 'text-white' : 'text-text'}`}>
                            {copied ? 'Tersalin!' : 'Copy PIN'}
                          </span>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-accent/10 rounded-2xl border border-accent/20 flex items-center justify-center h-24">
                      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )
                ) : (
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
                    <h3 className="font-bold text-sm text-text mb-2">Ganti Nickname / Register</h3>
                    <p className="text-xs text-textMuted mb-3 leading-relaxed">
                      Untuk mengganti nickname atau melakukan registrasi, silakan kembali ke obrolan dan ketikkan perintah berikut:
                    </p>
                    <ul className="text-xs text-textMuted space-y-2 font-mono bg-background p-3 rounded-xl border border-border">
                      <li><span className="text-primary font-bold">/nick</span> [nama_baru]</li>
                      <li><span className="text-primary font-bold">/register</span> [nama] [pass] [email]</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-text mb-4">Pengaturan Visibilitas</h3>
                  
                  <div className="flex items-start justify-between p-4 bg-secondary/30 rounded-2xl border border-border">
                    <div className="flex-1 pr-4">
                      <div className="font-bold text-text mb-1 flex items-center">
                        Incognito Mode
                      </div>
                      <p className="text-xs text-textMuted leading-relaxed">
                        Menyembunyikan jarak dan lokasi Anda dari fitur "Cari Teman Sekitar" (Radar).
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={incognitoMode}
                        onChange={(e) => setIncognitoMode(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                    </label>
                  </div>
                  
                  {isRegistered && (
                    <div className="flex items-start justify-between p-4 bg-secondary/30 rounded-2xl border border-border">
                      <div className="flex-1 pr-4">
                        <div className="font-bold text-text mb-1 flex items-center">
                          Vibes Publik
                        </div>
                        <p className="text-xs text-textMuted leading-relaxed">
                          Izinkan pengguna anonim atau yang belum berteman melihat Vibes Anda.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={vibesVisibility === 'public'}
                          onChange={(e) => handleToggleVibes(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                      </label>
                    </div>
                  )}
                  
                  {isRegistered && (
                    <div className="flex items-start justify-between p-4 bg-secondary/30 rounded-2xl border border-border">
                      <div className="flex-1 pr-4">
                        <div className="font-bold text-text mb-1 flex items-center">
                          Filter Pesan Pribadi
                        </div>
                        <p className="text-xs text-textMuted leading-relaxed">
                          Hanya menerima PM (Private Message) dari Connection (Teman).
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={friendsOnlyPM}
                          onChange={(e) => setFriendsOnlyPM(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-text mb-4">Pengaturan Suara</h3>
                  
                  <div className="flex items-start justify-between p-4 bg-secondary/30 rounded-2xl border border-border">
                    <div className="flex-1 pr-4">
                      <div className="font-bold text-text mb-1">
                        Sound Alerts
                      </div>
                      <p className="text-xs text-textMuted leading-relaxed">
                        Putar efek suara ketika ada pesan masuk, notifikasi sistem, atau pesan pribadi (PM).
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={soundEnabled}
                        onChange={(e) => setSoundEnabled(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                    </label>
                  </div>
                  <div className="flex items-start justify-between p-4 bg-secondary/30 rounded-2xl border border-border mt-4">
                    <div className="flex-1 pr-4">
                      <div className="font-bold text-text mb-1">
                        Getaran (Vibration)
                      </div>
                      <p className="text-xs text-textMuted leading-relaxed">
                        Aktifkan efek getar saat ada pesan masuk atau saat mereply pesan.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={vibrationEnabled}
                        onChange={(e) => setVibrationEnabled(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-text mb-4">Pengaturan Tampilan</h3>
                  
                  <div className="flex items-start justify-between p-4 bg-secondary/30 rounded-2xl border border-border">
                    <div className="flex-1 pr-4">
                      <div className="font-bold text-text mb-1 flex items-center">
                        Dark Mode
                      </div>
                      <p className="text-xs text-textMuted leading-relaxed">
                        Gunakan tema gelap agar lebih nyaman di mata pada malam hari.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={theme === 'dark'}
                        onChange={toggleTheme}
                      />
                      <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner flex items-center justify-center">
                        {theme === 'dark' && <Moon size={10} className="absolute left-1 text-white" />}
                        {theme === 'light' && <Sun size={10} className="absolute right-1 text-yellow-500" />}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border bg-secondary/10 flex justify-end">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
          >
            <Save size={18} />
            <span>Simpan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
