"""
SecureVault - Encrypt Tab UI
Handles file selection, password inputs, strength meter, options, and encryption workers.
"""

from __future__ import annotations

import os
import threading
from tkinter import filedialog, messagebox
from typing import List, Optional

import customtkinter as ctk

from core.encryptor import AESEncryptor
from core.utils import (
    calculate_password_strength,
    format_file_size,
    generate_secure_password,
    scan_folder_for_files,
)


class EncryptTab(ctk.CTkFrame):
    """Modern Encrypt tab built with CustomTkinter."""

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
            text="AES-256-GCM File Encryption",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color=("gray10", "#38bdf8"),
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
            text="Drag & Drop files here, or use the buttons below",
            font=ctk.CTkFont(size=13, weight="normal"),
            text_color=("gray40", "#94a3b8"),
        )
        drop_label.pack(pady=(10, 8))

        btn_row = ctk.CTkFrame(drop_banner, fg_color="transparent")
        btn_row.pack(pady=(0, 10))

        self.btn_select_files = ctk.CTkButton(
            btn_row,
            text="+ Select Files",
            width=130,
            height=32,
            fg_color="#0284c7",
            hover_color="#0369a1",
            font=ctk.CTkFont(size=13, weight="bold"),
            command=self._browse_files,
        )
        self.btn_select_files.pack(side="left", padx=6)

        self.btn_select_folder = ctk.CTkButton(
            btn_row,
            text="+ Select Folder",
            width=130,
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
            label_text="Selected Files (0 items)",
            label_font=ctk.CTkFont(size=13, weight="bold"),
        )
        self.file_list_scroll.grid(row=1, column=0, padx=15, pady=(0, 12), sticky="nsew")

        # Bottom Configuration & Controls Section
        config_frame = ctk.CTkFrame(self, corner_radius=12, fg_color=("gray90", "#1e293b"))
        config_frame.grid(row=2, column=0, padx=20, pady=(5, 15), sticky="ew")
        config_frame.grid_columnconfigure((0, 1), weight=1)

        # Password input row
        pwd_label = ctk.CTkLabel(
            config_frame,
            text="Master Encryption Password:",
            font=ctk.CTkFont(size=12, weight="bold"),
            text_color=("gray20", "#cbd5e1"),
        )
        pwd_label.grid(row=0, column=0, padx=15, pady=(10, 2), sticky="w")

        pwd_row = ctk.CTkFrame(config_frame, fg_color="transparent")
        pwd_row.grid(row=1, column=0, padx=15, pady=2, sticky="ew")

        self.entry_pwd = ctk.CTkEntry(
            pwd_row,
            placeholder_text="Enter strong password",
            show="*",
            height=34,
            font=ctk.CTkFont(size=13),
        )
        self.entry_pwd.pack(side="left", fill="x", expand=True)
        self.entry_pwd.bind("<KeyRelease>", self._on_password_change)

        self.btn_toggle_pwd = ctk.CTkButton(
            pwd_row,
            text="Show",
            width=55,
            height=34,
            fg_color="#334155",
            hover_color="#475569",
            command=self._toggle_password_visibility,
        )
        self.btn_toggle_pwd.pack(side="left", padx=(6, 0))

        self.btn_gen_pwd = ctk.CTkButton(
            pwd_row,
            text="Generate",
            width=75,
            height=34,
            fg_color="#059669",
            hover_color="#047857",
            command=self._generate_random_password,
        )
        self.btn_gen_pwd.pack(side="left", padx=(6, 0))

        # Confirm password row
        conf_label = ctk.CTkLabel(
            config_frame,
            text="Confirm Password:",
            font=ctk.CTkFont(size=12, weight="bold"),
            text_color=("gray20", "#cbd5e1"),
        )
        conf_label.grid(row=0, column=1, padx=15, pady=(10, 2), sticky="w")

        conf_row = ctk.CTkFrame(config_frame, fg_color="transparent")
        conf_row.grid(row=1, column=1, padx=15, pady=2, sticky="ew")

        self.entry_confirm = ctk.CTkEntry(
            conf_row,
            placeholder_text="Re-enter password to confirm",
            show="*",
            height=34,
            font=ctk.CTkFont(size=13),
        )
        self.entry_confirm.pack(side="left", fill="x", expand=True)

        # Strength Meter row
        strength_frame = ctk.CTkFrame(config_frame, fg_color="transparent")
        strength_frame.grid(row=2, column=0, columnspan=2, padx=15, pady=(4, 6), sticky="ew")
        strength_frame.grid_columnconfigure(1, weight=1)

        self.lbl_strength = ctk.CTkLabel(
            strength_frame,
            text="Strength: None",
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color="#94a3b8",
            width=110,
            anchor="w",
        )
        self.lbl_strength.grid(row=0, column=0, sticky="w")

        self.progress_strength = ctk.CTkProgressBar(strength_frame, height=8, corner_radius=4)
        self.progress_strength.set(0)
        self.progress_strength.grid(row=0, column=1, sticky="ew", padx=(5, 0))

        # Security Checkboxes & Options
        options_row = ctk.CTkFrame(config_frame, fg_color="transparent")
        options_row.grid(row=3, column=0, columnspan=2, padx=15, pady=(4, 10), sticky="ew")

        self.var_delete_original = ctk.BooleanVar(value=False)
        self.chk_delete = ctk.CTkCheckBox(
            options_row,
            text="Permanently delete original file(s) after encryption",
            variable=self.var_delete_original,
            font=ctk.CTkFont(size=12),
            text_color=("gray20", "#f87171"),
            fg_color="#dc2626",
            hover_color="#b91c1c",
        )
        self.chk_delete.pack(side="left")

        # Action Button & Progress Indicator
        action_frame = ctk.CTkFrame(config_frame, fg_color="transparent")
        action_frame.grid(row=4, column=0, columnspan=2, padx=15, pady=(5, 12), sticky="ew")
        action_frame.grid_columnconfigure(0, weight=1)

        self.progress_bar = ctk.CTkProgressBar(action_frame, height=12, corner_radius=6)
        self.progress_bar.set(0)
        self.progress_bar.grid(row=0, column=0, sticky="ew", pady=(0, 6))

        self.lbl_status = ctk.CTkLabel(
            action_frame,
            text="Ready to encrypt. Add files and specify a password.",
            font=ctk.CTkFont(size=12),
            text_color=("gray30", "#94a3b8"),
            anchor="w",
        )
        self.lbl_status.grid(row=1, column=0, sticky="w")

        self.btn_encrypt = ctk.CTkButton(
            action_frame,
            text="Lock Vault & Encrypt Files",
            height=42,
            font=ctk.CTkFont(size=14, weight="bold"),
            fg_color="#0284c7",
            hover_color="#0369a1",
            command=self._start_encryption_thread,
        )
        self.btn_encrypt.grid(row=2, column=0, sticky="ew", pady=(10, 0))

    def _browse_files(self):
        initial_dir = self.app.last_directory or os.path.expanduser("~")
        files = filedialog.askopenfilenames(
            title="Select Files to Encrypt",
            initialdir=initial_dir,
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
            title="Select Folder to Encrypt",
            initialdir=initial_dir,
        )
        if folder:
            self.app.last_directory = folder
            files = scan_folder_for_files(folder)
            added_count = 0
            for f in files:
                if f not in self.selected_files and not f.endswith(".enc"):
                    self.selected_files.append(f)
                    added_count += 1
            self._refresh_file_list()
            self._set_status(f"Added {added_count} files from folder.", "info")

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

        label_title = f"Selected Files ({count} items • {format_file_size(total_size)})"
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
            self.entry_confirm.configure(show="")
            self.btn_toggle_pwd.configure(text="Hide")
        else:
            self.entry_pwd.configure(show="*")
            self.entry_confirm.configure(show="*")
            self.btn_toggle_pwd.configure(text="Show")

    def _generate_random_password(self):
        pwd = generate_secure_password(length=20, use_symbols=True)
        self.entry_pwd.delete(0, "end")
        self.entry_pwd.insert(0, pwd)
        self.entry_confirm.delete(0, "end")
        self.entry_confirm.insert(0, pwd)
        self._on_password_change()
        self._set_status("Generated cryptographically secure 20-character password.", "success")

    def _on_password_change(self, event=None):
        pwd = self.entry_pwd.get()
        score, label, color = calculate_password_strength(pwd)
        self.lbl_strength.configure(text=f"Strength: {label}", text_color=color)
        self.progress_strength.set(score / 100.0)
        self.progress_strength.configure(progress_color=color)

    def _set_status(self, message: str, level: str = "info"):
        color_map = {
            "info": ("gray30", "#94a3b8"),
            "success": ("#15803d", "#34d399"),
            "warning": ("#b45309", "#fbbf24"),
            "error": ("#b91c1c", "#f87171"),
        }
        self.lbl_status.configure(text=message, text_color=color_map.get(level, ("gray30", "#94a3b8")))

    def _start_encryption_thread(self):
        if self.is_processing:
            return

        if not self.selected_files:
            messagebox.showwarning("No Files", "Please select or drop at least one file to encrypt.")
            return

        pwd = self.entry_pwd.get()
        confirm = self.entry_confirm.get()

        if not pwd:
            messagebox.showwarning("Missing Password", "Please enter a password for encryption.")
            return

        if pwd != confirm:
            messagebox.showerror("Password Mismatch", "Passwords do not match. Please verify both fields.")
            return

        if len(pwd) < 8:
            if not messagebox.askyesno(
                "Short Password Warning",
                "Your password is less than 8 characters and may be vulnerable. Do you wish to continue?",
            ):
                return

        delete_orig = self.var_delete_original.get()
        if delete_orig:
            if not messagebox.askyesno(
                "Confirm Deletion",
                "WARNING: You have enabled 'Permanently delete original file'. The unencrypted files will be permanently erased. Are you sure?",
                icon="warning",
            ):
                return

        self.is_processing = True
        self.btn_encrypt.configure(state="disabled", text="Encrypting Vault...")
        self.btn_select_files.configure(state="disabled")
        self.btn_select_folder.configure(state="disabled")

        thread = threading.Thread(
            target=self._run_encryption_worker,
            args=(list(self.selected_files), pwd, delete_orig),
            daemon=True,
        )
        thread.start()

    def _run_encryption_worker(self, files: List[str], password: str, delete_orig: bool):
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
                AESEncryptor.encrypt_file(
                    input_path=file_path,
                    password=password,
                    delete_original=delete_orig,
                    progress_callback=progress_callback,
                )
                success_count += 1
            except Exception as e:
                errors.append(f"{file_name}: {str(e)}")

        self.after(0, lambda: self._on_encryption_finished(success_count, total_files, errors))

    def _on_encryption_finished(self, success_count: int, total_files: int, errors: List[str]):
        self.is_processing = False
        self.btn_encrypt.configure(state="normal", text="Lock Vault & Encrypt Files")
        self.btn_select_files.configure(state="normal")
        self.btn_select_folder.configure(state="normal")
        self.progress_bar.set(1.0 if not errors else 0.5)

        if not errors:
            self._set_status(f"Successfully encrypted {success_count} of {total_files} file(s).", "success")
            messagebox.showinfo(
                "Encryption Successful",
                f"All {success_count} file(s) were successfully encrypted with AES-256-GCM (.enc extension added).",
            )
            self.selected_files.clear()
            self._refresh_file_list()
        else:
            self._set_status(f"Completed with errors: {len(errors)} failed.", "error")
            err_msg = "\n".join(errors[:5])
            if len(errors) > 5:
                err_msg += f"\n...and {len(errors) - 5} more."
            messagebox.showerror("Encryption Errors", f"Errors occurred during encryption:\n\n{err_msg}")
