SecureVault - AES File Encryptor
SecureVault is an enterprise-grade, modern desktop application for securing and authenticating files and folders with AES-256-GCM authenticated encryption. Designed with CustomTkinter, it features a dark/light interface, real-time progress indicators, drag-and-drop file imports, password strength analysis, and defense against brute-force and tampering attacks.

🛡️ Security Architecture
Security Parameter	Specification	Purpose
Cipher	AES-256-GCM	Authenticated Encryption with Associated Data (AEAD)
Key Derivation	PBKDF2HMAC-SHA256	Key stretching resistant to GPU/ASIC attacks
Iteration Count	600,000 rounds	Complies with OWASP & NIST modern password hashing standards
Salt	16 bytes (128-bit)	Cryptographically secure random (os.urandom) generated per file
Nonce / IV	12 bytes (96-bit)	Unique initialization vector for each encryption operation
Auth Tag	16 bytes (128-bit)	Galois Counter Mode integrity verification; detects any bit-flip
Binary File Format	[16B Salt] + [12B Nonce] + [Ciphertext + 16B Tag]	Universal interoperable format
Zero Knowledge	In-memory ephemeral keys	Passwords and keys are never cached to disk
✨ Features
Single & Batch Processing: Encrypt or decrypt individual files or hundreds of files at once.
Folder Support: Recursively scan and encrypt/decrypt entire directories while preserving file structure.
Drag & Drop: Effortlessly drag files or folders directly into the application window.
Modern CustomTkinter GUI: Dark mode by default, seamless Light mode switch, sleek slate/cyan aesthetic.
Password Strength Analyzer: Real-time evaluation of password entropy with color-coded feedback (Weak, Moderate, Strong, Very Strong).
Secure Password Generator: One-click generator creating 20-character high-entropy cryptographic passwords.
Tamper & Corruption Detection: GCM authentication tags guarantee that altered or corrupted files cannot be decrypted with silent errors.
Permanent Shred Option: Securely overwrites and removes the original unencrypted file upon request.
Non-Blocking Architecture: Heavy cryptographic operations run in background worker threads with live progress meters.
Automatic Extension Handling: Appends .enc to encrypted files and automatically strips it upon decryption.
📁 Project Structure
SecureVault/
├── main.py                 # Application entry point
├── ui/
│   ├── __init__.py
│   ├── app.py              # Main window, navigation, header, theme toggle
│   ├── encrypt_tab.py      # Encryption tab, drop zone, password controls
│   └── decrypt_tab.py      # Decryption tab, authentication, unlock handler
├── core/
│   ├── __init__.py
│   ├── encryptor.py        # AES-256-GCM cryptographic engine
│   └── utils.py            # Password strength, random generator, formatting
├── requirements.txt        # Python package dependencies
└── README.md               # Documentation & setup guide
🚀 Installation & Setup
1. Prerequisites
Python 3.10 or higher installed on your system.
Standard pip package manager.
2. Clone or Extract the Project
git clone https://github.com/your-username/SecureVault.git
cd SecureVault
3. Create a Virtual Environment (Recommended)
# macOS / Linux
python3 -m venv venv
source venv/bin/activate

# Windows (Command Prompt / PowerShell)
python -m venv venv
.\venv\Scripts\activate
4. Install Dependencies
pip install -r requirements.txt
Note for Linux users: If tkinter is not bundled with your Python distribution, install it via:

sudo apt-get install python3-tk
💻 How to Run
Launch the application with:

python main.py
Or on macOS/Linux:

python3 main.py
🔒 Security Best Practices
Keep Your Password Safe: AES-256-GCM authenticated encryption is mathematically unbreakable without the key. If you lose your password, data recovery is impossible.
Tamper Proof: If anyone modifies even a single byte of an .enc file or guesses the password incorrectly, the GCM tag verification will fail and abort decryption immediately.
Chunking & Memory Safety: Sensitive derived keys are discarded immediately after processing.
📄 License
Apache License 2.0. Free for personal and commercial security usage.
