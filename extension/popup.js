// LocKey Companion - Popup Logic

let serverUrl = '';
let jwtToken = '';
let vaultPayload = null;
let vaultDb = null;
let masterKey = null;
let currentDomain = '';

// DOM Elements
const screenConfig = document.getElementById('screen-config');
const screenLogin = document.getElementById('screen-login');
const screenUnlock = document.getElementById('screen-unlock');
const screenMain = document.getElementById('screen-main');

const formConfig = document.getElementById('form-config');
const formLogin = document.getElementById('form-login');
const formUnlock = document.getElementById('form-unlock');

const configError = document.getElementById('config-error');
const loginError = document.getElementById('login-error');
const unlockError = document.getElementById('unlock-error');

const inputServerUrl = document.getElementById('server-url');
const inputUsername = document.getElementById('username');
const inputPassword = document.getElementById('password');
const inputMasterPassword = document.getElementById('master-password');
const inputSearch = document.getElementById('search-input');

const domainSection = document.getElementById('domain-section');
const spanCurrentDomain = document.getElementById('current-domain');
const divDomainCreds = document.getElementById('domain-creds');
const divAllCreds = document.getElementById('all-creds');

const btnChangeServer = document.getElementById('btn-change-server');
const btnLogout = document.getElementById('btn-logout');
const btnLock = document.getElementById('btn-lock');
const btnSync = document.getElementById('btn-sync');

// Initialize Extension Popup
document.addEventListener('DOMContentLoaded', async () => {
  // Carica configurazione da chrome.storage
  const data = await chrome.storage.local.get(['serverUrl', 'jwtToken', 'username']);
  
  if (data.serverUrl) {
    serverUrl = data.serverUrl;
    if (data.jwtToken) {
      jwtToken = data.jwtToken;
      // Abbiamo server e login, proviamo a scaricare il vault payload
      const success = await fetchVaultPayload();
      if (success) {
        showScreen('unlock');
      } else {
        // Token JWT scaduto o server non raggiungibile
        showScreen('login');
      }
    } else {
      showScreen('login');
    }
  } else {
    showScreen('config');
  }

  // Recupera il dominio attivo della scheda corrente
  detectCurrentTabDomain();
});

// Navigation Helpers
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${screenId}`).classList.add('active');
}

// ----------------------------------------------------
// API & Cryptography Helpers
// ----------------------------------------------------

async function fetchVaultPayload() {
  try {
    const response = await fetch(`${serverUrl}/api/vault`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Impossibile scaricare il vault.');
    }

    const data = await response.json();
    if (!data) {
      throw new Error('Nessun vault configurato sul server.');
    }
    
    vaultPayload = data;
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

// Converte stringa Base64 in ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derivazione chiave crittografica tramite PBKDF2
async function deriveKey(password, salt, iterations) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

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
    ['decrypt']
  );
}

// Decifra un testo AES-GCM
async function decryptData(ciphertext, nonce, key) {
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
  const nonceBuffer = base64ToArrayBuffer(nonce);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(nonceBuffer),
    },
    key,
    ciphertextBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

// ----------------------------------------------------
// UI Form Handlers
// ----------------------------------------------------

formConfig.addEventListener('submit', async (e) => {
  e.preventDefault();
  configError.style.display = 'none';
  const url = inputServerUrl.value.trim().replace(/\/$/, "");

  try {
    // Verifica connettività
    const response = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '', password: '' }) // Chiamata vuota solo per testare connettività
    });
    
    // Accetta errore 400 perché indica che il server risponde e mancano solo i parametri
    if (response.status === 400 || response.ok) {
      serverUrl = url;
      await chrome.storage.local.set({ serverUrl: url });
      showScreen('login');
    } else {
      throw new Error('Il server ha risposto con codice non valido.');
    }
  } catch (err) {
    configError.textContent = 'Server non raggiungibile o non valido.';
    configError.style.display = 'block';
  }
});

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';
  const username = inputUsername.value.trim();
  const password = inputPassword.value;

  try {
    const response = await fetch(`${serverUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Errore di autenticazione.');
    }

    jwtToken = data.token;
    await chrome.storage.local.set({ jwtToken: data.token, username: data.username });

    const success = await fetchVaultPayload();
    if (success) {
      showScreen('unlock');
    } else {
      throw new Error('Vault non presente su questo account.');
    }
  } catch (err) {
    loginError.textContent = err.message;
    loginError.style.display = 'block';
  }
});

