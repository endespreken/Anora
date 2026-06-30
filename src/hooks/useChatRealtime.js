import { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { fetchMessages } from '../services/dbServices';
import { decryptMessage } from '../utils/encryption';

export function useChatRealtime(channel, user, pseudo) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channel) return;

    let mounted = true;
    const loadMessages = async () => {
      setLoading(true);
      const data = await fetchMessages(channel);
      if (mounted) {
        const hasSeenWelcome = sessionStorage.getItem(`welcome_${channel}`);
        const isPrivateChannel = channel.startsWith('@');
        
        if (!hasSeenWelcome) {
          const newMessages = [];
          
          const encryptMsg = {
            id: `local-encrypt-${Date.now()}`,
            channel_name: channel,
            user_pseudo: 'System 🔒',
            content: `Percakapan di dalam ${isPrivateChannel ? 'Private Message' : 'Room'} ini dilindungi oleh Enkripsi End-to-End (E2EE). Tidak ada seorang pun di luar obrolan ini yang dapat membaca pesan Anda.`,
            is_system_msg: true,
            created_at: new Date(Date.now() - 1000).toISOString()
          };
          newMessages.push(encryptMsg);

          if (!isPrivateChannel) {
            const welcomeMsg = {
              id: `local-welcome-${Date.now()}`,
              channel_name: channel,
              user_pseudo: 'Anora 🤖',
              content: `Selamat datang di channel ${channel}! Ketik /help apabila membutuhkan bantuan.`,
              is_system_msg: false,
              created_at: new Date().toISOString()
            };
            newMessages.push(welcomeMsg);
          }
          
          setMessages([...data, ...newMessages]);
          sessionStorage.setItem(`welcome_${channel}`, 'true');
        } else {
          setMessages([...data]);
        }
        
        setLoading(false);
      }
    };

    loadMessages();

    // 1. Subscribe to new messages & updates (read receipts)
    const messageChannel = supabase.channel(`public:messages:channel=${channel}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages',
        filter: `channel_name=eq.${channel}`
      }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const decryptedNew = {
            ...payload.new,
            content: decryptMessage(payload.new.content, channel)
          };
          
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [...prev, decryptedNew]);
          } else {
            setMessages((prev) => prev.map(m => m.id === decryptedNew.id ? decryptedNew : m));
          }
        }
      })
      .subscribe();

    // 2. Subscribe to typing broadcasts using a dedicated channel or presence
    // We can just use a channel without tracking presence
    const presenceChannel = supabase.channel(`presence:${channel}`);
    
    presenceChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const typingUser = payload.payload.user;
        if (typingUser !== pseudo) {
          setTypingUsers(prev => {
            if (!prev.includes(typingUser)) return [...prev, typingUser];
            return prev;
          });
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u !== typingUser));
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      messageChannel.unsubscribe();
      presenceChannel.unsubscribe();
    };
  }, [channel, user, pseudo]);

  const broadcastTyping = () => {
    supabase.channel(`presence:${channel}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user: pseudo }
    });
  };

  return { messages, typingUsers, loading, setMessages, broadcastTyping };
}
