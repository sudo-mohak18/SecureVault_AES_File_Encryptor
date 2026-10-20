import test from 'node:test';
import assert from 'node:assert/strict';
import { detectFileCategory, generateHexPreview } from './fileType.ts';

test('detectFileCategory identifies images correctly', () => {
  const png = detectFileCategory('photo.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
  assert.equal(png.category, 'image');
  assert.equal(png.mimeType, 'image/png');

  const jpg = detectFileCategory('photo.jpg', new Uint8Array([0xff, 0xd8, 0xff]));
  assert.equal(jpg.category, 'image');
  assert.equal(jpg.mimeType, 'image/jpeg');
});

test('detectFileCategory identifies pdf, audio, and video', () => {
  const pdf = detectFileCategory('document.pdf', new Uint8Array([0x25, 0x50, 0x44, 0x46]));
  assert.equal(pdf.category, 'pdf');

  const audio = detectFileCategory('song.mp3', new Uint8Array([0x49, 0x44, 0x33]));
  assert.equal(audio.category, 'audio');

  const video = detectFileCategory('clip.mp4', new Uint8Array([0, 0, 0, 0x20]));
  assert.equal(video.category, 'video');
});

test('detectFileCategory identifies text and code files', () => {
  const text = detectFileCategory('script.py', new TextEncoder().encode('print("hello world")'));
  assert.equal(text.category, 'text');

  const json = detectFileCategory('data.json', new TextEncoder().encode('{"key": "value"}'));
  assert.equal(json.category, 'text');
});

test('generateHexPreview produces readable hex output', () => {
  const sample = new Uint8Array([0x41, 0x42, 0x43, 0x00, 0xff]);
  const hex = generateHexPreview(sample);
  assert.ok(hex.includes('41 42 43 00 ff'));
  assert.ok(hex.includes('|ABC..|'));
});
