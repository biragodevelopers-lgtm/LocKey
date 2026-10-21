import { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Shield,
  Key,
  Search,
  RefreshCw,
  Globe,
  Download,
  Upload,
} from 'lucide-react';
import * as cryptoHelper from './crypto';
import * as api from './api';
import * as csvImporter from './csvImporter';
import * as syncEngine from './syncEngine';

// Translation dictionary
const translations = {
  it: {
    appName: "LocKey",
    nasTag: "NAS Personale",
    userLabel: "Utente",
    lock: "Blocca",
    logout: "Esci",
    cancel: "Annulla",
    save: "Salva",
    add: "Aggiungi",
    edit: "Modifica",
    delete: "Elimina",
    
    // Auth Screen
    authSubtitle: "Gestore di Password di Famiglia Self-Hosted",
    username: "Username",
    usernamePlaceholder: "Inserisci il tuo username",
    accountPassword: "Password dell'Account",
    accountPasswordPlaceholder: "••••••••",
    signup: "Registrati",
    login: "Accedi",
    signupPrompt: "Non hai ancora un account? ",
    signupLink: "Registrati qui",
    loginPrompt: "Hai già un account? ",
    loginLink: "Accedi qui",
    authError: "Errore durante l'autenticazione.",
    
    // Setup Vault Screen
    setupTitle: "Crea la tua Master Password",
    setupSubtitle: "Questa password verrà utilizzata per cifrare i tuoi dati. Non viene mai salvata sul server ed è impossibile recuperarla se persa.",
    masterPassword: "Master Password",
    masterPasswordConfirm: "Conferma Master Password",
    setupPlaceholder: "Minimo 8 caratteri",
    confirmPlaceholder: "Inserisci di nuovo",
    setupButton: "Inizializza Vault",
    backButton: "Indietro",
    passwordMismatch: "Le due password non coincidono.",
    passwordTooShort: "La Master Password deve essere lunga almeno 8 caratteri.",
    
    // Unlock Screen
    vaultLocked: "Vault Bloccato",
    welcomeBack: "Bentornato,",
    masterPasswordLabel: "Inserisci Master Password",
    unlockPlaceholder: "Inserisci la Master Password per decifrare",
    unlockButton: "Sblocca",
    
    // Sidebar Groups
    groupsTitle: "Gruppi",
    createGroup: "Crea Gruppo",
    newGroup: "Nuovo Gruppo",
    editGroup: "Modifica Gruppo",
    groupNameLabel: "Nome Gruppo",
    groupNamePlaceholder: "Es. Lavoro, Social...",
    confirmDeleteGroup: "Sei sicuro di voler eliminare questo gruppo e tutte le sue applicazioni?",
    
    // Middlebar Apps
    appsTitle: "Applicazioni",
    searchResults: "Risultati Ricerca",
    noResults: "Nessun risultato trovato",
    noApps: "Nessuna applicazione in questo gruppo",
    selectGroup: "Seleziona o crea un gruppo",
    newApp: "Nuova Applicazione",
    editApp: "Modifica Applicazione",
    confirmDeleteApp: "Sei sicuro di voler eliminare questa applicazione?",
    
    // Detail Panel
    addAccount: "Aggiungi Account",
    accountNum: "Account",
    editAccount: "Modifica Account",
    deleteAccount: "Elimina Account",
    notes: "Note",
    notesPlaceholder: "Eventuali note o risposte di sicurezza...",
    passwordLabel: "Password",
    copySuccess: "copiato! Verrà rimosso dagli appunti tra 30 secondi.",
    cantDeleteOnlyCred: "Non puoi eliminare l'unica credenziale di questa applicazione. Elimina l'intera applicazione se necessario.",
    confirmDeleteCred: "Sei sicuro di voler eliminare questa credenziale?",
    
    // Password Generator
    genTitle: "Generatore di Password Sicuro",
    genSubtitle: "Genera password ad alta entropia senza bias statistici direttamente sul tuo dispositivo",
    genLength: "Lunghezza caratteri",
    genNumbers: "Includi Numeri (0-9)",
    genSymbols: "Includi Simboli (!@#$...)",
    genRegen: "Rigenera",
    genCopy: "Copia",
    
    // Modals
    appNameLabel: "Nome Applicazione *",
    appNamePlaceholder: "Es. Google, Netflix...",
    webUrl: "URL (Sito Web)",
    webUrlPlaceholder: "Es. google.com",
    initialCreds: "Credenziali Iniziali",
    usernameEmail: "Username / Email",
    usernameEmailPlaceholder: "Es. nome@email.com",
    passwordOrGen: "Password o genera",
    totpLabel: "Codice OTP (2FA)",
    totpSecretLabel: "Segreto TOTP (Base32)",
    totpSecretPlaceholder: "Es. JBSWY3DPEHPK3PXP",
    expiresIn: "Scade in",
    seconds: "s",
    importCSV: "Importa CSV",
    enableBiometrics: "Abilita Touch ID",
    disableBiometrics: "Disabilita Touch ID",
    toolsSection: "Strumenti & Importazione",
    biometricsUnlock: "Sblocca con Touch ID",
    exportBackup: "Esporta Backup",
    importBackup: "Importa Backup .lockey",
    passwordHistory: "Cronologia Password",
    securityAudit: "Audit Sicurezza",
    weakPasswords: "Password Deboli",
    reusedPasswords: "Password Duplicate",
    pwnedPasswords: "Password Compromesse",
    checkCompromise: "Verifica Compromissione",
    scanLeak: "Avvia Scansione Leak",
    scanning: "Scansione in corso...",
    pwnedAlert: "ATTENZIONE: Questa password compare nei leak pubblici!",
    pwnedSafe: "Non trovata nei leak pubblici",
    entropyLabel: "Entropia",
    restore: "Ripristina",
    auditIntro: "Questo strumento analizza in locale il tuo database per rilevare password non sicure e controlla la loro compromissione nei leak pubblici tramite l'API di Have I Been Pwned in modalità Zero-Knowledge.",
    noVulnerabilities: "Grande! Nessuna vulnerabilità trovata nel tuo vault.",
    vulnerabilitiesFound: "Vulnerabilità trovate nel tuo Vault:",
  },
  en: {
    appName: "LocKey",
    nasTag: "Self-Hosted NAS",
    userLabel: "User",
    lock: "Lock",
    logout: "Logout",
    cancel: "Cancel",
    save: "Save",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    
    // Auth Screen
    authSubtitle: "Self-Hosted Family Password Manager",
    username: "Username",
    usernamePlaceholder: "Enter your username",
    accountPassword: "Account Password",
    accountPasswordPlaceholder: "••••••••",
    signup: "Sign Up",
    login: "Log In",
    signupPrompt: "Don't have an account yet? ",
    signupLink: "Sign up here",
    loginPrompt: "Already have an account? ",
    loginLink: "Log in here",
    authError: "Authentication error.",
    
    // Setup Vault Screen
    setupTitle: "Create your Master Password",
    setupSubtitle: "This password will be used to encrypt your data. It is never saved on the server and cannot be recovered if lost.",
    masterPassword: "Master Password",
    masterPasswordConfirm: "Confirm Master Password",
    setupPlaceholder: "Minimum 8 characters",
    confirmPlaceholder: "Enter again",
    setupButton: "Initialize Vault",
    backButton: "Back",
    passwordMismatch: "The two passwords do not match.",
    passwordTooShort: "The Master Password must be at least 8 characters long.",
    
    // Unlock Screen
    vaultLocked: "Vault Locked",
    welcomeBack: "Welcome back,",
    masterPasswordLabel: "Enter Master Password",
    unlockPlaceholder: "Enter Master Password to decrypt",
    unlockButton: "Unlock",
    
    // Sidebar Groups
    groupsTitle: "Groups",
    createGroup: "Create Group",
    newGroup: "New Group",
    editGroup: "Edit Group",
    groupNameLabel: "Group Name",
    groupNamePlaceholder: "e.g., Work, Social...",
    confirmDeleteGroup: "Are you sure you want to delete this group and all its applications?",
    
    // Middlebar Apps
    appsTitle: "Applications",
    searchResults: "Search Results",
    noResults: "No results found",
    noApps: "No applications in this group",
    selectGroup: "Select or create a group",
    newApp: "New Application",
    editApp: "Edit Application",
    confirmDeleteApp: "Are you sure you want to delete this application?",
    
    // Detail Panel
    addAccount: "Add Account",
    accountNum: "Account",
    editAccount: "Edit Account",
    deleteAccount: "Delete Account",
    notes: "Notes",
    notesPlaceholder: "Notes or security answers...",
    passwordLabel: "Password",
    copySuccess: "copied! It will be removed from clipboard in 30 seconds.",
    cantDeleteOnlyCred: "You cannot delete the only credential for this application. Delete the entire application if needed.",
    confirmDeleteCred: "Are you sure you want to delete this credential?",
    
    // Password Generator
    genTitle: "Secure Password Generator",
    genSubtitle: "Generate high-entropy bias-free passwords directly on your device",
    genLength: "Character length",
    genNumbers: "Include Numbers (0-9)",
    genSymbols: "Include Symbols (!@#$...)",
    genRegen: "Regenerate",
    genCopy: "Copy",
    
    // Modals
    appNameLabel: "Application Name *",
    appNamePlaceholder: "e.g., Google, Netflix...",
    webUrl: "URL (Website)",
    webUrlPlaceholder: "e.g., google.com",
    initialCreds: "Initial Credentials",
    usernameEmail: "Username / Email",
    usernameEmailPlaceholder: "e.g., name@email.com",
    passwordOrGen: "Password or generate",
    totpLabel: "OTP Code (2FA)",
    totpSecretLabel: "TOTP Secret (Base32)",
    totpSecretPlaceholder: "e.g., JBSWY3DPEHPK3PXP",
    expiresIn: "Expires in",
    seconds: "s",
    importCSV: "Import CSV",
    enableBiometrics: "Enable Touch ID",
    disableBiometrics: "Disable Touch ID",
    toolsSection: "Tools & Import",
    biometricsUnlock: "Unlock with Touch ID",
    exportBackup: "Export Backup",
    importBackup: "Import .lockey Backup",
    passwordHistory: "Password History",
    securityAudit: "Security Audit",
    weakPasswords: "Weak Passwords",
    reusedPasswords: "Reused Passwords",
    pwnedPasswords: "Compromised Passwords",
    checkCompromise: "Check Compromise",
    scanLeak: "Start Leak Scan",
    scanning: "Scanning...",
    pwnedAlert: "WARNING: This password appears in public leaks!",
    pwnedSafe: "Not found in public leaks",
    entropyLabel: "Entropy",
    restore: "Restore",
    auditIntro: "This tool analyzes your local database to detect insecure passwords and checks if they have been compromised in public data breaches using the Have I Been Pwned API in a Zero-Knowledge manner.",
    noVulnerabilities: "Great! No vulnerabilities found in your vault.",
    vulnerabilitiesFound: "Vulnerabilities found in your Vault:",
  }
};

