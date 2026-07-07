import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import BottomNav from './components/Layout/BottomNav';
import ChatWindow from './components/Chat/ChatWindow';
import ChatInput from './components/Chat/ChatInput';
import PinGeneratorModal from './components/Modals/PinGeneratorModal';
import NearbyUsersModal from './components/Modals/NearbyUsersModal';
import OnlineUsersModal from './components/Modals/OnlineUsersModal';
import SettingsModal from './components/Modals/SettingsModal';
import NotificationsModal from './components/Modals/NotificationsModal';
import FollowPinModal from './components/Modals/FollowPinModal';
import UnfollowConfirmModal from './components/Modals/UnfollowConfirmModal';
import ProfileModal from './components/Modals/ProfileModal';
import LoginModal from './components/Modals/LoginModal';
import ChangeNicknameModal from './components/Modals/ChangeNicknameModal';
import JoinChannelModal from './components/Modals/JoinChannelModal';
import FOPortalModal from './components/Modals/FOPortalModal';
import LocationRequiredModal from './components/Modals/LocationRequiredModal';
import { useChatRealtime } from './hooks/useChatRealtime';
import { useCommandParser } from './hooks/useCommandParser';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './config/supabaseClient';
import { soundManager } from './utils/SoundManager';
import { decryptMessage } from './utils/encryption';
import { markMessagesAsRead, sendMessage, fetchUnreadCountsForUser, fetchFriends, fetchFriendNicks, addFriendWithPin, removeFriend, checkIsFriend, fetchFollowedChannels, toggleFollowChannel, fetchAllVerifiedChannels } from './services/dbServices';
import { useGlobalPresence } from './hooks/useGlobalPresence';
import { useSettings } from './contexts/SettingsContext';
import Home from './components/Home/Home';
import { App as CapApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

function App() {
  const [currentChannel, setCurrentChannel] = useState('random');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  
  // New Header Context Menu Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isChangeNicknameModalOpen, setIsChangeNicknameModalOpen] = useState(false);
  const [isJoinChannelModalOpen, setIsJoinChannelModalOpen] = useState(false);
  const [isFOPortalOpen, setIsFOPortalOpen] = useState(false);
  const [verifiedChannels, setVerifiedChannels] = useState([]);
  
  const [pendingVibeReply, setPendingVibeReply] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState('pms');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const { user, pseudo, isRegistered, trueUserId, permanentPin } = useAuth();
  const [hasJoined, setHasJoined] = useState(() => {
    if (pseudo && !/^Anon\d+$/.test(pseudo)) {
      return true;
    }
    return false;
  });
  const [privateChannels, setPrivateChannels] = useState([]);
  const [joinedSpaces, setJoinedSpaces] = useState(['random']);
  const [replyingTo, setReplyingTo] = useState(null);
  const [pinnedChannels, setPinnedChannels] = useState([]);
  const [globalTyping, setGlobalTyping] = useState({});
  const [friends, setFriends] = useState([]);
  const [friendNicks, setFriendNicks] = useState([]);
  const [followedChannels, setFollowedChannels] = useState([]);
  const [isFollowPinModalOpen, setIsFollowPinModalOpen] = useState(false);
  const [isUnfollowConfirmModalOpen, setIsUnfollowConfirmModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileTargetNickname, setProfileTargetNickname] = useState('');
  const [targetFollowUser, setTargetFollowUser] = useState('');
  const [unfollowTargetIsSpace, setUnfollowTargetIsSpace] = useState(false);
  const globalChannelRef = useRef(null);
  const isAppActiveRef = useRef(true);
  const { friendsOnlyPM } = useSettings();

  useEffect(() => {
    const initNotifications = async () => {
      try {
        await LocalNotifications.requestPermissions();
      } catch (err) {
        console.warn('LocalNotifications permission error:', err);
      }
      
      // Request Web Notifications (WhatsApp Web style)
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    };
    initNotifications();

    const setupAppState = async () => {
      try {
        await CapApp.addListener('appStateChange', ({ isActive }) => {
          isAppActiveRef.current = isActive;
        });
      } catch (err) {
        console.warn('CapApp listener error:', err);
      }
    };
    setupAppState();
    
    // Fallback for Web Browser visibility
    const handleVisibilityChange = () => {
      isAppActiveRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const activeUserId = trueUserId || user?.id;
    if (activeUserId && isRegistered && pseudo) {
      const loadFriends = async () => {
        const friendIds = await fetchFriends(activeUserId);
        setFriends(friendIds);
        const nicks = await fetchFriendNicks(activeUserId);
        setFriendNicks(nicks);
        
        if (nicks.length > 0) {
          setPrivateChannels(prev => {
            const newPMs = nicks.map(n => `@${[pseudo, n].sort().join('-')}`);
            const merged = [...new Set([...prev, ...newPMs])];
            localStorage.setItem(`anora_pm_${pseudo}`, JSON.stringify(merged));
            return merged;
          });
        }
      };
      loadFriends();
    } else {
      setFriends([]);
      setFriendNicks([]);
    }
  }, [user, isRegistered, pseudo, trueUserId]);
  
  // Load channels when pseudo changes
  useEffect(() => {
    if (pseudo) {
      const savedPM = localStorage.getItem(`anora_pm_${pseudo}`);
      if (savedPM) setPrivateChannels(JSON.parse(savedPM));
      else setPrivateChannels([]);

      const savedSpaces = localStorage.getItem(`anora_spaces_${pseudo}`);
      if (savedSpaces) setJoinedSpaces(JSON.parse(savedSpaces).map(s => s.toLowerCase()));
      else setJoinedSpaces(['random']);

      const savedPinned = localStorage.getItem(`anora_pinned_${pseudo}`);
      if (savedPinned) setPinnedChannels(JSON.parse(savedPinned).map(c => c.startsWith('@') ? c : c.toLowerCase()));
      else setPinnedChannels([]);

      if (isRegistered) {
        fetchFollowedChannels(pseudo).then(channels => {
          setFollowedChannels(channels);
          if (channels && channels.length > 0) {
            setJoinedSpaces(prev => {
              const merged = [...new Set([...prev, ...channels])];
              localStorage.setItem(`anora_spaces_${pseudo}`, JSON.stringify(merged));
              return merged;
            });
          }
        });
      } else {
        setFollowedChannels([]);
      }
    }
  }, [pseudo, isRegistered]);

  const reloadVerifiedChannels = () => {
    fetchAllVerifiedChannels().then(channels => setVerifiedChannels(channels));
  };

  useEffect(() => {
    reloadVerifiedChannels();
  }, []);

  const handlePinChat = (channel) => {
    setPinnedChannels(prev => {
      let next;
      if (prev.includes(channel)) {
        next = prev.filter(c => c !== channel);
      } else {
        next = [...prev, channel];
      }
      if (pseudo) localStorage.setItem(`anora_pinned_${pseudo}`, JSON.stringify(next));
      return next;
    });
  };

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
  
  const { messages, typingUsers, loading, setMessages, broadcastTyping } = useChatRealtime(currentChannel, user, pseudo);

  // Global Presence
  const { globalOnlineUsers, locationPermissionDenied, handleRequestLocation } = useGlobalPresence(user, pseudo, joinedSpaces, privateChannels);
  
  // Filter online users for current room
  const onlineUsers = globalOnlineUsers.filter(u => {
    if (currentChannel === 'random') return true; // random is global
    if (currentChannel.startsWith('@')) return currentChannel.includes(u.pseudo);
    return u.spaces?.includes(currentChannel);
  });

  useEffect(() => {
    if (currentChannel.startsWith('@')) {
      if (!privateChannels.includes(currentChannel)) {
        updatePrivateChannels(prev => [...prev, currentChannel]);
      }
    } else {
      const formattedChannel = currentChannel.toLowerCase();
      if (!joinedSpaces.includes(formattedChannel)) {
        updateJoinedSpaces(prev => [...prev, formattedChannel]);
        if (pseudo) {
          sendMessage(formattedChannel, 'SYSTEM', `${pseudo} telah bergabung dalam ruangan.`, true);
        }
      }
    }
  }, [currentChannel, privateChannels, joinedSpaces, pseudo]);

  // Load persistent unread counts
  useEffect(() => {
    if (!pseudo) return;
    const allChannels = [...new Set([...joinedSpaces, ...privateChannels])];
    if (allChannels.length === 0) return;
    
    fetchUnreadCountsForUser(allChannels, pseudo).then(counts => {
      setUnreadCounts(prev => ({ ...prev, ...counts }));
    });
  }, [pseudo, joinedSpaces, privateChannels]);

  useEffect(() => {
    if (hasJoined && pseudo && !isRegistered) {
      const pmSent = localStorage.getItem(`anora_welcome_pm_${pseudo}`);
      if (!pmSent) {
        const pmChannel = `@${[pseudo, 'Anora 🤖'].sort().join('-')}`;
        const messageContent = `Selamat datang di Anora, Chat Anonim Random\n\nBerikut perintah yang bisa kamu gunakan:\n1. /join [channel] - Pindah/masuk ke chat room\n2. /nick [nickname] - Ganti nickname temporary\n3. /nick [nickname] [password] - Login/verifikasi nickname yang sudah diregistrasi\n4. /register [nick] [pass] [email] - Daftarkan nickname kamu\n5. /beacon [message] - Kirim sinyal beacon\n6. /addfriend [PIN] - Tambah teman dengan PIN\n\njika kamu perlu bantuan, silahkan chat Anora yah`;
        
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
        
        // Cek apakah channel adalah space yang kita ikuti
        const savedSpaces = JSON.parse(localStorage.getItem(`anora_spaces_${pseudo}`) || '["random"]');
        const isJoinedSpace = !newMsg.channel_name.startsWith('@') && savedSpaces.includes(newMsg.channel_name);

        // Abaikan PM yang bukan untuk kita
        if (newMsg.channel_name.startsWith('@') && !isPMChannel) return;

        // Abaikan pesan dari space yang tidak kita ikuti (kecuali kita dimention)
        if (!newMsg.channel_name.startsWith('@') && !isJoinedSpace && !isMention) return;

        const processMessage = () => {
          if (newMsg.channel_name === currentChannel) {
            // Message is in active channel, mark as read immediately
            markMessagesAsRead(currentChannel, pseudo);
            localStorage.setItem(`last_read_${pseudo}_${currentChannel}`, Date.now().toString());
          } else {
            // Not active channel, Add to unread
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

          // Check if this is a command response
          const commandPrefixes = ['[WEATHER]:', '[MEME]:', '[TRANSLATE]:', '[KURS]:', '[QUIZ]:', '[QUIZ_WIN]:', '[WIKI]:', '[CRYPTO]:', '[TEBAKKATA]:'];
          const isCommandResponse = commandPrefixes.some(prefix => newMsg.content.startsWith(prefix)) || newMsg.user_pseudo === 'Anora' || newMsg.user_pseudo === 'SYSTEM';

          const showNotification = (title, body) => {
            if (Capacitor.isNativePlatform()) {
              // Native Mobile (Capacitor)
              LocalNotifications.schedule({
                notifications: [{
                  title,
                  body,
                  id: new Date().getTime() % 1000000,
                }]
              }).catch(e => console.warn(e));
            } else {
              // Web Browser (WhatsApp Web style)
              if ('Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification(title, { 
                  body, 
                  icon: 'https://snixuzaslqdnbduqmazs.supabase.co/storage/v1/object/public/Asset/Logo%20Apps%20Mobile.png' 
                });
                notification.onclick = () => {
                  window.focus();
                  notification.close();
                };
              }
            }
          };

          // Play sounds
          // Do not play sound if it's a command response and it was requested by someone else
          if (isAnora) {
            // Anora is completely silent for all users
          } else if (isCommandResponse && newMsg.user_id !== user?.id) {
            // No sound for other people's commands
          } else if (isPMChannel) {
            soundManager.playReceivePM();
            if (!isAppActiveRef.current) {
              const decryptedText = decryptMessage(newMsg.content, newMsg.channel_name);
              showNotification(`Pesan dari ${newMsg.user_pseudo}`, decryptedText);
            }
          } else if (isMention) {
            soundManager.playReceivePM(); // Same sound for mention
            if (!isAppActiveRef.current) {
              const decryptedText = decryptMessage(newMsg.content, newMsg.channel_name);
              showNotification(`Mention dari ${newMsg.user_pseudo}`, decryptedText);
            }
          } else {
            soundManager.playReceiveChannel();
          }
        };

        if (isPMChannel && !isAnora && friendsOnlyPM && user) {
          // Verify friend
          checkIsFriend(user.id, newMsg.user_id).then(isFriend => {
            if (isFriend) {
              processMessage();
            }
          });
        } else {
          processMessage();
        }
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { channel_name, user_pseudo } = payload.payload;
        if (user_pseudo !== pseudo) {
          setGlobalTyping(prev => {
            const current = prev[channel_name] || [];
            if (!current.includes(user_pseudo)) {
              return { ...prev, [channel_name]: [...current, user_pseudo] };
            }
            return prev;
          });
          
          setTimeout(() => {
            setGlobalTyping(prev => {
              const current = prev[channel_name] || [];
              const filtered = current.filter(u => u !== user_pseudo);
              if (filtered.length === 0) {
                const next = { ...prev };
                delete next[channel_name];
                return next;
              }
              return { ...prev, [channel_name]: filtered };
            });
          }, 3000);
        }
      })
      .on('broadcast', { event: 'friend_request' }, (payload) => {
        // Fallback for realtime friend request notifications
        if (payload.payload && payload.payload.targetUserId === user?.id) {
          // Trigger AuthContext to re-fetch pending requests
          window.dispatchEvent(new CustomEvent('new_friend_request'));
        }
      })
      .subscribe();

    globalChannelRef.current = globalChannel;

    const handleSendFriendRequest = (e) => {
      const targetUserId = e.detail?.targetUserId;
      if (targetUserId && globalChannel) {
        globalChannel.send({
          type: 'broadcast',
          event: 'friend_request',
          payload: { targetUserId }
        });
      }
    };
    window.addEventListener('send_friend_request_broadcast', handleSendFriendRequest);

    return () => {
      window.removeEventListener('send_friend_request_broadcast', handleSendFriendRequest);
      globalChannel.unsubscribe();
      globalChannelRef.current = null;
    };
  }, [pseudo, currentChannel]);

  // Mark as read when entering a channel
  useEffect(() => {
    if (pseudo && currentChannel) {
      markMessagesAsRead(currentChannel, pseudo);
      localStorage.setItem(`last_read_${pseudo}_${currentChannel}`, Date.now().toString());
      // Hapus dari unreadCounts jika ada
      setUnreadCounts(prev => {
        const next = { ...prev };
        delete next[currentChannel];
        return next;
      });
    }
  }, [currentChannel, pseudo]);

  // Capacitor hardware back button handler
  useEffect(() => {
    let backButtonListener = null;

    const setupListener = async () => {
      try {
        backButtonListener = await CapApp.addListener('backButton', () => {
          if (isPinModalOpen) {
            setIsPinModalOpen(false);
          } else if (isNearbyModalOpen) {
            setIsNearbyModalOpen(false);
          } else if (isOnlineModalOpen) {
            setIsOnlineModalOpen(false);
          } else if (isSettingsModalOpen) {
            setIsSettingsModalOpen(false);
          } else if (isFOPortalOpen) {
            setIsFOPortalOpen(false);
          } else if (isMobileChatOpen) {
            setIsMobileChatOpen(false);
          } else {
            CapApp.exitApp();
          }
        });
      } catch (err) {
        // Capacitor might throw if not running in a native environment
        console.warn('Capacitor App plugin not available:', err);
      }
    };

    setupListener();

    return () => {
      if (backButtonListener && typeof backButtonListener.remove === 'function') {
        backButtonListener.remove();
      }
    };
  }, [isPinModalOpen, isNearbyModalOpen, isOnlineModalOpen, isSettingsModalOpen, isMobileChatOpen, isFOPortalOpen]);

  const handleMarkAsRead = (channelToMark) => {
    if (pseudo) {
      markMessagesAsRead(channelToMark, pseudo);
      localStorage.setItem(`last_read_${pseudo}_${channelToMark}`, Date.now().toString());
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
    // If not a PM channel, make it lowercase to ensure case-insensitive matching
    const formattedChannel = newChannel.startsWith('@') ? newChannel : newChannel.toLowerCase();
    setCurrentChannel(formattedChannel);
    setIsMobileChatOpen(true); // Open chat view on mobile
    setReplyingTo(null);
  };

  const handleCloseChat = () => {
    if (currentChannel === 'random') return;
    
    if (currentChannel.startsWith('@')) {
      updatePrivateChannels(prev => prev.filter(c => c !== currentChannel));
    } else {
      setJoinedSpaces(prev => prev.filter(s => s !== currentChannel));
    }
    setCurrentChannel('random');
  };

  const handleToggleFollow = async () => {
    if (!isRegistered) return;
    
    if (currentChannel.startsWith('@')) {
      const targetUser = currentChannel.replace('@', '').split('-').find(p => p !== pseudo) || currentChannel.replace('@', '').split('-')[0];
      setTargetFollowUser(targetUser);
      setUnfollowTargetIsSpace(false);
      
      const isFriend = friendNicks.some(n => n.toLowerCase() === targetUser.toLowerCase());
      if (isFriend) {
        setIsUnfollowConfirmModalOpen(true);
      } else {
        setIsFollowPinModalOpen(true);
      }
      return;
    }
    
    const channelName = currentChannel;
    const isCurrentlyFollowing = followedChannels.includes(channelName);
    
    if (isCurrentlyFollowing) {
      // Intent to unfollow space -> show modal
      setTargetFollowUser(channelName);
      setUnfollowTargetIsSpace(true);
      setIsUnfollowConfirmModalOpen(true);
      return;
    }
    
    // Intent to follow space -> execute directly
    setFollowedChannels(prev => [...prev, channelName]);
    const success = await toggleFollowChannel(pseudo, channelName, true);
    
    if (!success) {
      setFollowedChannels(prev => prev.filter(c => c !== channelName));
    }
  };

  const openPinModal = () => setIsPinModalOpen(true);
  const closePinModal = () => setIsPinModalOpen(false);

  const openNearbyModal = () => setIsNearbyModalOpen(true);
  const closeNearbyModal = () => setIsNearbyModalOpen(false);

  const openProfileModal = (nickname) => {
    setProfileTargetNickname(nickname);
    setIsProfileModalOpen(true);
  };
  const closeProfileModal = () => setIsProfileModalOpen(false);

  const startPrivateMessage = (targetPseudo) => {
    if (targetPseudo === pseudo) return;
    const pmChannel = `@${[pseudo, targetPseudo].sort().join('-')}`;
    changeChannel(pmChannel);
  };

  const handleVibeReply = (targetNickname, message) => {
    startPrivateMessage(targetNickname);
    setPendingVibeReply({ targetNickname, message });
  };

  useEffect(() => {
    if (pendingVibeReply && pseudo) {
      const pmChannel = `@${[pseudo, pendingVibeReply.targetNickname].sort().join('-')}`;
      if (currentChannel === pmChannel) {
        handleSendMessage(pendingVibeReply.message);
        setPendingVibeReply(null);
      }
    }
  }, [pendingVibeReply, currentChannel, pseudo]);

  const { parseCommand } = useCommandParser(currentChannel, changeChannel, openPinModal, addLocalMessage, joinedSpaces, privateChannels, () => setIsFOPortalOpen(true));

  const globalBroadcastTyping = () => {
    broadcastTyping(); // For current channel
    if (globalChannelRef.current) {
      globalChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { channel_name: currentChannel, user_pseudo: pseudo }
      });
    }
  };

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

  const handleSubmitFollowPin = async (pin) => {
    if (!isRegistered || !permanentPin) return { success: false, message: "Kamu harus registrasi akun terlebih dahulu untuk menambah teman." };
    const result = await addFriendWithPin(permanentPin, pin);
    if (result.success) {
      const activeUserId = trueUserId || user?.id;
      const friendIds = await fetchFriends(activeUserId);
      setFriends(friendIds);
      const nicks = await fetchFriendNicks(activeUserId);
      setFriendNicks(nicks);
    }
    return result;
  };

  const handleConfirmUnfollow = async () => {
    const activeUserId = trueUserId || user?.id;
    if (!activeUserId) return;
    
    if (unfollowTargetIsSpace) {
      const channelName = targetFollowUser;
      
      // Optimistic update
      setFollowedChannels(prev => prev.filter(c => c !== channelName));
      
      const success = await toggleFollowChannel(pseudo, channelName, false);
      if (!success) {
        setFollowedChannels(prev => [...prev, channelName]);
      }
    } else {
      const success = await removeFriend(activeUserId, targetFollowUser);
      if (success) {
        const friendIds = await fetchFriends(activeUserId);
        setFriends(friendIds);
        const nicks = await fetchFriendNicks(activeUserId);
        setFriendNicks(nicks);
      }
    }
  };

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
          pinnedChannels={pinnedChannels}
          onPinChat={handlePinChat}
          globalTyping={globalTyping}
          globalOnlineUsers={globalOnlineUsers}
          friends={friends}
          friendNicks={friendNicks}
          onSettingsClick={() => setIsSettingsModalOpen(true)}
          onProfileClick={(nickname) => openProfileModal(nickname)}
          onReply={handleVibeReply}
          onNotificationsClick={() => setIsNotificationsModalOpen(true)}
          verifiedChannels={verifiedChannels}
        />
        <BottomNav 
          activeTab={activeMobileTab} 
          onChangeTab={setActiveMobileTab} 
          onNotificationsClick={() => setIsNotificationsModalOpen(true)}
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
          onShowMembers={() => setIsOnlineModalOpen(true)}
          onSettingsClick={() => setIsSettingsModalOpen(true)}
          onProfileClick={openProfileModal}
          onLoginClick={() => setIsLoginModalOpen(true)}
          onChangeNicknameClick={() => setIsChangeNicknameModalOpen(true)}
          onJoinChannelClick={() => setIsJoinChannelModalOpen(true)}
          onAddFriendClick={() => setIsFollowPinModalOpen(true)}
          onCloseChat={handleCloseChat}
          isFollowing={
            currentChannel.startsWith('@')
              ? friendNicks.some(n => n.toLowerCase() === (currentChannel.replace('@', '').split('-').find(p => p !== pseudo) || '').toLowerCase())
              : followedChannels.includes(currentChannel)
          }
          onToggleFollow={handleToggleFollow}
          verifiedChannels={verifiedChannels}
        />
        
        <ChatWindow 
          messages={messages} 
          loading={loading} 
          typingUsers={typingUsers}
          onReply={(msg) => setReplyingTo(msg)}
          onUserClick={startPrivateMessage}
          onProfileClick={openProfileModal}
          isTargetOnline={currentChannel.startsWith('@') && onlineUsers.some(u => u.pseudo !== pseudo)}
        />
        
        <div className="sticky bottom-0 w-full z-10">
          {/* Subtle gradient to blend input with background */}
          <div className="absolute inset-x-0 bottom-full h-12 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
          <ChatInput 
            onSendMessage={handleSendMessage} 
            broadcastTyping={globalBroadcastTyping}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            onlineUsers={onlineUsers}
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
        onlineUsers={globalOnlineUsers}
        onUserClick={startPrivateMessage}
      />

        <FollowPinModal
          isOpen={isFollowPinModalOpen}
          onClose={() => setIsFollowPinModalOpen(false)}
          targetUserNick={targetFollowUser}
          onSubmitPin={handleSubmitFollowPin}
        />
        <UnfollowConfirmModal
          isOpen={isUnfollowConfirmModalOpen}
          onClose={() => setIsUnfollowConfirmModalOpen(false)}
          targetUserNick={targetFollowUser}
          isSpace={unfollowTargetIsSpace}
          onConfirm={handleConfirmUnfollow}
        />
        <OnlineUsersModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        onlineUsers={onlineUsers}
        onUserClick={startPrivateMessage}
        onProfileClick={openProfileModal}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={closeProfileModal}
        targetNickname={profileTargetNickname}
        onMessageClick={(nick) => {
          closeProfileModal();
          startPrivateMessage(nick);
        }}
      />

      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      
      <NotificationsModal 
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />

      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <ChangeNicknameModal
        isOpen={isChangeNicknameModalOpen}
        onClose={() => setIsChangeNicknameModalOpen(false)}
      />

      <JoinChannelModal
        isOpen={isJoinChannelModalOpen}
        onClose={() => setIsJoinChannelModalOpen(false)}
        onJoin={changeChannel}
      />

      <FOPortalModal 
        isOpen={isFOPortalOpen} 
        onClose={() => setIsFOPortalOpen(false)} 
        onVerifiedUpdated={reloadVerifiedChannels}
      />

      <LocationRequiredModal
        isOpen={locationPermissionDenied}
        onRequestPermission={handleRequestLocation}
      />
    </div>
  );
}

export default App;
