import React, { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import BottomNav from './components/Layout/BottomNav';
import ChatWindow from './components/Chat/ChatWindow';
import ChatInput from './components/Chat/ChatInput';
import PinGeneratorModal from './components/Modals/PinGeneratorModal';
import NearbyUsersModal from './components/Modals/NearbyUsersModal';
import CallModal from './components/Modals/CallModal';
import { useChatRealtime } from './hooks/useChatRealtime';
import { useWebRTC } from './hooks/useWebRTC';
import { useCommandParser } from './hooks/useCommandParser';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './config/supabaseClient';
import { soundManager } from './utils/SoundManager';
import { markMessagesAsRead, sendMessage } from './services/dbServices';
import Home from './components/Home/Home';

function App() {
  const [currentChannel, setCurrentChannel] = useState('random');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState('pms');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [hasJoined, setHasJoined] = useState(false);
  const { user, pseudo, isRegistered } = useAuth();
  const [privateChannels, setPrivateChannels] = useState([]);
  const [joinedSpaces, setJoinedSpaces] = useState(['random']);
  const [replyingTo, setReplyingTo] = useState(null);
  
  const {
    callState,
    caller,
    callTarget,
    localStream,
    remoteStream,
    isMuted,
    startCall,
    acceptCall,
    endCall,
    toggleMute
  } = useWebRTC(pseudo);

  // Load channels when pseudo changes
  useEffect(() => {
    if (pseudo) {
      const savedPM = localStorage.getItem(`anora_pm_${pseudo}`);
      if (savedPM) setPrivateChannels(JSON.parse(savedPM));
      else setPrivateChannels([]);

      const savedSpaces = localStorage.getItem(`anora_spaces_${pseudo}`);
      if (savedSpaces) setJoinedSpaces(JSON.parse(savedSpaces));
      else setJoinedSpaces(['random']);
    }
  }, [pseudo]);

  // Wrappers to save to localStorage safely
  const updatePrivateChannels = (updater) => {
    setPrivateChannels(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (pseudo) localStorage.setItem(`anora_pm_${pseudo}`, JSON.stringify(next));
      return next;
    });
  };

  const updateJoinedSpaces = (updater) => {
    setJoinedSpaces(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (pseudo) localStorage.setItem(`anora_spaces_${pseudo}`, JSON.stringify(next));
      return next;
    });
  };
  
  const { messages, onlineUsers, typingUsers, loading, setMessages, broadcastTyping } = useChatRealtime(currentChannel, user, pseudo);

  useEffect(() => {
    if (currentChannel.startsWith('@')) {
      if (!privateChannels.includes(currentChannel)) {
        updatePrivateChannels(prev => [...prev, currentChannel]);
      }
    } else {
      if (!joinedSpaces.includes(currentChannel)) {
        updateJoinedSpaces(prev => [...prev, currentChannel]);
      }
    }
  }, [currentChannel, privateChannels, joinedSpaces]);

  useEffect(() => {
    if (hasJoined && pseudo && !isRegistered) {
      const pmSent = localStorage.getItem(`anora_welcome_pm_${pseudo}`);
      if (!pmSent) {
        const pmChannel = `@${[pseudo, 'Anora 🤖'].sort().join('-')}`;
        const messageContent = `selamat datang di Anora, Chat Anonim Random\n\nBerikut perintah yang bisa kamu gunakan:\n1. /join [channel] - Pindah/masuk ke chat room\n2. /nick [name] [password] - Ganti nickname kamu\n3. /register [nick] [pass] [email] - Daftarkan nickname kamu\n4. /beacon [message] - Kirim sinyal beacon\n5. /addfriend [PIN] - Tambah teman dengan PIN\n\njika kamu perlu bantuan, silahkan chat Anora yah`;
        
        updatePrivateChannels(prev => {
          if (!prev.includes(pmChannel)) return [...prev, pmChannel];
          return prev;
        });

        sendMessage(pmChannel, 'Anora 🤖', messageContent);

        localStorage.setItem(`anora_welcome_pm_${pseudo}`, 'true');
      }
    }
  }, [hasJoined, pseudo, isRegistered]);

  // 1-hour Anonymous Suggestion
  useEffect(() => {
    if (!hasJoined || !user || isRegistered) return;

    const startKey = `anon_start_time_${user.id}`;
    const pmSentKey = `anora_register_suggestion_sent_${user.id}`;

    if (!localStorage.getItem(startKey)) {
      localStorage.setItem(startKey, Date.now().toString());
    }

    if (localStorage.getItem(pmSentKey)) return;

    const checkInterval = setInterval(() => {
      const startTime = parseInt(localStorage.getItem(startKey) || '0', 10);
      const oneHour = 60 * 60 * 1000; // 1 hour in ms
      
      if (Date.now() - startTime >= oneHour) {
        const pmChannel = `@${[pseudo, 'Anora 🤖'].sort().join('-')}`;
        const messageContent = `Halo! Saya perhatikan kamu sudah mengobrol sebagai anonim selama 1 jam.\n\nAgar lebih seru, yuk register nickname kamu! Dengan register, nickname kamu tidak akan hilang dan kamu bisa menambah teman (Add Connection) ke dalam Friendlist menggunakan PIN.\n\nGunakan perintah ini untuk register:\n/register [nickname] [password] [email]\n\nJika butuh bantuan, ketik /help atau balas pesan ini yah.`;
        
        updatePrivateChannels(prev => {
          if (!prev.includes(pmChannel)) return [...prev, pmChannel];
          return prev;
        });

        sendMessage(pmChannel, 'Anora 🤖', messageContent);
        localStorage.setItem(pmSentKey, 'true');
        clearInterval(checkInterval);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [hasJoined, user, isRegistered, pseudo]);

  const closePrivateChannel = (channelToClose) => {
    updatePrivateChannels(prev => prev.filter(c => c !== channelToClose));
    if (currentChannel === channelToClose) {
      setCurrentChannel('random');
    }
  };
  
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
        const isPMChannel = newMsg.channel_name.startsWith('@') && newMsg.channel_name.includes(pseudo);
        const isAnora = newMsg.user_pseudo.includes('Anora');

        if (newMsg.channel_name === currentChannel) {
          // Message is in active channel, mark as read immediately
          markMessagesAsRead(currentChannel, pseudo);
        } else if (isMention || isPMChannel) {
          // Not active channel, but it's a mention or PM -> Add to unread
          setUnreadCounts(prev => ({
            ...prev,
            [newMsg.channel_name]: (prev[newMsg.channel_name] || 0) + 1
          }));
          
          if (isPMChannel && newMsg.channel_name.startsWith('@')) {
            updatePrivateChannels(prev => {
              if (!prev.includes(newMsg.channel_name)) return [...prev, newMsg.channel_name];
              return prev;
            });
          }
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
      // Hapus dari unreadCounts jika ada
      setUnreadCounts(prev => {
        const next = { ...prev };
        delete next[currentChannel];
        return next;
      });
    }
  }, [currentChannel, pseudo]);

  const handleMarkAsRead = (channelToMark) => {
    if (pseudo) {
      markMessagesAsRead(channelToMark, pseudo);
      setUnreadCounts(prev => {
        const next = { ...prev };
        delete next[channelToMark];
        return next;
      });
    }
  };

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
    setIsMobileChatOpen(true); // Open chat view on mobile
    setReplyingTo(null);
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
    const success = await parseCommand(text, replyingTo?.id);
    if (success) {
      setReplyingTo(null);
    }
    return success;
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
      
      <div className={`${!isMobileChatOpen ? 'flex' : 'hidden md:flex'} w-full md:w-auto relative`}>
        <Sidebar 
          currentChannel={currentChannel} 
          changeChannel={changeChannel} 
          openPinModal={openPinModal}
          openNearbyModal={openNearbyModal}
          unreadCounts={unreadCounts}
          privateChannels={privateChannels}
          closePrivateChannel={closePrivateChannel}
          joinedSpaces={joinedSpaces}
          onMarkAsRead={handleMarkAsRead}
          closeSpace={(spaceToClose) => {
            updateJoinedSpaces(prev => prev.filter(c => c !== spaceToClose));
            if (currentChannel === spaceToClose) setCurrentChannel('random');
          }}
          activeMobileTab={activeMobileTab}
        />
        <BottomNav 
          activeTab={activeMobileTab} 
          onChangeTab={setActiveMobileTab} 
          unreadTabs={['spaces', 'pms'].filter(tab => {
            if (tab === 'pms') return Object.keys(unreadCounts).some(c => c.startsWith('@') && unreadCounts[c] > 0);
            if (tab === 'spaces') return Object.keys(unreadCounts).some(c => !c.startsWith('@') && unreadCounts[c] > 0);
            return false;
          })} 
        />
      </div>
      
      <div className={`${isMobileChatOpen ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 relative`}>
        <Header 
          currentChannel={currentChannel} 
          onlineUsers={onlineUsers}
          isMobileChatOpen={isMobileChatOpen}
          onBack={() => setIsMobileChatOpen(false)}
          onUserClick={startPrivateMessage}
          onCallClick={startCall}
        />
        
        <ChatWindow 
          messages={messages} 
          loading={loading} 
          typingUsers={typingUsers}
          onReply={(msg) => setReplyingTo(msg)}
        />
        
        <div className="sticky bottom-0 w-full z-10">
          {/* Subtle gradient to blend input with background */}
          <div className="absolute inset-x-0 bottom-full h-12 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
          <ChatInput 
            onSendMessage={handleSendMessage} 
            broadcastTyping={broadcastTyping}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
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

      <CallModal
        callState={callState}
        caller={caller}
        callTarget={callTarget}
        remoteStream={remoteStream}
        isMuted={isMuted}
        acceptCall={acceptCall}
        endCall={endCall}
        toggleMute={toggleMute}
      />
    </div>
  );
}

export default App;
