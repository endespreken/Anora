import { useAuth } from '../contexts/AuthContext';
import { sendMessage, addFriendWithPin, checkNicknameExists, checkEmailExists, registerNickname, verifyNickname, fetchUserRoles } from '../services/dbServices';

import { getRandomTrivia } from '../utils/trivia_id';
import { getRandomJoke } from '../utils/jokes_id';
import { generateTebakKata } from '../utils/tebak_kata_id';

export function useCommandParser(currentChannel, changeChannel, openPinModal, addLocalMessage, joinedSpaces = [], privateChannels = [], openFOPortal) {
  const { user, pseudo, changePseudo, isRegistered, markAsRegistered, permanentPin } = useAuth();

  const parseCommand = async (text, replyToId = null) => {
    const trimmed = text.trim();
    if (!trimmed.startsWith('/')) {
      // Normal message
      await sendMessage(currentChannel, pseudo, trimmed, false, replyToId, user.id);
      
      // Anora Bot Auto-Reply (Local Only)
      if (trimmed.toLowerCase().includes('anora')) {
        setTimeout(() => {
          addLocalMessage(`Halo ${pseudo}! Saya Anora, asisten bot di sini. Ada yang bisa saya bantu? Ketik /help untuk melihat perintah.`);
        }, 600);
      }
      return true;
    }

    const parts = trimmed.substring(1).split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    switch (command) {
      case 'fo':
        if (args.toLowerCase() === 'portal') {
          const { isGlobalFO, channelRoles } = await fetchUserRoles(pseudo);
          if (isGlobalFO || channelRoles.some(r => r.role === 'FO' || r.role === 'SOP')) {
            openFOPortal();
          } else {
            addLocalMessage("Akses ditolak: Anda tidak memiliki akses FO Portal.");
          }
        }
        return true;

      case 'join':
        if (args) {
          changeChannel(args);
          // The join message is now handled globally in App.jsx when a new space is joined
          // so we don't necessarily need to send it here, but if they join via command,
          // they will enter the channel and the useEffect will trigger it.
        }
        return true;

      case 'nick':
        if (args) {
          const nickArgs = args.split(' ');
          const newNick = nickArgs[0];
          const password = nickArgs[1] || '';

          if (newNick.length > 15) {
            addLocalMessage(`Nickname maksimal 15 karakter termasuk karakter khusus.`);
            return true;
          }

          const isTaken = await checkNicknameExists(newNick);
          
          if (isTaken) {
            if (!password) {
              addLocalMessage(`Nickname ${newNick} sudah terdaftar. Silakan verifikasi dengan: /nick ${newNick} [password]`);
              return true;
            }
            const isVerified = await verifyNickname(newNick, password, user.id);
            if (isVerified) {
              const oldPseudo = pseudo;
              changePseudo(newNick, true);
              markAsRegistered();
              
              const allChannels = [...new Set([...joinedSpaces, ...privateChannels])];
              for (const ch of allChannels) {
                await sendMessage(ch, 'SYSTEM', `${oldPseudo} sudah mengganti nickname menjadi ${newNick}`, true);
              }
              addLocalMessage(`Berhasil masuk sebagai ${newNick}.`);
            } else {
              addLocalMessage(`Password salah untuk nickname ${newNick}.`);
            }
          } else {
            const oldPseudo = pseudo;
            changePseudo(newNick, false);
            
            const allChannels = [...new Set([...joinedSpaces, ...privateChannels])];
            for (const ch of allChannels) {
              await sendMessage(ch, 'SYSTEM', `${oldPseudo} sudah mengganti nickname menjadi ${newNick}`, true);
            }
            addLocalMessage(`Nickname ${newNick} belum terdaftar. Kamu memiliki waktu 5 menit untuk mendaftar menggunakan /register ${newNick} [password] [email], atau namamu akan diacak kembali.`);
          }
        }
        return true;

      case 'register':
        if (args) {
          const regArgs = args.split(' ');
          if (regArgs.length < 3) {
            addLocalMessage('Format salah. Gunakan: /register [nickname] [password] [email]');
            return true;
          }
          const [regNick, regPass, regEmail] = regArgs;
          
          if (regNick.length > 15) {
            addLocalMessage(`Nickname maksimal 15 karakter termasuk karakter khusus.`);
            return true;
          }
          
          const nickExists = await checkNicknameExists(regNick);
          if (nickExists) {
            addLocalMessage(`Maaf, nickname ${regNick} sudah terdaftar. Silakan pilih nickname lain.`);
            return true;
          }
          
          const emailExists = await checkEmailExists(regEmail);
          if (emailExists) {
            addLocalMessage(`Maaf, email ${regEmail} sudah digunakan.`);
            return true;
          }
          
          const pinCode = await registerNickname(regNick, regPass, regEmail, user.id);
          if (pinCode) {
            changePseudo(regNick, true);
            markAsRegistered();
            addLocalMessage(`Selamat! Nickname ${regNick} berhasil didaftarkan dan kamu sudah diverifikasi. PIN Permanen kamu adalah: ${pinCode}. Kamu bisa melihatnya di menu pengaturan.`);
          } else {
            addLocalMessage('Terjadi kesalahan saat mendaftar. Silakan coba lagi nanti.');
          }
        } else {
          addLocalMessage('Format salah. Gunakan: /register [nickname] [password] [email]');
        }
        return true;

      case 'beacon':
        if (args) {
          // A special formatted message
          const beaconContent = `[BEACON SIGNAL]: ${args}`;
          await sendMessage(currentChannel, pseudo, beaconContent, false, null, user.id);
        }
        return true;

      case 'addfriend':
        if (!isRegistered) {
          addLocalMessage("Kamu harus registrasi akun terlebih dahulu untuk menambah teman. Gunakan: /register [nickname] [password] [email]");
          return true;
        }
        if (args) {
          // If a pin is provided
          const result = await addFriendWithPin(permanentPin, args);
          alert(result.message); // In a real app, use a toast notification
        } else {
          // Open PIN generator modal
          openPinModal();
        }
        return true;
        
      case 'help':
        await sendMessage(currentChannel, pseudo, "/help", false, null, user.id); // Menampilkan command yang diketik user
        setTimeout(() => {
          const helpText = `Hai! Saya Anora 🤖. Berikut perintah yang bisa kamu gunakan:

1. /join [channel] - Pindah/masuk ke chat room
2. /nick [name] [pass] - Ganti nickname
3. /register [nick] [pass] [email] - Daftar nick
4. /addfriend [PIN] - Tambah teman
5. /wiki [keyword] - Cari dari Wikipedia
6. /kripto [koin] - Cek harga Live kripto
7. /kurs [kode] - Cek kurs fiat (contoh /kurs usd)
8. /cuaca [kota] - Cek info prakiraan cuaca
9. /meme - Tampilkan meme random dari Reddit
10. /translate [teks] - Terjemahkan ke B. Indonesia
11. /jokes - Anora akan kasih tebak-tebakan lucu
12. /quiz - Mainkan kuis trivia interaktif
13. /tebak - Mainkan mini-game tebak kata`;
          
          addLocalMessage(helpText);
        }, 500);
        return true;

      case 'wiki':
        if (args) {
          try {
            const res = await fetch(`https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(args)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.type === 'standard') {
                const wikiData = {
                  title: data.title,
                  extract: data.extract,
                  thumbnail: data.thumbnail?.source || null,
                  url: data.content_urls?.desktop?.page || `https://id.wikipedia.org/wiki/${encodeURIComponent(args)}`
                };
                await sendMessage(currentChannel, pseudo, `[WIKI]:${JSON.stringify(wikiData)}`, false, null, user.id);
                return true;
              }
            }
            addLocalMessage(`Artikel Wikipedia untuk "${args}" tidak ditemukan.`);
          } catch (err) {
            addLocalMessage("Gagal mengambil data dari Wikipedia.");
          }
        } else {
          addLocalMessage("Format salah. Gunakan: /wiki [kata kunci]");
        }
        return true;

      case 'kripto':
      case 'crypto':
        if (args) {
          try {
            const coinId = args.toLowerCase().replace(' ', '-');
            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,idr`);
            if (res.ok) {
              const data = await res.json();
              if (data[coinId]) {
                const cryptoData = {
                  coin: coinId.toUpperCase(),
                  usd: data[coinId].usd,
                  idr: data[coinId].idr
                };
                await sendMessage(currentChannel, pseudo, `[CRYPTO]:${JSON.stringify(cryptoData)}`, false, null, user.id);
                return true;
              }
            }
            addLocalMessage(`Koin kripto "${args}" tidak ditemukan.`);
          } catch (err) {
            addLocalMessage("Gagal mengambil data dari CoinGecko.");
          }
        } else {
          addLocalMessage("Format salah. Gunakan: /kripto [nama koin] (contoh: /kripto bitcoin)");
        }
        return true;

      case 'kurs':
        if (args) {
          try {
            const baseCurrency = args.toUpperCase().trim();
            const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
            if (res.ok) {
              const data = await res.json();
              if (data.rates && data.rates.IDR) {
                const kursData = {
                  base: baseCurrency,
                  idr: data.rates.IDR
                };
                await sendMessage(currentChannel, pseudo, `[KURS]:${JSON.stringify(kursData)}`, false, null, user.id);
                return true;
              }
            }
            addLocalMessage(`Mata uang "${baseCurrency}" tidak ditemukan atau tidak didukung.`);
          } catch (err) {
            addLocalMessage("Gagal mengambil data dari server kurs mata uang.");
          }
        } else {
          addLocalMessage("Format salah. Gunakan: /kurs [kode mata uang] (contoh: /kurs usd)");
        }
        return true;

      case 'quiz':
        try {
          const q = getRandomTrivia();
          const quizData = {
            question: q.question,
            correct: q.correct,
            incorrect: q.incorrect,
            category: q.category,
            difficulty: q.difficulty
          };
          await sendMessage(currentChannel, 'System', `[QUIZ]:${JSON.stringify(quizData)}`, true, null, null);
        } catch (err) {
          addLocalMessage("Gagal memuat kuis.");
        }
        return true;

      case 'tebak':
      case 'tebakkata':
        try {
          const t = generateTebakKata();
          await sendMessage(currentChannel, 'System', `[TEBAKKATA]:${JSON.stringify(t)}`, true, null, null);
        } catch (err) {
          addLocalMessage("Gagal memuat tebak kata.");
        }
        return true;

      case 'jokes':
        const joke = getRandomJoke();
        await sendMessage(currentChannel, 'Anora', `😂 ${joke}`, false, null, user.id);
        return true;

      case 'cuaca':
        if (args) {
          try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(args)}&count=1&language=id&format=json`);
            const geoData = await geoRes.json();
            
            if (geoData.results && geoData.results.length > 0) {
              const location = geoData.results[0];
              const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`);
              const weatherData = await weatherRes.json();
              
              const wmoCodes = {
                0: "Cerah ☀️", 1: "Sebagian Berawan 🌤️", 2: "Berawan ⛅", 3: "Mendung ☁️",
                45: "Berkabut 🌫️", 48: "Kabut Tebal 🌫️",
                51: "Gerimis Ringan 🌦️", 53: "Gerimis Sedang 🌦️", 55: "Gerimis Lebat 🌧️",
                61: "Hujan Ringan 🌧️", 63: "Hujan Sedang 🌧️", 65: "Hujan Lebat 🌧️",
                71: "Salju Ringan 🌨️", 73: "Salju Sedang 🌨️", 75: "Salju Lebat 🌨️",
                95: "Badai Petir ⛈️", 96: "Badai Petir & Hujan Es ⛈️", 99: "Badai Petir Hebat ⛈️"
              };
              
              const weatherPayload = {
                city: location.name,
                temperature: weatherData.current.temperature_2m,
                windspeed: weatherData.current.wind_speed_10m,
                description: wmoCodes[weatherData.current.weather_code] || "Tidak Diketahui"
              };
              
              await sendMessage(currentChannel, pseudo, `[WEATHER]:${JSON.stringify(weatherPayload)}`, false, null, user.id);
            } else {
              addLocalMessage(`Kota "${args}" tidak ditemukan.`);
            }
          } catch (err) {
            addLocalMessage("Gagal mengambil data cuaca.");
          }
        } else {
          addLocalMessage("Format salah. Gunakan: /cuaca [nama kota]");
        }
        return true;

      case 'meme':
        try {
          const res = await fetch('https://meme-api.com/gimme');
          if (res.ok) {
            const data = await res.json();
            const memePayload = {
              title: data.title,
              url: data.url,
              subreddit: data.subreddit
            };
            await sendMessage(currentChannel, pseudo, `[MEME]:${JSON.stringify(memePayload)}`, false, null, user.id);
          } else {
            addLocalMessage("Gagal mengambil meme.");
          }
        } catch (err) {
          addLocalMessage("Koneksi gagal ke server meme.");
        }
        return true;

      case 'translate':
        if (args) {
          try {
            // Menggunakan Endpoint Publik Google Translate (Gratis, Akurat, Auto-Detect Bahasa Asal)
            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(args)}`);
            if (res.ok) {
              const data = await res.json();
              if (data && data[0]) {
                // Google memecah kalimat panjang menjadi array, kita gabungkan kembali
                const translatedText = data[0].map(item => item[0]).join('');
                const sourceLang = data[2] ? data[2].toUpperCase() : 'AUTO';
                
                const translatePayload = {
                  original: args,
                  translated: translatedText,
                  sourceLang: sourceLang
                };
                await sendMessage(currentChannel, pseudo, `[TRANSLATE]:${JSON.stringify(translatePayload)}`, false, null, user.id);
                return true;
              }
            }
            addLocalMessage("Gagal menerjemahkan teks dari Google Translate.");
          } catch (err) {
            addLocalMessage("Koneksi gagal ke server terjemahan.");
          }
        } else {
          addLocalMessage("Format salah. Gunakan: /translate [teks]");
        }
        return true;

      default:
        alert(`Unknown command: /${command}. Type /help for available commands.`);
        return false;
    }
  };

  return { parseCommand };
}
