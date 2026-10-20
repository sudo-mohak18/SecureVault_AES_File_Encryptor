/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FileCategory = 'image' | 'text' | 'pdf' | 'audio' | 'video' | 'binary';

export interface DecryptedViewableFile {
  id: string;
  filename: string;
  size: number;
  blob: Blob;
  category: FileCategory;
  mimeType: string;
  previewUrl?: string;
  textContent?: string;
  lineCount?: number;
  hexPreview?: string;
}

export function detectFileCategory(
  filename: string,
  bytes: Uint8Array
): { category: FileCategory; mimeType: string } {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  // 1. Image extensions
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico', 'avif'].includes(ext)) {
    const mimeMap: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      ico: 'image/x-icon',
      avif: 'image/avif',
    };
    return { category: 'image', mimeType: mimeMap[ext] || 'image/png' };
  }

  // 2. PDF
  if (ext === 'pdf') {
    return { category: 'pdf', mimeType: 'application/pdf' };
  }

  // 3. Audio
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) {
    const mimeMap: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      m4a: 'audio/mp4',
      flac: 'audio/flac',
      aac: 'audio/aac',
    };
    return { category: 'audio', mimeType: mimeMap[ext] || 'audio/mpeg' };
  }

  // 4. Video
  if (['mp4', 'webm', 'ogv', 'mov'].includes(ext)) {
    const mimeMap: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      ogv: 'video/ogg',
      mov: 'video/quicktime',
    };
    return { category: 'video', mimeType: mimeMap[ext] || 'video/mp4' };
  }

  // 5. Text & Code extensions
  const textExts = [
    'txt', 'md', 'markdown', 'json', 'csv', 'xml', 'html', 'htm', 'css',
    'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp',
    'cs', 'rs', 'go', 'php', 'rb', 'sh', 'bash', 'zsh', 'bat', 'ps1',
    'yaml', 'yml', 'toml', 'ini', 'env', 'log', 'sql', 'dockerfile',
    'conf', 'config', 'vue', 'svelte'
  ];

  if (textExts.includes(ext)) {
    const mimeMap: Record<string, string> = {
      json: 'application/json',
      html: 'text/html',
      htm: 'text/html',
      css: 'text/css',
      xml: 'application/xml',
      csv: 'text/csv',
      js: 'text/javascript',
      ts: 'text/typescript',
      md: 'text/markdown',
    };
    return { category: 'text', mimeType: mimeMap[ext] || 'text/plain;charset=utf-8' };
  }

  // Magic byte checks if extension was stripped or generic
  if (bytes.length >= 4) {
    // PNG magic bytes: 0x89 0x50 0x4E 0x47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return { category: 'image', mimeType: 'image/png' };
    }
    // JPEG magic: 0xFF 0xD8 0xFF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { category: 'image', mimeType: 'image/jpeg' };
    }
    // GIF magic: GIF8
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      return { category: 'image', mimeType: 'image/gif' };
    }
    // PDF magic: %PDF
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return { category: 'pdf', mimeType: 'application/pdf' };
    }
  }

  // Check if bytes are valid UTF-8 text (first 10KB)
  try {
    const sample = bytes.slice(0, Math.min(bytes.length, 8192));
    const decoder = new TextDecoder('utf-8', { fatal: true });
    decoder.decode(sample);
    return { category: 'text', mimeType: 'text/plain;charset=utf-8' };
  } catch {
    return { category: 'binary', mimeType: 'application/octet-stream' };
  }
}

export function generateHexPreview(bytes: Uint8Array, maxBytes: number = 128): string {
  const slice = bytes.slice(0, Math.min(bytes.length, maxBytes));
  const lines: string[] = [];
  for (let i = 0; i < slice.length; i += 16) {
    const chunk = slice.slice(i, i + 16);
    const hex = Array.from(chunk)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    const ascii = Array.from(chunk)
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
      .join('');
    const offset = i.toString(16).padStart(4, '0');
    lines.push(`${offset}:  ${hex.padEnd(48, ' ')}  |${ascii}|`);
  }
  return lines.join('\n');
}

export function processDecryptedFile(
  id: string,
  filename: string,
  decryptedBytes: Uint8Array
): DecryptedViewableFile {
  const { category, mimeType } = detectFileCategory(filename, decryptedBytes);
  const blob = new Blob([decryptedBytes.buffer as ArrayBuffer], { type: mimeType });

  let previewUrl: string | undefined;
  let textContent: string | undefined;
  let lineCount: number | undefined;
  let hexPreview: string | undefined;

  if (category === 'image' || category === 'pdf' || category === 'audio' || category === 'video') {
    previewUrl = URL.createObjectURL(blob);
  } else if (category === 'text') {
    try {
      const decoder = new TextDecoder('utf-8');
      textContent = decoder.decode(decryptedBytes);
      lineCount = textContent.split('\n').length;
    } catch {
      textContent = 'Unable to decode text stream as UTF-8.';
    }
  } else {
    hexPreview = generateHexPreview(decryptedBytes);
  }

  return {
    id,
    filename,
    size: decryptedBytes.byteLength,
    blob,
    category,
    mimeType,
    previewUrl,
    textContent,
    lineCount,
    hexPreview,
  };
}
