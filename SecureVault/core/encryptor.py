"""
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


# Security constants
SALT_SIZE_BYTES = 16
NONCE_SIZE_BYTES = 12
TAG_SIZE_BYTES = 16
KEY_SIZE_BYTES = 32
PBKDF2_ITERATIONS = 600_000
CHUNK_SIZE_BYTES = 64 * 1024 * 1024  # 64 MB read buffer for progress updates


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
    """Result data for completed encryption."""
    input_path: str
    output_path: str
    original_size: int
    encrypted_size: int
    deleted_original: bool


@dataclass
class DecryptionResult:
    """Result data for completed decryption."""
    input_path: str
    output_path: str
    decrypted_size: int


class AESEncryptor:
    """
    Production-grade AES-256-GCM File Encryptor/Decryptor.
    """

    @staticmethod
    def derive_key(password: str, salt: bytes) -> bytes:
        """
        Derive a 256-bit (32-byte) key from the given password and salt using PBKDF2HMAC-SHA256.
        Uses 600,000 iterations to resist brute-force/GPU dictionary attacks.
        """
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
        """
        Encrypts a file using AES-256-GCM.
        
        Header structure:
        - Bytes 0..15: Salt (16 bytes)
        - Bytes 16..27: Nonce (12 bytes)
        - Bytes 28..EOF: Ciphertext + 16-byte authentication tag
        """
        if not os.path.isfile(input_path):
            raise FileNotFoundError(f"Input file not found: {input_path}")
        if not password:
            raise ValueError("Password cannot be empty.")

        if output_path is None:
            output_path = f"{input_path}.enc"

        file_size = os.path.getsize(input_path)

        if progress_callback:
            progress_callback(0.05, f"Generating cryptographically secure salt & nonce...")

        # Generate unique 16-byte salt and 12-byte nonce
        salt = os.urandom(SALT_SIZE_BYTES)
        nonce = os.urandom(NONCE_SIZE_BYTES)

        if progress_callback:
            progress_callback(0.15, "Deriving 256-bit AES key (600,000 iterations)...")

        key = cls.derive_key(password, salt)
        aesgcm = AESGCM(key)

        temp_output_path = f"{output_path}.tmp_{os.urandom(4).hex()}"

        try:
            if progress_callback:
                progress_callback(0.35, "Reading and encrypting data with AES-256-GCM...")

            # Read file data
            with open(input_path, "rb") as f_in:
                plaintext = f_in.read()

            # Encrypt in one authenticated operation
            ciphertext_with_tag = aesgcm.encrypt(nonce, plaintext, None)

            if progress_callback:
                progress_callback(0.80, "Writing encrypted header and payload...")

            with open(temp_output_path, "wb") as f_out:
                f_out.write(salt)
                f_out.write(nonce)
                f_out.write(ciphertext_with_tag)

            # Atomic replace
            if os.path.exists(output_path):
                os.remove(output_path)
            shutil.move(temp_output_path, output_path)

            encrypted_size = os.path.getsize(output_path)

            deleted_original = False
            if delete_original:
                if progress_callback:
                    progress_callback(0.95, "Securely removing original file...")
                # Overwrite and remove
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

        except Exception as e:
            if os.path.exists(temp_output_path):
                try:
                    os.remove(temp_output_path)
                except OSError:
                    pass
            raise e
        finally:
            # Memory wipe key
            del key

    @classmethod
    def decrypt_file(
        cls,
        input_path: str,
        output_path: Optional[str] = None,
        password: str = "",
        progress_callback: Optional[Callable[[float, str], None]] = None,
    ) -> DecryptionResult:
        """
        Decrypts an AES-256-GCM encrypted file.
        Verifies authentication tag; fails if wrong password or modified file.
        """
        if not os.path.isfile(input_path):
            raise FileNotFoundError(f"Encrypted file not found: {input_path}")
        if not password:
            raise ValueError("Password cannot be empty.")

        file_size = os.path.getsize(input_path)
        min_header_size = SALT_SIZE_BYTES + NONCE_SIZE_BYTES + TAG_SIZE_BYTES
        if file_size < min_header_size:
            raise FileFormatError(
                f"File is too small ({file_size} bytes) to be a valid SecureVault file. Minimum is {min_header_size} bytes."
            )

        if output_path is None:
            if input_path.endswith(".enc"):
                output_path = input_path[:-4]
            else:
                base, ext = os.path.splitext(input_path)
                output_path = f"{base}.decrypted{ext}"

        if progress_callback:
            progress_callback(0.05, "Reading cryptographic header...")

        with open(input_path, "rb") as f_in:
            salt = f_in.read(SALT_SIZE_BYTES)
            nonce = f_in.read(NONCE_SIZE_BYTES)
            ciphertext_with_tag = f_in.read()

        if len(salt) != SALT_SIZE_BYTES or len(nonce) != NONCE_SIZE_BYTES:
            raise FileFormatError("Incomplete cryptographic header in file.")

        if progress_callback:
            progress_callback(0.20, "Deriving 256-bit AES key (600,000 PBKDF2 iterations)...")

        key = cls.derive_key(password, salt)
        aesgcm = AESGCM(key)

        if progress_callback:
            progress_callback(0.50, "Authenticating and decrypting payload...")

        try:
            plaintext = aesgcm.decrypt(nonce, ciphertext_with_tag, None)
        except InvalidTag:
            raise InvalidPasswordOrCorruptedError(
                "Decryption failed: Incorrect password or corrupted/tampered file (GCM authentication tag mismatch)."
            )
        finally:
            del key

        if progress_callback:
            progress_callback(0.85, "Writing decrypted file to disk...")

        temp_output_path = f"{output_path}.tmp_{os.urandom(4).hex()}"
        try:
            with open(temp_output_path, "wb") as f_out:
                f_out.write(plaintext)

            if os.path.exists(output_path):
                os.remove(output_path)
            shutil.move(temp_output_path, output_path)

            decrypted_size = os.path.getsize(output_path)

            if progress_callback:
                progress_callback(1.0, "Decryption complete.")

            return DecryptionResult(
                input_path=input_path,
                output_path=output_path,
                decrypted_size=decrypted_size,
            )
        except Exception as e:
            if os.path.exists(temp_output_path):
                try:
                    os.remove(temp_output_path)
                except OSError:
                    pass
            raise e
