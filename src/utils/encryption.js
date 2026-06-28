import CryptoJS from 'crypto-js';

const GLOBAL_SALT = 'anora_secure_e2ee_2026_xYz987';

/**
 * Encrypts a message before sending it to the database.
 * @param {string} text - The original message text.
 * @param {string} channelName - The channel or PM name to derive the key.
 * @returns {string} - The encrypted base64 string.
 */
export const encryptMessage = (text, channelName) => {
  if (!text) return text;
  try {
    const key = `${channelName}_${GLOBAL_SALT}`;
    return CryptoJS.AES.encrypt(text, key).toString();
  } catch (error) {
    console.error("Encryption error:", error);
    return text; // Fallback to plain if something goes horribly wrong
  }
};

/**
 * Decrypts a message received from the database.
 * @param {string} cipherText - The encrypted base64 string.
 * @param {string} channelName - The channel or PM name to derive the key.
 * @returns {string} - The decrypted original message.
 */
export const decryptMessage = (cipherText, channelName) => {
  if (!cipherText) return cipherText;
  
  // Quick check to see if it looks like a CryptoJS string (starts with U2FsdGVkX1)
  // If it's not encrypted (e.g. old messages), we just return it as is.
  if (!cipherText.startsWith('U2FsdGVkX1')) {
    return cipherText;
  }

  try {
    const key = `${channelName}_${GLOBAL_SALT}`;
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    
    // If decryption fails (e.g. wrong key, tampered data), originalText will be empty
    if (!originalText) return "🔒 [Pesan tidak dapat didekripsi]";
    
    return originalText;
  } catch (error) {
    console.error("Decryption error:", error);
    return "🔒 [Pesan tidak dapat didekripsi]";
  }
};
