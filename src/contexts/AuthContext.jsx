import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [pseudo, setPseudo] = useState(() => {
    const saved = localStorage.getItem('anora_pseudo');
    const savedTime = localStorage.getItem('anora_pseudo_time');
    const now = Date.now();
    if (saved && savedTime && now - parseInt(savedTime) < 24 * 60 * 60 * 1000) {
      return saved;
    }
    const newPseudo = 'Anon' + Math.floor(Math.random() * 10000);
    localStorage.setItem('anora_pseudo', newPseudo);
    localStorage.setItem('anora_pseudo_time', now.toString());
    return newPseudo;
  });
  const [isRegistered, setIsRegistered] = useState(() => {
    return localStorage.getItem('anora_is_registered') === 'true';
  });
  const [loading, setLoading] = useState(true);
  const timerRef = React.useRef(null);

  const [allRegisteredNicks, setAllRegisteredNicks] = useState([]);
  const [registeredProfiles, setRegisteredProfiles] = useState({});
  const [permanentPin, setPermanentPin] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [trueUserId, setTrueUserId] = useState(null);

  useEffect(() => {
    if (isRegistered && pseudo) {
      import('../services/dbServices').then(({ fetchUserPin, fetchUserProfile }) => {
        fetchUserPin(pseudo).then(pin => {
          setPermanentPin(pin);
        });
        fetchUserProfile(pseudo).then(profile => {
          if (profile && profile.user_id) {
            setTrueUserId(profile.user_id);
          }
        });
      });
    } else {
      setPermanentPin(null);
      setPendingRequests([]);
      setTrueUserId(null);
    }
  }, [isRegistered, pseudo]);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Error signing in anonymously:", error);
          const fallbackId = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : '00000000-0000-0000-0000-000000000000';
          setUser({ id: fallbackId });
        } else {
          setUser(data.user);
        }
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      }
    });

    // Fetch registered nicknames for blue checkmarks and avatars
    const fetchNicks = async () => {
      const { data, error } = await supabase.from('registered_users').select('nickname, avatar_url');
      if (!error && data) {
        setAllRegisteredNicks(data.map(d => d.nickname));
        const profilesMap = {};
        data.forEach(d => {
          profilesMap[d.nickname.toLowerCase()] = { avatar_url: d.avatar_url };
        });
        setRegisteredProfiles(profilesMap);
      }
    };
    fetchNicks();

    const channel = supabase.channel('registered_users_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registered_users' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new && payload.new.nickname) {
          setAllRegisteredNicks(prev => {
            if (!prev.includes(payload.new.nickname)) return [...prev, payload.new.nickname];
            return prev;
          });
          setRegisteredProfiles(prev => ({
            ...prev,
            [payload.new.nickname.toLowerCase()]: { avatar_url: payload.new.avatar_url }
          }));
        } else if (payload.eventType === 'UPDATE' && payload.new && payload.new.nickname) {
          setRegisteredProfiles(prev => ({
            ...prev,
            [payload.new.nickname.toLowerCase()]: { avatar_url: payload.new.avatar_url }
          }));
        }
      })
      .subscribe();

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const activeUserId = trueUserId || user?.id;
    if (!isRegistered || !pseudo || !activeUserId) return;

    const fetchAndSyncRequests = () => {
      import('../services/dbServices').then(({ fetchPendingRequests }) => {
        fetchPendingRequests(activeUserId).then(reqs => {
          setPendingRequests(prev => {
            const isDifferent = reqs.length !== prev.length || !reqs.every((r, i) => prev[i] && r.id === prev[i].id);
            if (!isDifferent) return prev;

            if (reqs.length > prev.length) {
              import('../utils/SoundManager').then(({ soundManager }) => {
                soundManager.playReceivePM();
              });
            }
            return reqs;
          });
        });
      });
    };

    const friendLinksChannel = supabase.channel(`friend_links_${activeUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_links' }, fetchAndSyncRequests)
      .subscribe();

    window.addEventListener('new_friend_request', fetchAndSyncRequests);
    
    // Ultimate Fallback: Poll every 10 seconds
    const intervalId = setInterval(fetchAndSyncRequests, 10000);

    return () => {
      window.removeEventListener('new_friend_request', fetchAndSyncRequests);
      supabase.removeChannel(friendLinksChannel);
      clearInterval(intervalId);
    };
  }, [user?.id, trueUserId, isRegistered, pseudo]);

  const changePseudo = (newPseudo, registered = false) => {
    const oldPseudo = pseudo;
    if (oldPseudo && oldPseudo !== newPseudo) {
      const savedSpaces = localStorage.getItem(`anora_spaces_${oldPseudo}`);
      if (savedSpaces) localStorage.setItem(`anora_spaces_${newPseudo}`, savedSpaces);
      
      const savedPMs = localStorage.getItem(`anora_pm_${oldPseudo}`);
      if (savedPMs) localStorage.setItem(`anora_pm_${newPseudo}`, savedPMs);
      
      const savedPinned = localStorage.getItem(`anora_pinned_${oldPseudo}`);
      if (savedPinned) localStorage.setItem(`anora_pinned_${newPseudo}`, savedPinned);
    }

    setPseudo(newPseudo);
    setIsRegistered(registered);
    
    localStorage.setItem('anora_pseudo', newPseudo);
    localStorage.setItem('anora_pseudo_time', Date.now().toString());
    localStorage.setItem('anora_is_registered', registered.toString());
    
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const markAsRegistered = () => {
    setIsRegistered(true);
    localStorage.setItem('anora_is_registered', 'true');
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <AuthContext.Provider value={{ user, trueUserId, pseudo, changePseudo, isRegistered, markAsRegistered, loading, allRegisteredNicks, registeredProfiles, permanentPin, pendingRequests, setPendingRequests }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
