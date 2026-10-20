/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { EncryptView } from './components/EncryptView';
import { DecryptView } from './components/DecryptView';
import { PythonSourceView } from './components/PythonSourceView';
import { SecurityModal } from './components/SecurityModal';
import { PYTHON_FILES } from './data/pythonFiles';
import JSZip from 'jszip';

export default function App() {
  const [activeTab, setActiveTab] = useState<'encrypt' | 'decrypt' | 'python-source'>('encrypt');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [isSpecsOpen, setIsSpecsOpen] = useState<boolean>(false);
  const [queuedFilesForDecrypt, setQueuedFilesForDecrypt] = useState<File[]>([]);

  // JSZip project bundler
  const handleDownloadProjectZip = async () => {
    const zip = new JSZip();
    const rootFolder = zip.folder('SecureVault');

    if (!rootFolder) return;

    PYTHON_FILES.forEach((item) => {
      rootFolder.file(item.path, item.code);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SecureVault-AES-Encryptor-Python.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTransferToDecrypt = (file: File) => {
    setQueuedFilesForDecrypt([file]);
    setActiveTab('decrypt');
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 font-sans ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        setIsDark={setIsDark}
        onOpenSpecs={() => setIsSpecsOpen(true)}
        onDownloadZip={handleDownloadProjectZip}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'encrypt' && (
          <EncryptView onTransferToDecrypt={handleTransferToDecrypt} />
        )}

        {activeTab === 'decrypt' && (
          <DecryptView
            queuedFiles={queuedFilesForDecrypt}
            onClearQueuedFiles={() => setQueuedFilesForDecrypt([])}
          />
        )}

        {activeTab === 'python-source' && (
          <PythonSourceView onDownloadZip={handleDownloadProjectZip} />
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            SecureVault v2.4 • AES-256-GCM Authenticated Encryption • 600,000 PBKDF2 Rounds
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Zero-Knowledge</span>
            <span>•</span>
            <span>Client-Side Execution</span>
            <span>•</span>
            <span>Cross-Compatible with Python</span>
          </div>
        </div>
      </footer>

      <SecurityModal isOpen={isSpecsOpen} onClose={() => setIsSpecsOpen(false)} />
    </div>
  );
}
