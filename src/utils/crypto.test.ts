import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptBuffer,
  decryptBuffer,
  evaluatePasswordStrength,
  generatePassword,
  formatBytes,
} from './crypto.ts';

test('Password strength calculation behaves predictably', () => {
  const empty = evaluatePasswordStrength('');
  assert.equal(empty.score, 0);

  const weak = evaluatePasswordStrength('12345');
  assert.equal(weak.label, 'Weak');

  const strong = evaluatePasswordStrength('CorrectHorseBatteryStaple123!');
  assert.match(strong.label, /(Strong|Very Strong)/);
});

test('Password generator generates correct length and diverse characters', () => {
  const pwd = generatePassword(24, true);
  assert.equal(pwd.length, 24);
  assert.match(pwd, /[a-z]/);
  assert.match(pwd, /[A-Z]/);
  assert.match(pwd, /[0-9]/);
  assert.match(pwd, /[!@#$%^&*()-_=+[\]{}|;:,.<>?]/);
});

test('formatBytes displays human readable sizes', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1024 * 1024 * 5), '5 MB');
});

test('AES-256-GCM encryption and decryption round-trip succeeds with correct password', async () => {
  const text = 'SecureVault Secret Data 2026! Top Secret Payload.';
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const originalBytes = encoder.encode(text);
  const password = 'SuperSecretVaultMasterKey#99!';

  const encrypted = await encryptBuffer(originalBytes.buffer as ArrayBuffer, password);
  assert.ok(encrypted.byteLength > originalBytes.byteLength + 28); // 16 salt + 12 nonce + 16 tag

  const decrypted = await decryptBuffer(encrypted.buffer as ArrayBuffer, password);
  const decryptedText = decoder.decode(decrypted);

  assert.equal(decryptedText, text);
});

test('AES-256-GCM decryption fails with incorrect password (authentication tag mismatch)', async () => {
  const text = 'Confidential documents';
  const encoder = new TextEncoder();
  const originalBytes = encoder.encode(text);
  const password = 'OriginalPassword123!';
  const wrongPassword = 'WrongPassword456!';

  const encrypted = await encryptBuffer(originalBytes.buffer as ArrayBuffer, password);

  await assert.rejects(
    async () => {
      await decryptBuffer(encrypted.buffer as ArrayBuffer, wrongPassword);
    },
    {
      name: 'Error',
      message: /Decryption failed: Incorrect password or corrupted\/tampered file/,
    }
  );
});

test('AES-256-GCM decryption fails if ciphertext is tampered with', async () => {
  const text = 'Unalterable bank records';
  const encoder = new TextEncoder();
  const originalBytes = encoder.encode(text);
  const password = 'BankSecurityPassword!';

  const encrypted = await encryptBuffer(originalBytes.buffer as ArrayBuffer, password);
  const tampered = new Uint8Array(encrypted);
  // Flip a bit in the ciphertext / tag region
  tampered[tampered.length - 5] ^= 0xff;

  await assert.rejects(
    async () => {
      await decryptBuffer(tampered.buffer as ArrayBuffer, password);
    },
    {
      name: 'Error',
      message: /Decryption failed: Incorrect password or corrupted\/tampered file/,
    }
  );
});
