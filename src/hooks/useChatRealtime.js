import { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { fetchMessages } from '../services/dbServices';

export function useChatRealtime(channel, user, pseudo) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channel) return;

    let mounted = true;
    const loadMessages = async () => {
      setLoading(true);
      const data = await fetchMessages(channel);
      if (mounted) {
        setMessages(data);
        setLoading(false);
      }
    };

    loadMessages();

    // 1. Subscribe to new messages
    const messageChannel = supabase.channel(`public:messages:channel=${channel}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `channel_name=eq.${channel}`
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
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

    return () => {
      mounted = false;
      messageChannel.unsubscribe();
      presenceChannel.unsubscribe();
    };
  }, [channel, user, pseudo]);

  return { messages, onlineUsers, loading };
}
