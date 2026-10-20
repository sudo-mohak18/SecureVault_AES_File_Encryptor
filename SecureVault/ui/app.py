"""
SecureVault - Main Application Window
Coordinates tabs, themes, global settings, and drag-and-drop integration.
"""

from __future__ import annotations

import os
from typing import Optional

import customtkinter as ctk

from ui.decrypt_tab import DecryptTab
from ui.encrypt_tab import EncryptTab

# Optional drag & drop support via tkinterdnd2
try:
    from tkinterdnd2 import DND_FILES, TkinterDnD
    HAS_TKDND = True
except ImportError:
    HAS_TKDND = False


class SecureVaultApp(ctk.CTk):
    """
    Main Application Window for SecureVault.
    Size: 900x650, resizable, modern dark/light styling.
    """

    def __init__(self):
        super().__init__()

        # Window Configuration
        self.title("SecureVault - AES-256 File Encryptor")
        self.geometry("900x650")
        self.minsize(800, 580)

        # Default theme
        ctk.set_appearance_mode("Dark")
        ctk.set_default_color_theme("blue")

        # Session state
        self.last_directory: Optional[str] = os.path.expanduser("~")

        self._setup_ui()
        self._init_drag_and_drop()

    def _setup_ui(self):
        # Configure grid layout
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Header Frame
        header = ctk.CTkFrame(self, height=65, corner_radius=0, fg_color=("gray85", "#0f172a"))
        header.grid(row=0, column=0, sticky="ew")
        header.grid_columnconfigure(1, weight=1)

        # App Logo & Branding
        brand_frame = ctk.CTkFrame(header, fg_color="transparent")
        brand_frame.pack(side="left", padx=20, pady=12)

        icon_lbl = ctk.CTkLabel(
            brand_frame,
            text="🔒",
            font=ctk.CTkFont(size=24),
        )
        icon_lbl.pack(side="left", padx=(0, 10))

        title_box = ctk.CTkFrame(brand_frame, fg_color="transparent")
        title_box.pack(side="left")

        app_name = ctk.CTkLabel(
            title_box,
            text="SecureVault",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color=("gray10", "#f8fafc"),
        )
        app_name.pack(anchor="w")

        app_sub = ctk.CTkLabel(
            title_box,
            text="AES-256-GCM Authenticated Encryption",
            font=ctk.CTkFont(size=11),
            text_color=("gray40", "#94a3b8"),
        )
        app_sub.pack(anchor="w")

        # Right Header Badges and Theme Toggle
        actions_frame = ctk.CTkFrame(header, fg_color="transparent")
        actions_frame.pack(side="right", padx=20, pady=12)

        # Security badge
        badge = ctk.CTkLabel(
            actions_frame,
            text="PBKDF2 600K",
            font=ctk.CTkFont(size=11, weight="bold"),
            fg_color=("#e2e8f0", "#1e293b"),
            text_color=("#0284c7", "#38bdf8"),
            corner_radius=6,
            padx=8,
            pady=3,
        )
        badge.pack(side="left", padx=8)

        # Theme Switch
        self.theme_switch = ctk.CTkSwitch(
            actions_frame,
            text="Dark Mode",
            font=ctk.CTkFont(size=12),
            command=self._toggle_theme,
            onvalue="Dark",
            offvalue="Light",
        )
        self.theme_switch.select()  # Dark by default
        self.theme_switch.pack(side="left", padx=8)

        # About button
        btn_about = ctk.CTkButton(
            actions_frame,
            text="About",
            width=65,
            height=28,
            fg_color="#334155",
            hover_color="#475569",
            command=self._show_about_dialog,
        )
        btn_about.pack(side="left", padx=(5, 0))

        # Main Tabview (Encrypt & Decrypt)
        self.tabview = ctk.CTkTabview(
            self,
            corner_radius=12,
            segmented_button_fg_color=("gray80", "#1e293b"),
            segmented_button_selected_color="#0284c7",
            segmented_button_selected_hover_color="#0369a1",
        )
        self.tabview.grid(row=1, column=0, padx=20, pady=(5, 10), sticky="nsew")

        # Add tabs
        self.tab_encrypt_container = self.tabview.add("   Encrypt Files   ")
        self.tab_decrypt_container = self.tabview.add("   Decrypt Files   ")

        # Instantiate tab frame widgets
        self.encrypt_tab = EncryptTab(self.tab_encrypt_container, app_instance=self)
        self.encrypt_tab.pack(fill="both", expand=True)

        self.decrypt_tab = DecryptTab(self.tab_decrypt_container, app_instance=self)
        self.decrypt_tab.pack(fill="both", expand=True)

        # Footer Status Strip
        footer = ctk.CTkFrame(self, height=26, corner_radius=0, fg_color=("gray90", "#090d16"))
        footer.grid(row=2, column=0, sticky="ew")

        self.lbl_footer_info = ctk.CTkLabel(
            footer,
            text="SecureVault v2.4 • Zero-knowledge client-side encryption • Keys never stored on disk",
            font=ctk.CTkFont(size=11),
            text_color=("gray50", "#64748b"),
        )
        self.lbl_footer_info.pack(side="left", padx=20)

    def _toggle_theme(self):
        mode = self.theme_switch.get()
        ctk.set_appearance_mode(mode)

    def _show_about_dialog(self):
        about_win = ctk.CTkToplevel(self)
        about_win.title("About SecureVault")
        about_win.geometry("450x380")
        about_win.resizable(False, False)
        about_win.transient(self)
        about_win.grab_set()

        content = ctk.CTkFrame(about_win, corner_radius=12, fg_color=("gray95", "#1e293b"))
        content.pack(fill="both", expand=True, padx=20, pady=20)

        lbl_t = ctk.CTkLabel(
            content,
            text="SecureVault - AES-256-GCM",
            font=ctk.CTkFont(size=16, weight="bold"),
            text_color=("#0284c7", "#38bdf8"),
        )
        lbl_t.pack(pady=(15, 6))

        spec_text = (
            "Military-grade file encryption tool built for privacy and performance.\n\n"
            "• Cipher: AES-256-GCM (Authenticated Encryption)\n"
            "• Key Derivation: PBKDF2-HMAC-SHA256\n"
            "• Work Factor: 600,000 iterations\n"
            "• Entropy: 16-byte random salt + 12-byte nonce per file\n"
            "• Integrity: 16-byte Galois Counter Mode (GCM) auth tag\n"
            "• Tamper Detection: Bit-level corruption verification\n"
            "• Architecture: Single/batch file & folder recursion\n\n"
            "No keys, passwords, or plaintexts are ever cached or logged."
        )

        lbl_body = ctk.CTkLabel(
            content,
            text=spec_text,
            font=ctk.CTkFont(size=12),
            text_color=("gray30", "#cbd5e1"),
            justify="left",
        )
        lbl_body.pack(padx=20, pady=10, fill="both")

        btn_close = ctk.CTkButton(
            content,
            text="Close",
            width=100,
            command=about_win.destroy,
        )
        btn_close.pack(pady=(0, 15))

    def _init_drag_and_drop(self):
        """Initializes TkinterDnD if available, or logs clean status."""
        if HAS_TKDND and hasattr(self, "drop_target_register"):
            try:
                self.drop_target_register(DND_FILES)
                self.dnd_bind("<<Drop>>", self._on_dnd_drop)
            except Exception:
                pass

    def _on_dnd_drop(self, event):
        raw_data = event.data
        if not raw_data:
            return

        # Parse file paths
        if raw_data.startswith("{") and raw_data.endswith("}"):
            paths = [p.strip("{}") for p in raw_data.split("} {")]
        else:
            paths = raw_data.split()

        active_tab = self.tabview.get().strip()
        if "Encrypt" in active_tab:
            self.encrypt_tab.handle_dropped_files(paths)
        else:
            self.decrypt_tab.handle_dropped_files(paths)
