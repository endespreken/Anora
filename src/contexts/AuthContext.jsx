import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [pseudo, setPseudo] = useState('Anon' + Math.floor(Math.random() * 10000));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // Attempt to sign in anonymously
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Error signing in anonymously:", error);
          // If anonymous sign-in fails (e.g. not enabled in Supabase or placeholder used),
          // we fallback to a mock user so the UI can still be previewed.
          setUser({ id: 'mock-user-id-' + Math.random().toString(36).substr(2, 9) });
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

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const changePseudo = (newPseudo) => {
    setPseudo(newPseudo);
  };

  return (
    <AuthContext.Provider value={{ user, pseudo, changePseudo, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
