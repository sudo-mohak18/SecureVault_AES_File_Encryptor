/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
  FileCheck,
  AlertCircle,
  Download,
  FolderPlus,
  FilePlus,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import {
  encryptBuffer,
  evaluatePasswordStrength,
  generatePassword,
  formatBytes,
} from '../utils/crypto';
import JSZip from 'jszip';

interface SelectedFile {
  id: string;
  name: string;
  size: number;
  file: File;
}

interface EncryptedResult {
  id: string;
  originalName: string;
  encryptedName: string;
  originalSize: number;
  encryptedSize: number;
  blob: Blob;
  saltHex?: string;
  nonceHex?: string;
}

interface EncryptViewProps {
  onTransferToDecrypt?: (file: File) => void;
}

export const EncryptView: React.FC<EncryptViewProps> = ({ onTransferToDecrypt }) => {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requireConfirmation, setRequireConfirmation] = useState(false);
  const [deleteOriginal, setDeleteOriginal] = useState(false);
  const [bundleAsZip, setBundleAsZip] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Password Generator state
  const [showGenSettings, setShowGenSettings] = useState(false);
  const [genLength, setGenLength] = useState(20);
  const [genSymbols, setGenSymbols] = useState(true);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Ready. Add files, enter your password, and click Lock Vault.'
  );
  const [statusType, setStatusType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  // Completed results
  const [results, setResults] = useState<EncryptedResult[]>([]);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const strength = evaluatePasswordStrength(password);
  const hasConfirmText = confirmPassword.trim().length > 0;
  const passwordsMatch = !hasConfirmText || password === confirmPassword;

  // File Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter((f) => !f.name.endsWith('.enc'));
    if (valid.length < newFiles.length) {
      setStatusType('warning');
      setStatusMessage('Skipped files that already have .enc extension.');
    }

    const items: SelectedFile[] = valid.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: file.size,
      file,
    }));

    setFiles((prev) => [...prev, ...items]);
    setStatusType('info');
    setStatusMessage(`Staged ${items.length} file(s). Enter password and click Lock Vault.`);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearFiles = () => {
    setFiles([]);
    setStatusType('info');
    setStatusMessage('Cleared all selected files.');
  };

  const createSampleFile = () => {
    const content = `CONFIDENTIAL DOCUMENT - TOP SECRET
Created on: ${new Date().toISOString()}
Classification: Highly Sensitive
Cipher Protocol: AES-256-GCM / PBKDF2 (600,000 iterations)

This is a demonstration secret file generated in SecureVault.
It contains proprietary data that will be fully encrypted with authenticated tags.
Tampering with any single byte will invalidate decryption!`;
    const blob = new Blob([content], { type: 'text/plain' });
    const file = new File([blob], `confidential-records-${Date.now().toString().slice(-4)}.txt`, {
      type: 'text/plain',
    });
    addFiles([file]);
  };

  const createSampleImage = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#064e3b" />
    </linearGradient>
  </defs>
  <rect width="600" height="400" rx="20" fill="url(#g1)" />
  <circle cx="300" cy="180" r="80" fill="#38bdf8" opacity="0.25" />
  <polygon points="300,110 360,150 360,220 300,260 240,220 240,150" fill="#38bdf8" stroke="#ffffff" stroke-width="3" />
  <text x="300" y="320" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">
    CONFIDENTIAL PHOTO ASSET
  </text>
  <text x="300" y="350" font-family="system-ui, sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">
    Encrypted with AES-256-GCM • Restorable In Browser
  </text>