formUnlock.addEventListener('submit', async (e) => {
  e.preventDefault();
  unlockError.style.display = 'none';
  const masterPassword = inputMasterPassword.value;

  if (!vaultPayload) return;

  try {
    const saltBytes = base64ToArrayBuffer(vaultPayload.salt);
    const key = await deriveKey(masterPassword, saltBytes, vaultPayload.iterations);

    const decryptedJson = await decryptData(
      vaultPayload.ciphertext,
      vaultPayload.nonce,
      key
    );

    vaultDb = JSON.parse(decryptedJson);
    masterKey = key; // Conserva solo in memoria del popup attivo

    showScreen('main');
    inputMasterPassword.value = '';
    renderVault();
  } catch (err) {
    console.error(err);
    unlockError.textContent = 'Master Password errata.';
    unlockError.style.display = 'block';
  }
});

// Logout
async function performLogout() {
  await chrome.storage.local.remove(['jwtToken', 'username']);
  jwtToken = '';
  vaultPayload = null;
  vaultDb = null;
  masterKey = null;
  showScreen('login');
}

btnLogout.addEventListener('click', performLogout);
btnChangeServer.addEventListener('click', () => showScreen('config'));

btnLock.addEventListener('click', () => {
  vaultDb = null;
  masterKey = null;
  showScreen('unlock');
});

btnSync.addEventListener('click', async () => {
  const success = await fetchVaultPayload();
  if (success && masterKey) {
    try {
      const decryptedJson = await decryptData(
        vaultPayload.ciphertext,
        vaultPayload.nonce,
        masterKey
      );
      vaultDb = JSON.parse(decryptedJson);
      renderVault();
      alert('Vault sincronizzato con successo!');
    } catch {
      alert('Errore decrittografia dopo sync.');
    }
  } else {
    alert('Errore di sincronizzazione.');
  }
});

// ----------------------------------------------------
// Domain Detection & Rendering
// ----------------------------------------------------

function detectCurrentTabDomain() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].url) {
      try {
        const urlObj = new URL(tabs[0].url);
        // Estrae il dominio base (es. google.com da www.google.com o accounts.google.com)
        const hostname = urlObj.hostname;
        const parts = hostname.split('.');
        if (parts.length >= 2) {
          // Prende le ultime due parti (es: google.com) o tre per domini complessi
          currentDomain = parts.slice(-2).join('.');
          if (parts[parts.length - 2] === 'co' || parts[parts.length - 2] === 'com') {
            // Es. google.co.uk o amazon.com.mx
            currentDomain = parts.slice(-3).join('.');
          }
        } else {
          currentDomain = hostname;
        }

        spanCurrentDomain.textContent = currentDomain;
        domainSection.style.display = 'flex';
      } catch (e) {
        // Schede di sistema (es. chrome://)
        domainSection.style.display = 'none';
        currentDomain = '';
      }
    } else {
      domainSection.style.display = 'none';
      currentDomain = '';
    }
  });
}

function renderVault() {
  if (!vaultDb) return;

  const searchQuery = inputSearch.value.toLowerCase().trim();
  
  // Estrai tutte le credenziali dal vault database
  const allCredentials = [];
  for (const group of vaultDb.groups) {
    for (const app of group.applications) {
      for (const cred of app.credentials) {
        allCredentials.push({
          id: cred.id,
          appName: app.name,
          appUrl: app.url || '',
          username: cred.username,
          password: cred.passwordCiphertext // Ricorda: nel nostro modello decifrato questo è in chiaro!
        });
      }
    }
  }

  // 1. Filtra per il dominio corrente
  let domainCreds = [];
  if (currentDomain) {
    domainCreds = allCredentials.filter(c => {
      const urlLower = c.appUrl.toLowerCase();
      const appNameLower = c.appName.toLowerCase();
      return urlLower.includes(currentDomain.toLowerCase()) || appNameLower.includes(currentDomain.toLowerCase());
    });
  }

  // Mostra/Nascondi sezione dominio corrente
  if (domainCreds.length > 0 && !searchQuery) {
    domainSection.style.display = 'flex';
    renderList(divDomainCreds, domainCreds);
  } else {
    domainSection.style.display = 'none';
  }

  // 2. Filtra tutte le credenziali in base alla barra di ricerca
  const filteredAll = allCredentials.filter(c => {
    if (!searchQuery) return true; // Mostra tutto
    return c.appName.toLowerCase().includes(searchQuery) ||
           c.username.toLowerCase().includes(searchQuery) ||
           c.appUrl.toLowerCase().includes(searchQuery);
  });

  renderList(divAllCreds, filteredAll);
}

