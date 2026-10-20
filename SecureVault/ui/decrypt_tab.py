"""
SecureVault - Decrypt Tab UI
Handles encrypted file selection, password inputs, validation, and decryption workers.
"""

from __future__ import annotations

import os
import threading
from tkinter import filedialog, messagebox
from typing import List, Optional

import customtkinter as ctk

from core.encryptor import (
    AESEncryptor,
    FileFormatError,
    InvalidPasswordOrCorruptedError,
)
from core.utils import format_file_size, scan_folder_for_files


class DecryptTab(ctk.CTkFrame):
    """Modern Decrypt tab built with CustomTkinter."""

    def __init__(self, master, app_instance, **kwargs):
        super().__init__(master, **kwargs)
        self.app = app_instance
        self.selected_files: List[str] = []
        self.is_processing = False

        self._setup_ui()

    def _setup_ui(self):
        # Configure layout grid
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Top Action Bar
        top_bar = ctk.CTkFrame(self, fg_color="transparent")
        top_bar.grid(row=0, column=0, padx=20, pady=(15, 10), sticky="ew")

        title_lbl = ctk.CTkLabel(
            top_bar,
            text="AES-256-GCM Vault Decryption",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color=("gray10", "#34d399"),
        )
        title_lbl.pack(side="left")

        btn_clear = ctk.CTkButton(
            top_bar,
            text="Clear List",
            width=90,
            height=28,
            fg_color="#334155",
            hover_color="#475569",
            command=self._clear_files,
        )
        btn_clear.pack(side="right", padx=(5, 0))

        # Main Drop Zone & File List Area
        middle_frame = ctk.CTkFrame(self, corner_radius=12, fg_color=("gray90", "#1e293b"))
        middle_frame.grid(row=1, column=0, padx=20, pady=5, sticky="nsew")
        middle_frame.grid_columnconfigure(0, weight=1)
        middle_frame.grid_rowconfigure(1, weight=1)

        # Drop banner / File picker triggers
        drop_banner = ctk.CTkFrame(middle_frame, fg_color=("gray85", "#0f172a"), corner_radius=10)
        drop_banner.grid(row=0, column=0, padx=15, pady=12, sticky="ew")

        drop_label = ctk.CTkLabel(
            drop_banner,
            text="Drag & Drop encrypted (.enc) files here, or use the buttons below",
            font=ctk.CTkFont(size=13, weight="normal"),
            text_color=("gray40", "#94a3b8"),
        )
        drop_label.pack(pady=(10, 8))

        btn_row = ctk.CTkFrame(drop_banner, fg_color="transparent")
        btn_row.pack(pady=(0, 10))

        self.btn_select_files = ctk.CTkButton(
            btn_row,
            text="+ Select Encrypted Files",
            width=170,
            height=32,
            fg_color="#059669",
            hover_color="#047857",
            font=ctk.CTkFont(size=13, weight="bold"),
            command=self._browse_files,
        )
        self.btn_select_files.pack(side="left", padx=6)

        self.btn_select_folder = ctk.CTkButton(
            btn_row,
            text="+ Select Folder (.enc)",
            width=160,
            height=32,
            fg_color="#334155",
            hover_color="#475569",
            font=ctk.CTkFont(size=13, weight="bold"),
            command=self._browse_folder,
        )
        self.btn_select_folder.pack(side="left", padx=6)

        # Scrollable file list container
        self.file_list_scroll = ctk.CTkScrollableFrame(
            middle_frame,
            fg_color="transparent",
            label_text="Encrypted Files (0 items)",
            label_font=ctk.CTkFont(size=13, weight="bold"),
        )
        self.file_list_scroll.grid(row=1, column=0, padx=15, pady=(0, 12), sticky="nsew")

        # Bottom Configuration & Controls Section
        config_frame = ctk.CTkFrame(self, corner_radius=12, fg_color=("gray90", "#1e293b"))
        config_frame.grid(row=2, column=0, padx=20, pady=(5, 15), sticky="ew")
        config_frame.grid_columnconfigure(0, weight=1)

        # Password input row
        pwd_label = ctk.CTkLabel(
            config_frame,
            text="Decryption Password:",
            font=ctk.CTkFont(size=12, weight="bold"),
            text_color=("gray20", "#cbd5e1"),
        )
        pwd_label.grid(row=0, column=0, padx=15, pady=(10, 2), sticky="w")

        pwd_row = ctk.CTkFrame(config_frame, fg_color="transparent")
        pwd_row.grid(row=1, column=0, padx=15, pady=2, sticky="ew")

        self.entry_pwd = ctk.CTkEntry(
            pwd_row,
            placeholder_text="Enter the vault password used during encryption",
            show="*",
            height=34,
            font=ctk.CTkFont(size=13),
        )
        self.entry_pwd.pack(side="left", fill="x", expand=True)

        self.btn_toggle_pwd = ctk.CTkButton(
            pwd_row,
            text="Show",
            width=60,
            height=34,
            fg_color="#334155",
            hover_color="#475569",
            command=self._toggle_password_visibility,
        )
        self.btn_toggle_pwd.pack(side="left", padx=(8, 0))

        # Action Button & Progress Indicator
        action_frame = ctk.CTkFrame(config_frame, fg_color="transparent")
        action_frame.grid(row=2, column=0, padx=15, pady=(8, 12), sticky="ew")
        action_frame.grid_columnconfigure(0, weight=1)

        self.progress_bar = ctk.CTkProgressBar(
            action_frame,
            height=12,
            corner_radius=6,
            progress_color="#10b981",
        )
        self.progress_bar.set(0)
        self.progress_bar.grid(row=0, column=0, sticky="ew", pady=(0, 6))

        self.lbl_status = ctk.CTkLabel(
            action_frame,
            text="Ready to decrypt. Add .enc files and enter password.",
            font=ctk.CTkFont(size=12),
            text_color=("gray30", "#94a3b8"),
            anchor="w",
        )
        self.lbl_status.grid(row=1, column=0, sticky="w")

        self.btn_decrypt = ctk.CTkButton(
            action_frame,
            text="Unlock Vault & Decrypt Files",
            height=42,
            font=ctk.CTkFont(size=14, weight="bold"),
            fg_color="#059669",
            hover_color="#047857",
            command=self._start_decryption_thread,
        )
        self.btn_decrypt.grid(row=2, column=0, sticky="ew", pady=(10, 0))

    def _browse_files(self):
        initial_dir = self.app.last_directory or os.path.expanduser("~")
        files = filedialog.askopenfilenames(
            title="Select Encrypted Files",
            initialdir=initial_dir,
            filetypes=[("Encrypted Files", "*.enc"), ("All Files", "*.*")],
        )
        if files:
            self.app.last_directory = os.path.dirname(files[0])
            for f in files:
                if f not in self.selected_files:
                    self.selected_files.append(f)
            self._refresh_file_list()

    def _browse_folder(self):
        initial_dir = self.app.last_directory or os.path.expanduser("~")
        folder = filedialog.askdirectory(
            title="Select Folder to Scan for .enc Files",
            initialdir=initial_dir,
        )
        if folder:
            self.app.last_directory = folder
            files = scan_folder_for_files(folder)
            enc_files = [f for f in files if f.endswith(".enc")]
            added = 0
            for f in enc_files:
                if f not in self.selected_files:
                    self.selected_files.append(f)
                    added += 1
            self._refresh_file_list()
            self._set_status(f"Found and added {added} encrypted file(s).", "info")

    def handle_dropped_files(self, file_paths: List[str]):
        """Handler for drag-and-dropped files."""
        added = 0
        for p in file_paths:
            if os.path.isdir(p):
                sub_files = scan_folder_for_files(p)
                for sf in sub_files:
                    if sf not in self.selected_files:
                        self.selected_files.append(sf)
                        added += 1
            elif os.path.isfile(p):
                if p not in self.selected_files:
                    self.selected_files.append(p)
                    added += 1
        if added > 0:
            self._refresh_file_list()
            self._set_status(f"Added {added} file(s) via Drag & Drop.", "info")

    def _refresh_file_list(self):
        for widget in self.file_list_scroll.winfo_children():
            widget.destroy()

        count = len(self.selected_files)
        total_size = 0

        for idx, file_path in enumerate(self.selected_files):
            try:
                size = os.path.getsize(file_path)
            except OSError:
                size = 0
            total_size += size

            row = ctk.CTkFrame(self.file_list_scroll, fg_color=("gray95", "#0f172a"), corner_radius=6)
            row.pack(fill="x", pady=2, padx=2)

            name_lbl = ctk.CTkLabel(
                row,
                text=os.path.basename(file_path),
                font=ctk.CTkFont(size=12, weight="bold"),
                anchor="w",
            )
            name_lbl.pack(side="left", padx=8, fill="x", expand=True)

            size_lbl = ctk.CTkLabel(
                row,
                text=format_file_size(size),
                font=ctk.CTkFont(size=11),
                text_color=("gray40", "#94a3b8"),
            )
            size_lbl.pack(side="left", padx=8)

            btn_remove = ctk.CTkButton(
                row,
                text="✕",
                width=24,
                height=24,
                fg_color="transparent",
                hover_color="#ef4444",
                text_color="#94a3b8",
                command=lambda p=file_path: self._remove_single_file(p),
            )
            btn_remove.pack(side="right", padx=6)

        label_title = f"Encrypted Files ({count} items • {format_file_size(total_size)})"
        self.file_list_scroll.configure(label_text=label_title)

    def _remove_single_file(self, file_path: str):
        if file_path in self.selected_files:
            self.selected_files.remove(file_path)
            self._refresh_file_list()

    def _clear_files(self):
        self.selected_files.clear()
        self._refresh_file_list()
        self._set_status("File list cleared.", "info")

    def _toggle_password_visibility(self):
        current_show = self.entry_pwd.cget("show")
        if current_show == "*":
            self.entry_pwd.configure(show="")
            self.btn_toggle_pwd.configure(text="Hide")
        else:
            self.entry_pwd.configure(show="*")
            self.btn_toggle_pwd.configure(text="Show")

    def _set_status(self, message: str, level: str = "info"):
        color_map = {
            "info": ("gray30", "#94a3b8"),
            "success": ("#15803d", "#34d399"),
            "warning": ("#b45309", "#fbbf24"),
            "error": ("#b91c1c", "#f87171"),
        }
        self.lbl_status.configure(text=message, text_color=color_map.get(level, ("gray30", "#94a3b8")))

    def _start_decryption_thread(self):
        if self.is_processing:
            return

        if not self.selected_files:
            messagebox.showwarning("No Files", "Please select or drop at least one encrypted (.enc) file.")
            return

        pwd = self.entry_pwd.get()
        if not pwd:
            messagebox.showwarning("Missing Password", "Please enter the password to decrypt.")
            return

        self.is_processing = True
        self.btn_decrypt.configure(state="disabled", text="Decrypting Vault...")
        self.btn_select_files.configure(state="disabled")
        self.btn_select_folder.configure(state="disabled")

        thread = threading.Thread(
            target=self._run_decryption_worker,
            args=(list(self.selected_files), pwd),
            daemon=True,
        )
        thread.start()

    def _run_decryption_worker(self, files: List[str], password: str):
        total_files = len(files)
        success_count = 0
        errors = []

        for index, file_path in enumerate(files):
            file_name = os.path.basename(file_path)

            def progress_callback(step_fraction: float, step_desc: str):
                overall = (index + step_fraction) / total_files
                self.after(0, lambda: self.progress_bar.set(overall))
                self.after(0, lambda: self._set_status(f"[{index+1}/{total_files}] {file_name}: {step_desc}", "info"))

            try:
                AESEncryptor.decrypt_file(
                    input_path=file_path,
                    password=password,
                    progress_callback=progress_callback,
                )
                success_count += 1
            except (InvalidPasswordOrCorruptedError, FileFormatError) as e:
                errors.append(f"{file_name}: {str(e)}")
            except Exception as e:
                errors.append(f"{file_name}: Unexpected error - {str(e)}")

        self.after(0, lambda: self._on_decryption_finished(success_count, total_files, errors))

    def _on_decryption_finished(self, success_count: int, total_files: int, errors: List[str]):
        self.is_processing = False
        self.btn_decrypt.configure(state="normal", text="Unlock Vault & Decrypt Files")
        self.btn_select_files.configure(state="normal")
        self.btn_select_folder.configure(state="normal")
        self.progress_bar.set(1.0 if not errors else 0.5)

        if not errors:
            self._set_status(f"Successfully decrypted {success_count} file(s).", "success")
            messagebox.showinfo(
                "Decryption Successful",
                f"All {success_count} file(s) were successfully authenticated and decrypted.",
            )
            self.selected_files.clear()
            self._refresh_file_list()
        else:
            self._set_status(f"Completed with errors: {len(errors)} failed.", "error")
            err_msg = "\n\n".join(errors[:4])
            if len(errors) > 4:
                err_msg += f"\n\n...and {len(errors) - 4} more."
            messagebox.showerror(
                "Decryption Error",
                f"Failed to decrypt files:\n\n{err_msg}\n\nPlease check that your password is correct.",
            )