</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const file = new File([blob], `classified-blueprint-${Date.now().toString().slice(-4)}.svg`, {
      type: 'image/svg+xml',
    });
    addFiles([file]);
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

  // Password Generator
  const handleGeneratePassword = () => {
    const newPwd = generatePassword(genLength, genSymbols);
    setPassword(newPwd);
    setConfirmPassword(newPwd);
    setPasswordError(false);
    setStatusType('success');
    setStatusMessage(`Generated secure ${genLength}-character password.`);
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

  // Main Encryption Execution
  const handleEncrypt = async () => {
    // Check if files are attached
    if (files.length === 0) {
      setStatusType('warning');
      setStatusMessage('Please select or drop at least one file first.');
      fileInputRef.current?.click();
      return;
    }

    // Check password
    if (!password || password.trim() === '') {
      setPasswordError(true);
      passwordInputRef.current?.focus();
      setStatusType('error');
      setStatusMessage('Please enter a password to encrypt and lock your vault.');
      return;
    }

    setPasswordError(false);

    // If confirmation is enabled or user entered a confirm password, ensure it matches
    if (requireConfirmation || hasConfirmText) {
      if (password !== confirmPassword) {
        setStatusType('error');
        setStatusMessage('Passwords do not match. Please verify your password confirmation.');
        return;
      }
    }

    setIsProcessing(true);
    setProgress(0);
    setStatusType('info');
    setStatusMessage('Initiating AES-256-GCM encryption with 600,000 PBKDF2 rounds...');

    const newResults: EncryptedResult[] = [];
    const total = files.length;

    try {
      for (let i = 0; i < total; i++) {
        const item = files[i];
        const stepProgress = (fraction: number, desc: string) => {
          const overall = (i + fraction) / total;
          setProgress(overall);
          setStatusMessage(`[${i + 1}/${total}] ${item.name}: ${desc}`);
        };

        const buffer = await item.file.arrayBuffer();
        const encryptedBytes = await encryptBuffer(buffer, password, stepProgress);

        const salt = encryptedBytes.slice(0, 16);
        const nonce = encryptedBytes.slice(16, 28);
        const saltHex = Array.from(salt)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        const nonceHex = Array.from(nonce)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        const blob = new Blob([encryptedBytes.buffer as ArrayBuffer], {
          type: 'application/octet-stream',
        });
        const encryptedName = `${item.name}.enc`;

        newResults.push({
          id: item.id,
          originalName: item.name,
          encryptedName,
          originalSize: item.size,
          encryptedSize: encryptedBytes.byteLength,
          blob,
          saltHex,
          nonceHex,
        });
      }

      setResults((prev) => [...newResults, ...prev]);
      setProgress(1.0);
      setStatusType('success');

      // AUTOMATIC DOWNLOAD: Immediately download the encrypted file!
      if (newResults.length === 1) {
        triggerDownload(newResults[0].blob, newResults[0].encryptedName);
        setStatusMessage(
          `Success! "${newResults[0].encryptedName}" was encrypted and automatically downloaded.`
        );
      } else if (newResults.length > 1) {
        if (bundleAsZip) {
          const zip = new JSZip();
          newResults.forEach((r) => zip.file(r.encryptedName, r.blob));
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          triggerDownload(
            zipBlob,
            `SecureVault-Encrypted-${new Date().toISOString().slice(0, 10)}.zip`
          );
          setStatusMessage(
            `Success! Encrypted ${newResults.length} files and downloaded ZIP archive.`
          );
        } else {
          // Download each file
          newResults.forEach((r, idx) => {
            setTimeout(() => triggerDownload(r.blob, r.encryptedName), idx * 250);
          });
          setStatusMessage(
            `Success! Encrypted ${newResults.length} files and started downloads.`
          );
        }
      }

      if (deleteOriginal) {
        setFiles([]);
      }
    } catch (err: unknown) {
      setStatusType('error');
      setStatusMessage(err instanceof Error ? err.message : 'Encryption failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadAllAsZip = async () => {
    if (results.length === 0) return;
    setStatusType('info');
    setStatusMessage('Packaging encrypted files into a single ZIP archive...');

    const zip = new JSZip();
    results.forEach((r) => {
      zip.file(r.encryptedName, r.blob);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    triggerDownload(content, `SecureVault-Encrypted-${new Date().toISOString().slice(0, 10)}.zip`);

    setStatusType('success');
    setStatusMessage('ZIP package downloaded successfully.');
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
                ? 'border-sky-500 bg-sky-500/10 scale-[1.01]'
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

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 mb-4 border border-sky-500/20 shadow-inner">
              <Upload className="h-7 w-7" />
            </div>

            <h3 className="text-base font-semibold text-white mb-1">
              Drag & Drop files or folders here
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
              Supports any file format: documents, images, code, archives, databases, and multi-gigabyte files.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
              >
                <FilePlus className="h-4 w-4" />
                <span>+ Select Files</span>
              </button>

              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              >
                <FolderPlus className="h-4 w-4 text-sky-400" />
                <span>+ Select Folder</span>
              </button>

              <button
                type="button"
                onClick={createSampleImage}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-all cursor-pointer"
              >
                <ImageIcon className="h-4 w-4" />
                <span>+ Sample Image</span>
              </button>

              <button
                type="button"
                onClick={createSampleFile}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>+ Sample Doc</span>
              </button>
            </div>
          </div>

          {/* Staged File List */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-sky-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Staged Files ({files.length} {files.length === 1 ? 'item' : 'items'} •{' '}
                  {formatBytes(totalBytes)})
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
                No files selected yet. Click here to choose a file, or use "+ Sample Secret File".
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {files.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                        {item.name.split('.').pop()?.toUpperCase() || 'FILE'}
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

        {/* Password & Security Configuration (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-sky-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Vault Password Setup
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowGenSettings(!showGenSettings)}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generator</span>
              </button>
            </div>

            {/* Generator Panel */}
            {showGenSettings && (
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-sky-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">
                    Length: {genLength} chars
                  </span>
                  <input
                    type="range"
                    min="12"
                    max="32"
                    value={genLength}
                    onChange={(e) => setGenLength(Number(e.target.value))}
                    className="w-28 accent-sky-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-400 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={genSymbols}
                      onChange={(e) => setGenSymbols(e.target.checked)}
                      className="rounded border-slate-700 text-sky-600 focus:ring-0"
                    />
                    Include symbols (!@#$)
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                  >
                    Generate & Apply
                  </button>
                </div>
              </div>
            )}

            {/* Password input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Master Encryption Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
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
                    if (e.key === 'Enter') handleEncrypt();
                  }}
                  placeholder="Type any password to lock file"
                  className={`w-full rounded-xl bg-slate-950/70 border px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors pr-10 ${
                    passwordError
                      ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500'
                      : 'border-slate-700/80 focus:border-sky-500'
                  }`}
                />
              </div>
            </div>

            {/* Optional Confirm Password */}
            {requireConfirmation && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEncrypt();
                  }}
                  placeholder="Re-enter password to confirm"
                  className={`w-full rounded-xl bg-slate-950/70 border px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none ${
                    confirmPassword && !passwordsMatch
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-700/80 focus:border-sky-500'
                  }`}
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Passwords do not match
                  </p>
                )}
                {passwordsMatch && hasConfirmText && (
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Passwords match
                  </p>
                )}
              </div>
            )}

            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Password Strength:</span>
                  <span style={{ color: strength.color }} className="font-semibold">
                    {strength.label} ({strength.score}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${strength.score}%`,
                      backgroundColor: strength.color,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Options Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireConfirmation}
                  onChange={(e) => setRequireConfirmation(e.target.checked)}
                  className="rounded border-slate-700 text-sky-600 focus:ring-0"
                />
                <span>Ask for password confirmation field</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteOriginal}
                  onChange={(e) => setDeleteOriginal(e.target.checked)}
                  className="rounded border-slate-700 text-rose-600 focus:ring-0"
                />
                <span className="text-slate-300">
                  Clear staging unencrypted files after encryption
                </span>
              </label>
              {files.length > 1 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bundleAsZip}
                    onChange={(e) => setBundleAsZip(e.target.checked)}
                    className="rounded border-slate-700 text-sky-600 focus:ring-0"
                  />
                  <span>Download all as single .zip archive</span>
                </label>
              )}
            </div>

            {/* Progress Bar & Status */}
            {isProcessing && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Encrypting vault payload...</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 transition-all duration-200"
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
              {statusType === 'info' && <Lock className="h-4 w-4 shrink-0 text-sky-400" />}
              <span className="truncate">{statusMessage}</span>
            </div>

            {/* Main CTA */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleEncrypt}
              className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                isProcessing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white shadow-sky-600/25 hover:shadow-sky-500/40'
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>{isProcessing ? 'Encrypting & Packaging...' : 'Lock Vault & Download Encrypted File'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Successfully Encrypted ({results.length} files)
                </h4>
                <p className="text-xs text-slate-400">
                  Binary layout: [16B Salt] + [12B Nonce] + [AES-256-GCM Ciphertext + 16B Tag]
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {results.length > 1 && (
                <button
                  type="button"
                  onClick={downloadAllAsZip}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white cursor-pointer shadow-md shadow-sky-600/20"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download All (.zip)</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 flex flex-col justify-between gap-3 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span className="text-sky-400">🔒</span> {r.encryptedName}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Original: {r.originalName} ({formatBytes(r.originalSize)}) ➔ Encrypted:{' '}
                        {formatBytes(r.encryptedSize)}
                      </p>
                    </div>
                  </div>

                  {r.saltHex && (
                    <div className="mt-2 text-[10px] text-slate-500 font-mono truncate">
                      Salt: {r.saltHex.substring(0, 16)}... | Nonce: {r.nonceHex}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => triggerDownload(r.blob, r.encryptedName)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 cursor-pointer transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Again</span>
                  </button>

                  {onTransferToDecrypt && (
                    <button
                      type="button"
                      onClick={() => {
                        const file = new File([r.blob], r.encryptedName, {
                          type: 'application/octet-stream',
                        });
                        onTransferToDecrypt(file);
                      }}
                      title="Send directly to Decrypt tab to test unlocking"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 cursor-pointer transition-colors"
                    >
                      <span>Decrypt Test</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
