# SecureVault - AES File Encryptor

SecureVault is an enterprise-grade desktop file encryption and decryption application built with **Python 3.10+**, **CustomTkinter**, and the **cryptography** library. It uses **AES-256-GCM** (Authenticated Encryption with Associated Data) paired with **PBKDF2HMAC-SHA256** key stretching at **600,000 iterations** to guarantee confidentiality, authenticity, and defense against brute-force or tampering attacks.

---

## 🛡️ Cryptographic Architecture

| Security Parameter | Specification | Purpose |
| :--- | :--- | :--- |
| **Cipher** | **AES-256-GCM** | Authenticated Encryption with Associated Data (AEAD) |
| **Key Derivation** | **PBKDF2HMAC-SHA256** | Key stretching resistant to GPU/ASIC dictionary attacks |
| **Iteration Count** | **600,000 rounds** | Complies with OWASP & NIST modern password hashing standards |
| **Salt** | **16 bytes (128-bit)** | Cryptographically secure random (`os.urandom`) generated per file |
| **Nonce / IV** | **12 bytes (96-bit)** | Unique random initialization vector for every encryption operation |
| **Auth Tag** | **16 bytes (128-bit)** | Galois Counter Mode integrity verification; detects any bit-level modification |
| **Binary File Format** | `[16B Salt] + [12B Nonce] + [Ciphertext + 16B Tag]` | Standardized, cross-platform interoperable container |
| **Zero Knowledge** | Ephemeral RAM storage | Passwords and derived keys are never written to disk or logs |

---

## ✨ Features

- **Single & Batch Processing**: Encrypt or decrypt single files or full batches with live progress tracking.
- **Folder Recursion**: Recursively scan and encrypt/decrypt entire directories while preserving folder structure.
- **Drag & Drop Support**: Drag files or folders directly into the application window (via `tkinterdnd2`).
- **Modern GUI (CustomTkinter)**: Dark mode by default, seamless Light mode switch, and modern slate/cyan styling.
- **Password Strength Analyzer**: Real-time evaluation of password entropy with color-coded feedback (Weak, Moderate, Strong, Very Strong).
- **Secure Password Generator**: One-click generator creating 20-character high-entropy cryptographic passwords.
- **Tamper Detection**: Altering any single byte causes decryption to abort with a cryptographic authentication error.
- **Permanent Shred Option**: Securely overwrites and removes unencrypted original files upon request.
- **Non-Blocking Architecture**: Heavy key derivations and encryption routines run in background worker threads so the GUI never freezes.
- **Automatic Extension Handling**: Appends `.enc` to encrypted files and automatically strips it upon decryption.

---

## 📁 Project Structure

```text
SecureVault/
├── main.py                 # Application entry point & DPI bootstrap
├── ui/
│   ├── __init__.py
│   ├── app.py              # Main window, Tabview, Dark/Light theme, Drag & Drop
│   ├── encrypt_tab.py      # Encryption tab, drop zone, password controls, worker
│   └── decrypt_tab.py      # Decryption tab, authentication, unlock handler
├── core/
│   ├── __init__.py
│   ├── encryptor.py        # AES-256-GCM cryptographic engine & PBKDF2 (600k rounds)
│   └── utils.py            # Password strength, random generator, formatters
├── requirements.txt        # Python package dependencies
└── README.md               # Documentation & setup guide
```
## 🚀 Installation & Setup
1. Prerequisites
Python 3.10 or higher installed on your system.
Standard pip package manager.

2. Clone or Extract the Project
```
git clone https://github.com/your-username/SecureVault.git
cd SecureVault
```
3. Create a Virtual Environment (Recommended)
On macOS / Linux:

```
python3 -m venv venv
source venv/bin/activate

```
On Windows (Command Prompt / PowerShell):
```
python -m venv venv
.\venv\Scripts\activate
```
4. Install Dependencies
   ```
   pip install -r requirements.txt
   ````
   (Note for Linux users: If tkinter is not bundled with your Python distribution, install it via sudo apt-get install python3-tk)
💻 How to Run
Launch the desktop application with:
```
python main.py
```
Or on macOS/Linux:
```
python3 main.py
````
## 🔒 Security Best Practices
Keep Your Password Safe: AES-256-GCM authenticated encryption cannot be brute-forced without the password. If you lose your password, data recovery is mathematically impossible.
Tamper Proof: If anyone modifies even a single bit of an .enc file or inputs an incorrect password, GCM tag verification fails and aborts decryption immediately.
Memory Safety: Sensitive derived keys are discarded from memory as soon as processing completes.

## 📄 License
Apache License 2.0. Free for personal, educational, and commercial security usage.
