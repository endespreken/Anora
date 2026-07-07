import React from 'react';
import { MapPin, AlertTriangle } from 'lucide-react';

export default function LocationRequiredModal({ isOpen, onRequestPermission }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-surface w-full max-w-sm rounded-3xl shadow-[0_0_50px_rgba(255,0,0,0.2)] overflow-hidden border border-red-500/20 animate-scale-up flex flex-col text-center">
        <div className="p-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 relative">
            <MapPin size={40} className="text-red-500" />
            <AlertTriangle size={20} className="text-yellow-500 absolute -bottom-2 -right-2 bg-surface rounded-full p-0.5" />
          </div>
          
          <h2 className="text-2xl font-bold text-text mb-3">Akses Lokasi Wajib</h2>
          
          <p className="text-sm text-textMuted mb-8 leading-relaxed">
            Aplikasi Anora sangat bergantung pada fitur lokasi (GPS) untuk berfungsi dengan baik dan menemukan pengguna di sekitarmu.
            <br/><br/>
            Untuk melanjutkan penggunaan aplikasi, kamu <strong>harus memberikan izin lokasi</strong>.
          </p>
          
          <button 
            onClick={onRequestPermission}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-500/30 flex items-center justify-center space-x-2"
          >
            <MapPin size={18} />
            <span>Berikan Izin Lokasi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
