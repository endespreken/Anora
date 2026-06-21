import React, { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import ChatWindow from './components/Chat/ChatWindow';
import ChatInput from './components/Chat/ChatInput';
import PinGeneratorModal from './components/Modals/PinGeneratorModal';
import NearbyUsersModal from './components/Modals/NearbyUsersModal';
import { useChatRealtime } from './hooks/useChatRealtime';
import { useCommandParser } from './hooks/useCommandParser';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './config/supabaseClient';
import { soundManager } from './utils/SoundManager';
import { markMessagesAsRead } from './services/dbServices';
import Home from './components/Home/Home';

function App() {
  const [currentChannel, setCurrentChannel] = useState('general');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadMentions, setUnreadMentions] = useState([]);
  const [hasJoined, setHasJoined] = useState(false);
  const { user, pseudo } = useAuth();
  
  const { messages, onlineUsers, typingUsers, loading, setMessages, broadcastTyping } = useChatRealtime(currentChannel, user, pseudo);
  
  // Global Listener for Messages (Sounds and Mentions)
  useEffect(() => {
    if (!pseudo) return;
    
    const globalChannel = supabase.channel('global_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        
        // Don't play receive sound for our own message, play send sound when we send (handled in sendMessage)
        if (newMsg.user_pseudo === pseudo) {
          // Play send sound, but since we insert locally maybe? No, let's play send sound here if we want to confirm it's sent.
          // Wait, playing here confirms delivery.
          soundManager.playSend();
          return;
        }

        // It's from someone else
        const isMention = newMsg.content.includes(`@${pseudo}`);
        const isPMChannel = newMsg.channel_name.includes(pseudo); // Asumsi sederhana PM
        const isAnora = newMsg.user_pseudo.includes('Anora');

        if (newMsg.channel_name === currentChannel) {
          // Message is in active channel, mark as read immediately
          markMessagesAsRead(currentChannel, pseudo);
        } else if (isMention || isPMChannel) {
          // Not active channel, but it's a mention or PM -> Add to unread
          setUnreadMentions(prev => {
            if (!prev.includes(newMsg.channel_name)) return [...prev, newMsg.channel_name];
            return prev;
          });
        }

        // Play sounds
        if (isAnora) {
          soundManager.playAnora();
        } else if (isMention || isPMChannel) {
          soundManager.playReceivePM();
        } else {
          soundManager.playReceiveChannel();
        }
      })
      .subscribe();

    return () => {
      globalChannel.unsubscribe();
    };
  }, [pseudo, currentChannel]);

  // Mark as read when entering a channel
  useEffect(() => {
    if (pseudo && currentChannel) {
      markMessagesAsRead(currentChannel, pseudo);
      // Hapus dari unreadMentions jika ada
      setUnreadMentions(prev => prev.filter(c => c !== currentChannel));
    }
  }, [currentChannel, pseudo]);

  const addLocalMessage = (content, botName = 'Anora 🤖') => {
    const localMsg = {
      id: `local-${Date.now()}-${Math.random()}`,
      channel_name: currentChannel,
      user_pseudo: botName,
      content,
      is_system_msg: false,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, localMsg]);
  };

  const changeChannel = (newChannel) => {
    setCurrentChannel(newChannel);
    setIsMobileMenuOpen(false); // Auto close menu on mobile
  };

  const openPinModal = () => setIsPinModalOpen(true);
  const closePinModal = () => setIsPinModalOpen(false);

  const openNearbyModal = () => setIsNearbyModalOpen(true);
  const closeNearbyModal = () => setIsNearbyModalOpen(false);

  const startPrivateMessage = (targetPseudo) => {
    if (targetPseudo === pseudo) return;
    const pmChannel = `@${[pseudo, targetPseudo].sort().join('-')}`;
    changeChannel(pmChannel);
  };

  const { parseCommand } = useCommandParser(currentChannel, changeChannel, openPinModal, addLocalMessage);

  const handleSendMessage = async (text) => {
    return await parseCommand(text);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-text">
        <div className="flex flex-col items-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Initializing Anora...</h2>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return <Home onJoin={() => setHasJoined(true)} />;
  }

  return (
    <div className="flex h-[100dvh] w-full bg-background text-text overflow-hidden transition-colors duration-300">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        currentChannel={currentChannel} 
        changeChannel={changeChannel} 
        openPinModal={openPinModal}
        openNearbyModal={openNearbyModal}
        unreadMentions={unreadMentions}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header 
          currentChannel={currentChannel} 
          onlineUsers={onlineUsers}
          onMenuClick={() => setIsMobileMenuOpen(true)}
          onUserClick={startPrivateMessage}
        />
        
        <ChatWindow 
          messages={messages} 
          loading={loading} 
          typingUsers={typingUsers}
        />
        
        <div className="sticky bottom-0 w-full z-10">
          {/* Subtle gradient to blend input with background */}
          <div className="absolute inset-x-0 bottom-full h-12 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
          <ChatInput 
            onSendMessage={handleSendMessage} 
            broadcastTyping={broadcastTyping}
          />
        </div>
      </div>

      <PinGeneratorModal 
        isOpen={isPinModalOpen} 
        onClose={closePinModal} 
      />

      <NearbyUsersModal
        isOpen={isNearbyModalOpen}
        onClose={closeNearbyModal}
        onlineUsers={onlineUsers}
      />
    </div>
  );
}

export default App;
