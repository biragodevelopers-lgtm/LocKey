// Client-side Zero-Knowledge Cryptography helpers using Web Crypto API

// Helper to convert ArrayBuffer to Base64 string
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 string to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

// Generate random salt (32 bytes)
export function generateRandomSalt(): Uint8Array {
  const salt = new Uint8Array(32);
  window.crypto.getRandomValues(salt);
  return salt;
}

// Generate random nonce (12 bytes for AES-GCM)
export function generateRandomNonce(): Uint8Array {
  const nonce = new Uint8Array(12);
  window.crypto.getRandomValues(nonce);
  return nonce;
}

// Derive a CryptoKey from a Master Password using PBKDF2
export async function deriveKey(password: string, salt: BufferSource, iterations: number = 100000): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import raw password as a base key
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive AES-GCM key
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext string using derived key (AES-GCM)
export async function encryptData(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; nonce: string }> {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(plaintext);
  const nonce = generateRandomNonce();

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce as BufferSource,
    },
    key,
    encodedData
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    nonce: arrayBufferToBase64(nonce.buffer as ArrayBuffer),
  };
}

// Decrypt ciphertext string using derived key (AES-GCM)
export async function decryptData(ciphertext: string, nonce: string, key: CryptoKey): Promise<string> {
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
  const nonceBuffer = base64ToArrayBuffer(nonce);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(nonceBuffer) as BufferSource,
    },
    key,
    ciphertextBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

// Unbiased password generator using rejection sampling from window.crypto
export function generateSecurePassword(
  length: number = 16,
  includeSymbols: boolean = true,
  includeNumbers: boolean = true
): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let pool = lowercase + uppercase;
  if (includeNumbers) pool += numbers;
  if (includeSymbols) pool += symbols;

  if (pool.length === 0) return '';

  const poolLength = pool.length;
  // To avoid modulo bias, we reject values that fall in the incomplete final block of 256
  const maxValidValue = 256 - (256 % poolLength);

  let password = '';
  const randomBytes = new Uint8Array(1);

  while (password.length < length) {
    window.crypto.getRandomValues(randomBytes);
    const value = randomBytes[0];

    // Rejection sampling
    if (value < maxValidValue) {
      password += pool.charAt(value % poolLength);
    }
  }

  return password;
}

// ----------------------------------------------------
// TOTP (Time-Based One-Time Password) Generator (RFC 6238)
// ----------------------------------------------------

// Helper to decode Base32 string to Uint8Array
export function base32Decode(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  const length = clean.length;
  const bits = length * 5;
  const bytes = new Uint8Array(Math.floor(bits / 8));
  
  let value = 0;
  let bitCount = 0;
  let index = 0;
  
  for (let i = 0; i < length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val === -1) throw new Error('Carattere Base32 non valido');
    value = (value << 5) | val;
    bitCount += 5;
    
    if (bitCount >= 8) {
      bytes[index++] = (value >> (bitCount - 8)) & 255;
      bitCount -= 8;
    }
  }
  return bytes;
}

// Generate a 6-digit TOTP code using Web Crypto API (HMAC-SHA1)
export async function generateTOTP(secretBase32: string): Promise<string> {
  try {
    const secretBytes = base32Decode(secretBase32);
    
    // Calculate current time step (30 seconds interval)
    const counter = Math.floor(Date.now() / 1000 / 30);
    const counterBytes = new Uint8Array(8);
    let temp = counter;
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = temp & 0xff;
      temp = Math.floor(temp / 256);
    }
    
    // Import Key for HMAC-SHA1
    const key = await window.crypto.subtle.importKey(
      'raw',
      secretBytes as any,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    // Calculate HMAC signature
    const signature = await window.crypto.subtle.sign(
      'HMAC',
      key,
      counterBytes as any
    );
    
    const hmac = new Uint8Array(signature);
    const offset = hmac[hmac.length - 1] & 0xf;
    
    // Dynamic truncation
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    );
    
    const otp = code % 1000000;
    return otp.toString().padStart(6, '0');
  } catch (error) {
    console.error('TOTP generation error:', error);
    return '000000';
  }
}

// ----------------------------------------------------
// WebAuthn Biometric API Helpers (Touch ID / Face ID)
// ----------------------------------------------------

// Register a hardware credential (Touch ID / Face ID) for local login
export async function registerBiometric(username: string): Promise<string> {
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: challenge,
      rp: { name: "LocKey" },
      user: {
        id: new Uint8Array([1, 2, 3, 4]),
        name: username,
        displayName: username
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }], // ES256
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required"
      },
      timeout: 60000
    }
  }) as PublicKeyCredential;

  if (!credential) throw new Error("Registrazione biometrica fallita.");
  return arrayBufferToBase64(credential.rawId);
}

// Authenticate user presence via Touch ID / Face ID
export async function authenticateBiometric(credentialIdBase64: string): Promise<boolean> {
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  const rawId = base64ToArrayBuffer(credentialIdBase64);

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: challenge,
      allowCredentials: [{
        id: rawId,
        type: "public-key"
      }],
      userVerification: "required",
      timeout: 60000
    }
  });

  return assertion !== null;
}

// Calculate SHA-1 hash of a string and return it as a hex string (uppercase)
export async function calculateSHA1(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
}

// Calculate password entropy in bits (E = L * log2(N))
export function calculatePasswordEntropy(password: string): number {
  if (!password) return 0;
  
  let poolSize = 0;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasDigit) poolSize += 10;
  if (hasSpecial) poolSize += 33; // estimated special character set size

  if (poolSize === 0) poolSize = 26;

  const entropy = password.length * Math.log2(poolSize);
  return Math.round(entropy);
}

