import { useAuth } from '../contexts/AuthContext';
import { sendMessage, addFriendWithPin, checkNicknameExists, checkEmailExists, registerNickname, verifyNickname } from '../services/dbServices';

export function useCommandParser(currentChannel, changeChannel, openPinModal, addLocalMessage, joinedSpaces = [], privateChannels = []) {
  const { user, pseudo, changePseudo, isRegistered, markAsRegistered } = useAuth();

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
            const isVerified = await verifyNickname(newNick, password);
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
          
          const success = await registerNickname(regNick, regPass, regEmail);
          if (success) {
            changePseudo(regNick, true);
            markAsRegistered();
            addLocalMessage(`Selamat! Nickname ${regNick} berhasil didaftarkan dan kamu sudah diverifikasi.`);
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
        if (args) {
          // If a pin is provided
          const result = await addFriendWithPin(user.id, args);
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
2. /nick [name] [password] - Ganti nickname kamu (sertakan password jika terdaftar)
3. /register [nick] [pass] [email] - Daftarkan nickname kamu
4. /beacon [message] - Kirim sinyal beacon
5. /addfriend [PIN] - Tambah teman dengan PIN (kosongkan untuk buat PIN)`;
          
          addLocalMessage(helpText);
        }, 500);
        return true;

      default:
        alert(`Unknown command: /${command}. Type /help for available commands.`);
        return false;
    }
  };

  return { parseCommand };
}
