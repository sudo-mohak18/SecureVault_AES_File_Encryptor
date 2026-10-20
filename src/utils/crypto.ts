/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SecureVault Web Crypto Engine
 * Interoperable with Python's cryptography AES-256-GCM.
 *
 * Binary Format:
 * [16 bytes salt] + [12 bytes nonce] + [ciphertext + 16 bytes tag]
 */

export const SALT_SIZE = 16;
export const NONCE_SIZE = 12;
export const TAG_SIZE = 16;
export const PBKDF2_ITERATIONS = 600000;
export const KEY_LENGTH_BITS = 256;

export interface EncryptedPayload {
  filename: string;
  blob: Blob;
  size: number;
}

export interface DecryptedPayload {
  filename: string;
  blob: Blob;
  size: number;
}

export interface CryptoProgressCallback {
  (progress: number, message: string): void;
}

/**
 * Derives a 256-bit AES-GCM CryptoKey using PBKDF2-HMAC-SHA-256 with 600,000 iterations.
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array,
  cryptoObj: Crypto = crypto
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await cryptoObj.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: KEY_LENGTH_BITS },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts an ArrayBuffer of file data using AES-256-GCM.
 */
export async function encryptBuffer(
  data: ArrayBuffer,
  password: string,
  onProgress?: CryptoProgressCallback,
  cryptoObj: Crypto = crypto
): Promise<Uint8Array> {
  onProgress?.(0.1, 'Generating 16-byte salt and 12-byte nonce...');
  const salt = new Uint8Array(SALT_SIZE);
  const nonce = new Uint8Array(NONCE_SIZE);
  cryptoObj.getRandomValues(salt);
  cryptoObj.getRandomValues(nonce);

  onProgress?.(0.25, 'Deriving AES-256 key (600,000 PBKDF2 rounds)...');
  const key = await deriveKey(password, salt, cryptoObj);

  onProgress?.(0.65, 'Encrypting data payload with AES-256-GCM...');
  const ciphertextBuffer = await cryptoObj.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
      tagLength: 128,
    },
    key,
    data
  );

  onProgress?.(0.9, 'Packaging binary header [salt + nonce + ciphertext + tag]...');
  const ciphertext = new Uint8Array(ciphertextBuffer);
  const totalLength = SALT_SIZE + NONCE_SIZE + ciphertext.byteLength;
  const result = new Uint8Array(totalLength);

  result.set(salt, 0);
  result.set(nonce, SALT_SIZE);
  result.set(ciphertext, SALT_SIZE + NONCE_SIZE);

  onProgress?.(1.0, 'Encryption complete.');
  return result;
}

/**
 * Decrypts a SecureVault encrypted ArrayBuffer.
 */
export async function decryptBuffer(
  encryptedData: ArrayBuffer,
  password: string,
  onProgress?: CryptoProgressCallback,
  cryptoObj: Crypto = crypto
): Promise<Uint8Array> {
  const minLength = SALT_SIZE + NONCE_SIZE + TAG_SIZE;
  if (encryptedData.byteLength < minLength) {
    throw new Error(
      `File is too small (${encryptedData.byteLength} bytes) to be a valid SecureVault file. Minimum is ${minLength} bytes.`
    );
  }

  onProgress?.(0.1, 'Extracting cryptographic header (salt & nonce)...');
  const fullArray = new Uint8Array(encryptedData);
  const salt = fullArray.slice(0, SALT_SIZE);
  const nonce = fullArray.slice(SALT_SIZE, SALT_SIZE + NONCE_SIZE);
  const ciphertextWithTag = fullArray.slice(SALT_SIZE + NONCE_SIZE);

  onProgress?.(0.3, 'Deriving AES-256 key (600,000 PBKDF2 rounds)...');
  const key = await deriveKey(password, salt, cryptoObj);

  onProgress?.(0.7, 'Verifying authentication tag and decrypting...');
  try {
    const decryptedBuffer = await cryptoObj.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
        tagLength: 128,
      },
      key,
      ciphertextWithTag
    );

    onProgress?.(1.0, 'Decryption verified and complete.');
    return new Uint8Array(decryptedBuffer);
  } catch {
    throw new Error(
      'Decryption failed: Incorrect password or corrupted/tampered file (GCM authentication tag mismatch).'
    );
  }
}

/**
 * Password strength evaluation
 */
export interface PasswordStrength {
  score: number;
  label: 'Weak' | 'Moderate' | 'Strong' | 'Very Strong';
  color: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: 'Weak', color: '#64748b' };
  }

  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 20;
  if (password.length >= 16) score += 10;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const diversity = Number(hasLower) + Number(hasUpper) + Number(hasDigit) + Number(hasSpecial);
  score += diversity * 12.5;

  score = Math.min(Math.round(score), 100);

  if (score < 35) {
    return { score, label: 'Weak', color: '#ef4444' };
  }
  if (score < 70) {
    return { score, label: 'Moderate', color: '#f59e0b' };
  }
  if (score < 90) {
    return { score, label: 'Strong', color: '#10b981' };
  }
  return { score, label: 'Very Strong', color: '#06b6d4' };
}

/**
 * Cryptographically secure random password generator
 */
export function generatePassword(length: number = 18, useSymbols: boolean = true): string {
  const lowers = 'abcdefghijklmnopqrstuvwxyz';
  const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';

  const alphabet = lowers + uppers + digits + (useSymbols ? symbols : '');
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  const chars: string[] = [
    lowers[array[0] % lowers.length],
    uppers[array[1] % uppers.length],
    digits[array[2] % digits.length],
  ];

  if (useSymbols) {
    chars.push(symbols[array[3] % symbols.length]);
  }

  for (let i = chars.length; i < length; i++) {
    chars.push(alphabet[array[i] % alphabet.length]);
  }

  // Fisher-Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = array[i] % (i + 1);
    const temp = chars[i];
    chars[i] = chars[j];
    chars[j] = temp;
  }

  return chars.join('');
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
