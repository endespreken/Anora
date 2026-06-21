import { useAuth } from '../contexts/AuthContext';
import { sendMessage, addFriendWithPin } from '../services/dbServices';

export function useCommandParser(currentChannel, changeChannel, openPinModal) {
  const { user, pseudo, changePseudo } = useAuth();

  const parseCommand = async (text) => {
    const trimmed = text.trim();
    if (!trimmed.startsWith('/')) {
      // Normal message
      await sendMessage(currentChannel, pseudo, trimmed);
      return true;
    }

    const parts = trimmed.substring(1).split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    switch (command) {
      case 'join':
        if (args) {
          changeChannel(args);
          // Send local system message or global system message if desired
          await sendMessage(args, 'SYSTEM', `${pseudo} joined ${args}`, true);
        }
        return true;

      case 'nick':
        if (args) {
          const oldPseudo = pseudo;
          changePseudo(args);
          await sendMessage(currentChannel, 'SYSTEM', `${oldPseudo} is now known as ${args}`, true);
        }
        return true;

      case 'beacon':
        if (args) {
          // A special formatted message
          const beaconContent = `[BEACON SIGNAL]: ${args}`;
          await sendMessage(currentChannel, pseudo, beaconContent);
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
        alert(`Available Commands:
/join [channel] - Join a chat room
/nick [name] - Change your nickname
/beacon [message] - Send a beacon signal
/addfriend [PIN] - Add friend, or just /addfriend to generate PIN`);
        return true;

      default:
        alert(`Unknown command: /${command}. Type /help for available commands.`);
        return false;
    }
  };

  return { parseCommand };
}
