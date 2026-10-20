/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  FileText,
  Image as ImageIcon,
  FileCode,
  Music,
  Video,
  File,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import { formatBytes } from '../utils/crypto';
import { DecryptedViewableFile, FileCategory } from '../utils/fileType';

interface FileViewerModalProps {
  file: DecryptedViewableFile | null;
  onClose: () => void;
  onDownload: (file: DecryptedViewableFile) => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  file,
  onClose,
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!file) return null;

  const handleCopyText = () => {
    if (file.textContent) {
      navigator.clipboard.writeText(file.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const getCategoryBadge = () => {
    switch (file.category) {
      case 'image':
        return {
          icon: <ImageIcon className="h-4 w-4 text-emerald-400" />,
          label: 'Decrypted Image',
          color: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
        };
      case 'pdf':
        return {
          icon: <FileText className="h-4 w-4 text-rose-400" />,
          label: 'Decrypted PDF',
          color: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
        };
      case 'text':
        return {
          icon: <FileCode className="h-4 w-4 text-sky-400" />,
          label: 'Decrypted Document / Code',
          color: 'bg-sky-950/60 text-sky-400 border-sky-800/60',
        };
      case 'audio':
        return {
          icon: <Music className="h-4 w-4 text-purple-400" />,
          label: 'Decrypted Audio',
          color: 'bg-purple-950/60 text-purple-400 border-purple-800/60',
        };
      case 'video':
        return {
          icon: <Video className="h-4 w-4 text-amber-400" />,
          label: 'Decrypted Video',
          color: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
        };
      default:
        return {
          icon: <File className="h-4 w-4 text-slate-400" />,
          label: 'Decrypted Binary File',
          color: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  const badge = getCategoryBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-hidden">
      <div
        className={`w-full rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl flex flex-col transition-all duration-200 ${
          isFullscreen
            ? 'h-[96vh] max-w-[96vw]'
            : 'max-h-[90vh] max-w-4xl'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
              {badge.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">{file.filename}</h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}
                >
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {formatBytes(file.size)} • MIME: {file.mimeType}
                {file.lineCount !== undefined && ` • ${file.lineCount} lines`}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {file.category === 'image' && (
              <>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  title="Rotate 90°"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </>
            )}

            {file.category === 'text' && (
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 flex items-center justify-center min-h-[350px]">
          {/* Image Viewer */}
          {file.category === 'image' && file.previewUrl && (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
              <img
                src={file.previewUrl}
                alt={file.filename}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease',
                }}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-xl"
              />
            </div>
          )}

          {/* PDF Viewer */}
          {file.category === 'pdf' && file.previewUrl && (
            <iframe
              src={file.previewUrl}
              title={file.filename}
              className="w-full h-[65vh] rounded-xl border border-slate-800 bg-white"
            />
          )}

          {/* Text / Code Viewer */}
          {file.category === 'text' && (
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 overflow-auto rounded-xl bg-slate-900/90 border border-slate-800 p-4 font-mono text-xs text-slate-200 leading-relaxed custom-scrollbar whitespace-pre-wrap selection:bg-emerald-500/30">
                {file.textContent}
              </div>
            </div>
          )}

          {/* Audio Player */}
          {file.category === 'audio' && file.previewUrl && (
            <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Music className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{file.filename}</h4>
                <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
              </div>
              <audio controls src={file.previewUrl} className="w-full mt-2" autoPlay />
            </div>
          )}

          {/* Video Player */}
          {file.category === 'video' && file.previewUrl && (
            <div className="w-full h-full flex items-center justify-center">
              <video
                controls
                src={file.previewUrl}
                className="max-h-[65vh] max-w-full rounded-xl shadow-2xl border border-slate-800 bg-black"
                autoPlay
              />
            </div>
          )}

          {/* Binary File Info / Hex Dump */}
          {file.category === 'binary' && (
            <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                  <File className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{file.filename}</h4>
                  <p className="text-xs text-slate-400">
                    Binary data ({formatBytes(file.size)}) • {file.mimeType}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                This file format is not directly rendered as visual media in browsers, but the file has been 100% authenticated and restored. You can download it directly below.
              </p>
              {file.hexPreview && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                    Header Hex Dump (First 128 bytes)
                  </span>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-400 overflow-x-auto whitespace-pre">
                    {file.hexPreview}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 rounded-b-2xl flex items-center justify-between text-xs text-slate-400">
          <span>Decrypted & Verified with AES-256-GCM authenticated tags</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};
