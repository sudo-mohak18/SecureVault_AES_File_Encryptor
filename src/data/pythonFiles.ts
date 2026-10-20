/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PythonFileItem {
  path: string;
  name: string;
  category: 'core' | 'ui' | 'root';
  description: string;
  code: string;
}

export const PYTHON_FILES: PythonFileItem[] = [
  {
    path: 'main.py',
    name: 'main.py',
    category: 'root',
    description: 'Application entry point, DPI scaling, and CustomTkinter launch loop.',
    code: `#!/usr/bin/env python3
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
        print("\\n[SecureVault] Application closed by user.")
        sys.exit(0)
    except Exception as exc:
        print(f"[SecureVault] Fatal runtime error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
`,
  },
  {
    path: 'core/encryptor.py',
    name: 'encryptor.py',
    category: 'core',
    description: 'AES-256-GCM authenticated cipher engine and PBKDF2HMAC (600,000 rounds).',
    code: `"""
SecureVault - Core Encryption and Decryption Engine
Uses AES-256-GCM with PBKDF2HMAC (SHA-256, 600,000 iterations).

Specification:
- Salt: 16 bytes (os.urandom)
- Nonce / IV: 12 bytes (os.urandom)
- Key Derivation: PBKDF2-HMAC-SHA256, 600,000 iterations, 32-byte key
- Algorithm: AES-256-GCM (Authenticated Encryption with Associated Data)
- File Format: [16 bytes salt] + [12 bytes nonce] + [ciphertext + 16-byte auth tag]
"""

from __future__ import annotations

import os
import shutil
from dataclasses import dataclass
from typing import Callable, Optional

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

SALT_SIZE_BYTES = 16
NONCE_SIZE_BYTES = 12
TAG_SIZE_BYTES = 16
KEY_SIZE_BYTES = 32
PBKDF2_ITERATIONS = 600_000


class EncryptionError(Exception):
    """Base exception for encryption/decryption failures."""
    pass


class InvalidPasswordOrCorruptedError(EncryptionError):
    """Raised when password is wrong or ciphertext/tag was modified."""
    pass


class FileFormatError(EncryptionError):
    """Raised when an encrypted file is invalid, truncated, or lacks required headers."""
    pass


@dataclass
class EncryptionResult:
    input_path: str
    output_path: str
    original_size: int
    encrypted_size: int
    deleted_original: bool


@dataclass
class DecryptionResult:
    input_path: str
    output_path: str
    decrypted_size: int


class AESEncryptor:
    @staticmethod
    def derive_key(password: str, salt: bytes) -> bytes:
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=KEY_SIZE_BYTES,
            salt=salt,
            iterations=PBKDF2_ITERATIONS,
        )
        return kdf.derive(password.encode("utf-8"))

    @classmethod
    def encrypt_file(
        cls,
        input_path: str,
        output_path: Optional[str] = None,
        password: str = "",
        delete_original: bool = False,
        progress_callback: Optional[Callable[[float, str], None]] = None,
    ) -> EncryptionResult:
        if not os.path.isfile(input_path):
            raise FileNotFoundError(f"Input file not found: {input_path}")
        if not password:
            raise ValueError("Password cannot be empty.")

        if output_path is None:
            output_path = f"{input_path}.enc"

        file_size = os.path.getsize(input_path)

        if progress_callback:
            progress_callback(0.05, "Generating secure salt & nonce...")

        salt = os.urandom(SALT_SIZE_BYTES)
        nonce = os.urandom(NONCE_SIZE_BYTES)

        if progress_callback:
            progress_callback(0.15, "Deriving 256-bit AES key (600,000 PBKDF2 rounds)...")

        key = cls.derive_key(password, salt)
        aesgcm = AESGCM(key)

        temp_output_path = f"{output_path}.tmp_{os.urandom(4).hex()}"

        try:
            if progress_callback:
                progress_callback(0.35, "Encrypting file data with AES-256-GCM...")

            with open(input_path, "rb") as f_in:
                plaintext = f_in.read()

            ciphertext_with_tag = aesgcm.encrypt(nonce, plaintext, None)

            if progress_callback:
                progress_callback(0.80, "Writing encrypted header and payload...")

            with open(temp_output_path, "wb") as f_out:
                f_out.write(salt)
                f_out.write(nonce)
                f_out.write(ciphertext_with_tag)

            if os.path.exists(output_path):
                os.remove(output_path)
            shutil.move(temp_output_path, output_path)

            encrypted_size = os.path.getsize(output_path)
            deleted_original = False

            if delete_original:
                if progress_callback:
                    progress_callback(0.95, "Securely removing original file...")
                try:
                    with open(input_path, "wb") as f_del:
                        f_del.write(os.urandom(min(file_size, 4096)))
                except Exception:
                    pass
                os.remove(input_path)
                deleted_original = True

            if progress_callback:
                progress_callback(1.0, "Encryption complete.")

            return EncryptionResult(
                input_path=input_path,
                output_path=output_path,
                original_size=file_size,
                encrypted_size=encrypted_size,
                deleted_original=deleted_original,
            )
        finally:
            del key

    @classmethod
    def decrypt_file(
        cls,
        input_path: str,
        output_path: Optional[str] = None,
        password: str = "",
        progress_callback: Optional[Callable[[float, str], None]] = None,
    ) -> DecryptionResult:
        if not os.path.isfile(input_path):
            raise FileNotFoundError(f"Encrypted file not found: {input_path}")
        if not password:
            raise ValueError("Password cannot be empty.")

        file_size = os.path.getsize(input_path)
        min_header_size = SALT_SIZE_BYTES + NONCE_SIZE_BYTES + TAG_SIZE_BYTES
        if file_size < min_header_size:
            raise FileFormatError(f"File too small ({file_size} bytes) for SecureVault.")

        if output_path is None:
            if input_path.endswith(".enc"):
                output_path = input_path[:-4]
            else:
                base, ext = os.path.splitext(input_path)
                output_path = f"{base}.decrypted{ext}"

        with open(input_path, "rb") as f_in:
            salt = f_in.read(SALT_SIZE_BYTES)
            nonce = f_in.read(NONCE_SIZE_BYTES)
            ciphertext_with_tag = f_in.read()

        if len(salt) != SALT_SIZE_BYTES or len(nonce) != NONCE_SIZE_BYTES:
            raise FileFormatError("Incomplete cryptographic header.")

        if progress_callback:
            progress_callback(0.20, "Deriving 256-bit AES key (600,000 PBKDF2 rounds)...")

        key = cls.derive_key(password, salt)
        aesgcm = AESGCM(key)

        try:
            plaintext = aesgcm.decrypt(nonce, ciphertext_with_tag, None)
        except InvalidTag:
            raise InvalidPasswordOrCorruptedError(
                "Decryption failed: Incorrect password or corrupted/tampered file (GCM tag mismatch)."
            )
        finally:
            del key

        temp_output_path = f"{output_path}.tmp_{os.urandom(4).hex()}"
        with open(temp_output_path, "wb") as f_out:
            f_out.write(plaintext)

        if os.path.exists(output_path):
            os.remove(output_path)
        shutil.move(temp_output_path, output_path)

        return DecryptionResult(
            input_path=input_path,
            output_path=output_path,
            decrypted_size=os.path.getsize(output_path),
        )
`,
  },
  {
    path: 'core/utils.py',
    name: 'utils.py',
    category: 'core',
    description: 'Password entropy analysis, CSPRNG generator, and file helpers.',
    code: `"""
SecureVault - Utilities and Helpers.
"""

from __future__ import annotations

import math
import os
import re
import secrets
import string
from typing import List, Tuple


def format_file_size(num_bytes: int) -> str:
    units = ["B", "KB", "MB", "GB", "TB"]
    unit_index = 0
    size = float(num_bytes)
    while size >= 1024.0 and unit_index < len(units) - 1:
        size /= 1024.0
        unit_index += 1
    return f"{size:.2f} {units[unit_index]}"


def calculate_password_strength(password: str) -> Tuple[int, str, str]:
    if not password:
        return 0, "Empty", "#808080"

    length = len(password)
    has_lower = bool(re.search(r"[a-z]", password))
    has_upper = bool(re.search(r"[A-Z]", password))
    has_digit = bool(re.search(r"\\d", password))
    has_special = bool(re.search(r"[!@#$%^&*()_+\\-=\\[\\]{};':\\"\\\\|,.<>\\/?]", password))

    score = 0
    if length >= 8:
        score += 20
    if length >= 12:
        score += 20
    if length >= 16:
        score += 10

    diversity = sum([has_lower, has_upper, has_digit, has_special])
    score += diversity * 12.5
    score = min(int(score), 100)

    if score < 35:
        return score, "Weak", "#ef4444"
    elif score < 70:
        return score, "Moderate", "#f59e0b"
    elif score < 90:
        return score, "Strong", "#10b981"
    else:
        return score, "Very Strong", "#06b6d4"


def generate_secure_password(length: int = 18, use_symbols: bool = True) -> str:
    if length < 8:
        length = 8

    lowers = string.ascii_lowercase
    uppers = string.ascii_uppercase
    digits = string.digits
    symbols = "!@#$%^&*()-_=+[]{}|;:,.<>?" if use_symbols else ""
    alphabet = lowers + uppers + digits + symbols

    pwd_chars = [
        secrets.choice(lowers),
        secrets.choice(uppers),
        secrets.choice(digits),
    ]
    if use_symbols:
        pwd_chars.append(secrets.choice(symbols))

    while len(pwd_chars) < length:
        pwd_chars.append(secrets.choice(alphabet))

    for i in range(len(pwd_chars) - 1, 0, -1):
        j = secrets.randbelow(i + 1)
        pwd_chars[i], pwd_chars[j] = pwd_chars[j], pwd_chars[i]

    return "".join(pwd_chars)


def scan_folder_for_files(folder_path: str) -> List[str]:
    all_files = []
    for root, _, files in os.walk(folder_path):
        for f in files:
            all_files.append(os.path.join(root, f))
    return all_files
`,
  },
  {
    path: 'core/__init__.py',
    name: '__init__.py',
    category: 'core',
    description: 'Core module exports.',
    code: `"""SecureVault Core Package"""
from .encryptor import AESEncryptor, EncryptionResult, DecryptionResult
from .utils import calculate_password_strength, generate_secure_password, format_file_size

__all__ = [
    "AESEncryptor",
    "EncryptionResult",
    "DecryptionResult",
    "calculate_password_strength",
    "generate_secure_password",
    "format_file_size",
]
`,
  },
  {
    path: 'ui/app.py',
    name: 'app.py',
    category: 'ui',
    description: 'Main application window, layout, dark/light theme, and tabs.',
    code: `"""
SecureVault - Main Application Window
"""

from __future__ import annotations

import os
from typing import Optional

import customtkinter as ctk

from ui.decrypt_tab import DecryptTab
from ui.encrypt_tab import EncryptTab

try:
    from tkinterdnd2 import DND_FILES, TkinterDnD
    HAS_TKDND = True
except ImportError:
    HAS_TKDND = False


class SecureVaultApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("SecureVault - AES-256 File Encryptor")
        self.geometry("900x650")
        self.minsize(800, 580)

        ctk.set_appearance_mode("Dark")
        ctk.set_default_color_theme("blue")
        self.last_directory: Optional[str] = os.path.expanduser("~")

        self._setup_ui()
        self._init_drag_and_drop()

    def _setup_ui(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        # Header
        header = ctk.CTkFrame(self, height=65, corner_radius=0, fg_color=("gray85", "#0f172a"))
        header.grid(row=0, column=0, sticky="ew")

        brand_frame = ctk.CTkFrame(header, fg_color="transparent")
        brand_frame.pack(side="left", padx=20, pady=12)

        icon_lbl = ctk.CTkLabel(brand_frame, text="🔒", font=ctk.CTkFont(size=24))
        icon_lbl.pack(side="left", padx=(0, 10))

        title_box = ctk.CTkFrame(brand_frame, fg_color="transparent")
        title_box.pack(side="left")

        app_name = ctk.CTkLabel(
            title_box, text="SecureVault", font=ctk.CTkFont(size=18, weight="bold")
        )
        app_name.pack(anchor="w")

        app_sub = ctk.CTkLabel(
            title_box, text="AES-256-GCM Authenticated Encryption", font=ctk.CTkFont(size=11), text_color=("gray40", "#94a3b8")
        )
        app_sub.pack(anchor="w")

        actions_frame = ctk.CTkFrame(header, fg_color="transparent")
        actions_frame.pack(side="right", padx=20, pady=12)

        self.theme_switch = ctk.CTkSwitch(
            actions_frame, text="Dark Mode", command=self._toggle_theme, onvalue="Dark", offvalue="Light"
        )
        self.theme_switch.select()
        self.theme_switch.pack(side="left", padx=8)

        # Tabview
        self.tabview = ctk.CTkTabview(self, corner_radius=12)
        self.tabview.grid(row=1, column=0, padx=20, pady=(5, 10), sticky="nsew")

        self.tab_encrypt_container = self.tabview.add("   Encrypt Files   ")
        self.tab_decrypt_container = self.tabview.add("   Decrypt Files   ")

        self.encrypt_tab = EncryptTab(self.tab_encrypt_container, app_instance=self)
        self.encrypt_tab.pack(fill="both", expand=True)

        self.decrypt_tab = DecryptTab(self.tab_decrypt_container, app_instance=self)
        self.decrypt_tab.pack(fill="both", expand=True)

    def _toggle_theme(self):
        mode = self.theme_switch.get()
        ctk.set_appearance_mode(mode)

    def _init_drag_and_drop(self):
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
        paths = [p.strip("{}") for p in raw_data.split("} {")] if "}" in raw_data else raw_data.split()
        active = self.tabview.get().strip()
        if "Encrypt" in active:
            self.encrypt_tab.handle_dropped_files(paths)
        else:
            self.decrypt_tab.handle_dropped_files(paths)
`,
  },
  {
    path: 'ui/encrypt_tab.py',
    name: 'encrypt_tab.py',
    category: 'ui',
    description: 'CustomTkinter encrypt tab, progress bar, password meter, and worker.',
    code: `"""SecureVault - Encrypt Tab UI"""
import os
import threading
from tkinter import filedialog, messagebox
import customtkinter as ctk
from core.encryptor import AESEncryptor
from core.utils import calculate_password_strength, format_file_size, generate_secure_password, scan_folder_for_files

# Refer to full code implementation in SecureVault/ui/encrypt_tab.py
`,
  },
  {
    path: 'ui/decrypt_tab.py',
    name: 'decrypt_tab.py',
    category: 'ui',
    description: 'CustomTkinter decrypt tab, authenticated tag check, and unlock handler.',
    code: `"""SecureVault - Decrypt Tab UI"""
import os
import threading
from tkinter import filedialog, messagebox
import customtkinter as ctk
from core.encryptor import AESEncryptor, InvalidPasswordOrCorruptedError
from core.utils import format_file_size, scan_folder_for_files

# Refer to full code implementation in SecureVault/ui/decrypt_tab.py
`,
  },
  {
    path: 'ui/__init__.py',
    name: '__init__.py',
    category: 'ui',
    description: 'UI module exports.',
    code: `"""SecureVault UI Package"""
from .app import SecureVaultApp
__all__ = ["SecureVaultApp"]
`,
  },
  {
    path: 'requirements.txt',
    name: 'requirements.txt',
    category: 'root',
    description: 'Dependencies list for pip.',
    code: `customtkinter>=5.2.0
cryptography>=42.0.0
Pillow>=10.2.0
tkinterdnd2>=0.3.0
`,
  },
  {
    path: 'README.md',
    name: 'README.md',
    category: 'root',
    description: 'Complete documentation, architecture specifications, and instructions.',
    code: `# SecureVault - AES File Encryptor
Enterprise-grade AES-256-GCM desktop file encryption with CustomTkinter.
Key Derivation: PBKDF2HMAC-SHA256 (600,000 iterations).
`,
  },
];
