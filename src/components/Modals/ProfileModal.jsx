import React, { useState, useEffect } from 'react';
import { X, User, Users, Info, Camera, Edit2, Save, Link as LinkIcon, MapPin, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUserProfile, updateUserProfile, uploadFileToR2 } from '../../services/dbServices';

export default function ProfileModal({ isOpen, onClose, targetNickname, onMessageClick }) {
  const { pseudo, isRegistered } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [localAvatarPreview, setLocalAvatarPreview] = useState(null);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    avatar_url: '',
    bio: '',
    gender: 'Tidak Dispesifikasikan',
    location: ''
  });

  const isOwnProfile = pseudo === targetNickname && isRegistered;

  const formatUrl = (url) => {
    if (!url) return '';
    if (!url.startsWith('http')) return 'https://' + url.replace(/^:\/\//, '');
    return url;
  };

  useEffect(() => {
    if (isOpen && targetNickname) {
      loadProfile();
    } else {
      setProfile(null);
      setIsEditing(false);
      setLocalAvatarPreview(null);
    }
  }, [isOpen, targetNickname]);

  const loadProfile = async () => {
    setLoading(true);
    const data = await fetchUserProfile(targetNickname);
    setProfile(data);
    if (data) {
      let parsedBio = data.bio;
      let parsedLoc = '';
      try {
        const obj = JSON.parse(data.bio);
        if (obj && typeof obj === 'object' && ('b' in obj || 'l' in obj)) {
          parsedBio = obj.b || '';
          parsedLoc = obj.l || '';
        }
      } catch(e) {
        // Not JSON, fallback to standard bio
      }

      // Update the profile object we show
      let safeAvatar = data.avatar_url || '';

      setEditForm({
        avatar_url: safeAvatar,
        bio: parsedBio || '',
        gender: data.gender || 'Tidak Dispesifikasikan',
        location: parsedLoc || ''
      });
      
      setProfile(prev => ({...prev, avatar_url: safeAvatar, bio: parsedBio, location: parsedLoc}));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    const combinedBio = JSON.stringify({
      b: editForm.bio,
      l: editForm.location
    });

    const success = await updateUserProfile(pseudo, {
      ...editForm,
      bio: combinedBio
    });
    
    if (success) {
      setProfile(prev => ({ ...prev, ...editForm }));
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Immediate visual feedback
    const previewUrl = URL.createObjectURL(file);
    setLocalAvatarPreview(previewUrl);
    
    setUploadingAvatar(true);
    const publicUrl = await uploadFileToR2(file);
    if (publicUrl) {
      setEditForm(prev => ({ ...prev, avatar_url: publicUrl }));
    } else {
      alert("Gagal mengunggah foto profil. Silakan coba lagi.");
      setLocalAvatarPreview(null); // Revert preview on failure
    }
    setUploadingAvatar(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-background/80 backdrop-blur-md animate-fade-in p-4" onClick={onClose}>
      <div 
        className="bg-surface w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-border animate-scale-up flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-lg text-text">Profil Pengguna</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-textMuted hover:bg-secondary/80 hover:text-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !profile ? (
            <div className="text-center py-8 text-textMuted">
              <User size={48} className="mx-auto mb-4 opacity-20" />
              <p>Pengguna tidak ditemukan atau belum melakukan registrasi.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              
              <div className="relative mb-4 group">
                <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden border-4 border-surface shadow-md relative">
                  {localAvatarPreview ? (
                    <img src={localAvatarPreview} alt={profile.nickname} referrerPolicy="no-referrer" className="w-full h-full object-cover bg-surface" />
                  ) : isEditing && editForm.avatar_url ? (
                    <img src={formatUrl(editForm.avatar_url)} alt={profile.nickname} referrerPolicy="no-referrer" className="w-full h-full object-cover bg-surface" onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${profile.nickname}&background=random`; }} />
                  ) : profile.avatar_url ? (
                    <img src={formatUrl(profile.avatar_url)} alt={profile.nickname} referrerPolicy="no-referrer" className="w-full h-full object-cover bg-surface" onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${profile.nickname}&background=random`; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                      <User size={40} />
                    </div>
                  )}
                  {isEditing && (
                    <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploadingAvatar ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Camera size={24} className="text-white mb-1" />
                          <span className="text-[10px] text-white font-medium text-center">Ubah Foto</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-bold text-text mb-1 flex items-center justify-center">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {profile.nickname}
                </span>
                <BadgeCheck size={18} className="ml-1.5 text-blue-500 flex-shrink-0" />
              </h3>
              
              <div className="flex items-center text-sm text-textMuted mb-6 bg-secondary/30 px-3 py-1 rounded-full border border-border">
                <Users size={14} className="mr-1.5 text-accent" />
                <span>{profile.connectionCount} Koneksi</span>
              </div>

              {isEditing ? (
                <div className="w-full space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-textMuted">Bio</label>
                    <textarea 
                      value={editForm.bio}
                      onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tulis sesuatu tentang dirimu..."
                      rows={3}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-primary transition-colors placeholder:text-textMuted/50 resize-none custom-scrollbar"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-textMuted">Jenis Kelamin</label>
                    <select 
                      value={editForm.gender}
                      onChange={e => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                      <option value="Tidak Dispesifikasikan">Tidak Dispesifikasikan</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-textMuted flex items-center">
                      <MapPin size={12} className="mr-1" />
                      Lokasi
                    </label>
                    <input 
                      type="text"
                      value={editForm.location}
                      onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Contoh: Jakarta, Indonesia"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-primary transition-colors placeholder:text-textMuted/50"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  <div className="bg-secondary/30 border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <Info size={18} className="text-primary mb-2 opacity-80" />
                    <p className="text-sm text-text">
                      {profile.bio || <span className="text-textMuted italic">Belum ada bio.</span>}
                    </p>
                  </div>

                  <div className="bg-secondary/30 border border-border rounded-2xl px-4 py-3 flex justify-between items-center">
                    <span className="text-xs font-medium text-textMuted">Jenis Kelamin</span>
                    <span className="text-sm font-semibold text-text">{profile.gender || 'Tidak Dispesifikasikan'}</span>
                  </div>

                  <div className="bg-secondary/30 border border-border rounded-2xl px-4 py-3 flex justify-between items-center">
                    <span className="text-xs font-medium text-textMuted">Lokasi</span>
                    <span className="text-sm font-semibold text-text flex items-center">
                      <MapPin size={14} className="mr-1.5 text-accent opacity-70" />
                      {profile.location || 'Tidak Dispesifikasikan'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!loading && profile && (
          <div className="p-4 border-t border-border bg-surface">
            {isOwnProfile ? (
              isEditing ? (
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary/50 transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium shadow-lg hover:shadow-primary/30 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                  >
                    {saving ? 'Menyimpan...' : (
                      <>
                        <Save size={16} className="mr-2" />
                        Simpan
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary/50 text-text transition-all active:scale-95 flex items-center justify-center"
                >
                  <Edit2 size={16} className="mr-2 text-textMuted" />
                  Edit Profil
                </button>
              )
            ) : (
              <button 
                onClick={() => onMessageClick && onMessageClick(profile.nickname)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-medium shadow-lg hover:shadow-primary/30 flex items-center justify-center transition-all active:scale-95"
              >
                Mulai Chat
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
