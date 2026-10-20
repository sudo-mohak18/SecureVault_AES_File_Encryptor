/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, Lock, Code2, Info, Moon, Sun, Download, KeyRound } from 'lucide-react';

interface HeaderProps {
  activeTab: 'encrypt' | 'decrypt' | 'python-source';
  setActiveTab: (tab: 'encrypt' | 'decrypt' | 'python-source') => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onOpenSpecs: () => void;
  onDownloadZip: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  onOpenSpecs,
  onDownloadZip,
}) => {
  return (
    <header className="border-b border-slate-700/60 bg-slate-900/90 backdrop-blur sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                SecureVault
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/80">
                  AES-256-GCM
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Enterprise File Encryptor • PBKDF2 600k Rounds • Zero-Knowledge
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('encrypt')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'encrypt'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Encrypt Files</span>
          </button>

          <button
            onClick={() => setActiveTab('decrypt')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'decrypt'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Decrypt Files</span>
          </button>

          <button
            onClick={() => setActiveTab('python-source')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'python-source'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Python Desktop App</span>
          </button>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={onDownloadZip}
            title="Download complete Python CustomTkinter project zip"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Download Python App</span>
            <span className="sm:hidden">Python .zip</span>
          </button>

          <button
            onClick={onOpenSpecs}
            title="View Cryptographic Architecture and Specifications"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            aria-label="Security Architecture Details"
          >
            <Info className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsDark(!isDark)}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-sky-400" />}
          </button>
        </div>

      </div>
    </header>
  );
};
