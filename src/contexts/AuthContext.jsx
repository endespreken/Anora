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

    // Fetch registered nicknames for blue checkmarks
    const fetchNicks = async () => {
      const { data, error } = await supabase.from('registered_users').select('nickname');
      if (!error && data) {
        setAllRegisteredNicks(data.map(d => d.nickname));
      }
    };
    fetchNicks();

    const channel = supabase.channel('registered_users_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'registered_users' }, (payload) => {
        if (payload.new && payload.new.nickname) {
          setAllRegisteredNicks(prev => [...prev, payload.new.nickname]);
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
    <AuthContext.Provider value={{ user, pseudo, changePseudo, isRegistered, markAsRegistered, loading, allRegisteredNicks }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
