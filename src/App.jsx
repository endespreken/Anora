import React, { useState } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import ChatWindow from './components/Chat/ChatWindow';
import ChatInput from './components/Chat/ChatInput';
import PinGeneratorModal from './components/Modals/PinGeneratorModal';
import NearbyUsersModal from './components/Modals/NearbyUsersModal';
import { useChatRealtime } from './hooks/useChatRealtime';
import { useCommandParser } from './hooks/useCommandParser';
import { useAuth } from './contexts/AuthContext';

function App() {
  const [currentChannel, setCurrentChannel] = useState('general');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const { user, pseudo } = useAuth();
  
  const { messages, onlineUsers, loading } = useChatRealtime(currentChannel, user, pseudo);
  
  const changeChannel = (newChannel) => {
    setCurrentChannel(newChannel);
  };

  const openPinModal = () => setIsPinModalOpen(true);
  const closePinModal = () => setIsPinModalOpen(false);

  const openNearbyModal = () => setIsNearbyModalOpen(true);
  const closeNearbyModal = () => setIsNearbyModalOpen(false);

  const { parseCommand } = useCommandParser(currentChannel, changeChannel, openPinModal);

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

  return (
    <div className="flex h-screen w-full bg-background text-text overflow-hidden transition-colors duration-300">
      <Sidebar 
        currentChannel={currentChannel} 
        changeChannel={changeChannel} 
        openPinModal={openPinModal}
        openNearbyModal={openNearbyModal}
      />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header 
          currentChannel={currentChannel} 
          onlineCount={onlineUsers.length} 
        />
        
        <ChatWindow 
          messages={messages} 
          loading={loading} 
        />
        
        <div className="sticky bottom-0 w-full z-10">
          {/* Subtle gradient to blend input with background */}
          <div className="absolute inset-x-0 bottom-full h-12 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
          <ChatInput 
            onSendMessage={handleSendMessage} 
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
