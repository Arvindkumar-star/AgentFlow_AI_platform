const CryptoJS = require('crypto-js');
const env = require('../config/env');

const SECRET_KEY = env.CREDENTIAL_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

/**
 * Encrypt a string or JavaScript object using AES-256
 */
function encryptCredential(payload) {
  if (!payload) return null;
  const rawString = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
  return CryptoJS.AES.encrypt(rawString, SECRET_KEY).toString();
}

/**
 * Decrypt an AES-256 encrypted ciphertext into original string or object
 */
function decryptCredential(ciphertext) {
  if (!ciphertext) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) return null;

    try {
      return JSON.parse(decryptedText);
    } catch (_) {
      return decryptedText;
    }
  } catch (err) {
    console.error('Credential decryption error:', err.message);
    return null;
  }
}

/**
 * Mask a secret string for safe UI presentation (e.g. sk-proj...7x9Q or https://discord...abcd)
 */
function maskSecret(secret) {
  if (!secret) return '';
  const str = String(secret).trim();
  if (str.length <= 8) {
    return '••••••••';
  }
  if (str.startsWith('http://') || str.startsWith('https://')) {
    const urlParts = str.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    return `${urlParts.slice(0, 3).join('/')}/.../${lastPart.slice(-6)}`;
  }
  const prefix = str.slice(0, 4);
  const suffix = str.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

module.exports = {
  encryptCredential,
  decryptCredential,
  maskSecret,
};
