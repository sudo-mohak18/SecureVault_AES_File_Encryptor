"""
SecureVault - Utility functions and helpers.
Includes password strength evaluation, secure password generator, and formatting helpers.
"""

from __future__ import annotations

import math
import os
import re
import secrets
import string
from typing import List, Tuple


def format_file_size(num_bytes: int) -> str:
    """Format bytes into a human-readable string (KB, MB, GB, etc.)."""
    if num_bytes < 0:
        return "0 B"
    units = ["B", "KB", "MB", "GB", "TB"]
    unit_index = 0
    size = float(num_bytes)
    while size >= 1024.0 and unit_index < len(units) - 1:
        size /= 1024.0
        unit_index += 1
    return f"{size:.2f} {units[unit_index]}"


def calculate_password_strength(password: str) -> Tuple[int, str, str]:
    """
    Evaluates password strength based on length, complexity, and entropy.
    Returns:
        (score_percent: 0-100, label: str, hex_color: str)
    """
    if not password:
        return 0, "Empty", "#808080"

    length = len(password)
    has_lower = bool(re.search(r"[a-z]", password))
    has_upper = bool(re.search(r"[A-Z]", password))
    has_digit = bool(re.search(r"\d", password))
    has_special = bool(re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", password))

    pool_size = 0
    if has_lower:
        pool_size += 26
    if has_upper:
        pool_size += 26
    if has_digit:
        pool_size += 10
    if has_special:
        pool_size += 33

    pool_size = max(pool_size, 10)
    entropy = length * math.log2(pool_size)

    # Score calculation
    score = 0
    if length >= 8:
        score += 20
    if length >= 12:
        score += 20
    if length >= 16:
        score += 10

    diversity = sum([has_lower, has_upper, has_digit, has_special])
    score += diversity * 12.5  # up to 50

    score = min(int(score), 100)

    if score < 35:
        return score, "Weak", "#ef4444"      # Red
    elif score < 70:
        return score, "Moderate", "#f59e0b"  # Amber
    elif score < 90:
        return score, "Strong", "#10b981"    # Emerald
    else:
        return score, "Very Strong", "#06b6d4"  # Cyan


def generate_secure_password(length: int = 18, use_symbols: bool = True) -> str:
    """
    Generates a cryptographically strong random password using Python's `secrets` module.
    Guarantees at least 1 uppercase, 1 lowercase, 1 digit, and 1 symbol.
    """
    if length < 8:
        length = 8

    lowers = string.ascii_lowercase
    uppers = string.ascii_uppercase
    digits = string.digits
    symbols = "!@#$%^&*()-_=+[]{}|;:,.<>?" if use_symbols else ""

    alphabet = lowers + uppers + digits + symbols

    # Guarantee required components
    pwd_chars = [
        secrets.choice(lowers),
        secrets.choice(uppers),
        secrets.choice(digits),
    ]
    if use_symbols:
        pwd_chars.append(secrets.choice(symbols))

    # Fill remaining
    while len(pwd_chars) < length:
        pwd_chars.append(secrets.choice(alphabet))

    # Secure shuffle
    for i in range(len(pwd_chars) - 1, 0, -1):
        j = secrets.randbelow(i + 1)
        pwd_chars[i], pwd_chars[j] = pwd_chars[j], pwd_chars[i]

    return "".join(pwd_chars)


def scan_folder_for_files(folder_path: str) -> List[str]:
    """Recursively collects all file paths within a directory."""
    all_files = []
    for root, _, files in os.walk(folder_path):
        for f in files:
            all_files.append(os.path.join(root, f))
    return all_files
