import React, { useState, useMemo } from 'react';
import { supabase } from '../../config/supabaseClient';
import { ExternalLink, HelpCircle, TrendingUp, BookOpen, Check, X, Banknote, CloudRain, Image as ImageIcon, Languages, Type } from 'lucide-react';

export const QuizCard = ({ data, currentChannel, pseudo }) => {
  const [answered, setAnswered] = useState(false);
  
  // Sort options alphabetically to keep them stable
  const options = useMemo(() => {
    return [data.correct, ...data.incorrect].sort();
  }, [data]);

  const handleAnswer = async (opt) => {
    if (answered) return;
    setAnswered(true);
    
    if (opt === data.correct) {
      try {
        await supabase.from('messages').insert([{
          channel_name: currentChannel,
          user_pseudo: 'Anora',
          content: `🎉 Wah hebat! **${pseudo}** berhasil menjawab kuis dengan benar: **${data.correct}**!`,
          is_system_msg: false,
          created_at: new Date().toISOString()
        }]);
      } catch(err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="bg-surface border border-primary/30 p-3.5 rounded-xl w-full max-w-sm mt-1 shadow-lg shadow-primary/5">
      <div className="flex items-center space-x-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
        <HelpCircle size={14} />
        <span>Trivia Quiz ({data.difficulty})</span>
      </div>
      <p className="text-text mb-3 text-sm font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: data.question }}></p>
      <div className="flex flex-col space-y-1.5">
        {options.map((opt, i) => (
          <button 
            key={i}
            onClick={() => handleAnswer(opt)}
            disabled={answered}
            className={`px-3 py-2 bg-secondary/60 hover:bg-primary/20 text-text rounded-lg text-sm transition-colors text-left relative overflow-hidden group ${answered ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <span dangerouslySetInnerHTML={{ __html: opt }} className="relative z-10"></span>
            {answered && opt === data.correct && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                <Check size={16} />
              </span>
            )}
            {answered && opt !== data.correct && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 opacity-50">
                <X size={16} />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export const WikiCard = ({ data }) => {
  return (
    <div className="bg-surface border border-border p-3.5 rounded-xl w-full max-w-sm mt-1 hover:border-primary/50 transition-colors shadow-lg">
      <div className="flex items-center space-x-2 text-textMuted text-xs font-semibold uppercase tracking-wider mb-2">
        <BookOpen size={14} />
        <span>Wikipedia</span>
      </div>
      <div className="flex space-x-3">
        {data.thumbnail && (
          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-secondary">
            <img src={data.thumbnail} alt={data.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1">
          <h4 className="font-bold text-text text-sm mb-1">{data.title}</h4>
          <p className="text-xs text-textMuted line-clamp-3 mb-2">{data.extract}</p>
        </div>
      </div>
      <a 
        href={data.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center space-x-1 text-xs text-primary hover:text-primaryHover font-medium w-max"
      >
        <span>Baca selengkapnya</span>
        <ExternalLink size={12} />
      </a>
    </div>
  );
};

export const CryptoCard = ({ data }) => {
  return (
    <div className="bg-surface border border-border p-3.5 rounded-xl w-max min-w-[200px] mt-1 shadow-lg bg-gradient-to-br from-surface to-secondary/30">
      <div className="flex items-center space-x-2 text-textMuted text-xs font-semibold uppercase tracking-wider mb-3">
        <TrendingUp size={14} className="text-green-500" />
        <span>Live Crypto Price</span>
      </div>
      <div className="mb-1">
        <span className="text-2xl font-bold text-text">{data.coin}</span>
      </div>
      <div className="flex flex-col space-y-0.5">
        <span className="text-lg font-medium text-green-400">
          ${data.usd?.toLocaleString()}
        </span>
        <span className="text-xs text-textMuted font-medium">
          Rp {data.idr?.toLocaleString('id-ID')}
        </span>
      </div>
    </div>
  );
};

export const KursCard = ({ data }) => {
  return (
    <div className="bg-surface border border-border p-3.5 rounded-xl w-max min-w-[200px] mt-1 shadow-lg bg-gradient-to-br from-surface to-secondary/30">
      <div className="flex items-center space-x-2 text-textMuted text-xs font-semibold uppercase tracking-wider mb-3">
        <Banknote size={14} className="text-blue-500" />
        <span>Live Exchange Rate</span>
      </div>
      <div className="mb-1">
        <span className="text-2xl font-bold text-text">1 {data.base}</span>
      </div>
      <div className="flex flex-col space-y-0.5">
        <span className="text-lg font-medium text-blue-400">
          = Rp {data.idr?.toLocaleString('id-ID')}
        </span>
      </div>
    </div>
  );
};

export const WeatherCard = ({ data }) => {
  return (
    <div className="bg-surface border border-border p-3.5 rounded-xl w-full max-w-sm mt-1 shadow-lg bg-gradient-to-br from-surface to-secondary/30">
      <div className="flex items-center space-x-2 text-textMuted text-xs font-semibold uppercase tracking-wider mb-3">
        <CloudRain size={14} className="text-blue-400" />
        <span>Live Weather Tracking</span>
      </div>
      <div className="mb-2">
        <span className="text-xl font-bold text-text capitalize">{data.city}</span>
      </div>
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-3xl font-bold text-text">{data.temperature}°C</span>
          <span className="text-sm text-textMuted font-medium mt-1">{data.description}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-textMuted">Wind</span>
          <span className="text-sm font-medium text-text">{data.windspeed} km/h</span>
        </div>
      </div>
    </div>
  );
};

export const MemeCard = ({ data }) => {
  return (
    <div className="bg-surface border border-border p-2 rounded-xl w-full max-w-sm mt-1 shadow-lg">
      <div className="flex items-center space-x-2 text-textMuted text-xs font-semibold uppercase tracking-wider mb-2 px-1.5 pt-1">
        <ImageIcon size={14} className="text-purple-500" />
        <span>Random Meme</span>
      </div>
      <div className="rounded-lg overflow-hidden bg-black/5 flex justify-center">
        <img src={data.url} alt={data.title} className="max-w-full h-auto object-contain max-h-[300px]" loading="lazy" />
      </div>
      <div className="px-1.5 pt-2 pb-1">
        <p className="text-sm font-medium text-text">{data.title}</p>
        <p className="text-xs text-textMuted mt-0.5">r/{data.subreddit}</p>
      </div>
    </div>
  );
};

export const TranslateCard = ({ data }) => {
  return (
    <div className="bg-surface border border-border p-3.5 rounded-xl w-full max-w-sm mt-1 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
        <Languages size={48} />
      </div>
      <div className="flex items-center space-x-2 text-textMuted text-xs font-semibold uppercase tracking-wider mb-3 relative z-10">
        <Languages size={14} className="text-green-500" />
        <span>Translator (To ID)</span>
      </div>
      <div className="flex flex-col space-y-3 relative z-10">
        <div className="bg-secondary/40 p-2.5 rounded-lg border border-border/50">
          <span className="text-[10px] text-textMuted uppercase font-bold tracking-wider mb-1 block">
            Original {data.sourceLang ? `(${data.sourceLang})` : ''}
          </span>
          <p className="text-sm text-textMuted italic">{data.original}</p>
        </div>
        <div className="bg-primary/10 p-2.5 rounded-lg border border-primary/20">
          <span className="text-[10px] text-primary uppercase font-bold tracking-wider mb-1 block">Indonesian</span>
          <p className="text-sm font-medium text-text leading-relaxed">{data.translated}</p>
        </div>
      </div>
    </div>
  );
};

export const TebakKataCard = ({ data, currentChannel, pseudo }) => {
  const [answered, setAnswered] = useState(false);
  const [answerInput, setAnswerInput] = useState('');

  const handleGuess = async () => {
    if (answered || !answerInput.trim()) return;
    
    if (answerInput.trim().toUpperCase() === data.answer.toUpperCase()) {
      setAnswered(true);
      try {
        await supabase.from('messages').insert([{
          channel_name: currentChannel,
          user_pseudo: 'Anora',
          content: `🎉 Hebat! **${pseudo}** berhasil menebak kata: **${data.answer}**!`,
          is_system_msg: false,
          created_at: new Date().toISOString()
        }]);
      } catch(err) {
        console.error(err);
      }
    } else {
      // Salah tebak, kosongkan input atau beri feedback visual
      setAnswerInput('');
    }
  };

  return (
    <div className="bg-surface border border-border p-4 rounded-xl w-full max-w-sm mt-1 shadow-lg relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 text-primary/5 rotate-12 pointer-events-none">
        <Type size={100} />
      </div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center space-x-2 text-primary font-semibold text-xs tracking-wider uppercase">
          <Type size={14} />
          <span>Tebak Kata</span>
        </div>
      </div>
      
      <div className="space-y-4 relative z-10">
        <div className="bg-secondary/30 p-3 rounded-lg border border-border/50 text-center">
          <p className="text-xs text-textMuted uppercase tracking-wider mb-2 font-semibold">Petunjuk</p>
          <p className="text-sm text-text font-medium">{data.clue}</p>
        </div>
        
        <div className="flex justify-center items-center py-2">
          <p className="text-2xl font-mono font-bold tracking-[0.3em] text-accent">
            {data.censored}
          </p>
        </div>
        
        <div className="flex space-x-2 mt-4">
          <input 
            type="text" 
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleGuess();
              }
            }}
            placeholder="Ketik jawabanmu..."
            disabled={answered}
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-textMuted focus:outline-none focus:border-primary disabled:opacity-50"
          />
          <button 
            onClick={handleGuess}
            disabled={answered || !answerInput.trim()}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tebak!
          </button>
        </div>
      </div>
    </div>
  );
};

export const VibeReplyCard = ({ data, isOwn }) => {
  const isImage = (data.bg_color || '').startsWith('img:');
  const bgUrl = isImage ? data.bg_color.substring(4).replace('pub-f591f14e39f84bdc80676d77036d98b2.r2.dev', 'media.anorachat.com') : '';
  
  return (
    <div className={`relative rounded-xl overflow-hidden mb-1 border ${isOwn ? 'border-white/20' : 'border-border'} shadow-sm w-48 h-28 flex flex-col justify-end group select-none`}>
      <div 
        className={`absolute inset-0 ${!isImage ? data.bg_color || 'bg-black' : 'bg-black'}`}
        style={isImage ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {isImage && <div className="absolute inset-0 bg-black/20"></div>}
      </div>
      
      {data.content && (
        <div className="relative z-10 w-full p-2 h-full flex items-center justify-center text-center">
          <p className={`text-white font-bold px-1 ${data.content.length > 20 ? 'text-[10px]' : 'text-xs'} break-words whitespace-pre-wrap max-h-full overflow-hidden line-clamp-3 drop-shadow-md`}>
            {data.content}
          </p>
        </div>
      )}
      
      {data.caption && (
        <div className="relative z-10 w-full bg-black/50 backdrop-blur-sm p-1.5 px-2">
          <p className="text-white/90 text-[10px] font-medium truncate">
            {data.caption}
          </p>
        </div>
      )}
      
      <div className="absolute top-1.5 left-1.5 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[9px] text-white/90 uppercase tracking-wider font-bold">
        Vibe
      </div>
    </div>
  );
};
