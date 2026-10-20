#!/usr/bin/env python3
"""
SecureVault - AES-256-GCM File Encryptor
Main entry point for launching the CustomTkinter desktop GUI application.
"""

from __future__ import annotations

import os
import sys

# Add project root directory to Python path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import customtkinter as ctk

# Enable modern DPI scaling and appearance defaults
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

# Attempt drag & drop support via tkinterdnd2 if available
try:
    from tkinterdnd2 import TkinterDnD
    class BaseApp(ctk.CTk, TkinterDnD.DnDWrapper):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.TkdndVersion = TkinterDnD._require(self)
except ImportError:
    BaseApp = ctk.CTk

from ui.app import SecureVaultApp


def main():
    """Initializes and launches SecureVault."""
    try:
        app = SecureVaultApp()
        app.mainloop()
    except KeyboardInterrupt:
        print("\n[SecureVault] Application closed by user.")
        sys.exit(0)
    except Exception as exc:
        print(f"[SecureVault] Fatal runtime error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
