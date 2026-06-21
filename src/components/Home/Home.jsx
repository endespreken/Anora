import React, { useState } from 'react';
import { verifyNickname } from '../../services/dbServices';
import { useAuth } from '../../contexts/AuthContext';

const Home = ({ onJoin }) => {
  const { changePseudo } = useAuth();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnonJoin = () => {
    onJoin();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!nickname || !password) {
      setError('Masukkan nickname dan password.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const isVerified = await verifyNickname(nickname, password);
      if (isVerified) {
        changePseudo(nickname, true);
        onJoin();
      } else {
        setError('Nickname atau password salah.');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden w-full">
      {/* Decorative Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-8 rounded-3xl flex flex-col gap-8 relative z-10 animate-fade-in shadow-2xl">
        
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mb-5 transform hover:scale-105 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text">Anora Chat</h1>
          <p className="text-text-muted mt-2 text-sm">Masuk dan mulai obrolan seru sekarang.</p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Primary Action: Anonymous */}
          <button 
            onClick={handleAnonJoin}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-lg shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform duration-300"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Masuk sebagai Anonim
          </button>

          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-border"></div>
            <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Atau Login</span>
            <div className="h-[1px] flex-1 bg-border"></div>
          </div>

          {/* Secondary Action: Login */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Nickname" 
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-muted/70 text-text"
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-text-muted/70 text-text"
              />
            </div>
            
            {error && <p className="text-red-500 text-sm text-center animate-fade-in">{error}</p>}
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-secondary hover:bg-border text-text font-medium transition-colors duration-200 disabled:opacity-50 flex justify-center items-center h-[48px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-text border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Login dengan Nickname'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;
