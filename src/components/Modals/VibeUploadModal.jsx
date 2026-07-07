import React, { useState } from 'react';
import { X, Send, Image as ImageIcon, Type, Smile } from 'lucide-react';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import { useAuth } from '../../contexts/AuthContext';
import { uploadVibe, uploadFileToR2 } from '../../services/dbServices';
import { compressImage } from '../../utils/image';

const BG_COLORS = [
  'bg-gradient-to-br from-primary to-accent',
  'bg-gradient-to-tr from-pink-500 to-rose-500',
  'bg-gradient-to-bl from-blue-500 to-cyan-400',
  'bg-gradient-to-t from-emerald-500 to-teal-400',
  'bg-gradient-to-r from-amber-400 to-orange-500',
  'bg-gradient-to-b from-indigo-500 to-purple-500',
  'bg-gradient-to-br from-gray-700 to-gray-900',
];

export default function VibeUploadModal({ isOpen, onClose }) {
  const { pseudo, isRegistered } = useAuth();
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [colorIndex, setColorIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const containerRef = React.useRef(null);
  const [textPos, setTextPos] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  
  const captionRef = React.useRef(null);
  const emojiRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clean up preview on unmount or close
  React.useEffect(() => {
    if (!isOpen) {
      setContent('');
      setCaption('');
      setImageFile(null);
      setImagePreview(null);
      setTextPos({ x: 50, y: 50 });
      setIsDragging(false);
      setShowTextOverlay(false);
      setShowEmoji(false);
    }
  }, [isOpen]);

  const handleCaptionChange = (e) => {
    setCaption(e.target.value);
    if (captionRef.current) {
      captionRef.current.style.height = 'auto';
      captionRef.current.style.height = `${Math.min(captionRef.current.scrollHeight, 120)}px`;
    }
  };

  const onEmojiClick = (emojiObject) => {
    setCaption(prev => prev + emojiObject.emoji);
    if (captionRef.current) {
      setTimeout(() => {
        captionRef.current.style.height = 'auto';
        captionRef.current.style.height = `${Math.min(captionRef.current.scrollHeight, 120)}px`;
      }, 0);
    }
  };

  if (!isOpen) return null;

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Tolong pilih file gambar (JPG, PNG, dll).');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setTextPos({ x: 50, y: 50 }); // Reset position when new image selected
    setShowTextOverlay(false);
  };

  const handlePointerDown = (e) => {
    if (!imagePreview) return;
    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !containerRef.current || !imagePreview) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    setTextPos({ x, y });
  };

  const handlePointerUp = (e) => {
    if (!imagePreview) return;
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  const handleUpload = async () => {
    if (!isRegistered) {
      alert("Hanya pengguna teregistrasi yang dapat mengunggah vibe.");
      return;
    }
    if (!content.trim() && !imageFile) return;
    setLoading(true);

    let finalBgColor = BG_COLORS[colorIndex];
    if (imageFile) {
      try {
        const compressed = await compressImage(imageFile, 1080, 0.8);
        const publicUrl = await uploadFileToR2(compressed, true);
        if (publicUrl) {
          finalBgColor = `img:${publicUrl}`;
        } else {
          throw new Error('Upload failed');
        }
      } catch (err) {
        console.error(err);
        alert('Gagal mengunggah gambar. Silakan coba lagi.');
        setLoading(false);
        return;
      }
    }

    let finalContent = content.trim() || ' ';
    if (imageFile) {
      // Encode coordinates and caption for image vibes
      // If text overlay is disabled, we don't save the text overlay
      finalContent = JSON.stringify({
        text: showTextOverlay ? finalContent : ' ',
        pos: textPos,
        caption: caption.trim()
      });
    }

    const success = await uploadVibe(pseudo, finalContent, finalBgColor);
    setLoading(false);
    if (success) {
      onClose();
    } else {
      alert("Gagal mengunggah Vibe. Silakan coba lagi.");
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 flex flex-col animate-fade-in p-4 sm:p-8">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onClose} className="p-2 text-white/80 hover:text-white rounded-full bg-white/10 active:scale-95 transition-all">
          <X size={24} />
        </button>
        <div className="flex items-center space-x-3">
          {imagePreview && (
            <button 
              onClick={() => {
                setShowTextOverlay(!showTextOverlay);
                if (!showTextOverlay) setContent(''); // Clear text when enabling
              }}
              className={`p-2 rounded-full transition-all shadow-sm backdrop-blur-md ${showTextOverlay ? 'bg-primary text-white' : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'}`}
              title="Tambahkan Teks di Foto"
            >
              <Type size={20} />
            </button>
          )}
          <button 
            onClick={handleUpload}
            disabled={loading || (!content.trim() && !imageFile)}
            className="flex items-center space-x-2 bg-primary hover:bg-primaryHover text-white px-5 py-2 rounded-full font-bold active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Posting...' : 'Share Vibe'}</span>
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Main Canvas Container - Flexible wrapping to keep aspect ratio */}
      <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0">
        {/* Main Canvas */}
        <div 
          ref={containerRef}
          className={`w-full aspect-[9/16] max-h-full sm:max-w-sm rounded-3xl mx-auto flex items-center justify-center transition-colors duration-300 shadow-2xl relative overflow-hidden ${!imagePreview ? BG_COLORS[colorIndex] : 'bg-black'}`}
          style={imagePreview ? { backgroundImage: `url(${imagePreview})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' } : {}}
        >
          {imagePreview && (
            <div className="absolute inset-0 bg-black/10 rounded-3xl backdrop-blur-[1px]"></div>
          )}
          
          {(!imagePreview || showTextOverlay) && (
            <div 
              className={`w-full px-8 relative z-10 ${imagePreview ? 'absolute cursor-move' : ''}`}
              style={imagePreview ? {
                top: `${textPos.y}%`,
                left: `${textPos.x}%`,
                transform: 'translate(-50%, -50%)',
                touchAction: 'none' // Prevent scrolling while dragging on mobile
              } : {}}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <textarea
                autoFocus={!imagePreview || showTextOverlay}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={imagePreview ? "Ketik sesuatu..." : "What's your vibe today?"}
                maxLength={150}
                className={`w-full bg-transparent text-white text-3xl font-bold text-center resize-none outline-none placeholder:text-white/50 pointer-events-auto ${imagePreview ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : ''}`}
                rows={5}
              />
            </div>
          )}
          
          {(!imagePreview || showTextOverlay) && (
            <div className="absolute bottom-4 right-6 text-white/60 text-sm font-medium z-20 pointer-events-none">
              {content.length}/150
            </div>
          )}
        </div>
      </div>

      {/* Caption Input for Image */}
      {imagePreview && (
        <div className="w-full max-w-sm mx-auto mt-4 animate-fade-in relative">
          
          {showEmoji && (
            <div ref={emojiRef} className="absolute bottom-full mb-4 right-0 z-50 animate-slide-up shadow-2xl rounded-2xl overflow-hidden border border-border">
              <EmojiPicker 
                onEmojiClick={onEmojiClick} 
                theme="dark"
                emojiStyle={EmojiStyle.TWEMOJI}
                searchDisabled={true}
                skinTonesDisabled={true}
                height={320}
                width={300}
                previewConfig={{ showPreview: false }}
              />
            </div>
          )}

          <div className="relative flex items-end">
            <textarea
              ref={captionRef}
              value={caption}
              onChange={handleCaptionChange}
              placeholder="Tambahkan caption..."
              maxLength={100}
              rows={1}
              className="w-full bg-white/10 text-white placeholder:text-white/60 border border-white/20 rounded-3xl py-3 pl-5 pr-12 outline-none focus:bg-white/20 transition-all backdrop-blur-md resize-none custom-scrollbar"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            
            <div className="absolute right-2 bottom-1.5 flex items-center">
              <button 
                type="button"
                onClick={() => setShowEmoji(!showEmoji)}
                className={`p-2 rounded-full transition-all duration-200 focus:outline-none ${showEmoji ? 'text-primary bg-primary/20' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              >
                <Smile size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Color Picker & Image Upload */}
      <div className="mt-4 sm:mt-8 w-full">
        <div className="flex items-center justify-start sm:justify-center space-x-3 overflow-x-auto py-4 px-2 no-scrollbar w-full">
          <label className="w-10 h-10 rounded-full bg-secondary flex flex-shrink-0 items-center justify-center cursor-pointer hover:bg-secondary/80 transition-colors text-textMuted hover:text-text shadow-sm border border-border ml-2 sm:ml-0">
            <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <ImageIcon size={20} />
          </label>
          
          <div className="h-6 w-px bg-border mx-1 flex-shrink-0"></div>

          {BG_COLORS.map((bg, idx) => (
            <button
              key={idx}
              onClick={() => setColorIndex(idx)}
              className={`w-8 h-8 rounded-full flex-shrink-0 transition-all ${bg} ${
                colorIndex === idx ? 'scale-110 ring-2 ring-white ring-offset-4 ring-offset-black opacity-100' : 'hover:scale-110 opacity-50 hover:opacity-100'
              }`}
            />
          ))}
          {/* Add a spacer at the end for mobile scroll padding */}
          <div className="w-2 flex-shrink-0 sm:hidden"></div>
        </div>
      </div>
    </div>
  );
}
