import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import VibeViewerModal from './VibeViewerModal';
import VibeUploadModal from './VibeUploadModal';
import { fetchActiveVibes } from '../../services/dbServices';

export default function VibesBar({ friendNicks, onReply }) {
  const { user, isRegistered, pseudo } = useAuth();
  const [vibesList, setVibesList] = useState([]);
  const [selectedVibeIndex, setSelectedVibeIndex] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    loadVibes();
    const interval = setInterval(loadVibes, 30000); // refresh every 30 seconds
    return () => clearInterval(interval);
  }, [pseudo, friendNicks]);

  const loadVibes = async () => {
    if (!pseudo) return;
    const allVibes = await fetchActiveVibes();
    
    // Filter vibes based on visibility rules
    const filtered = allVibes.filter(v => {
      if (v.nickname === pseudo) return true; // Can always see own vibes
      
      const isFriend = friendNicks.some(fn => fn.toLowerCase() === v.nickname.toLowerCase());
      
      if (v.vibes_visibility === 'public') return true;
      if (v.vibes_visibility === 'friends_only' && isFriend) return true;
      
      return false;
    });

    // Move current user to the front if they have vibes
    const myIndex = filtered.findIndex(v => v.nickname === pseudo);
    if (myIndex > 0) {
      const myVibes = filtered.splice(myIndex, 1)[0];
      filtered.unshift(myVibes);
    }
    
    setVibesList(filtered);
  };

  const handleVibeClick = (index) => {
    setSelectedVibeIndex(index);
    setIsViewerOpen(true);
  };

  const myVibeObj = vibesList.find(v => v.nickname === pseudo);
  const hasMyVibes = !!myVibeObj && myVibeObj.vibes.length > 0;

  if (!isRegistered && vibesList.length === 0) return null;

  return (
    <>
      <div className="w-full border-b border-border bg-secondary/10 px-4 py-3 overflow-x-auto no-scrollbar">
        <div className="flex space-x-4 items-center">
          
          {/* Add Vibe Button / My Vibe (Only for registered) */}
          {isRegistered && (
            <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group" onClick={() => {
              if (hasMyVibes) {
                const idx = vibesList.findIndex(v => v.nickname === pseudo);
                handleVibeClick(idx);
              } else {
                setIsUploadOpen(true);
              }
            }}>
            <div className="relative">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-200 ${
                hasMyVibes 
                  ? 'border-[3px] border-primary p-0.5' 
                  : 'bg-secondary border border-border group-hover:border-primary/50'
              }`}>
                <div className={`w-full h-full rounded-full flex items-center justify-center text-textMuted ${hasMyVibes ? 'bg-secondary' : ''}`}>
                  {pseudo ? pseudo.charAt(0).toUpperCase() : '?'}
                </div>
              </div>
              
              <div 
                className="absolute bottom-0 right-0 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-surface shadow-sm hover:bg-primaryHover transition-transform hover:scale-110 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUploadOpen(true);
                }}
                title="Add new Vibe"
              >
                <Plus size={12} strokeWidth={3} />
              </div>
            </div>
            <span className="text-xs font-medium text-textMuted mt-1 w-16 text-center truncate">
              {hasMyVibes ? 'Your Vibe' : 'Add Vibe'}
            </span>
          </div>
          )}

          {/* Other Vibes */}
          {vibesList.filter(v => v.nickname !== pseudo).map((userVibes, idx) => {
            // Find actual index in the full list
            const realIndex = vibesList.findIndex(v => v.nickname === userVibes.nickname);
            return (
              <div 
                key={userVibes.nickname} 
                className="flex flex-col items-center flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
                onClick={() => handleVibeClick(realIndex)}
              >
                <div className="w-14 h-14 rounded-full p-[3px] bg-gradient-to-tr from-accent to-primary mb-1">
                  <div className="w-full h-full rounded-full border-2 border-surface bg-secondary flex items-center justify-center font-bold text-text">
                    {userVibes.nickname.charAt(0).toUpperCase()}
                  </div>
                </div>
                <span className="text-xs font-medium text-text w-16 text-center truncate">
                  {userVibes.nickname}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {isViewerOpen && selectedVibeIndex !== null && createPortal(
        <VibeViewerModal 
          isOpen={isViewerOpen} 
          onClose={() => {
            setIsViewerOpen(false);
            setSelectedVibeIndex(null);
          }} 
          vibesList={vibesList} 
          initialIndex={selectedVibeIndex} 
          onReply={onReply}
        />,
        document.body
      )}

      {isUploadOpen && createPortal(
        <VibeUploadModal 
          isOpen={isUploadOpen} 
          onClose={() => {
            setIsUploadOpen(false);
            loadVibes(); // Refresh after upload
          }} 
        />,
        document.body
      )}
    </>
  );
}
