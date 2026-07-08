import { useEffect, useState, useRef } from 'react';
import { supabase } from '../config/supabaseClient';
import { useSettings } from '../contexts/SettingsContext';
import { Geolocation } from '@capacitor/geolocation';

export function useGlobalPresence(user, pseudo, joinedSpaces, privateChannels) {
  const [globalOnlineUsers, setGlobalOnlineUsers] = useState([]);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const channelRef = useRef(null);
  const locationRef = useRef({ lat: null, lng: null });
  const { incognitoMode } = useSettings();

  const handleRequestLocation = async (e) => {
    const isManual = !!e; // if called from onClick, e is the event object
    try {
      const currentPermissions = await Geolocation.checkPermissions();
      let hasPermission = currentPermissions.location === 'granted';
      
      if (!hasPermission) {
        const newPermissions = await Geolocation.requestPermissions();
        hasPermission = newPermissions.location === 'granted';
      }

      if (hasPermission) {
        setLocationPermissionDenied(false);
        const position = await Geolocation.getCurrentPosition({ timeout: 10000 });
        locationRef.current = { lat: position.coords.latitude, lng: position.coords.longitude };
        
        // Update presence if channel is active
        if (channelRef.current && user && pseudo) {
          channelRef.current.track({
            user_id: user.id,
            pseudo: pseudo,
            online_at: new Date().toISOString(),
            lat: incognitoMode ? null : locationRef.current.lat,
            lng: incognitoMode ? null : locationRef.current.lng,
            spaces: joinedSpaces,
            pms: privateChannels
          }).catch(() => {});
        }
      } else {
        setLocationPermissionDenied(true);
        if (isManual) {
          window.alert("Izin lokasi telah diblokir secara permanen atau tidak didukung di perangkat/browser Anda (contoh: mode incognito). Mohon buka Pengaturan Perangkat Anda dan izinkan akses lokasi untuk Anora agar Anda dapat melanjutkan.");
        }
      }
    } catch (error) {
      console.log('Geolocation error or denied:', error);
      setLocationPermissionDenied(true);
      if (isManual) {
        window.alert("Izin lokasi telah diblokir secara permanen atau tidak didukung di perangkat/browser Anda (contoh: mode incognito). Mohon buka Pengaturan Perangkat Anda dan izinkan akses lokasi untuk Anora agar Anda dapat melanjutkan.");
      }
    }
  };

  useEffect(() => {
    if (!user || !pseudo) return;

    const presenceChannel = supabase.channel('presence:global');
    channelRef.current = presenceChannel;

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.values(state).flatMap(users => users);
        // Deduplicate by nickname (pseudo) to prevent duplicate names in the list
        const uniqueUsers = Array.from(new Map(users.map(u => [u.pseudo, u])).values());
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

          // Track presence immediately so user shows as online without waiting for geolocation prompt
          trackPresence();

          // Request location safely using Capacitor
          handleRequestLocation();
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

  return { globalOnlineUsers, locationPermissionDenied, handleRequestLocation };
}
