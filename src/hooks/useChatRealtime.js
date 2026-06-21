import { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { fetchMessages } from '../services/dbServices';

export function useChatRealtime(channel, user, pseudo) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channel) return;

    let mounted = true;
    const loadMessages = async () => {
      setLoading(true);
      const data = await fetchMessages(channel);
      if (mounted) {
        const welcomeMsg = {
          id: `local-welcome-${Date.now()}`,
          channel_name: channel,
          user_pseudo: 'Anora 🤖',
          content: `Selamat datang di channel ${channel}! Ketik /help apabila membutuhkan bantuan.`,
          is_system_msg: false,
          created_at: new Date().toISOString()
        };
        setMessages([...data, welcomeMsg]);
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
        if (payload.eventType === 'INSERT') {
          setMessages((prev) => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setMessages((prev) => prev.map(m => m.id === payload.new.id ? payload.new : m));
        }
      })
      .subscribe();

    // 2. Subscribe to presence
    const presenceChannel = supabase.channel(`presence:${channel}`);
    
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.values(state).flatMap(users => users);
        // Deduplicate by user_id
        const uniqueUsers = Array.from(new Map(users.map(u => [u.user_id, u])).values());
        setOnlineUsers(uniqueUsers); 
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Optional: you can show a local system message that someone joined
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Optional: you can show a local system message that someone left
      })
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
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user) {
          const trackPresence = async (lat = null, lng = null) => {
            await presenceChannel.track({
              user_id: user.id,
              pseudo: pseudo,
              online_at: new Date().toISOString(),
              lat: lat,
              lng: lng,
            });
          };

          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                trackPresence(position.coords.latitude, position.coords.longitude);
              },
              (error) => {
                console.error("Geolocation error:", error);
                trackPresence();
              }
            );
          } else {
             trackPresence();
          }
        }
      });

    // Return functions to be bound to ref or passed directly, wait, better to return from hook

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

  return { messages, onlineUsers, typingUsers, loading, setMessages, broadcastTyping };
}