function renderList(container, list) {
  container.innerHTML = '';
  
  if (list.length === 0) {
    container.innerHTML = '<div style="color:var(--text-secondary);font-size:12px;padding:8px;text-align:center;">Nessuna credenziale trovata.</div>';
    return;
  }

  list.forEach(c => {
    const card = document.createElement('div');
    card.className = 'cred-card';
    
    const info = document.createElement('div');
    info.className = 'cred-info';
    
    const title = document.createElement('div');
    title.className = 'cred-title';
    title.textContent = c.appName;
    
    const user = document.createElement('div');
    user.className = 'cred-user';
    user.textContent = c.username || 'Nessun username';
    
    info.appendChild(title);
    info.appendChild(user);
    
    const actions = document.createElement('div');
    actions.className = 'cred-actions';
    
    // Pulsante Copia Username
    const copyUserBtn = document.createElement('button');
    copyUserBtn.className = 'action-icon';
    copyUserBtn.innerHTML = '👤';
    copyUserBtn.title = 'Copia Username';
    copyUserBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(c.username);
      showNotification('Username copiato!');
    });

    // Pulsante Copia Password
    const copyPassBtn = document.createElement('button');
    copyPassBtn.className = 'action-icon';
    copyPassBtn.innerHTML = '🔑';
    copyPassBtn.title = 'Copia Password';
    copyPassBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(c.password);
      showNotification('Password copiata!');
      // Avvia pulizia degli appunti tra 30 secondi
      chrome.runtime.sendMessage({ action: 'startClipboardClearTimer', text: c.password });
    });

    // Pulsante Autocompila
    const autofillBtn = document.createElement('button');
    autofillBtn.className = 'action-icon';
    autofillBtn.innerHTML = '⚡';
    autofillBtn.title = 'Autocompila';
    autofillBtn.addEventListener('click', () => {
      autofillInActiveTab(c.username, c.password);
    });

    actions.appendChild(copyUserBtn);
    actions.appendChild(copyPassBtn);
    actions.appendChild(autofillBtn);
    
    card.appendChild(info);
    card.appendChild(actions);
    container.appendChild(card);
  });
}

inputSearch.addEventListener('input', renderVault);

// ----------------------------------------------------
// Autofill Injected Script Execution
// ----------------------------------------------------

function autofillInActiveTab(username, password) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (u, p) => {
          // Trova il campo password
          const passwordField = document.querySelector('input[type="password"]');
          if (!passwordField) {
            alert('Campo password non trovato nella pagina.');
            return;
          }

          const form = passwordField.form;
          let usernameField = null;

          if (form) {
            usernameField = form.querySelector('input[type="text"], input[type="email"], input:not([type])');
          } else {
            // Cerca all'indietro partendo dalla password
            const inputs = Array.from(document.querySelectorAll('input'));
            const passIdx = inputs.indexOf(passwordField);
            for (let i = passIdx - 1; i >= 0; i--) {
              const type = inputs[i].getAttribute('type') || 'text';
              if (type === 'text' || type === 'email') {
                usernameField = inputs[i];
                break;
              }
            }
          }

          if (usernameField) {
            usernameField.value = u;
            usernameField.dispatchEvent(new Event('input', { bubbles: true }));
            usernameField.dispatchEvent(new Event('change', { bubbles: true }));
          }

          passwordField.value = p;
          passwordField.dispatchEvent(new Event('input', { bubbles: true }));
          passwordField.dispatchEvent(new Event('change', { bubbles: true }));
        },
        args: [username, password]
      });
    }
  });
}

function showNotification(text) {
  // Semplice alert o notifica temporanea nel popup
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.bottom = '10px';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.background = 'var(--success-color)';
  notification.style.color = 'white';
  notification.style.padding = '6px 12px';
  notification.style.borderRadius = '4px';
  notification.style.fontSize = '11px';
  notification.style.fontWeight = 'bold';
  notification.style.zIndex = '1000';
  notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
  notification.textContent = text;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 1500);
}
