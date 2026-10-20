/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileCode2,
  FolderTree,
  Terminal,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { PYTHON_FILES, PythonFileItem } from '../data/pythonFiles';
import JSZip from 'jszip';

interface PythonSourceViewProps {
  onDownloadZip: () => void;
}

export const PythonSourceView: React.FC<PythonSourceViewProps> = ({ onDownloadZip }) => {
  const [selectedFile, setSelectedFile] = useState<PythonFileItem>(PYTHON_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [cmdCopied, setCmdCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const commandSnippet = `# 1. Navigate to directory
cd SecureVault

# 2. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate   # On Windows: .\\venv\\Scripts\\activate

# 3. Install required dependencies
pip install -r requirements.txt

# 4. Launch CustomTkinter GUI Desktop Application
python3 main.py`;

  const handleCopyCommands = () => {
    navigator.clipboard.writeText(commandSnippet);
    setCmdCopied(true);
    setTimeout(() => setCmdCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
              CustomTkinter GUI
            </span>
            <span className="text-xs text-slate-400">Python 3.10+ • Standalone Desktop Application</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            SecureVault Python Desktop Source Code
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-1">
            All code files are production-ready, strictly following PEP 8, typed, modular, and built with CustomTkinter, cryptography (AES-256-GCM), and PBKDF2 (600,000 rounds).
          </p>
        </div>

        <button
          type="button"
          onClick={onDownloadZip}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-600/25 transition-all cursor-pointer self-start md:self-auto shrink-0"
        >
          <Download className="h-4 w-4" />
          <span>Download Project (.zip)</span>
        </button>
      </div>

      {/* Quick Run Terminal Commands */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-400">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span className="font-bold">How to Run on Windows / macOS / Linux</span>
          </div>
          <button
            type="button"
            onClick={handleCopyCommands}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"
          >
            {cmdCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{cmdCopied ? 'Copied Commands' : 'Copy Commands'}</span>
          </button>
        </div>
        <pre className="text-emerald-400/90 whitespace-pre-wrap leading-relaxed">
          {commandSnippet}
        </pre>
      </div>

      {/* File Explorer & Code Viewer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: File Tree (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <FolderTree className="h-4 w-4 text-sky-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Project Structure
            </h4>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase px-2 py-1">
              Root Entry & Config
            </div>
            {PYTHON_FILES.filter((f) => f.category === 'root').map((file) => (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedFile(file)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                  selectedFile.path === file.path
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{file.path}</span>
                </div>
              </button>
            ))}

            <div className="text-[11px] font-bold text-slate-500 uppercase px-2 pt-3 pb-1">
              Core Engine (AES-GCM)
            </div>
            {PYTHON_FILES.filter((f) => f.category === 'core').map((file) => (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedFile(file)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                  selectedFile.path === file.path
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{file.path}</span>
                </div>
              </button>
            ))}

            <div className="text-[11px] font-bold text-slate-500 uppercase px-2 pt-3 pb-1">
              UI (CustomTkinter)
            </div>
            {PYTHON_FILES.filter((f) => f.category === 'ui').map((file) => (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedFile(file)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                  selectedFile.path === file.path
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{file.path}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Code Viewer (8 Cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white">
                  SecureVault/{selectedFile.path}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{selectedFile.description}</p>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800/80 p-4 font-mono text-xs overflow-auto max-h-[600px] text-slate-300 leading-relaxed custom-scrollbar">
            <pre className="whitespace-pre">{selectedFile.code}</pre>
          </div>
        </div>

      </div>
    </div>
  );
};
