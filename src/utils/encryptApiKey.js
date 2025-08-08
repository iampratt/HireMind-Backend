const crypto = require('crypto');

// Use a secret key for encryption - in production, this should be in environment variables
const ENCRYPTION_KEY_STRING =
  process.env.ENCRYPTION_KEY || 'your-secret-encryption-key-32-chars-long';
const ALGORITHM = 'aes-256-cbc';

// Derive a proper 32-byte key from the string
const ENCRYPTION_KEY = crypto.scryptSync(ENCRYPTION_KEY_STRING, 'salt', 32);

/**
 * Encrypts a Gemini API key using AES-256-CBC
 * @param {string} apiKey - The API key to encrypt
 * @returns {string} - The encrypted API key (hex encoded)
 */
const encryptApiKey = (apiKey) => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Error encrypting API key:', error);
    throw new Error('Failed to encrypt API key');
  }
};

/**
 * Decrypts a Gemini API key using AES-256-CBC
 * @param {string} encryptedApiKey - The encrypted API key
 * @returns {string} - The decrypted API key
 */
const decryptApiKey = (encryptedApiKey) => {
  try {
    const parts = encryptedApiKey.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Error decrypting API key:', error);
    throw new Error('Failed to decrypt API key');
  }
};

module.exports = { encryptApiKey, decryptApiKey };
