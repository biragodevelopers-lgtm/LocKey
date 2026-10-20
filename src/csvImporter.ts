// Client-side CSV parser and mapper for importing credentials from Chrome, Safari, Bitwarden, and 1Password.

import { base32Decode } from './crypto';

export interface ImportedCredential {
  username: string;
  passwordCiphertext: string;
  notes?: string;
  totpSecret?: string;
}

export interface ImportedApplication {
  name: string;
  url?: string;
  credentials: ImportedCredential[];
}

export interface ImportedGroup {
  name: string;
  applications: ImportedApplication[];
}

// Custom simple parser that handles quotes and newlines in CSV
export function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let curr = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          curr += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        curr += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(curr);
        curr = '';
      } else if (char === '\n' || char === '\r') {
        row.push(curr);
        curr = '';
        if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
          result.push(row);
        }
        row = [];
        if (char === '\r' && nextChar === '\n') {
          i++; // skip \n
        }
      } else {
        curr += char;
      }
    }
  }

  if (curr !== '' || row.length > 0) {
    row.push(curr);
    if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
      result.push(row);
    }
  }

  return result;
}

// Extracts a TOTP secret key from either a raw secret or an otpauth:// URI
export function extractTOTPSecret(value: string | undefined): string | undefined {
  if (!value) return undefined;
  
  const trimmed = value.trim();
  if (trimmed.startsWith('otpauth://')) {
    try {
      const url = new URL(trimmed);
      const secret = url.searchParams.get('secret');
      if (secret) {
        // Validate if it is valid base32
        base32Decode(secret);
        return secret.toUpperCase();
      }
    } catch (e) {
      // If parsing as URL fails, fallback to regex search
      const match = trimmed.match(/[?&]secret=([A-Z2-7]+)/i);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }
  }
  
  // Clean secret of spaces/hyphens and check if base32
  const cleaned = trimmed.replace(/[\s-]/g, '').toUpperCase();
  if (/^[A-Z2-7]+=*$/.test(cleaned)) {
    try {
      base32Decode(cleaned);
      return cleaned;
    } catch (e) {
      return undefined;
    }
  }
  
  return undefined;
}

// Main entrypoint for importing CSV content
export function importFromCSV(csvText: string, defaultGroupName: string = 'Importati'): ImportedGroup[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    throw new Error('Il file CSV è vuoto o non contiene intestazioni valide.');
  }

  const headers = rows[0].map(h => h.trim().toLowerCase());
  
  // Find indices for common headers
  let folderIdx = -1;
  let nameIdx = -1;
  let urlIdx = -1;
  let usernameIdx = -1;
  let passwordIdx = -1;
  let notesIdx = -1;
  let totpIdx = -1;

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    
    // Folder / Group mapping
    if (h === 'folder' || h === 'group' || h === 'gruppo' || h === 'category' || h === 'categoria') {
      folderIdx = i;
    }
    // Name / Title mapping
    else if (h === 'name' || h === 'title' || h === 'titolo' || h === 'nome') {
      nameIdx = i;
    }
    // URL mapping
    else if (h === 'url' || h === 'website' || h === 'sito' || h === 'login_uri' || h === 'uri') {
      urlIdx = i;
    }
    // Username mapping
    else if (h === 'username' || h === 'login_username' || h === 'email' || h === 'login_email' || h === 'utente') {
      usernameIdx = i;
    }
    // Password mapping
    else if (h === 'password' || h === 'login_password' || h === 'chiave') {
      passwordIdx = i;
    }
    // Notes mapping
    else if (h === 'notes' || h === 'note' || h === 'notes' || h === 'comment' || h === 'description' || h === 'descrizione') {
      notesIdx = i;
    }
    // TOTP mapping
    else if (h === 'totp' || h === 'login_totp' || h === 'otpauth' || h === '2fa' || h === 'otpauth_url' || h === 'secret') {
      totpIdx = i;
    }
  }

  // Fallback mappings if specific headers are not found
  if (nameIdx === -1 && urlIdx !== -1) nameIdx = urlIdx;
  if (urlIdx === -1 && nameIdx !== -1) urlIdx = nameIdx;
  
  if (usernameIdx === -1) {
    // Try to find a header containing 'user' or 'mail'
    usernameIdx = headers.findIndex(h => h.includes('user') || h.includes('mail') || h.includes('email'));
  }
  if (passwordIdx === -1) {
    // Try to find a header containing 'pass' or 'word'
    passwordIdx = headers.findIndex(h => h.includes('pass') || h.includes('word') || h.includes('chiave'));
  }

  if (passwordIdx === -1 || usernameIdx === -1) {
    throw new Error('Impossibile rilevare le colonne per username e password.');
  }

  const groupsMap = new Map<string, Map<string, ImportedApplication>>();

  // Process data rows
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length < Math.max(usernameIdx, passwordIdx)) continue;

    const username = row[usernameIdx]?.trim() || '';
    const password = row[passwordIdx]?.trim() || '';
    
    // We need at least a username or a password to import
    if (!username && !password) continue;

    const rawGroupName = folderIdx !== -1 ? row[folderIdx]?.trim() : '';
    const groupName = rawGroupName || defaultGroupName;

    const name = nameIdx !== -1 ? row[nameIdx]?.trim() : '';
    const url = urlIdx !== -1 ? row[urlIdx]?.trim() : '';
    const appName = name || (url ? new URL(url.startsWith('http') ? url : `http://${url}`).hostname : 'Sito Importato');
    
    const notes = notesIdx !== -1 ? row[notesIdx]?.trim() : undefined;
    
    // Extract TOTP
    let totpSecret: string | undefined;
    if (totpIdx !== -1 && row[totpIdx]) {
      totpSecret = extractTOTPSecret(row[totpIdx]);
    }

    // Check if we also have an OTPauth URL in notes
    if (!totpSecret && notes && notes.includes('otpauth://')) {
      const otpMatch = notes.match(/otpauth:\/\/[^\s]+/);
      if (otpMatch) {
        totpSecret = extractTOTPSecret(otpMatch[0]);
      }
    }

    // Get group map
    if (!groupsMap.has(groupName)) {
      groupsMap.set(groupName, new Map<string, ImportedApplication>());
    }
    const appsMap = groupsMap.get(groupName)!;

    // Get application
    const appKey = `${appName.toLowerCase()}_${(url || '').toLowerCase()}`;
    if (!appsMap.has(appKey)) {
      appsMap.set(appKey, {
        name: appName,
        url: url || undefined,
        credentials: []
      });
    }
    const app = appsMap.get(appKey)!;

    // Check for duplicate credentials within the same application
    const isDup = app.credentials.some(c => c.username === username && c.passwordCiphertext === password);
    if (!isDup) {
      app.credentials.push({
        username,
        passwordCiphertext: password,
        notes: notes || undefined,
        totpSecret
      });
    }
  }

  // Convert map to final structure
  const resultGroups: ImportedGroup[] = [];
  for (const [groupName, appsMap] of groupsMap.entries()) {
    const applications = Array.from(appsMap.values());
    if (applications.length > 0) {
      resultGroups.push({
        name: groupName,
        applications
      });
    }
  }

  return resultGroups;
}
