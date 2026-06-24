import { useEffect, useState, useRef } from 'react';
import { supabase } from '../config/supabaseClient';
import { useSettings } from '../contexts/SettingsContext';

export function useGlobalPresence(user, pseudo, joinedSpaces, privateChannels) {
  const [globalOnlineUsers, setGlobalOnlineUsers] = useState([]);
  const channelRef = useRef(null);
  const locationRef = useRef({ lat: null, lng: null });
  const { incognitoMode } = useSettings();

  useEffect(() => {
    if (!user || !pseudo) return;

    const presenceChannel = supabase.channel('presence:global');
    channelRef.current = presenceChannel;

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.values(state).flatMap(users => users);
        const uniqueUsers = Array.from(new Map(users.map(u => [u.user_id, u])).values());
        setGlobalOnlineUsers(uniqueUsers); 
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const trackPresence = async (lat = null, lng = null) => {
            locationRef.current = { lat, lng };
            await presenceChannel.track({
              user_id: user.id,
              pseudo: pseudo,
              online_at: new Date().toISOString(),
              lat: incognitoMode ? null : lat,
              lng: incognitoMode ? null : lng,
              spaces: joinedSpaces,
              pms: privateChannels
            });
          };

          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
              (position) => trackPresence(position.coords.latitude, position.coords.longitude),
              () => trackPresence()
            );
          } else {
             trackPresence();
          }
        }
      });

    return () => {
      presenceChannel.unsubscribe();
      channelRef.current = null;
    };
  }, [user, pseudo]); // only reconnect if user/pseudo changes

  // Update track data when joinedSpaces or privateChannels change without reconnecting
  useEffect(() => {
    if (channelRef.current && user && pseudo) {
      // Check if channel is joined
      // In supabase-js, you can call track() repeatedly
      channelRef.current.track({
        user_id: user.id,
        pseudo: pseudo,
        online_at: new Date().toISOString(),
        lat: incognitoMode ? null : locationRef.current.lat,
        lng: incognitoMode ? null : locationRef.current.lng,
        spaces: joinedSpaces,
        pms: privateChannels
      }).catch(err => console.log('Track update error ignored', err));
    }
  }, [joinedSpaces, privateChannels, user, pseudo, incognitoMode]);

  return { globalOnlineUsers };
}