// Types matching Swift models
interface PasswordHistoryEntry {
  passwordValue: string;
  updatedAt: string;
}

interface Credential {
  id: string;
  username: string;
  passwordCiphertext: string;
  passwordNonce: string;
  notes?: string;
  totpSecret?: string;
  createdAt: string;
  updatedAt: string;
  passwordHistory?: PasswordHistoryEntry[];
}

interface Application {
  id: string;
  name: string;
  url?: string;
  credentials: Credential[];
  createdAt: string;
  updatedAt: string;
}

interface Group {
  id: string;
  name: string;
  applications: Application[];
  createdAt: string;
  updatedAt: string;
}

interface VaultDatabase {
  groups: Group[];
  version: number;
  tombstones?: syncEngine.Tombstone[];
}

export default function App() {
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;

  useEffect(() => {
    if (isElectron) {
      setIsLoggedIn(true);
      setAccountUsername(localStorage.getItem('lockey_lang') === 'en' ? 'Local' : 'Locale');

      const loadLocalVault = async () => {
        setLoading(true);
        try {
          const payload = await (window as any).electronAPI.loadVault();
          if (payload) {
            setVaultPayload(payload);
          } else {
            setVaultPayload(null);
            setIsUnlocked(false);
          }
        } catch (e) {
          console.error("Errore caricamento vault locale in Electron:", e);
        } finally {
          setLoading(false);
        }
      };

      loadLocalVault();

      // Blocco automatico quando si perde il focus
      (window as any).electronAPI.onAppBlur(() => {
        setIsUnlocked(false);
        setMasterKey(null);
        setVaultDb(null);
        setMasterPassword('');
      });
    }
  }, [isElectron]);

  // Localization state
  const [lang, setLang] = useState<'it' | 'en'>(
    (localStorage.getItem('lockey_lang') as 'it' | 'en') || 'it'
  );
  
  const t = useMemo(() => translations[lang], [lang]);

  function toggleLang() {
    const nextLang = lang === 'it' ? 'en' : 'it';
    setLang(nextLang);
    localStorage.setItem('lockey_lang', nextLang);
  }

  // Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState(api.isLoggedIn());
  const [accountUsername, setAccountUsername] = useState(api.getUsername());
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Vault Unlock States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [vaultDb, setVaultDb] = useState<VaultDatabase | null>(null);
  const [vaultPayload, setVaultPayload] = useState<api.VaultPayload | null>(null);
  const [vaultError, setVaultError] = useState('');

  // Setup Master Password States
  const [setupMasterPassword, setSetupMasterPassword] = useState('');
  const [setupMasterPasswordConfirm, setSetupMasterPasswordConfirm] = useState('');

  // UI Selection States
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuditActive, setIsAuditActive] = useState(false);
  const [pwnedResults, setPwnedResults] = useState<{ [password: string]: { count: number; checked: boolean; loading: boolean } }>({});
  const [isPwnedScanning, setIsPwnedScanning] = useState(false);

  // Clipboard Clear Timer State
  const [clipboardTimer, setClipboardTimer] = useState<number | null>(null);

  // Password Generator State (independent panel)
  const [genLength, setGenLength] = useState(16);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Modal / Editor States
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Stati Verifica Aggiornamenti (Modalità A)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);

  const [showAppModal, setShowAppModal] = useState(false);
  const [appNameInput, setAppNameInput] = useState('');
  const [appUrlInput, setAppUrlInput] = useState('');
  const [appUsernameInput, setAppUsernameInput] = useState('');
  const [appPasswordInput, setAppPasswordInput] = useState('');
  const [appNotesInput, setAppNotesInput] = useState('');
  const [editingAppId, setEditingAppId] = useState<string | null>(null);

  const [showCredModal, setShowCredModal] = useState(false);
  const [credUsernameInput, setCredUsernameInput] = useState('');
  const [credPasswordInput, setCredPasswordInput] = useState('');
  const [credNotesInput, setCredNotesInput] = useState('');
  const [editingCredId, setEditingCredId] = useState<string | null>(null);

  // Visibility states for passwords
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});

  // New states for TOTP, CSV Import & WebAuthn Biometrics
  const [appTotpSecretInput, setAppTotpSecretInput] = useState('');
  const [credTotpSecretInput, setCredTotpSecretInput] = useState('');
  const [totpCodes, setTotpCodes] = useState<{ [credId: string]: string }>({});
  const [totpSecondsRemaining, setTotpSecondsRemaining] = useState(30);
  const [isBiometricsSupported, setIsBiometricsSupported] = useState(false);
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);

  // ----------------------------------------------------
  // IndexedDB Helpers for Biometric Storage
  // ----------------------------------------------------
  function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LocKeyBiometricDB', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('secrets')) {
          db.createObjectStore('secrets');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function setIndexedDB(key: string, value: any): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('secrets', 'readwrite');
      const store = transaction.objectStore('secrets');
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async function getIndexedDB(key: string): Promise<any> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('secrets', 'readonly');
      const store = transaction.objectStore('secrets');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function deleteIndexedDB(key: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('secrets', 'readwrite');
      const store = transaction.objectStore('secrets');
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ----------------------------------------------------
  // Biometrics and TOTP Countdown Ticker
  // ----------------------------------------------------
  useEffect(() => {
    // Check WebAuthn platform support
    if (window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          setIsBiometricsSupported(available);
        })
        .catch(() => setIsBiometricsSupported(false));
    }
    
    // Check if biometric credential exists
    const credId = localStorage.getItem('lockey_biometric_cred_id');
    setIsBiometricsEnabled(!!credId);
  }, []);

  useEffect(() => {
    let timer: number;
    
    async function updateTOTPs() {
      const now = Date.now();
      const seconds = Math.floor(now / 1000);
      const remaining = 30 - (seconds % 30);
      setTotpSecondsRemaining(remaining);

      if (!vaultDb) return;
      
      const newCodes: { [credId: string]: string } = {};
      let updated = false;

      // Find all credentials in the selected application that have a totpSecret
      if (selectedAppId) {
        for (const g of vaultDb.groups) {
          const app = g.applications.find(a => a.id === selectedAppId);
          if (app) {
            for (const cred of app.credentials) {
              if (cred.totpSecret) {
                try {
                  const code = await cryptoHelper.generateTOTP(cred.totpSecret);
                  newCodes[cred.id] = code;
                  updated = true;
                } catch (e) {
                  console.error('Failed to generate TOTP', e);
                }
              }
            }
            break;
          }
        }
      }

      if (updated) {
        setTotpCodes(newCodes);
      }
    }

    updateTOTPs();
    timer = window.setInterval(updateTOTPs, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [vaultDb, selectedAppId]);

  // Automatic Password Generation
  // ----------------------------------------------------
  useEffect(() => {
    if (isLoggedIn) {
      setGeneratedPassword(cryptoHelper.generateSecurePassword(genLength, genSymbols, genNumbers));
    }
  }, [genLength, genNumbers, genSymbols, isLoggedIn]);

  useEffect(() => {
    if (searchTerm) {
      setIsAuditActive(false);
    }
  }, [searchTerm]);

  // ----------------------------------------------------
  // Retrieve Vault Payload upon Login
  // ----------------------------------------------------
  useEffect(() => {
    if (isLoggedIn) {
      loadVaultPayload();
    } else {
      handleLock();
    }
  }, [isLoggedIn]);

  async function loadVaultPayload() {
    if (isElectron) return;
    setLoading(true);
    setVaultError('');
    try {
      const payload = await api.getVault();
      setVaultPayload(payload);
    } catch (err: any) {
      setVaultError(err.message || 'Error downloading vault.');
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------------------------------
  // Clipboard Auto-Clear Logic
  // ----------------------------------------------------
  function copyToClipboard(text: string, label: string) {
    if (isElectron) {
      (window as any).electronAPI.copyPassword(text);
      alert(`${label} ${t.copySuccess}`);
      return;
    }

    navigator.clipboard.writeText(text);

    // Clear previous timer
    if (clipboardTimer) {
      window.clearTimeout(clipboardTimer);
    }

    alert(`${label} ${t.copySuccess}`);

    const timer = window.setTimeout(async () => {
      try {
        const currentClipboard = await navigator.clipboard.readText();
        if (currentClipboard === text) {
          await navigator.clipboard.writeText('');
          console.log('Clipboard auto-cleared securely.');
        }
      } catch {
        await navigator.clipboard.writeText('');
        console.log('Clipboard overwritten.');
      }
    }, 30000);

    setClipboardTimer(timer);
  }

  // ----------------------------------------------------
  // Auth Operations (Signup / Login)
  // ----------------------------------------------------
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setLoading(true);

    try {
      if (authMode === 'signup') {
        await api.signUp(usernameInput, passwordInput);
        setAuthSuccess(lang === 'it' ? 'Account creato con successo! Ora puoi accedere.' : 'Account created successfully! You can now log in.');
        setAuthMode('login');
        setPasswordInput('');
      } else {
        const data = await api.logIn(usernameInput, passwordInput);
        setAccountUsername(data.username);
        setIsLoggedIn(true);
      }
    } catch (err: any) {
      setAuthError(err.message || t.authError);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    api.logOut();
    setIsLoggedIn(false);
    setAccountUsername(null);
    handleLock();
  }

  // ----------------------------------------------------
  // Vault Operations (Unlock / Setup / Lock / Save)
  // ----------------------------------------------------
  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!vaultPayload) return;
    setVaultError('');
    setLoading(true);

    try {
      const saltBytes = cryptoHelper.base64ToArrayBuffer(vaultPayload.salt);
      const key = await cryptoHelper.deriveKey(
        masterPassword,
        saltBytes as BufferSource,
        vaultPayload.iterations
      );

      const decryptedJson = await cryptoHelper.decryptData(
        vaultPayload.ciphertext,
        vaultPayload.nonce,
        key
      );

      const db: VaultDatabase = JSON.parse(decryptedJson);
      setMasterKey(key);
      setVaultDb(db);
      setIsUnlocked(true);
      setMasterPassword('');
      syncVault(db);

      if (db.groups.length > 0) {
        setSelectedGroupId(db.groups[0].id);
      }
    } catch (err: any) {
      setVaultError(lang === 'it' ? 'Master Password errata.' : 'Invalid Master Password.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetupVault(e: React.FormEvent) {
    e.preventDefault();
    if (setupMasterPassword !== setupMasterPasswordConfirm) {
      setVaultError(t.passwordMismatch);
      return;
    }
    if (setupMasterPassword.length < 8) {
      setVaultError(t.passwordTooShort);
      return;
    }

    setVaultError('');
    setLoading(true);

    try {
      const salt = cryptoHelper.generateRandomSalt();
      const iterations = 100000;
      const key = await cryptoHelper.deriveKey(setupMasterPassword, salt as BufferSource, iterations);

      const initialDb: VaultDatabase = {
        groups: [
          {
            id: window.crypto.randomUUID(),
            name: lang === 'it' ? 'Personale' : 'Personal',
            applications: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        version: 1,
      };

      const serialized = JSON.stringify(initialDb);
      const { ciphertext, nonce } = await cryptoHelper.encryptData(serialized, key);

      const payload: api.VaultPayload = {
        ciphertext,
        salt: cryptoHelper.arrayBufferToBase64(salt.buffer as ArrayBuffer),
        nonce,
        iterations,
      };

      if (isElectron) {
        await (window as any).electronAPI.saveVault(payload);
      } else {
        await api.saveVault(payload);
      }
      setVaultPayload(payload);
      setMasterKey(key);
      setVaultDb(initialDb);
      setIsUnlocked(true);
      setSelectedGroupId(initialDb.groups[0].id);
    } catch (err: any) {
      setVaultError(err.message || 'Error creating vault.');
    } finally {
      setLoading(false);
    }
  }

  function handleLock() {
    setIsUnlocked(false);
    setMasterKey(null);
    setVaultDb(null);
    setMasterPassword('');
    setSetupMasterPassword('');
    setSetupMasterPasswordConfirm('');
    setSelectedGroupId(null);
    setSelectedAppId(null);
    setSearchTerm('');
    setVisiblePasswords({});
    if (clipboardTimer) {
      window.clearTimeout(clipboardTimer);
      setClipboardTimer(null);
    }
  }

  async function syncVault(updatedDb: VaultDatabase) {
    if (!masterKey || !vaultPayload) return;

    try {
      if (isElectron) {
        const serialized = JSON.stringify(updatedDb);
        const { ciphertext, nonce } = await cryptoHelper.encryptData(serialized, masterKey);

        const payload: api.VaultPayload = {
          ciphertext,
          salt: vaultPayload.salt,
          nonce,
          iterations: vaultPayload.iterations,
        };

        await (window as any).electronAPI.saveVault(payload);
        setVaultDb(updatedDb);
        setVaultPayload(payload);
        return;
      }

      // Scarica l'ultimo payload del vault dal server per fare il merge
      const remotePayload = await api.getVault();
      let mergedDb = updatedDb;

      if (remotePayload) {
        try {
          // Decifra il vault remoto usando la masterKey corrente
          const decryptedRemoteJson = await cryptoHelper.decryptData(
            remotePayload.ciphertext,
            remotePayload.nonce,
            masterKey
          );
          const remoteDb: VaultDatabase = JSON.parse(decryptedRemoteJson);
          
          // Esegui il merge smart tramite il syncEngine
          mergedDb = syncEngine.mergeVaults(updatedDb, remoteDb);
        } catch (err) {
          console.error("Non è stato possibile decifrare il vault remoto per il merge. Procedo con il salvataggio locale.", err);
          // In caso di errore di decifratura (es. password diversa su server),
          // per sicurezza manteniamo il database locale senza forzare sovrascritture cieche se possibile.
        }
      }

      const serialized = JSON.stringify(mergedDb);
      const { ciphertext, nonce } = await cryptoHelper.encryptData(serialized, masterKey);

      const payload: api.VaultPayload = {
        ciphertext,
        salt: vaultPayload.salt,
        nonce,
        iterations: vaultPayload.iterations,
      };

      await api.saveVault(payload);
      setVaultDb(mergedDb);
      setVaultPayload(payload);
    } catch (err: any) {
      alert(lang === 'it' ? 'Errore di sincronizzazione: ' + err.message : 'Sync error: ' + err.message);
    }
  }

  // Restore password from history
  async function handleRestorePassword(credId: string, oldPassword: string) {
    if (!vaultDb || !selectedGroupId || !selectedAppId) return;

    const updatedDb = { ...vaultDb };
    const group = updatedDb.groups.find((g) => g.id === selectedGroupId);
    if (!group) return;

    const app = group.applications.find((a) => a.id === selectedAppId);
    if (!app) return;

    app.credentials = app.credentials.map((c) => {
      if (c.id === credId) {
        let newHistory = c.passwordHistory ? [...c.passwordHistory] : [];
        newHistory.unshift({
          passwordValue: c.passwordCiphertext,
          updatedAt: new Date().toISOString()
        });
        if (newHistory.length > 10) {
          newHistory = newHistory.slice(0, 10);
        }
        return {
          ...c,
          passwordCiphertext: oldPassword,
          updatedAt: new Date().toISOString(),
          passwordHistory: newHistory
        };
      }
      return c;
    });

    await syncVault(updatedDb);
  }

  // Check if a password is breached using Have I Been Pwned API (k-Anonymity)
  async function checkPasswordBreach(password: string): Promise<number> {
    if (!password) return 0;
    try {
      const sha1 = await cryptoHelper.calculateSHA1(password);
      const prefix = sha1.slice(0, 5);
      const suffix = sha1.slice(5);

      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      if (!res.ok) return 0;
      
      const text = await res.text();
      const lines = text.split('\n');
      for (const line of lines) {
        const [hashSuffix, countStr] = line.split(':');
        if (hashSuffix.trim() === suffix) {
          return parseInt(countStr.trim(), 10);
        }
      }
      return 0;
    } catch (e) {
      console.error("Have I Been Pwned API error:", e);
      return 0;
    }
  }

  // Run a global leak scan across all credentials in the vault
  async function runGlobalLeakScan() {
    if (!vaultDb || isPwnedScanning) return;
    setIsPwnedScanning(true);

    const passwordsToScan: string[] = [];
    vaultDb.groups.forEach(g => {
      g.applications.forEach(a => {
        a.credentials.forEach(c => {
          if (c.passwordCiphertext && !passwordsToScan.includes(c.passwordCiphertext)) {
            passwordsToScan.push(c.passwordCiphertext);
          }
        });
      });
    });

    const results = { ...pwnedResults };

    for (const pwd of passwordsToScan) {
      results[pwd] = { count: 0, checked: false, loading: true };
    }
    setPwnedResults({ ...results });

    for (const pwd of passwordsToScan) {
      const count = await checkPasswordBreach(pwd);
      results[pwd] = { count, checked: true, loading: false };
      setPwnedResults({ ...results });
      await new Promise(r => setTimeout(r, 100)); // rate limit courtesy
    }

    setIsPwnedScanning(false);
  }

  // Render password strength (Entropy) bar
  function renderPasswordStrength(password: string) {
    if (!password) return null;
    const entropy = cryptoHelper.calculatePasswordEntropy(password);
    
    let strengthLabel = '';
    let barColor = '';
    let barWidth = '';

    if (entropy < 40) {
      strengthLabel = lang === 'it' ? 'Molto Debole' : 'Very Weak';
      barColor = 'bg-red-500';
      barWidth = 'w-1/4';
    } else if (entropy < 60) {
      strengthLabel = lang === 'it' ? 'Debole' : 'Weak';
      barColor = 'bg-orange-500';
      barWidth = 'w-2/4';
    } else if (entropy < 80) {
      strengthLabel = lang === 'it' ? 'Media' : 'Medium';
      barColor = 'bg-yellow-500';
      barWidth = 'w-3/4';
    } else {
      strengthLabel = lang === 'it' ? 'Forte' : 'Strong';
      barColor = 'bg-emerald-500';
      barWidth = 'w-full';
    }

    return (
      <div className="flex flex-col gap-1 mt-1">
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-zinc-400 font-semibold">{t.entropyLabel}: <span className="font-mono">{entropy} bits</span></span>
          <span className={`font-bold ${
            entropy < 40 ? 'text-red-400' :
            entropy < 60 ? 'text-orange-400' :
            entropy < 80 ? 'text-yellow-400' :
            'text-emerald-400'
          }`}>{strengthLabel}</span>
        </div>
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
          <div className={`h-full ${barColor} ${barWidth} transition-all duration-300`}></div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Helper Getters & Selectors
  // ----------------------------------------------------
  const selectedGroup = useMemo(() => {
    if (!vaultDb) return null;
    return vaultDb.groups.find((g) => g.id === selectedGroupId) || null;
  }, [vaultDb, selectedGroupId]);

  const selectedApp = useMemo(() => {
    if (!selectedGroup) return null;
    return selectedGroup.applications.find((a) => a.id === selectedAppId) || null;
  }, [selectedGroup, selectedAppId]);

  const auditReport = useMemo(() => {
    if (!vaultDb) return { weak: [], duplicate: [], totalCount: 0 };

    const weak: { appName: string; appId: string; groupId: string; cred: Credential; entropy: number }[] = [];
    const duplicateMap: { [password: string]: { appName: string; appId: string; groupId: string; cred: Credential }[] } = {};
    let totalCount = 0;

    vaultDb.groups.forEach((g) => {
      g.applications.forEach((a) => {
        a.credentials.forEach((c) => {
          totalCount++;
          const entropy = cryptoHelper.calculatePasswordEntropy(c.passwordCiphertext);
          
          if (entropy < 60 || c.passwordCiphertext.length < 10) {
            weak.push({
              appName: a.name,
              appId: a.id,
              groupId: g.id,
              cred: c,
              entropy
            });
          }

          if (c.passwordCiphertext) {
            if (!duplicateMap[c.passwordCiphertext]) {
              duplicateMap[c.passwordCiphertext] = [];
            }
            duplicateMap[c.passwordCiphertext].push({
              appName: a.name,
              appId: a.id,
              groupId: g.id,
              cred: c
            });
          }
        });
      });
    });

    const duplicate: { password: string; items: { appName: string; appId: string; groupId: string; cred: Credential }[] }[] = [];
    Object.keys(duplicateMap).forEach((pwd) => {
      if (duplicateMap[pwd].length > 1) {
        duplicate.push({
          password: pwd,
          items: duplicateMap[pwd]
        });
      }
    });

    return {
      weak,
      duplicate,
      totalCount
    };
  }, [vaultDb]);

  function renderSecurityAuditDashboard() {
    if (!vaultDb) return null;

    const pwnedPasswords = Object.keys(pwnedResults).filter(pwd => pwnedResults[pwd].checked && pwnedResults[pwd].count > 0);
    const pwnedCount = pwnedPasswords.length;

    return (
      <div className="max-w-4xl w-full flex flex-col gap-6 animate-fade-in text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="text-indigo-400" size={24} />
              {t.securityAudit}
            </h2>
            <p className="text-sm text-zinc-400 mt-1 max-w-xl">
              {t.auditIntro}
            </p>
          </div>
          <button
            onClick={runGlobalLeakScan}
            disabled={isPwnedScanning}
            className={`btn flex items-center gap-2 py-2.5 px-4 font-semibold ${
              isPwnedScanning
                ? 'btn-secondary opacity-60 cursor-not-allowed'
                : 'btn-primary bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            <RefreshCw size={16} className={isPwnedScanning ? 'animate-spin' : ''} />
            {isPwnedScanning ? t.scanning : t.scanLeak}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {lang === 'it' ? "Password Totali" : "Total Passwords"}
            </span>
            <span className="text-3xl font-extrabold text-white mt-2 font-mono">
              {auditReport.totalCount}
            </span>
          </div>

          <div className={`glass-panel p-4 flex flex-col justify-between min-h-[100px] border-l-4 ${
            auditReport.weak.length > 0 ? 'border-l-red-500' : 'border-l-emerald-500'
          }`}>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {t.weakPasswords}
            </span>
            <span className={`text-3xl font-extrabold mt-2 font-mono ${
              auditReport.weak.length > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {auditReport.weak.length}
            </span>
          </div>

          <div className={`glass-panel p-4 flex flex-col justify-between min-h-[100px] border-l-4 ${
            auditReport.duplicate.length > 0 ? 'border-l-orange-500' : 'border-l-emerald-500'
          }`}>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {t.reusedPasswords}
            </span>
            <span className={`text-3xl font-extrabold mt-2 font-mono ${
              auditReport.duplicate.length > 0 ? 'text-orange-400' : 'text-emerald-400'
            }`}>
              {auditReport.duplicate.length}
            </span>
          </div>

          <div className={`glass-panel p-4 flex flex-col justify-between min-h-[100px] border-l-4 ${
            pwnedCount > 0 ? 'border-l-pink-500' : 'border-l-emerald-500'
          }`}>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {t.pwnedPasswords}
            </span>
            <span className={`text-3xl font-extrabold mt-2 font-mono ${
              pwnedCount > 0 ? 'text-pink-400' : 'text-emerald-400'
            }`}>
              {isPwnedScanning ? '...' : pwnedCount}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {auditReport.weak.length === 0 && auditReport.duplicate.length === 0 && pwnedCount === 0 && (
            <div className="glass-panel p-8 text-center flex flex-col items-center justify-center gap-2">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                <Shield size={36} />
              </div>
              <h3 className="text-lg font-bold text-white mt-2">{t.noVulnerabilities}</h3>
            </div>
          )}

          {auditReport.weak.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                {t.weakPasswords} ({auditReport.weak.length})
              </h3>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                {auditReport.weak.map(({ appName, appId, groupId, cred, entropy }, idx) => (
                  <div key={idx} className="glass-panel p-4 flex items-center justify-between gap-4 border-l-2 border-l-red-500/50">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-white font-semibold truncate">{appName}</span>
                      <span className="text-xs text-zinc-400 truncate">{cred.username}</span>
                      <span className="text-[10px] text-red-400 font-medium">
                        {lang === 'it' ? 'Entropia molto debole' : 'Very weak entropy'}: {entropy} bits (L: {cred.passwordCiphertext.length})
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedGroupId(groupId);
                        setSelectedAppId(appId);
                        setIsAuditActive(false);
                      }}
                      className="btn btn-secondary py-1 px-3 text-xs shrink-0"
                    >
                      {lang === 'it' ? 'Risolvi' : 'Resolve'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {auditReport.duplicate.length > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                {t.reusedPasswords} ({auditReport.duplicate.length})
              </h3>
              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                {auditReport.duplicate.map(({ password, items }, idx) => (
                  <div key={idx} className="glass-panel p-4 flex flex-col gap-2 border-l-2 border-l-orange-500/50">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 font-semibold uppercase">{lang === 'it' ? 'Password Condivisa' : 'Shared Password'}</span>
                      <span className="font-mono text-zinc-300">
                        {visiblePasswords[`audit_dup_${idx}`] ? password : '••••••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(`audit_dup_${idx}`)}
                        className="btn-icon p-1"
                        type="button"
                      >
                        {visiblePasswords[`audit_dup_${idx}`] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {items.map((item, itemIdx) => (
                        <div key={itemIdx} className="bg-black/20 p-2.5 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                          <div className="flex flex-col truncate mr-2">
                            <span className="text-zinc-200 font-medium truncate">{item.appName}</span>
                            <span className="text-zinc-500 truncate text-[10px]">{item.cred.username}</span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedGroupId(item.groupId);
                              setSelectedAppId(item.appId);
                              setIsAuditActive(false);
                            }}
                            className="btn btn-secondary py-0.5 px-2 text-[10px] shrink-0"
                          >
                            {lang === 'it' ? 'Cambia' : 'Change'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pwnedCount > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div>
                {t.pwnedPasswords} ({pwnedCount})
              </h3>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                {vaultDb.groups.flatMap(g => 
                  g.applications.flatMap(a => 
                    a.credentials.map(c => {
                      const pwned = pwnedResults[c.passwordCiphertext];
                      if (!pwned || !pwned.checked || pwned.count === 0) return null;
                      return (
                        <div key={c.id} className="glass-panel p-4 flex items-center justify-between gap-4 border-l-2 border-l-pink-500/50">
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-white font-semibold truncate">{a.name}</span>
                            <span className="text-xs text-zinc-400 truncate">{c.username}</span>
                            <span className="text-[10px] text-pink-400 font-medium">
                              {lang === 'it' 
                                ? `Compromessa: Trovata in ${pwned.count.toLocaleString()} leak pubblici!` 
                                : `Compromised: Found in ${pwned.count.toLocaleString()} public breaches!`}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedGroupId(g.id);
                              setSelectedAppId(a.id);
                              setIsAuditActive(false);
                            }}
                            className="btn btn-secondary py-1 px-3 text-xs shrink-0"
                          >
                            {lang === 'it' ? 'Risolvi' : 'Resolve'}
                          </button>
                        </div>
                      );
                    })
                  )
                ).filter(Boolean)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const searchedApps = useMemo(() => {
    if (!vaultDb) return [];
    if (!searchTerm.trim()) return null;

    const query = searchTerm.toLowerCase();
    const results: { app: Application; groupName: string; groupId: string }[] = [];

    vaultDb.groups.forEach((group) => {
      group.applications.forEach((app) => {
        const matchesName = app.name.toLowerCase().includes(query);
        const matchesCreds = app.credentials.some((c) => c.username.toLowerCase().includes(query));
        if (matchesName || matchesCreds) {
          results.push({ app, groupName: group.name, groupId: group.id });
        }
      });
    });

    return results;
  }, [vaultDb, searchTerm]);

  // ----------------------------------------------------
  // Group CRUD Operations
  // ----------------------------------------------------
  async function handleSaveGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!vaultDb || !groupNameInput.trim()) return;

    const updatedDb = { ...vaultDb };
    if (editingGroupId) {
      updatedDb.groups = updatedDb.groups.map((g) =>
        g.id === editingGroupId ? { ...g, name: groupNameInput.trim(), updatedAt: new Date().toISOString() } : g
      );
    } else {
      const newGroup: Group = {
        id: window.crypto.randomUUID(),
        name: groupNameInput.trim(),
        applications: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedDb.groups.push(newGroup);
      setSelectedGroupId(newGroup.id);
    }

    await syncVault(updatedDb);
    setGroupNameInput('');
    setEditingGroupId(null);
    setShowGroupModal(false);
  }

  async function handleDeleteGroup(groupId: string) {
    if (!vaultDb) return;
    if (!confirm(t.confirmDeleteGroup)) return;

    const updatedDb = { ...vaultDb };
    updatedDb.groups = updatedDb.groups.filter((g) => g.id !== groupId);

    // Registra tombstone per la sincronizzazione
    if (!updatedDb.tombstones) updatedDb.tombstones = [];
    updatedDb.tombstones.push({
      id: groupId,
      type: 'group',
      deletedAt: new Date().toISOString()
    });

    await syncVault(updatedDb);
    if (selectedGroupId === groupId) {
      setSelectedGroupId(updatedDb.groups[0]?.id || null);
      setSelectedAppId(null);
    }
  }

  // ----------------------------------------------------
  // Application CRUD Operations
  // ----------------------------------------------------
  async function handleSaveApp(e: React.FormEvent) {
    e.preventDefault();
    if (!vaultDb || !selectedGroupId || !appNameInput.trim()) return;

    const updatedDb = { ...vaultDb };
    const groupIdx = updatedDb.groups.findIndex((g) => g.id === selectedGroupId);
    if (groupIdx === -1) return;

    const group = updatedDb.groups[groupIdx];

    if (editingAppId) {
      group.applications = group.applications.map((a) =>
        a.id === editingAppId
          ? { ...a, name: appNameInput.trim(), url: appUrlInput.trim(), updatedAt: new Date().toISOString() }
          : a
      );
    } else {
      const newAppId = window.crypto.randomUUID();
      const newCredId = window.crypto.randomUUID();

      const newCred: Credential = {
        id: newCredId,
        username: appUsernameInput.trim(),
        passwordCiphertext: appPasswordInput,
        passwordNonce: '',
        notes: appNotesInput.trim() || undefined,
        totpSecret: appTotpSecretInput.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newApp: Application = {
        id: newAppId,
        name: appNameInput.trim(),
        url: appUrlInput.trim() || undefined,
        credentials: [newCred],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      group.applications.push(newApp);
      setSelectedAppId(newAppId);
    }

    await syncVault(updatedDb);
    setAppNameInput('');
    setAppUrlInput('');
    setAppUsernameInput('');
    setAppPasswordInput('');
    setAppNotesInput('');
    setAppTotpSecretInput('');
    setEditingAppId(null);
    setShowAppModal(false);
  }

  async function handleDeleteApp(appId: string) {
    if (!vaultDb || !selectedGroupId) return;
    if (!confirm(t.confirmDeleteApp)) return;

    const updatedDb = { ...vaultDb };
    const group = updatedDb.groups.find((g) => g.id === selectedGroupId);
    if (!group) return;

    group.applications = group.applications.filter((a) => a.id !== appId);

    // Registra tombstone per la sincronizzazione
    if (!updatedDb.tombstones) updatedDb.tombstones = [];
    updatedDb.tombstones.push({
      id: appId,
      type: 'application',
      deletedAt: new Date().toISOString()
    });

    await syncVault(updatedDb);
    if (selectedAppId === appId) {
      setSelectedAppId(null);
    }
  }

  // ----------------------------------------------------
  // Credential CRUD Operations
  // ----------------------------------------------------
  async function handleSaveCred(e: React.FormEvent) {
    e.preventDefault();
    if (!vaultDb || !selectedGroupId || !selectedAppId || !credPasswordInput) return;

    const updatedDb = { ...vaultDb };
    const group = updatedDb.groups.find((g) => g.id === selectedGroupId);
    if (!group) return;

    const app = group.applications.find((a) => a.id === selectedAppId);
    if (!app) return;

    if (editingCredId) {
      app.credentials = app.credentials.map((c) => {
        if (c.id === editingCredId) {
          let newHistory = c.passwordHistory ? [...c.passwordHistory] : [];
          if (c.passwordCiphertext !== credPasswordInput) {
            newHistory.unshift({
              passwordValue: c.passwordCiphertext,
              updatedAt: c.updatedAt || new Date().toISOString()
            });
            if (newHistory.length > 10) {
              newHistory = newHistory.slice(0, 10);
            }
          }
          return {
            ...c,
            username: credUsernameInput.trim(),
            passwordCiphertext: credPasswordInput,
            notes: credNotesInput.trim() || undefined,
            totpSecret: credTotpSecretInput.trim() || undefined,
            updatedAt: new Date().toISOString(),
            passwordHistory: newHistory
          };
        }
        return c;
      });
    } else {
      const newCred: Credential = {
        id: window.crypto.randomUUID(),
        username: credUsernameInput.trim(),
        passwordCiphertext: credPasswordInput,
        passwordNonce: '',
        notes: credNotesInput.trim() || undefined,
        totpSecret: credTotpSecretInput.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      app.credentials.push(newCred);
    }

    await syncVault(updatedDb);
    setCredUsernameInput('');
    setCredPasswordInput('');
    setCredNotesInput('');
    setCredTotpSecretInput('');
    setEditingCredId(null);
    setShowCredModal(false);
  }

  async function handleDeleteCred(credId: string) {
    if (!vaultDb || !selectedGroupId || !selectedAppId) return;
    const group = vaultDb.groups.find((g) => g.id === selectedGroupId);
    if (!group) return;

    const app = group.applications.find((a) => a.id === selectedAppId);
    if (!app) return;

    if (app.credentials.length <= 1) {
      alert(t.cantDeleteOnlyCred);
      return;
    }

    if (!confirm(t.confirmDeleteCred)) return;

    const updatedDb = { ...vaultDb };
    const updatedGroup = updatedDb.groups.find((g) => g.id === selectedGroupId)!;
    const updatedApp = updatedGroup.applications.find((a) => a.id === selectedAppId)!;
    updatedApp.credentials = updatedApp.credentials.filter((c) => c.id !== credId);

    // Registra tombstone per la sincronizzazione
    if (!updatedDb.tombstones) updatedDb.tombstones = [];
    updatedDb.tombstones.push({
      id: credId,
      type: 'credential',
      deletedAt: new Date().toISOString()
    });

    await syncVault(updatedDb);
  }

  function togglePasswordVisibility(id: string) {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // ----------------------------------------------------
  // CSV Import and Biometric Unlock Handlers
  // ----------------------------------------------------
  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !vaultDb) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const importedGroups = csvImporter.importFromCSV(text, lang === 'it' ? 'Importati' : 'Imported');
        const updatedDb = { ...vaultDb };
        
        for (const impGroup of importedGroups) {
          let group = updatedDb.groups.find(g => g.name.toLowerCase() === impGroup.name.toLowerCase());
          if (!group) {
            group = {
              id: window.crypto.randomUUID(),
              name: impGroup.name,
              applications: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            updatedDb.groups.push(group);
          }

          for (const impApp of impGroup.applications) {
            let app = group.applications.find(a => a.name.toLowerCase() === impApp.name.toLowerCase());
            if (!app) {
              app = {
                id: window.crypto.randomUUID(),
                name: impApp.name,
                url: impApp.url,
                credentials: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              group.applications.push(app);
            }

            for (const impCred of impApp.credentials) {
              const isDup = app.credentials.some(c => c.username === impCred.username);
              if (!isDup) {
                app.credentials.push({
                  id: window.crypto.randomUUID(),
                  username: impCred.username,
                  passwordCiphertext: impCred.passwordCiphertext,
                  passwordNonce: '',
                  notes: impCred.notes,
                  totpSecret: impCred.totpSecret,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
              }
            }
          }
        }

        await syncVault(updatedDb);
        alert(lang === 'it' ? 'Credenziali importate con successo!' : 'Credentials imported successfully!');
      } catch (err: any) {
        alert((lang === 'it' ? 'Errore durante l\'importazione: ' : 'Error during import: ') + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleExportBackup() {
    if (!vaultDb) return;
    const backupPassword = prompt(
      lang === 'it' 
        ? 'Inserisci una password per cifrare questo file di backup:' 
        : 'Enter a password to encrypt this backup file:'
    );
    if (!backupPassword) return;

    try {
      const salt = cryptoHelper.generateRandomSalt();
      const iterations = 100000;
      const key = await cryptoHelper.deriveKey(backupPassword, salt as BufferSource, iterations);

      const serialized = JSON.stringify(vaultDb);
      const { ciphertext, nonce } = await cryptoHelper.encryptData(serialized, key);

      const backupFile = {
        version: 1,
        salt: cryptoHelper.arrayBufferToBase64(salt.buffer as ArrayBuffer),
        encryptedVaultKey: ciphertext,
        encryptedGroups: '',
        nonce: nonce,
        iterations: iterations
      };

      const backupJSON = JSON.stringify(backupFile, null, 2);

      if (isElectron) {
        const success = await (window as any).electronAPI.exportBackup(backupJSON);
        if (success) {
          alert(lang === 'it' ? 'Backup esportato con successo!' : 'Backup exported successfully!');
        }
      } else {
        const blob = new Blob([backupJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_lockey_${new Date().toISOString().split('T')[0]}.lockey`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(lang === 'it' ? 'Backup scaricato con successo!' : 'Backup downloaded successfully!');
      }
    } catch (err: any) {
      alert((lang === 'it' ? 'Errore durante l\'esportazione: ' : 'Error during export: ') + err.message);
    }
  }

  async function handleImportBackup(e: React.ChangeEvent<HTMLInputElement> | null) {
    if (!vaultDb) return;

    let fileContent = '';

    try {
      if (isElectron) {
        fileContent = await (window as any).electronAPI.importBackup();
        if (!fileContent) return; // Annullato dall'utente
      } else {
        if (!e) return;
        const file = e.target.files?.[0];
        if (!file) return;

        fileContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string || '');
          reader.onerror = (err) => reject(err);
          reader.readAsText(file);
        });
      }

      const backupObj = JSON.parse(fileContent);
      if (!backupObj.salt || !backupObj.encryptedVaultKey || !backupObj.nonce) {
        throw new Error(lang === 'it' ? 'Formato del file di backup non valido.' : 'Invalid backup file format.');
      }

      const backupPassword = prompt(
        lang === 'it' 
          ? 'Inserisci la password utilizzata per cifrare il backup:' 
          : 'Enter the password used to encrypt the backup:'
      );
      if (!backupPassword) return;

      const saltBytes = cryptoHelper.base64ToArrayBuffer(backupObj.salt);
      const key = await cryptoHelper.deriveKey(backupPassword, saltBytes as BufferSource, backupObj.iterations || 100000);

      const decryptedJson = await cryptoHelper.decryptData(
        backupObj.encryptedVaultKey,
        backupObj.nonce,
        key
      );

      const remoteDb: VaultDatabase = JSON.parse(decryptedJson);
      const mergedDb = syncEngine.mergeVaults(vaultDb, remoteDb);
      
      await syncVault(mergedDb);
      alert(lang === 'it' ? 'Backup importato e fuso con successo!' : 'Backup imported and merged successfully!');
    } catch (err: any) {
      alert((lang === 'it' ? 'Errore durante l\'importazione: ' : 'Error during import: ') + err.message);
    } finally {
      if (e) e.target.value = '';
    }
  }

  const checkForUpdates = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatus(null);
    setUpdateAvailable(false);
    setUpdateUrl(null);

    try {
      const res = await fetch('https://api.github.com/repos/biragodevelopers-lgtm/LocKey/releases/latest');
      if (!res.ok) {
        throw new Error('Nessuna release trovata');
      }
      const data = await res.json();
      const latestTag = data.tag_name || '';
      const currentVersion = 'v1.0.4';

      if (latestTag && latestTag !== currentVersion) {
        setUpdateAvailable(true);
        setUpdateStatus(`Nuova versione disponibile: ${latestTag}!`);
        setUpdateUrl(data.html_url || 'https://github.com/biragodevelopers-lgtm/LocKey/releases/latest');
      } else {
        setUpdateAvailable(false);
        setUpdateStatus(`LocKey è aggiornato all'ultima versione (${currentVersion}).`);
      }
    } catch {
      setUpdateAvailable(false);
      setUpdateStatus('Nessuna connessione internet disponibile (offline).');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  async function toggleBiometrics() {
    try {
      if (isBiometricsEnabled) {
        localStorage.removeItem('lockey_biometric_cred_id');
        localStorage.removeItem('lockey_biometric_username');
        await deleteIndexedDB('encrypted_master_password');
        setIsBiometricsEnabled(false);
        alert(lang === 'it' ? 'Sblocco biometrico disabilitato.' : 'Biometric unlock disabled.');
      } else {
        if (!accountUsername) return;
        const pass = prompt(
          lang === 'it'
            ? 'Inserisci la tua Master Password per confermare l\'abilitazione del Touch ID:'
            : 'Enter your Master Password to confirm enabling Touch ID:'
        );
        if (!pass) return;

        if (!vaultPayload) return;
        const saltBytes = cryptoHelper.base64ToArrayBuffer(vaultPayload.salt);
        const key = await cryptoHelper.deriveKey(pass, saltBytes as BufferSource, vaultPayload.iterations);
        try {
          await cryptoHelper.decryptData(vaultPayload.ciphertext, vaultPayload.nonce, key);
        } catch {
          alert(lang === 'it' ? 'Master Password errata.' : 'Invalid Master Password.');
          return;
        }

        const credId = await cryptoHelper.registerBiometric(accountUsername);
        localStorage.setItem('lockey_biometric_cred_id', credId);
        localStorage.setItem('lockey_biometric_username', accountUsername);

        const encKey = await cryptoHelper.deriveKey(accountUsername, new Uint8Array([1,3,5,7,9,11,13,15]));
        const encrypted = await cryptoHelper.encryptData(pass, encKey);
        await setIndexedDB('encrypted_master_password', encrypted);

        setIsBiometricsEnabled(true);
        alert(lang === 'it' ? 'Touch ID abilitato con successo!' : 'Touch ID enabled successfully!');
      }
    } catch (err: any) {
      console.error(err);
      alert((lang === 'it' ? 'Errore biometrico: ' : 'Biometric error: ') + err.message);
    }
  }

  async function handleBiometricUnlock() {
    const credId = localStorage.getItem('lockey_biometric_cred_id');
    const bUsername = localStorage.getItem('lockey_biometric_username');
    if (!credId || !bUsername || !vaultPayload) return;

    setVaultError('');
    setLoading(true);

    try {
      const success = await cryptoHelper.authenticateBiometric(credId);
      if (!success) {
        throw new Error(lang === 'it' ? 'Autenticazione biometrica rifiutata o fallita.' : 'Biometric authentication rejected or failed.');
      }

      const stored = await getIndexedDB('encrypted_master_password');
      if (!stored || !stored.ciphertext || !stored.nonce) {
        throw new Error(lang === 'it' ? 'Credenziali locali non trovate. Riabilita Touch ID.' : 'Local credentials not found. Re-enable Touch ID.');
      }

      const encKey = await cryptoHelper.deriveKey(bUsername, new Uint8Array([1,3,5,7,9,11,13,15]));
      const pass = await cryptoHelper.decryptData(stored.ciphertext, stored.nonce, encKey);

      const saltBytes = cryptoHelper.base64ToArrayBuffer(vaultPayload.salt);
      const key = await cryptoHelper.deriveKey(
        pass,
        saltBytes as BufferSource,
        vaultPayload.iterations
      );

      const decryptedJson = await cryptoHelper.decryptData(
        vaultPayload.ciphertext,
        vaultPayload.nonce,
        key
      );

      const db: VaultDatabase = JSON.parse(decryptedJson);
      setMasterKey(key);
      setVaultDb(db);
      setIsUnlocked(true);
      syncVault(db);

      if (db.groups.length > 0) {
        setSelectedGroupId(db.groups[0].id);
      }
    } catch (err: any) {
      setVaultError(err.message || (lang === 'it' ? 'Errore Touch ID.' : 'Touch ID Error.'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------------------------------
  // UI Render Paths
  // ----------------------------------------------------

  // 1. Auth Page
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-height-100vh w-full px-4 animate-fade-in relative">
        {/* Language selector in cover top right */}
        <div className="absolute top-6 right-6">
          <button onClick={toggleLang} className="btn btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs">
            <Globe size={13} /> {lang === 'it' ? 'English (EN)' : 'Italiano (IT)'}
          </button>
        </div>

        <div className="glass-panel w-full max-w-md p-8 animate-slide-up relative">
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="p-3 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400">
              <Shield size={36} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t.appName}</h1>
            <p className="text-sm text-zinc-400 text-center">
              {t.authSubtitle}
            </p>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t.username}
              </label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder={t.usernamePlaceholder}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t.accountPassword}
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={t.accountPasswordPlaceholder}
              />
            </div>

            {authError && (
              <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-500/10">
                {authError}
              </p>
            )}

            {authSuccess && (
              <p className="text-sm text-emerald-400 bg-emerald-400/10 p-3 rounded-lg border border-emerald-500/10">
                {authSuccess}
              </p>
            )}

            <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
              {loading ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : authMode === 'login' ? (
                t.login
              ) : (
                t.signup
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            {authMode === 'login' ? (
              <p className="text-sm text-zinc-400">
                {t.signupPrompt}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError('');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold bg-transparent border-none cursor-pointer"
                >
                  {t.signupLink}
                </button>
              </p>
            ) : (
              <p className="text-sm text-zinc-400">
                {t.loginPrompt}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold bg-transparent border-none cursor-pointer"
                >
                  {t.loginLink}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Loading State
  if (loading && !isUnlocked && !vaultPayload) {
    return (
      <div className="flex items-center justify-center min-height-100vh w-full">
        <RefreshCw className="animate-spin text-indigo-400" size={32} />
      </div>
    );
  }

  // 3. Vault Setup (First time login)
  if (isLoggedIn && !vaultPayload) {
    return (
      <div className="flex items-center justify-center min-height-100vh w-full px-4 animate-fade-in">
        <div className="glass-panel w-full max-w-md p-8 animate-slide-up">
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="p-3 bg-purple-500/10 rounded-full border border-purple-500/20 text-purple-400">
              <Key size={36} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{t.setupTitle}</h2>
            <p className="text-sm text-zinc-400 text-center">
              {t.setupSubtitle}
            </p>
          </div>

          <form onSubmit={handleSetupVault} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t.masterPassword}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={setupMasterPassword}
                onChange={(e) => setSetupMasterPassword(e.target.value)}
                placeholder={t.setupPlaceholder}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t.masterPasswordConfirm}
              </label>
              <input
                type="password"
                required
                value={setupMasterPasswordConfirm}
                onChange={(e) => setSetupMasterPasswordConfirm(e.target.value)}
                placeholder={t.confirmPlaceholder}
              />
            </div>

            {vaultError && (
              <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-500/10">
                {vaultError}
              </p>
            )}

            <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
              {loading ? <RefreshCw className="animate-spin" size={18} /> : t.setupButton}
            </button>
            <button type="button" onClick={handleLogout} className="btn btn-secondary mt-1">
              {t.backButton}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 4. Unlock Vault Screen (Vault exists, needs Master Password)
  if (isLoggedIn && !isUnlocked) {
    return (
      <div className="flex items-center justify-center min-height-100vh w-full px-4 animate-fade-in relative">
        <div className="absolute top-6 right-6">
          <button onClick={toggleLang} className="btn btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs">
            <Globe size={13} /> {lang === 'it' ? 'English (EN)' : 'Italiano (IT)'}
          </button>
        </div>

        <div className="glass-panel w-full max-w-md p-8 animate-slide-up">
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="p-3 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400">
              <Lock size={36} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{t.vaultLocked}</h2>
            <p className="text-sm text-zinc-400">
              {t.welcomeBack} <span className="text-indigo-400 font-semibold">{accountUsername}</span>.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t.masterPasswordLabel}
              </label>
              <input
                type="password"
                required
                autoFocus
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                placeholder={t.unlockPlaceholder}
              />
            </div>

            {vaultError && (
              <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-500/10">
                {vaultError}
              </p>
            )}

            <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
              {loading ? <RefreshCw className="animate-spin" size={18} /> : t.unlockButton}
            </button>

            {isBiometricsEnabled && (
              <button
                type="button"
                onClick={handleBiometricUnlock}
                className="btn btn-secondary flex items-center justify-center gap-2 mt-1 py-2 hover:bg-white/5 transition-all"
                disabled={loading}
              >
                <Shield size={15} className="text-indigo-400" />
                {t.biometricsUnlock}
              </button>
            )}
            
            <div className="flex justify-between mt-4 text-sm text-zinc-400">
              <button
                type="button"
                onClick={handleLogout}
                className="text-zinc-500 hover:text-zinc-300 bg-transparent border-none cursor-pointer flex items-center gap-1"
              >
                <LogOut size={14} /> {t.logout}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 5. Main Dashboard (Vault Unlocked)
  return (
    <div className="flex flex-col w-full min-height-100vh overflow-hidden animate-fade-in">
      {/* Top Navbar */}
      <header className="glass-panel border-r-0 border-l-0 border-t-0 rounded-none px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Shield size={20} />
          </div>
          <span className="font-bold text-white tracking-wide text-lg">{t.appName}</span>
          <span className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-zinc-400">
            {t.nasTag}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-zinc-400 mr-2 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            {t.userLabel}: <strong className="text-zinc-200">{accountUsername}</strong>
          </div>
          
          {/* Language selector in navbar */}
          <button onClick={toggleLang} className="btn btn-secondary flex items-center gap-1 py-1.5 px-3 text-xs">
            <Globe size={13} /> {lang === 'it' ? 'EN' : 'IT'}
          </button>

          <button onClick={handleLock} className="btn btn-secondary flex items-center gap-1.5 py-1.5">
            <Lock size={15} /> {t.lock}
          </button>
          <button onClick={handleLogout} className="btn btn-danger flex items-center gap-1.5 py-1.5">
            <LogOut size={15} /> {t.logout}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden app-container">
        {/* Left Column: Groups */}
        <aside className="w-64 border-r border-white/5 bg-black/10 flex flex-col overflow-y-auto p-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t.groupsTitle}</h3>
            <button
              onClick={() => {
                setEditingGroupId(null);
                setGroupNameInput('');
                setShowGroupModal(true);
              }}
              className="btn-icon"
              title={t.createGroup}
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {vaultDb?.groups.map((group) => (
              <div
                key={group.id}
                onClick={() => {
                  setSelectedGroupId(group.id);
                  setSelectedAppId(null);
                  setSearchTerm('');
                }}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  selectedGroupId === group.id && !searchTerm
                    ? 'bg-indigo-500/10 border border-indigo-500/25 text-indigo-300'
                    : 'bg-white/[0.01] border border-transparent text-zinc-400 hover:bg-white/5'
                }`}
              >
                <span className="font-medium truncate mr-2">{group.name}</span>
                <div className="flex items-center gap-1 shrink-0 opacity-0 hover:opacity-100 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingGroupId(group.id);
                      setGroupNameInput(group.name);
                      setShowGroupModal(true);
                    }}
                    className="btn-icon p-1 hover:text-white"
                  >
                    <Edit2 size={12} />
                  </button>
                  {vaultDb.groups.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(group.id);
                      }}
                      className="btn-icon p-1 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Search section */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
              <input
                type="text"
                placeholder={lang === 'it' ? "Cerca password..." : "Search passwords..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 py-2 text-sm"
              />
            </div>
          </div>

          {/* Tools & Import Section */}
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {t.toolsSection}
            </span>
            <label className="btn btn-secondary py-1.5 px-3 text-xs text-center cursor-pointer flex items-center justify-center gap-1.5 hover:bg-white/5 transition-all">
              <Plus size={13} />
              {t.importCSV}
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                className="hidden"
              />
            </label>

            {/* Esportazione Backup */}
            <button
              onClick={handleExportBackup}
              className="btn btn-secondary py-1.5 px-3 text-xs flex items-center justify-center gap-1.5 hover:bg-white/5 transition-all"
            >
              <Download size={13} />
              {t.exportBackup}
            </button>

            {/* Importazione Backup */}
            {isElectron ? (
              <button
                onClick={() => handleImportBackup(null)}
                className="btn btn-secondary py-1.5 px-3 text-xs flex items-center justify-center gap-1.5 hover:bg-white/5 transition-all"
              >
                <Upload size={13} />
                {t.importBackup}
              </button>
            ) : (
              <label className="btn btn-secondary py-1.5 px-3 text-xs text-center cursor-pointer flex items-center justify-center gap-1.5 hover:bg-white/5 transition-all">
                <Upload size={13} />
                {t.importBackup}
                <input
                  type="file"
                  accept=".lockey"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            )}

            {isBiometricsSupported && !isElectron && (
              <button
                onClick={toggleBiometrics}
                className="btn btn-secondary py-1.5 px-3 text-xs flex items-center justify-center gap-1.5 hover:bg-white/5 transition-all"
              >
                <Shield size={13} />
                {isBiometricsEnabled ? t.disableBiometrics : t.enableBiometrics}
              </button>
            )}

            {/* Audit di Sicurezza */}
            <button
              onClick={() => {
                setSelectedGroupId(null);
                setSelectedAppId(null);
                setSearchTerm('');
                setIsAuditActive(true);
              }}
              className={`btn py-1.5 px-3 text-xs flex items-center justify-center gap-1.5 transition-all ${
                isAuditActive 
                  ? 'btn-primary bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 shadow shadow-indigo-500/10' 
                  : 'btn-secondary hover:bg-white/5 border-transparent'
              }`}
            >
              <Shield size={13} />
              {t.securityAudit}
            </button>
          </div>

          {/* Footer BiragoDev & Verifica Aggiornamenti (Modalità A) */}
          <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span className="font-semibold text-zinc-400">LocKey v1.0.4</span>
              <a 
                href="https://www.biragodev.it" 
                target="_blank" 
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                BiragoDev
              </a>
            </div>

            <button
              onClick={checkForUpdates}
              disabled={isCheckingUpdate}
              className="btn btn-secondary py-1.5 px-2.5 text-[11px] flex items-center justify-center gap-1.5 hover:bg-white/5 transition-all text-zinc-300"
            >
              <RefreshCw size={12} className={isCheckingUpdate ? "animate-spin text-indigo-400" : ""} />
              {isCheckingUpdate ? "Verifica in corso..." : "Verifica aggiornamenti"}
            </button>

            {updateStatus && (
              <div className="text-[11px] p-2 rounded bg-black/40 border border-white/10 flex flex-col gap-1.5 mt-1">
                <span className={updateAvailable ? "text-emerald-400 font-medium" : "text-zinc-400"}>
                  {updateStatus}
                </span>
                {updateUrl && (
                  <a
                    href={updateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary py-1 px-2 text-[10px] text-center flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded"
                  >
                    <Download size={11} /> Scarica Aggiornamento
                  </a>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Middle Column: Applications list */}
        {!isAuditActive && (
          <section className="w-80 border-r border-white/5 flex flex-col p-4 shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {searchTerm ? t.searchResults : t.appsTitle}
              </h3>
              {!searchTerm && selectedGroupId && (
                <button
                  onClick={() => {
                    setEditingAppId(null);
                    setAppNameInput('');
                    setAppUrlInput('');
                    setAppUsernameInput('');
                    setAppPasswordInput('');
                    setAppNotesInput('');
                    setAppTotpSecretInput('');
                    setShowAppModal(true);
                  }}
                  className="btn-icon"
                  title={t.newApp}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {searchTerm ? (
                searchedApps && searchedApps.length > 0 ? (
                  searchedApps.map(({ app, groupName, groupId }) => (
                    <div
                      key={app.id}
                      onClick={() => {
                        setSelectedGroupId(groupId);
                        setSelectedAppId(app.id);
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-all border ${
                        selectedAppId === app.id
                          ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300'
                          : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      <div className="font-semibold text-zinc-200 truncate">{app.name}</div>
                      <div className="text-xs text-zinc-500 mt-1 flex items-center justify-between">
                        <span className="truncate">{app.credentials[0]?.username}</span>
                        <span className="px-1.5 py-0.2 bg-white/5 rounded border border-white/10 text-[10px]">
                          {groupName}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-zinc-500 text-center mt-4">{t.noResults}</div>
                )
              ) : (
                selectedGroup ? (
                  selectedGroup.applications.length > 0 ? (
                    selectedGroup.applications.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => setSelectedAppId(app.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all border ${
                          selectedAppId === app.id
                            ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300'
                            : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-200 truncate">{app.name}</span>
                          <div className="flex items-center gap-1 opacity-0 hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAppId(app.id);
                                setAppNameInput(app.name);
                                setAppUrlInput(app.url || '');
                                setShowAppModal(true);
                              }}
                              className="btn-icon p-1 hover:text-white"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteApp(app.id);
                              }}
                              className="btn-icon p-1 hover:text-red-400"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-zinc-500 mt-1 truncate">
                          {app.credentials[0]?.username || (lang === 'it' ? 'Nessun account' : 'No account')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-zinc-500 text-center mt-4">{t.noApps}</div>
                  )
                ) : (
                  <div className="text-sm text-zinc-500 text-center mt-4">{t.selectGroup}</div>
                )
              )}
            </div>
          </section>
        )}

        {/* Right Column: App details or Password Generator */}
        {isAuditActive ? (
          <main className="flex-1 p-6 overflow-y-auto bg-black/5 flex flex-col items-center">
            {renderSecurityAuditDashboard()}
          </main>
        ) : (
          <main className="flex-1 p-6 overflow-y-auto flex flex-col bg-black/5">
            {selectedApp ? (
            <div className="max-w-2xl w-full flex flex-col gap-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedApp.name}</h2>
                  {selectedApp.url && (
                    <a
                      href={selectedApp.url.startsWith('http') ? selectedApp.url : `https://${selectedApp.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 mt-1 inline-flex"
                    >
                      {selectedApp.url} <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <button
                  onClick={() => {
                    setEditingCredId(null);
                    setCredUsernameInput('');
                    setCredPasswordInput('');
                    setCredNotesInput('');
                    setCredTotpSecretInput('');
                    setShowCredModal(true);
                  }}
                  className="btn btn-secondary py-2"
                >
                  <Plus size={15} /> {t.addAccount}
                </button>
              </div>

              {/* List of accounts / credentials */}
              <div className="flex flex-col gap-4">
                {selectedApp.credentials.map((cred, index) => (
                  <div key={cred.id} className="glass-panel p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                        {t.accountNum} #{index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCredId(cred.id);
                            setCredUsernameInput(cred.username);
                            setCredPasswordInput(cred.passwordCiphertext);
                            setCredNotesInput(cred.notes || '');
                            setCredTotpSecretInput(cred.totpSecret || '');
                            setShowCredModal(true);
                          }}
                          className="btn-icon p-1"
                          title={t.editAccount}
                        >
                          <Edit2 size={13} />
                        </button>
                        {selectedApp.credentials.length > 1 && (
                          <button
                            onClick={() => handleDeleteCred(cred.id)}
                            className="btn-icon p-1 hover:text-red-400"
                            title={t.deleteAccount}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Username */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-500 font-semibold uppercase">{t.username}</label>
                        <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                          <span className="text-zinc-200 select-all font-medium">{cred.username}</span>
                          <button
                            onClick={() => copyToClipboard(cred.username, t.username)}
                            className="btn-icon p-1"
                            title={lang === 'it' ? "Copia Username" : "Copy Username"}
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Password */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-500 font-semibold uppercase">{t.passwordLabel}</label>
                        <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                          <span className="text-zinc-200 font-mono tracking-wide">
                            {visiblePasswords[cred.id] ? cred.passwordCiphertext : '••••••••••••'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => togglePasswordVisibility(cred.id)}
                              className="btn-icon p-1"
                              title={visiblePasswords[cred.id] ? (lang === 'it' ? 'Nascondi Password' : 'Hide Password') : (lang === 'it' ? 'Mostra Password' : 'Show Password')}
                            >
                              {visiblePasswords[cred.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(cred.passwordCiphertext, t.passwordLabel)}
                              className="btn-icon p-1"
                              title={lang === 'it' ? "Copia Password" : "Copy Password"}
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TOTP 2FA */}
                    {cred.totpSecret && (
                      <div className="flex flex-col gap-1 mt-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-zinc-500 font-semibold uppercase">{t.totpLabel}</label>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {t.expiresIn} {totpSecondsRemaining}{t.seconds}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                          <span className="text-indigo-300 font-mono tracking-widest text-lg font-bold">
                            {totpCodes[cred.id] ? (
                              `${totpCodes[cred.id].slice(0, 3)} ${totpCodes[cred.id].slice(3)}`
                            ) : (
                              '------'
                            )}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => copyToClipboard(totpCodes[cred.id] || '', t.totpLabel)}
                              className="btn-icon p-1"
                              title={lang === 'it' ? "Copia Codice OTP" : "Copy OTP Code"}
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Password History */}
                    {cred.passwordHistory && cred.passwordHistory.length > 0 && (
                      <div className="flex flex-col gap-1 mt-3">
                        <details className="group/hist bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                          <summary className="flex items-center justify-between p-3 text-xs text-zinc-400 font-semibold uppercase cursor-pointer hover:bg-white/5 select-none transition-colors">
                            <span>{t.passwordHistory} ({cred.passwordHistory.length})</span>
                            <span className="text-zinc-500 group-open/hist:rotate-180 transition-transform">▼</span>
                          </summary>
                          <div className="p-3 border-t border-white/5 flex flex-col gap-2 max-h-40 overflow-y-auto">
                            {cred.passwordHistory.map((hist, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                                <div className="flex flex-col min-w-0 mr-2">
                                  <span className="font-mono text-zinc-300 truncate">
                                    {visiblePasswords[`hist_${cred.id}_${idx}`] ? hist.passwordValue : '••••••••••••'}
                                  </span>
                                  <span className="text-[9px] text-zinc-500 mt-0.5">
                                    {new Date(hist.updatedAt).toLocaleString(lang === 'it' ? 'it-IT' : 'en-US')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => togglePasswordVisibility(`hist_${cred.id}_${idx}`)}
                                    className="btn-icon p-1"
                                    type="button"
                                    title={visiblePasswords[`hist_${cred.id}_${idx}`] ? (lang === 'it' ? 'Nascondi' : 'Hide') : (lang === 'it' ? 'Mostra' : 'Show')}
                                  >
                                    {visiblePasswords[`hist_${cred.id}_${idx}`] ? <EyeOff size={12} /> : <Eye size={12} />}
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(hist.passwordValue, t.passwordLabel)}
                                    className="btn-icon p-1"
                                    type="button"
                                    title={lang === 'it' ? "Copia" : "Copy"}
                                  >
                                    <Copy size={12} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(lang === 'it' ? "Ripristinare questa vecchia password?" : "Restore this old password?")) {
                                        handleRestorePassword(cred.id, hist.passwordValue);
                                      }
                                    }}
                                    className="btn-icon p-1 hover:text-indigo-400"
                                    type="button"
                                    title={t.restore}
                                  >
                                    <RefreshCw size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}

                    {/* Notes */}
                    {cred.notes && (
                      <div className="flex flex-col gap-1 mt-2">
                        <label className="text-xs text-zinc-500 font-semibold uppercase">{t.notes}</label>
                        <div className="bg-black/20 p-3 rounded-lg border border-white/5 text-sm text-zinc-300 whitespace-pre-wrap">
                          {cred.notes}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Default Screen: Password Generator
            <div className="max-w-xl w-full mx-auto flex flex-col gap-6 items-center justify-center h-full text-center">
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 mb-2">
                  <Shield size={40} />
                </div>
                <h2 className="text-xl font-bold text-white">{t.genTitle}</h2>
                <p className="text-sm text-zinc-500">
                  {t.genSubtitle}
                </p>
              </div>

              {/* Generator Panel */}
              <div className="glass-panel w-full p-6 flex flex-col gap-5 text-left">
                <div className="flex items-center justify-between bg-black/45 p-4 rounded-xl border border-white/10">
                  <span className="font-mono text-lg text-indigo-300 break-all select-all font-semibold">
                    {generatedPassword}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setGeneratedPassword(
                          cryptoHelper.generateSecurePassword(genLength, genSymbols, genNumbers)
                        )
                      }
                      className="btn-icon p-2"
                      title={t.genRegen}
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      onClick={() => copyToClipboard(generatedPassword, t.genTitle)}
                      className="btn btn-primary p-2"
                      title={t.genCopy}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                {renderPasswordStrength(generatedPassword)}

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-zinc-300">{t.genLength}</span>
                    <span className="font-bold text-indigo-400">{genLength}</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={64}
                    value={genLength}
                    onChange={(e) => setGenLength(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 bg-zinc-800"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={genNumbers}
                      onChange={(e) => setGenNumbers(e.target.checked)}
                      className="w-4 h-4 accent-indigo-500"
                    />
                    <span>{t.genNumbers}</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={genSymbols}
                      onChange={(e) => setGenSymbols(e.target.checked)}
                      className="w-4 h-4 accent-indigo-500"
                    />
                    <span>{t.genSymbols}</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </main>
      )}
      </div>

      {/* --------------------------------------------- */}
      {/* MODALS SECTION */}
      {/* --------------------------------------------- */}

      {/* 1. Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-sm p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingGroupId ? t.editGroup : t.newGroup}
            </h3>
            <form onSubmit={handleSaveGroup} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-semibold uppercase">{t.groupNameLabel}</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={t.groupNamePlaceholder}
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="btn btn-secondary py-2"
                >
                  {t.cancel}
                </button>
                <button type="submit" className="btn btn-primary py-2">
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Application Modal */}
      {showAppModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md p-6 animate-slide-up overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingAppId ? t.editApp : t.newApp}
            </h3>
            <form onSubmit={handleSaveApp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-semibold uppercase">{t.appNameLabel}</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={t.appNamePlaceholder}
                  value={appNameInput}
                  onChange={(e) => setAppNameInput(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-semibold uppercase">{t.webUrl}</label>
                <input
                  type="text"
                  placeholder={t.webUrlPlaceholder}
                  value={appUrlInput}
                  onChange={(e) => setAppUrlInput(e.target.value)}
                />
              </div>

              {!editingAppId && (
                <>
                  <div className="border-t border-white/5 my-2 pt-2">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                      {t.initialCreds}
                    </h4>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-500 font-semibold uppercase">{t.usernameEmail}</label>
                    <input
                      type="text"
                      placeholder={t.usernameEmailPlaceholder}
                      value={appUsernameInput}
                      onChange={(e) => setAppUsernameInput(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-500 font-semibold uppercase">{t.passwordLabel}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t.passwordOrGen}
                        value={appPasswordInput}
                        onChange={(e) => setAppPasswordInput(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAppPasswordInput(cryptoHelper.generateSecurePassword(16, true, true))
                        }
                        className="btn btn-secondary p-2 px-3"
                        title={lang === 'it' ? "Genera Password" : "Generate Password"}
                      >
                        {lang === 'it' ? "Genera" : "Generate"}
                      </button>
                    </div>
                    {renderPasswordStrength(appPasswordInput)}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-500 font-semibold uppercase">{t.notes}</label>
                    <textarea
                      placeholder={t.notesPlaceholder}
                      value={appNotesInput}
                      onChange={(e) => setAppNotesInput(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-zinc-500 font-semibold uppercase">{t.totpSecretLabel}</label>
                    <input
                      type="text"
                      placeholder={t.totpSecretPlaceholder}
                      value={appTotpSecretInput}
                      onChange={(e) => setAppTotpSecretInput(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAppModal(false)}
                  className="btn btn-secondary py-2"
                >
                  {t.cancel}
                </button>
                <button type="submit" className="btn btn-primary py-2">
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Credential Modal */}
      {showCredModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingCredId ? t.editAccount : (lang === 'it' ? 'Nuovo Account per ' : 'New Account for ') + selectedApp?.name}
            </h3>
            <form onSubmit={handleSaveCred} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-semibold uppercase">{t.usernameEmail}</label>
                <input
                  type="text"
                  placeholder={t.usernameEmailPlaceholder}
                  autoFocus
                  value={credUsernameInput}
                  onChange={(e) => setCredUsernameInput(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-semibold uppercase">{t.passwordLabel} *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder={t.passwordOrGen}
                    value={credPasswordInput}
                    onChange={(e) => setCredPasswordInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setCredPasswordInput(cryptoHelper.generateSecurePassword(16, true, true))
                    }
                    className="btn btn-secondary p-2 px-3"
                    title={lang === 'it' ? "Genera Password" : "Generate Password"}
                  >
                    {lang === 'it' ? "Genera" : "Generate"}
                  </button>
                </div>
                {renderPasswordStrength(credPasswordInput)}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-semibold uppercase">{t.notes}</label>
                <textarea
                  placeholder={t.notesPlaceholder}
                  value={credNotesInput}
                  onChange={(e) => setCredNotesInput(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-semibold uppercase">{t.totpSecretLabel}</label>
                <input
                  type="text"
                  placeholder={t.totpSecretPlaceholder}
                  value={credTotpSecretInput}
                  onChange={(e) => setCredTotpSecretInput(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCredModal(false)}
                  className="btn btn-secondary py-2"
                >
                  {t.cancel}
                </button>
                <button type="submit" className="btn btn-primary py-2">
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
