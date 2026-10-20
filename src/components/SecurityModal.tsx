/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Lock, Hash, Layers, Cpu, CheckCircle2 } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-900 p-6 md:p-8 shadow-2xl space-y-6 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-white">
                SecureVault Cryptographic Architecture
              </h3>
              <p className="text-xs text-slate-400">
                AES-256-GCM • PBKDF2 600k Iterations • Tamper-Evident Binary Format
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Binary Layout Visualizer */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-cyan-400" />
            <span>Encrypted File Binary Container (.enc format)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-cyan-400 font-bold">Bytes 0 .. 15 (16 B)</div>
              <div className="text-white font-semibold">Random Salt</div>
              <div className="text-[11px] text-slate-400">
                Fresh random salt generated via CSPRNG for PBKDF2 key stretching.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-sky-400 font-bold">Bytes 16 .. 27 (12 B)</div>
              <div className="text-white font-semibold">GCM Nonce / IV</div>
              <div className="text-[11px] text-slate-400">
                96-bit unique initialization vector ensures no two files share identical ciphertext.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-emerald-400 font-bold">Bytes 28 .. EOF</div>
              <div className="text-white font-semibold">Ciphertext + 16B Tag</div>
              <div className="text-[11px] text-slate-400">
                Encrypted payload appended with 128-bit Galois authentication tag.
              </div>
            </div>
          </div>
        </div>

        {/* Security Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>PBKDF2-HMAC-SHA256 (600,000 Rounds)</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Modern recommendation for password-based key derivation. 600,000 rounds forces an attacker to spend significant GPU/ASIC compute cycles per candidate password, neutralizing dictionary and brute-force attacks.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span>Authenticated Encryption (AEAD)</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Unlike legacy CBC or ECB modes, AES-GCM calculates a 128-bit authentication tag over the entire ciphertext. Any single bit modification, truncated file, or tampering will be detected instantly upon decryption.
            </p>
          </div>
        </div>

        {/* Cross-Compatibility Notice */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/50 to-indigo-950/40 border border-sky-800/50 flex items-start gap-3 text-xs text-sky-200">
          <CheckCircle2 className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block mb-0.5">
              100% Interoperability Guarantee
            </span>
            Any file encrypted in this browser application can be decrypted using the Python CustomTkinter desktop script, and any file encrypted with the Python script can be decrypted here. Both adhere to the exact same cryptographic standard.
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white cursor-pointer"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};
