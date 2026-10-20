/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  KeyRound,
  Eye,
  EyeOff,
  Trash2,
  FileCheck,
  AlertCircle,
  Download,
  FolderPlus,
  FilePlus,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Music,
  Video,
  File as FileIcon,
  ExternalLink,
} from 'lucide-react';
import { decryptBuffer, encryptBuffer, formatBytes } from '../utils/crypto';
import { DecryptedViewableFile, processDecryptedFile } from '../utils/fileType';
import { FileViewerModal } from './FileViewerModal';

interface SelectedEncryptedFile {
  id: string;
  name: string;
  size: number;
  file: File;
}

interface DecryptViewProps {
  queuedFiles?: File[];
  onClearQueuedFiles?: () => void;
}

export const DecryptView: React.FC<DecryptViewProps> = ({
  queuedFiles = [],
  onClearQueuedFiles,
}) => {
  const [files, setFiles] = useState<SelectedEncryptedFile[]>([]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to decrypt.');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  // Results & In-Browser Viewer
  const [results, setResults] = useState<DecryptedViewableFile[]>([]);
  const [activeViewerFile, setActiveViewerFile] = useState<DecryptedViewableFile | null>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Handle incoming queued files from Encrypt tab
  React.useEffect(() => {
    if (queuedFiles.length > 0) {
      addFiles(queuedFiles);
      onClearQueuedFiles?.();
    }
  }, [queuedFiles]);

  const addFiles = (newFiles: File[]) => {
    const items: SelectedEncryptedFile[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: file.size,
      file,
    }));

    setFiles((prev) => [...prev, ...items]);
    setStatusType('info');
    setStatusMessage(`Staged ${items.length} encrypted file(s). Enter password to decrypt.`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearFiles = () => {
    setFiles([]);
    setStatusType('info');
    setStatusMessage('Cleared encrypted file list.');
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Create demo encrypted secret document
  const createDemoEncryptedDoc = async () => {
    try {
      const demoText = `TOP SECRET FINANCIAL REPORT 2026
-----------------------------------
Executive Summary:
- Vault Authorization: Master Admin
- Decryption Authentication: Verified with AES-256-GCM
- Key Stretching: 600,000 PBKDF2 rounds with SHA-256
- Status: Secure & Authenticated

Congratulations! Your SecureVault AES-256-GCM decryptor successfully authenticated and unlocked this confidential document without errors.`;
      const demoPassword = 'TestVaultPassword123!';
      setPassword(demoPassword);
      setPasswordError(false);

      const enc = new TextEncoder();
      const bytes = enc.encode(demoText);
      const encryptedBytes = await encryptBuffer(bytes.buffer as ArrayBuffer, demoPassword);

      const blob = new Blob([encryptedBytes.buffer as ArrayBuffer], {
        type: 'application/octet-stream',
      });
      const file = new File([blob], 'demo-financial-audit.docx.enc', {
        type: 'application/octet-stream',
      });

      addFiles([file]);
      setStatusType('info');
      setStatusMessage('Loaded demo encrypted file. Password pre-filled with "TestVaultPassword123!"');
    } catch (err: unknown) {
      setStatusType('error');
      setStatusMessage(err instanceof Error ? err.message : 'Failed to create demo file.');
    }
  };

  // Create demo encrypted IMAGE (SVG Badge converted to image)
  const createDemoEncryptedImage = async () => {
    try {
      const svgImage = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#082f49" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="shield" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
  </defs>
  <rect width="600" height="400" rx="24" fill="url(#bg)" />
  <circle cx="300" cy="170" r="90" fill="#0369a1" opacity="0.3" />
  <path d="M300 100 L370 140 L370 210 Q370 270 300 300 Q230 270 230 210 L230 140 Z" fill="url(#shield)" stroke="#e0f2fe" stroke-width="4" />
  <circle cx="300" cy="190" r="22" fill="#0f172a" />
  <rect x="294" y="190" width="12" height="30" rx="4" fill="#0f172a" />
  <text x="300" y="340" font-family="system-ui, sans-serif" font-size="24" font-weight="bold" fill="#f8fafc" text-anchor="middle">
    SECUREVAULT • TOP SECRET IMAGE
  </text>
  <text x="300" y="370" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">
    AES-256-GCM Authenticated • Restored in Browser
  </text>
</svg>`;

      const demoPassword = 'ImageVaultPassword2026!';
      setPassword(demoPassword);
      setPasswordError(false);

      const enc = new TextEncoder();
      const bytes = enc.encode(svgImage);
      const encryptedBytes = await encryptBuffer(bytes.buffer as ArrayBuffer, demoPassword);

      const blob = new Blob([encryptedBytes.buffer as ArrayBuffer], {
        type: 'application/octet-stream',
      });
      const file = new File([blob], 'confidential-badge.svg.enc', {
        type: 'application/octet-stream',
      });

      addFiles([file]);
      setStatusType('info');
      setStatusMessage('Loaded demo encrypted IMAGE. Password pre-filled with "ImageVaultPassword2026!"');
    } catch (err: unknown) {
      setStatusType('error');
      setStatusMessage(err instanceof Error ? err.message : 'Failed to create demo image.');
    }
  };

  // Helper to trigger direct browser download
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Decryption Execution
  const handleDecrypt = async () => {
    if (files.length === 0) {
      setStatusType('warning');
      setStatusMessage('Please select or drop at least one encrypted (.enc) file.');
      fileInputRef.current?.click();
      return;
    }

    if (!password || password.trim() === '') {
      setPasswordError(true);
      passwordInputRef.current?.focus();
      setStatusType('error');
      setStatusMessage('Please enter the password to unlock this vault.');
      return;
    }

    setPasswordError(false);
    setIsProcessing(true);
    setProgress(0);
    setStatusType('info');
    setStatusMessage('Authenticating GCM tag and deriving keys (600,000 iterations)...');

    const newResults: DecryptedViewableFile[] = [];
    const errors: string[] = [];
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const item = files[i];
      const stepProgress = (fraction: number, desc: string) => {
        const overall = (i + fraction) / total;
        setProgress(overall);
        setStatusMessage(`[${i + 1}/${total}] ${item.name}: ${desc}`);
      };

      try {
        const buffer = await item.file.arrayBuffer();
        const decryptedBytes = await decryptBuffer(buffer, password, stepProgress);

        let outName = item.name;
        if (outName.endsWith('.enc')) {
          outName = outName.slice(0, -4);
        } else {
          outName = `decrypted_${outName}`;
        }

        const viewable = processDecryptedFile(item.id, outName, decryptedBytes);
        newResults.push(viewable);
      } catch (err: unknown) {
        errors.push(`${item.name}: ${err instanceof Error ? err.message : 'Decryption failed'}`);
      }
    }

    setIsProcessing(false);

    if (newResults.length > 0) {
      setResults((prev) => [...newResults, ...prev]);

      if (errors.length === 0) {
        setProgress(1.0);
        setStatusType('success');

        // Automatically open the in-browser viewer for single decrypted file!
        if (newResults.length === 1) {
          const first = newResults[0];
          triggerDownload(first.blob, first.filename);

          // If the file is viewable in browser (image, text, pdf, audio, video)
          if (first.category !== 'binary') {
            setActiveViewerFile(first);
            setStatusMessage(
              `Success! "${first.filename}" was decrypted and is now shown in the browser viewer below.`
            );
          } else {
            setStatusMessage(
              `Success! "${first.filename}" was authenticated, decrypted, and downloaded.`
            );
          }
        } else {
          // Multiple files
          newResults.forEach((r, idx) => {
            setTimeout(() => triggerDownload(r.blob, r.filename), idx * 250);
          });
          // Show the first viewable file in browser
          const firstViewable = newResults.find((r) => r.category !== 'binary');
          if (firstViewable) {
            setActiveViewerFile(firstViewable);
          }
          setStatusMessage(
            `Successfully decrypted ${newResults.length} file(s) and opened in browser viewer!`
          );
        }
      } else {
        setStatusType('warning');
        setStatusMessage(
          `Decrypted ${newResults.length} file(s), but ${errors.length} failed (GCM authentication failed).`
        );
      }
    } else {
      setProgress(0);
      setStatusType('error');
      setStatusMessage(
        errors[0] ||
          'Decryption failed: Incorrect password or corrupted/tampered file (GCM authentication tag mismatch).'
      );
    }
  };

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner and Drag Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Drop & Selection Area (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />
            <input
              type="file"
              ref={folderInputRef}
              onChange={handleFileSelect}
              // @ts-expect-error directory attribute
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
            />

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20 shadow-inner">
              <KeyRound className="h-7 w-7" />
            </div>

            <h3 className="text-base font-semibold text-white mb-1">
              Drag & Drop encrypted files (.enc) here
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
              SecureVault verifies the 16-byte GCM tag. Decrypted files (images, text, documents, audio) open directly in the browser!
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <FilePlus className="h-4 w-4" />
                <span>+ Select Encrypted Files</span>
              </button>

              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              >
                <FolderPlus className="h-4 w-4 text-emerald-400" />
                <span>+ Select Folder</span>
              </button>

              <button
                type="button"
                onClick={createDemoEncryptedImage}
                title="Test decrypting and viewing an encrypted image in browser"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-all cursor-pointer"
              >
                <ImageIcon className="h-4 w-4" />
                <span>+ Sample Encrypted Image</span>
              </button>

              <button
                type="button"
                onClick={createDemoEncryptedDoc}
                title="Test decrypting and viewing a secret document in browser"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>+ Sample Secret Doc</span>
              </button>
            </div>
          </div>

          {/* Staged File List */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Encrypted Files Staged ({files.length} items • {formatBytes(totalBytes)})
                </h4>
              </div>
              {files.length > 0 && (
                <button
                  type="button"
                  onClick={clearFiles}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {files.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="py-8 text-center text-xs text-slate-500 cursor-pointer hover:text-slate-400"
              >
                No encrypted files selected yet. Drag & drop .enc files above, or click "+ Sample Encrypted Image" to test.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {files.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                        ENC
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500">{formatBytes(item.size)}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Password & Decrypt Configuration (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Vault Authentication
                </h4>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                AES-GCM Auth
              </span>
            </div>

            {/* Password input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Vault Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleDecrypt();
                  }}
                  placeholder="Enter the password used to encrypt"
                  className={`w-full rounded-xl bg-slate-950/70 border px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors pr-10 ${
                    passwordError
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                      : 'border-slate-700/80 focus:border-emerald-500'
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                AES-256-GCM authenticated tags verify mathematical integrity. An incorrect password cannot result in garbled text—it safely aborts with an authentication failure.
              </p>
            </div>

            {/* Security Architecture Box */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>In-Browser Live Viewer Enabled</span>
              </div>
              <p>
                Decrypted images, PDFs, code, audio, and documents render directly on this platform without relying on third-party software.
              </p>
            </div>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Authenticating & decrypting...</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-200"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Status Message */}
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                statusType === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : statusType === 'error'
                  ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  : statusType === 'warning'
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400'
              }`}
            >
              {statusType === 'error' && <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />}
              {statusType === 'warning' && (
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
              )}
              {statusType === 'success' && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              )}
              {statusType === 'info' && <KeyRound className="h-4 w-4 shrink-0 text-emerald-400" />}
              <span className="truncate">{statusMessage}</span>
            </div>

            {/* Main CTA */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleDecrypt}
              className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                isProcessing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25 hover:shadow-emerald-500/40'
              }`}
            >
              <KeyRound className="h-4 w-4" />
              <span>{isProcessing ? 'Decrypting Vault...' : 'Unlock Vault & View File in Browser'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Embedded In-Browser Active File Viewer */}
      {activeViewerFile && (
        <div className="rounded-2xl border-2 border-emerald-500/60 bg-slate-900/90 shadow-2xl p-5 space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {activeViewerFile.category === 'image' && <ImageIcon className="h-5 w-5" />}
                {activeViewerFile.category === 'text' && <FileText className="h-5 w-5" />}
                {activeViewerFile.category === 'pdf' && <FileText className="h-5 w-5 text-rose-400" />}
                {activeViewerFile.category === 'audio' && <Music className="h-5 w-5 text-purple-400" />}
                {activeViewerFile.category === 'video' && <Video className="h-5 w-5 text-amber-400" />}
                {activeViewerFile.category === 'binary' && <FileIcon className="h-5 w-5 text-slate-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">
                    Decrypted File (In-Browser View): {activeViewerFile.filename}
                  </h4>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {activeViewerFile.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {formatBytes(activeViewerFile.size)} • {activeViewerFile.mimeType}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => triggerDownload(activeViewerFile.blob, activeViewerFile.filename)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download File</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveViewerFile(null)}
                className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                Hide Viewer
              </button>
            </div>
          </div>

          {/* Viewer Surface */}
          <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/80 flex items-center justify-center overflow-auto min-h-[250px] max-h-[600px]">
            {/* Image Rendering */}
            {activeViewerFile.category === 'image' && activeViewerFile.previewUrl && (
              <div className="flex flex-col items-center justify-center gap-2 p-2 w-full">
                <img
                  src={activeViewerFile.previewUrl}
                  alt={activeViewerFile.filename}
                  className="max-h-[500px] max-w-full rounded-xl object-contain shadow-2xl border border-slate-800"
                />
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeViewerFile.filename} • Rendered directly in browser
                </span>
              </div>
            )}

            {/* PDF Rendering */}
            {activeViewerFile.category === 'pdf' && activeViewerFile.previewUrl && (
              <iframe
                src={activeViewerFile.previewUrl}
                title={activeViewerFile.filename}
                className="w-full h-[500px] rounded-xl border border-slate-800 bg-white"
              />
            )}

            {/* Text & Code Rendering */}
            {activeViewerFile.category === 'text' && (
              <div className="w-full">
                <pre className="w-full overflow-auto max-h-[480px] font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed custom-scrollbar selection:bg-emerald-500/30">
                  {activeViewerFile.textContent}
                </pre>
              </div>
            )}

            {/* Audio Rendering */}
            {activeViewerFile.category === 'audio' && activeViewerFile.previewUrl && (
              <div className="w-full max-w-md p-6 text-center space-y-3">
                <div className="h-14 w-14 mx-auto rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Music className="h-7 w-7" />
                </div>
                <h5 className="text-sm font-semibold text-white">{activeViewerFile.filename}</h5>
                <audio controls src={activeViewerFile.previewUrl} className="w-full mt-2" />
              </div>
            )}

            {/* Video Rendering */}
            {activeViewerFile.category === 'video' && activeViewerFile.previewUrl && (
              <video
                controls
                src={activeViewerFile.previewUrl}
                className="max-h-[450px] max-w-full rounded-xl shadow-xl border border-slate-800 bg-black"
              />
            )}

            {/* Binary Info */}
            {activeViewerFile.category === 'binary' && (
              <div className="w-full max-w-lg p-4 space-y-3">
                <p className="text-xs text-slate-300">
                  Binary format ({activeViewerFile.mimeType}). File successfully authenticated and decrypted.
                </p>
                {activeViewerFile.hexPreview && (
                  <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-400 overflow-x-auto">
                    {activeViewerFile.hexPreview}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Decrypted & Authenticated Files ({results.length})
                </h4>
                <p className="text-xs text-slate-400">
                  GCM authentication tag verified. Click "View in Browser" to inspect any file.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 flex flex-col justify-between gap-3 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                      {r.category === 'image' && <ImageIcon className="h-4 w-4" />}
                      {r.category === 'text' && <FileText className="h-4 w-4" />}
                      {r.category === 'pdf' && <FileText className="h-4 w-4 text-rose-400" />}
                      {r.category === 'audio' && <Music className="h-4 w-4 text-purple-400" />}
                      {r.category === 'video' && <Video className="h-4 w-4 text-amber-400" />}
                      {r.category === 'binary' && <FileIcon className="h-4 w-4 text-slate-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        {r.filename}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Restored: {formatBytes(r.size)} • Type: {r.category.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => triggerDownload(r.blob, r.filename)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 cursor-pointer transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveViewerFile(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-700/60 cursor-pointer transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View in Browser</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Modal Viewer (if triggered from external action) */}
      <FileViewerModal
        file={null}
        onClose={() => {}}
        onDownload={(f) => triggerDownload(f.blob, f.filename)}
      />
    </div>
  );
};
