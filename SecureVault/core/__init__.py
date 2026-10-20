"""
SecureVault Core Package
Cryptographic engine and helper utilities for AES-256-GCM file encryption.
"""

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
