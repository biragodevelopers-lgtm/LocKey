// API Client for LocKey Auth & Sync

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('lockey_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface VaultPayload {
  ciphertext: string;
  salt: string;
  nonce: string;
  iterations: number;
}

export async function signUp(username: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Errore durante la registrazione.');
  }
}

export async function logIn(username: string, password: string): Promise<{ token: string; username: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Errore durante il login.');
  }

  localStorage.setItem('lockey_token', data.token);
  localStorage.setItem('lockey_username', data.username);
  return data;
}

export function logOut(): void {
  localStorage.removeItem('lockey_token');
  localStorage.removeItem('lockey_username');
}

export function getToken(): string | null {
  return localStorage.getItem('lockey_token');
}

export function getUsername(): string | null {
  return localStorage.getItem('lockey_username');
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}

export async function getVault(): Promise<VaultPayload | null> {
  const res = await fetch(`${API_BASE}/vault`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (res.status === 401) {
    logOut();
    throw new Error('Sessione scaduta. Effettua nuovamente il login.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Impossibile recuperare il vault.');
  }

  return data;
}

export async function saveVault(payload: VaultPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/vault`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  if (res.status === 401) {
    logOut();
    throw new Error('Sessione scaduta. Effettua nuovamente il login.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Impossibile salvare il vault.');
  }
}
