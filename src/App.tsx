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
  Folder,
  FolderPlus,
  Info,
  ChevronDown,
  ShieldCheck,
  User,
  WifiOff,
  X,
} from 'lucide-react';
import * as cryptoHelper from './crypto';
import * as api from './api';
import * as csvImporter from './csvImporter';
import * as syncEngine from './syncEngine';

// Translation dictionary
const translations = {
  it: {
    appName: "LocKey",
    nasTag: "NAS Locale",
    userLabel: "Utente",
    lock: "Blocca",
    logout: "Esci",
    cancel: "Annulla",
    save: "Salva",
    add: "Aggiungi",
    edit: "Modifica",
    delete: "Elimina",
    
    // Auth Screen
    authSubtitle: "Gestore di Password Locale e Sicuro",
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
    syncError: "Errore di sincronizzazione: ",
    accountCreatedSuccess: "Account creato con successo! Ora puoi accedere.",
    
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
    invalidMasterPassword: "Master Password errata.",
    
    // Header & Navigation
    searchPlaceholder: "Cerca applicazione o account...",
    updates: "Aggiornamenti",
    updatesTooltip: "Verifica disponibilità aggiornamenti su GitHub",
    backup: "Backup",
    exportEncryptedBackup: "Esporta Backup Cifrato (.lockey)",
    importEncryptedBackup: "Importa Backup (.lockey)",
    importCSVFile: "Importa da file CSV",
    securityAuditMenu: "Audit di Sicurezza Password",
    infoTooltip: "Informazioni su LocKey & BiragoDev",
    lockVault: "Blocca Vault",
    lockVaultTooltip: "Blocca immediatamente il Vault",
    language: "Lingua",
    currentLanguageName: "Italiano",
    switchLanguageTitle: "Cambia lingua in Inglese (Switch to English)",
    
    // Sidebar Groups
    groupsTitle: "Gruppi",
    yourGroups: "I TUOI GRUPPI",
    noGroups: "Nessun gruppo",
    createGroup: "Crea Gruppo",
    newGroup: "Nuovo Gruppo",
    newGroupBtn: "Nuovo Gruppo",
    editGroup: "Modifica Gruppo",
    renameGroup: "Rinomina Gruppo",
    deleteGroup: "Elimina Gruppo",
    groupNameLabel: "Nome Gruppo",
    groupNamePlaceholder: "Es. Lavoro, Social...",
    confirmDeleteGroup: "Sei sicuro di voler eliminare questo gruppo e tutte le sue applicazioni?",
    deleteGroupConfirmMsg: "Sei sicuro di voler eliminare il gruppo \"{name}\" e tutte le relative applicazioni?",
    defaultGroupName: "Personale",
    localAes: "AES-256 Locale",
    
    // Middlebar Apps
    appsTitle: "Applicazioni",
    results: "Risultati",
    searchResults: "Risultati Ricerca",
    noResults: "Nessun risultato trovato",
    noApps: "Nessuna applicazione in questo gruppo",
    noAccount: "Nessun account",
    noAppsInGroupDesc: "Aggiungi un sito o servizio dentro",
    selectGroup: "Seleziona o crea un gruppo",
    selectOrCreateGroupTitle: "Seleziona o crea un Gruppo",
    selectOrCreateGroupDesc: "Crea un gruppo a sinistra per iniziare.",
    newApp: "Nuova Applicazione",
    addAppBtn: "Aggiungi Applicazione",
    editApp: "Modifica Applicazione",
    deleteApp: "Elimina Applicazione",
    confirmDeleteApp: "Sei sicuro di voler eliminare questa applicazione?",
    deleteAppConfirmMsg: "Sei sicuro di voler eliminare l'applicazione \"{name}\" e tutte le sue credenziali?",
    
    // Detail Panel
    addAccount: "Aggiungi Account",
    accountNum: "Account",
    editAccount: "Modifica Account",
    deleteAccount: "Elimina Account",
    deleteCredential: "Elimina Credenziale",
    notes: "Note",
    notesPlaceholder: "Eventuali note o risposte di sicurezza...",
    passwordLabel: "Password",
    copySuccess: "copiato! Verrà rimosso dagli appunti tra 30 secondi.",
    cantDeleteOnlyCred: "Non puoi eliminare l'unica credenziale di questa applicazione. Elimina l'intera applicazione se necessario.",
    confirmDeleteCred: "Sei sicuro di voler eliminare questa credenziale?",
    deleteCredConfirmMsg: "Sei sicuro di voler eliminare questa credenziale?",
    credentialsProtectedPlural: "credenziali protette",
    credentialsProtectedSingular: "credenziale protetta",
    newCredentialBtn: "Nuova Credenziale",
    addCredentialBtn: "Aggiungi Credenziale",
    noCredentialsInAppTitle: "Nessuna credenziale salvata",
    noCredentialsInAppDesc: "Aggiungi il primo account o password per",
    copyPasswordTitle: "Copia Password",
    copyUsernameTitle: "Copia Username",
    showPassword: "Mostra",
    hidePassword: "Nascondi",
    copyBtn: "Copia",
    restoreOldPasswordConfirm: "Ripristinare questa vecchia password?",
    restoreBtn: "Ripristina",
    vaultUnlockedTitle: "Il tuo Vault LocKey è Sbloccato",
    vaultUnlockedSubtitle: "Seleziona un'applicazione a sinistra o creane una nuova per gestire le tue password.",
    zeroNetwork: "Zero-Network",
    localSecurity: "Sicurezza Locale",
    
    // Password Generator
    genTitle: "Generatore di Password Sicuro",
    genSubtitle: "Genera password ad alta entropia senza bias statistici direttamente sul tuo dispositivo",
    genLength: "Lunghezza caratteri",
    genNumbers: "Includi Numeri (0-9)",
    genSymbols: "Includi Simboli (!@#$...)",
    genRegen: "Rigenera",
    genCopy: "Copia",
    generatePassword: "Genera Password",
    generate: "Genera",
    
    // Modals & Forms
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
    newAccountFor: "Nuovo Account per ",
    
    // Backup & Tools
    importCSV: "Importa CSV",
    importedGroupDefault: "Importati",
    csvImportSuccess: "Credenziali importate con successo!",
    csvImportError: "Errore durante l'importazione: ",
    exportBackupPrompt: "Inserisci una password per cifrare questo file di backup:",
    exportBackupSuccess: "Backup esportato con successo!",
    downloadBackupSuccess: "Backup scaricato con successo!",
    exportBackupError: "Errore durante l'esportazione: ",
    importBackupInvalidFormat: "Formato del file di backup non valido.",
    importBackupPrompt: "Inserisci la password utilizzata per cifrare il backup:",
    importBackupSuccess: "Backup importato e fuso con successo!",
    enableBiometrics: "Abilita Touch ID",
    disableBiometrics: "Disabilita Touch ID",
    biometricsDisabledMsg: "Sblocco biometrico disabilitato.",
    biometricsPromptPass: "Inserisci la tua Master Password per confermare l'abilitazione del Touch ID:",
    biometricsEnabledMsg: "Touch ID abilitato con successo!",
    biometricsErrorMsg: "Errore biometrico: ",
    biometricsAuthFailed: "Autenticazione biometrica rifiutata o fallita.",
    biometricsNoCreds: "Credenziali locali non trovate. Riabilita Touch ID.",
    biometricsErrorShort: "Errore Touch ID.",
    toolsSection: "Strumenti & Importazione",
    biometricsUnlock: "Sblocca con Touch ID",
    exportBackup: "Esporta Backup",
    importBackup: "Importa Backup .lockey",
    passwordHistory: "Cronologia Password",
    
    // Security Audit
    securityAudit: "Audit Sicurezza",
    totalPasswords: "Password Totali",
    weakPasswords: "Password Deboli",
    reusedPasswords: "Password Duplicate",
    pwnedPasswords: "Password Compromesse",
    checkCompromise: "Verifica Compromissione",
    scanLeak: "Avvia Scansione Violazioni",
    scanning: "Scansione in corso...",
    pwnedAlert: "ATTENZIONE: Questa password compare in violazioni pubbliche!",
    pwnedSafe: "Non trovata in violazioni pubbliche",
    entropyLabel: "Entropia",
    veryWeakEntropy: "Entropia molto debole",
    sharedPassword: "Password Condivisa",
    resolve: "Risolvi",
    change: "Cambia",
    strengthVeryWeak: "Molto Debole",
    strengthWeak: "Debole",
    strengthMedium: "Media",
    strengthStrong: "Forte",
    restore: "Ripristina",
    auditIntro: "Questo strumento analizza in locale il tuo database per rilevare password vulnerabili o duplicate e controlla la loro sicurezza in modalità Zero-Knowledge.",
    noVulnerabilities: "Ottimo! Nessuna vulnerabilità trovata nel tuo vault.",
    vulnerabilitiesFound: "Vulnerabilità trovate nel tuo Vault:",
    
    // About Modal
    aboutAppTitle: "LocKey Desktop",
    aboutVersionPrefix: "Versione",
    aboutDescription: "Gestore di password locale, ultra-sicuro e 100% offline cifrato in AES-256-GCM.",
    checkingUpdatesText: "Verifica in corso...",
    checkUpdatesBtn: "Verifica disponibilità aggiornamenti",
    downloadUpdateBtn: "Scarica Aggiornamento",
    developedBy: "Sviluppato da",
    newVersionAvailable: "Nuova versione disponibile:",
    appUpToDate: "LocKey è aggiornato all'ultima versione",
    noInternetOffline: "Nessuna connessione internet disponibile (offline).",
    
    // Delete Confirmation
    deleteConfirmTitle: "Conferma Eliminazione",
  },
  en: {
    appName: "LocKey",
    nasTag: "Local NAS",
    userLabel: "User",
    lock: "Lock",
    logout: "Logout",
    cancel: "Cancel",
    save: "Save",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    
    // Auth Screen
    authSubtitle: "Local & Secure Password Manager",
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
    syncError: "Sync error: ",
    accountCreatedSuccess: "Account created successfully! You can now log in.",
    
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
    invalidMasterPassword: "Invalid Master Password.",
    
    // Header & Navigation
    searchPlaceholder: "Search apps or accounts...",
    updates: "Updates",
    updatesTooltip: "Check for updates on GitHub",
    backup: "Backup",
    exportEncryptedBackup: "Export Encrypted Backup (.lockey)",
    importEncryptedBackup: "Import .lockey Backup",
    importCSVFile: "Import from CSV file",
    securityAuditMenu: "Password Security Audit",
    infoTooltip: "About LocKey & BiragoDev",
    lockVault: "Lock Vault",
    lockVaultTooltip: "Lock Vault immediately",
    language: "Language",
    currentLanguageName: "English",
    switchLanguageTitle: "Switch language to Italian (Passa a Italiano)",
    
    // Sidebar Groups
    groupsTitle: "Groups",
    yourGroups: "YOUR GROUPS",
    noGroups: "No groups",
    createGroup: "Create Group",
    newGroup: "New Group",
    newGroupBtn: "New Group",
    editGroup: "Edit Group",
    renameGroup: "Rename Group",
    deleteGroup: "Delete Group",
    groupNameLabel: "Group Name",
    groupNamePlaceholder: "e.g., Work, Social...",
    confirmDeleteGroup: "Are you sure you want to delete this group and all its applications?",
    deleteGroupConfirmMsg: "Are you sure you want to delete group \"{name}\" and all its applications?",
    defaultGroupName: "Personal",
    localAes: "Local AES-256",
    
    // Middlebar Apps
    appsTitle: "Applications",
    results: "Results",
    searchResults: "Search Results",
    noResults: "No results found",
    noApps: "No applications in this group",
    noAccount: "No account",
    noAppsInGroupDesc: "Add an app or site to",
    selectGroup: "Select or create a group",
    selectOrCreateGroupTitle: "Select or create a Group",
    selectOrCreateGroupDesc: "Create a group on the left to start.",
    newApp: "New Application",
    addAppBtn: "Add Application",
    editApp: "Edit Application",
    deleteApp: "Delete Application",
    confirmDeleteApp: "Are you sure you want to delete this application?",
    deleteAppConfirmMsg: "Are you sure you want to delete application \"{name}\" and all its credentials?",
    
    // Detail Panel
    addAccount: "Add Account",
    accountNum: "Account",
    editAccount: "Edit Account",
    deleteAccount: "Delete Account",
    deleteCredential: "Delete Credential",
    notes: "Notes",
    notesPlaceholder: "Notes or security answers...",
    passwordLabel: "Password",
    copySuccess: "copied! It will be removed from clipboard in 30 seconds.",
    cantDeleteOnlyCred: "You cannot delete the only credential for this application. Delete the entire application if needed.",
    confirmDeleteCred: "Are you sure you want to delete this credential?",
    deleteCredConfirmMsg: "Are you sure you want to delete this credential?",
    credentialsProtectedPlural: "protected credentials",
    credentialsProtectedSingular: "protected credential",
    newCredentialBtn: "Add Credential",
    addCredentialBtn: "Add Credential",
    noCredentialsInAppTitle: "No credentials saved",
    noCredentialsInAppDesc: "Add the first account or password for",
    copyPasswordTitle: "Copy Password",
    copyUsernameTitle: "Copy Username",
    showPassword: "Show",
    hidePassword: "Hide",
    copyBtn: "Copy",
    restoreOldPasswordConfirm: "Restore this old password?",
    restoreBtn: "Restore",
    vaultUnlockedTitle: "Your LocKey Vault is Unlocked",
    vaultUnlockedSubtitle: "Select an application on the left or create a new one to manage your passwords.",
    zeroNetwork: "Zero-Network",
    localSecurity: "Local Security",
    
    // Password Generator
    genTitle: "Secure Password Generator",
    genSubtitle: "Generate high-entropy bias-free passwords directly on your device",
    genLength: "Character length",
    genNumbers: "Include Numbers (0-9)",
    genSymbols: "Include Symbols (!@#$...)",
    genRegen: "Regenerate",
    genCopy: "Copy",
    generatePassword: "Generate Password",
    generate: "Generate",
    
    // Modals & Forms
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
    newAccountFor: "New Account for ",
    
    // Backup & Tools
    importCSV: "Import CSV",
    importedGroupDefault: "Imported",
    csvImportSuccess: "Credentials imported successfully!",
    csvImportError: "Error during import: ",
    exportBackupPrompt: "Enter a password to encrypt this backup file:",
    exportBackupSuccess: "Backup exported successfully!",
    downloadBackupSuccess: "Backup downloaded successfully!",
    exportBackupError: "Error during export: ",
    importBackupInvalidFormat: "Invalid backup file format.",
    importBackupPrompt: "Enter the password used to encrypt the backup:",
    importBackupSuccess: "Backup imported and merged successfully!",
    enableBiometrics: "Enable Touch ID",
    disableBiometrics: "Disable Touch ID",
    biometricsDisabledMsg: "Biometric unlock disabled.",
    biometricsPromptPass: "Enter your Master Password to confirm enabling Touch ID:",
    biometricsEnabledMsg: "Touch ID enabled successfully!",
    biometricsErrorMsg: "Biometric error: ",
    biometricsAuthFailed: "Biometric authentication rejected or failed.",
    biometricsNoCreds: "Local credentials not found. Re-enable Touch ID.",
    biometricsErrorShort: "Touch ID Error.",
    toolsSection: "Tools & Import",
    biometricsUnlock: "Unlock with Touch ID",
    exportBackup: "Export Backup",
    importBackup: "Import .lockey Backup",
    passwordHistory: "Password History",
    
    // Security Audit
    securityAudit: "Security Audit",
    totalPasswords: "Total Passwords",
    weakPasswords: "Weak Passwords",
    reusedPasswords: "Reused Passwords",
    pwnedPasswords: "Compromised Passwords",
    checkCompromise: "Check Compromise",
    scanLeak: "Start Breach Scan",
    scanning: "Scanning...",
    pwnedAlert: "WARNING: This password appears in public data breaches!",
    pwnedSafe: "Not found in public breaches",
    entropyLabel: "Entropy",
    veryWeakEntropy: "Very weak entropy",
    sharedPassword: "Shared Password",
    resolve: "Resolve",
    change: "Change",
    strengthVeryWeak: "Very Weak",
    strengthWeak: "Weak",
    strengthMedium: "Medium",
    strengthStrong: "Strong",
    restore: "Restore",
    auditIntro: "This tool analyzes your local database to detect vulnerable or reused passwords and checks their security in a Zero-Knowledge manner.",
    noVulnerabilities: "Great! No vulnerabilities found in your vault.",
    vulnerabilitiesFound: "Vulnerabilities found in your Vault:",
    
    // About Modal
    aboutAppTitle: "LocKey Desktop",
    aboutVersionPrefix: "Version",
    aboutDescription: "Local, ultra-secure and 100% offline password manager encrypted with AES-256-GCM.",
    checkingUpdatesText: "Checking for updates...",
    checkUpdatesBtn: "Check for updates",
    downloadUpdateBtn: "Download Update",
    developedBy: "Developed by",
    newVersionAvailable: "New version available:",
    appUpToDate: "LocKey is up to date",
    noInternetOffline: "No internet connection available (offline).",
    
    // Delete Confirmation
    deleteConfirmTitle: "Confirm Deletion",
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



  // Modal / Editor States
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showBackupMenu, setShowBackupMenu] = useState(false);

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
        setAuthSuccess(t.accountCreatedSuccess);
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
      setVaultError(t.invalidMasterPassword);
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
            name: t.defaultGroupName,
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
      alert(t.syncError + err.message);
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
      strengthLabel = t.strengthVeryWeak;
      barColor = 'bg-red-500';
      barWidth = 'w-1/4';
    } else if (entropy < 60) {
      strengthLabel = t.strengthWeak;
      barColor = 'bg-orange-500';
      barWidth = 'w-2/4';
    } else if (entropy < 80) {
      strengthLabel = t.strengthMedium;
      barColor = 'bg-yellow-500';
      barWidth = 'w-3/4';
    } else {
      strengthLabel = t.strengthStrong;
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
              {t.totalPasswords}
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
                        {t.veryWeakEntropy}: {entropy} bits (L: {cred.passwordCiphertext.length})
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
                      {t.resolve}
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
                      <span className="text-zinc-500 font-semibold uppercase">{t.sharedPassword}</span>
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
                            {t.change}
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
                                ? `Compromessa: Trovata in ${pwned.count.toLocaleString()} violazioni pubbliche!` 
                                : `Compromised: Found in ${pwned.count.toLocaleString()} public data breaches!`}
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
                            {t.resolve}
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

  async function executeDeleteGroup(groupId: string) {
    if (!vaultDb) return;

    const updatedDb = { ...vaultDb };
    updatedDb.groups = updatedDb.groups.filter((g) => g.id !== groupId);

    if (!updatedDb.tombstones) updatedDb.tombstones = [];
    updatedDb.tombstones.push({
      id: groupId,
      type: 'group',
      deletedAt: new Date().toISOString()
    });

    await syncVault(updatedDb);
    if (selectedGroupId === groupId) {
      const nextGroup = updatedDb.groups[0] || null;
      setSelectedGroupId(nextGroup?.id || null);
      setSelectedAppId(nextGroup?.applications[0]?.id || null);
    }
  }

  function requestDeleteGroup(groupId: string, groupName: string) {
    setDeleteConfirmModal({
      isOpen: true,
      title: t.deleteGroup,
      message: t.deleteGroupConfirmMsg.replace('{name}', groupName),
      onConfirm: () => executeDeleteGroup(groupId),
    });
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

  async function executeDeleteApp(appId: string) {
    if (!vaultDb || !selectedGroupId) return;

    const updatedDb = { ...vaultDb };
    const group = updatedDb.groups.find((g) => g.id === selectedGroupId);
    if (!group) return;

    group.applications = group.applications.filter((a) => a.id !== appId);

    if (!updatedDb.tombstones) updatedDb.tombstones = [];
    updatedDb.tombstones.push({
      id: appId,
      type: 'application',
      deletedAt: new Date().toISOString()
    });

    await syncVault(updatedDb);
    if (selectedAppId === appId) {
      const remainingApps = group.applications;
      setSelectedAppId(remainingApps[0]?.id || null);
    }
  }

  function requestDeleteApp(appId: string) {
    setDeleteConfirmModal({
      isOpen: true,
      title: t.deleteApp,
      message: t.confirmDeleteApp,
      onConfirm: () => executeDeleteApp(appId),
    });
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

  async function executeDeleteCred(credId: string) {
    if (!vaultDb || !selectedGroupId || !selectedAppId) return;
    const group = vaultDb.groups.find((g) => g.id === selectedGroupId);
    if (!group) return;

    const app = group.applications.find((a) => a.id === selectedAppId);
    if (!app) return;

    const updatedDb = { ...vaultDb };
    const updatedGroup = updatedDb.groups.find((g) => g.id === selectedGroupId);
    if (!updatedGroup) return;
    const updatedApp = updatedGroup.applications.find((a) => a.id === selectedAppId);
    if (!updatedApp) return;

    updatedApp.credentials = updatedApp.credentials.filter((c) => c.id !== credId);

    if (!updatedDb.tombstones) updatedDb.tombstones = [];
    updatedDb.tombstones.push({
      id: credId,
      type: 'credential',
      deletedAt: new Date().toISOString()
    });

    await syncVault(updatedDb);
  }

  function requestDeleteCred(credId: string) {
    setDeleteConfirmModal({
      isOpen: true,
      title: t.deleteCredential,
      message: t.confirmDeleteCred,
      onConfirm: () => executeDeleteCred(credId),
    });
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

        const importedGroups = csvImporter.importFromCSV(text, t.importedGroupDefault);
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
        alert(t.csvImportSuccess);
      } catch (err: any) {
        alert(t.csvImportError + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleExportBackup() {
    if (!vaultDb) return;
    const backupPassword = prompt(t.exportBackupPrompt);
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
          alert(t.exportBackupSuccess);
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
        alert(t.downloadBackupSuccess);
      }
    } catch (err: any) {
      alert(t.exportBackupError + err.message);
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
        throw new Error(t.importBackupInvalidFormat);
      }

      const backupPassword = prompt(t.importBackupPrompt);
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
      alert(t.importBackupSuccess);
    } catch (err: any) {
      alert(t.csvImportError + err.message);
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
      const currentVersion = 'v1.0.6';

      if (latestTag && latestTag !== currentVersion) {
        setUpdateAvailable(true);
        setUpdateStatus(`${t.newVersionAvailable} ${latestTag}!`);
        setUpdateUrl(data.html_url || 'https://github.com/biragodevelopers-lgtm/LocKey/releases/latest');
      } else {
        setUpdateAvailable(false);
        setUpdateStatus(`${t.appUpToDate} (${currentVersion}).`);
      }
    } catch {
      setUpdateAvailable(false);
      setUpdateStatus(t.noInternetOffline);
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
        alert(t.biometricsDisabledMsg);
      } else {
        if (!accountUsername) return;
        const pass = prompt(t.biometricsPromptPass);
        if (!pass) return;

        if (!vaultPayload) return;
        const saltBytes = cryptoHelper.base64ToArrayBuffer(vaultPayload.salt);
        const key = await cryptoHelper.deriveKey(pass, saltBytes as BufferSource, vaultPayload.iterations);
        try {
          await cryptoHelper.decryptData(vaultPayload.ciphertext, vaultPayload.nonce, key);
        } catch {
          alert(t.invalidMasterPassword);
          return;
        }

        const credId = await cryptoHelper.registerBiometric(accountUsername);
        localStorage.setItem('lockey_biometric_cred_id', credId);
        localStorage.setItem('lockey_biometric_username', accountUsername);

        const encKey = await cryptoHelper.deriveKey(accountUsername, new Uint8Array([1,3,5,7,9,11,13,15]));
        const encrypted = await cryptoHelper.encryptData(pass, encKey);
        await setIndexedDB('encrypted_master_password', encrypted);

        setIsBiometricsEnabled(true);
        alert(t.biometricsEnabledMsg);
      }
    } catch (err: any) {
      console.error(err);
      alert(t.biometricsErrorMsg + err.message);
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
        throw new Error(t.biometricsAuthFailed);
      }

      const stored = await getIndexedDB('encrypted_master_password');
      if (!stored || !stored.ciphertext || !stored.nonce) {
        throw new Error(t.biometricsNoCreds);
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
      setVaultError(err.message || t.biometricsErrorShort);
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
      <div className="flex items-center justify-center min-height-100vh w-full px-4 animate-fade-in relative">
        <div className="absolute top-6 right-6">
          <button onClick={toggleLang} className="btn btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs">
            <Globe size={13} /> {lang === 'it' ? 'English (EN)' : 'Italiano (IT)'}
          </button>
        </div>

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
    <div className="flex flex-col w-full h-screen bg-[#0c0c12] text-zinc-100 overflow-hidden select-none animate-fade-in font-sans">
      {/* Top Navbar */}
      <header className="h-16 px-6 bg-[#13131c] border-b border-white/[0.08] flex items-center justify-between shrink-0 z-20">
        {/* Brand Left */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-0.5 shadow-md shadow-purple-600/30 flex items-center justify-center">
            <div className="w-full h-full rounded-[10px] bg-[#1a1a28] flex items-center justify-center">
              <Lock className="text-white drop-shadow" size={17} />
            </div>
          </div>
          <span className="font-bold text-white tracking-tight text-lg">LocKey</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/90">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            <span className="text-[10px] font-bold tracking-wider">100% OFFLINE</span>
          </div>
        </div>

        {/* Center Search Bar */}
        <div className="relative w-72 md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.06] border border-white/10 rounded-lg pl-9 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.08] transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Actions Right */}
        <div className="flex items-center gap-2.5">
          {/* Selettore Lingua Globale */}
          <button
            onClick={toggleLang}
            className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-white/90 flex items-center gap-1.5 transition-all cursor-pointer"
            title={t.switchLanguageTitle}
          >
            <Globe size={13} className="text-indigo-400" />
            <span>{lang === 'it' ? 'IT' : 'EN'}</span>
          </button>

          {/* Pulsante Verifica Aggiornamenti */}
          <button
            onClick={() => { setShowAboutModal(true); checkForUpdates(); }}
            className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-white/90 flex items-center gap-2 transition-all cursor-pointer"
            title={t.updatesTooltip}
          >
            <RefreshCw size={12} className={`text-blue-400 ${isCheckingUpdate ? "animate-spin" : ""}`} />
            <span>{t.updates}</span>
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded">v1.0.6</span>
          </button>

          {/* Menu Backup (.lockey) */}
          <div className="relative">
            <button
              onClick={() => setShowBackupMenu(!showBackupMenu)}
              className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-white/90 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download size={12} />
              <span>{t.backup}</span>
              <ChevronDown size={11} className="text-zinc-400" />
            </button>

            {showBackupMenu && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-xl bg-[#1a1a26] border border-white/10 shadow-2xl p-1.5 z-50 flex flex-col gap-1 backdrop-blur-xl animate-fade-in"
                onMouseLeave={() => setShowBackupMenu(false)}
              >
                <button
                  onClick={() => { setShowBackupMenu(false); handleExportBackup(); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 hover:bg-white/10 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download size={13} className="text-purple-400 shrink-0" />
                  <span>{t.exportEncryptedBackup}</span>
                </button>
                {isElectron ? (
                  <button
                    onClick={() => { setShowBackupMenu(false); handleImportBackup(null); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 hover:bg-white/10 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Upload size={13} className="text-blue-400 shrink-0" />
                    <span>{t.importEncryptedBackup}</span>
                  </button>
                ) : (
                  <label className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 hover:bg-white/10 flex items-center gap-2 cursor-pointer transition-all">
                    <Upload size={13} className="text-blue-400 shrink-0" />
                    <span>{t.importEncryptedBackup}</span>
                    <input
                      type="file"
                      accept=".lockey"
                      onChange={(e) => { setShowBackupMenu(false); handleImportBackup(e); }}
                      className="hidden"
                    />
                  </label>
                )}
                <label className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 hover:bg-white/10 flex items-center gap-2 cursor-pointer transition-all border-t border-white/5 pt-2">
                  <Plus size={13} className="text-emerald-400 shrink-0" />
                  <span>{t.importCSVFile}</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => { setShowBackupMenu(false); handleCSVImport(e); }}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => {
                    setShowBackupMenu(false);
                    setSelectedGroupId(null);
                    setSelectedAppId(null);
                    setSearchTerm('');
                    setIsAuditActive(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 hover:bg-white/10 flex items-center gap-2 transition-all cursor-pointer border-t border-white/5 pt-2"
                >
                  <Shield size={13} className="text-amber-400 shrink-0" />
                  <span>{t.securityAuditMenu}</span>
                </button>
                {isBiometricsSupported && (
                  <button
                    onClick={() => {
                      setShowBackupMenu(false);
                      toggleBiometrics();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 hover:bg-white/10 flex items-center gap-2 transition-all cursor-pointer border-t border-white/5 pt-2"
                  >
                    <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                    <span>{isBiometricsEnabled ? t.disableBiometrics : t.enableBiometrics}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pulsante Info */}
          <button
            onClick={() => setShowAboutModal(true)}
            className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-white/80 transition-all cursor-pointer"
            title={t.infoTooltip}
          >
            <Info size={14} />
          </button>

          {/* UNICO Pulsante Blocca Vault */}
          <button
            onClick={handleLock}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600/90 to-pink-600/90 hover:from-red-500 hover:to-pink-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-red-500/20 transition-all cursor-pointer"
            title={t.lockVaultTooltip}
          >
            <Lock size={12} className="stroke-[2.5]" />
            <span>{t.lockVault}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace (3 Colonne Splittate) */}
      <div className="flex flex-1 overflow-hidden">
        {/* COLONNA 1: SIDEBAR GRUPPI */}
        <aside className="w-60 bg-[#13131c]/90 border-r border-white/[0.07] flex flex-col shrink-0 select-none">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2.5">
            <span className="text-[11px] font-bold text-zinc-500 tracking-wider uppercase">
              {t.yourGroups}
            </span>
            <button
              onClick={() => {
                setEditingGroupId(null);
                setGroupNameInput('');
                setShowGroupModal(true);
              }}
              className="w-5 h-5 rounded-md bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 flex items-center justify-center transition-all cursor-pointer"
              title={t.newGroup}
            >
              <Plus size={12} className="stroke-[3]" />
            </button>
          </div>

          {/* Lista Gruppi */}
          <div className="flex-1 overflow-y-auto px-3 py-1 flex flex-col gap-1.5">
            {!vaultDb || vaultDb.groups.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <FolderPlus size={28} className="text-zinc-600 mb-2" />
                <span className="text-xs text-zinc-500">{t.noGroups}</span>
              </div>
            ) : (
              vaultDb.groups.map((group) => {
                const isSelected = selectedGroupId === group.id && !searchTerm && !isAuditActive;
                return (
                  <div
                    key={group.id}
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setSelectedAppId(null);
                      setSearchTerm('');
                      setIsAuditActive(false);
                    }}
                    className={`group w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-500/15 border border-purple-500/40 text-white shadow-sm'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-purple-500/25 text-purple-300' : 'bg-white/5 text-zinc-400 group-hover:text-zinc-200'
                    }`}>
                      <Folder size={14} />
                    </div>
                    <span className="text-xs font-medium truncate flex-1 text-left">
                      {group.name}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                      isSelected ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-zinc-500'
                    }`}>
                      {group.applications.length}
                    </span>
                    <div className={`items-center gap-1 shrink-0 ${isSelected ? 'flex' : 'hidden group-hover:flex'}`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingGroupId(group.id);
                          setGroupNameInput(group.name);
                          setShowGroupModal(true);
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title={t.renameGroup}
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteGroup(group.id, group.name);
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                        title={t.deleteGroup}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Button + Footer BiragoDev */}
          <div className="p-3 border-t border-white/[0.06] flex flex-col gap-3">
            <button
              onClick={() => {
                setEditingGroupId(null);
                setGroupNameInput('');
                setShowGroupModal(true);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600/85 to-blue-600/85 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
            >
              <Plus size={14} className="stroke-[2.5]" />
              <span>{t.newGroupBtn}</span>
            </button>

            <div className="flex items-center justify-between text-[11px] px-1 pt-0.5">
              <div className="flex items-center gap-1 text-emerald-400 font-medium">
                <ShieldCheck size={12} />
                <span className="text-zinc-400">{t.localAes}</span>
              </div>
              <a
                href="https://www.biragodev.it"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-purple-400 hover:text-purple-300 transition-colors"
              >
                BiragoDev
              </a>
            </div>
          </div>
        </aside>

        {/* COLONNA 2: LISTA APPLICAZIONI DEL GRUPPO */}
        {!isAuditActive && (
          <section className="w-64 bg-[#0d0e15] border-r border-white/[0.07] flex flex-col shrink-0 select-none">
            {/* Header Colonna Applicazioni */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <Folder size={13} className="text-purple-400 shrink-0" />
                <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider truncate">
                  {searchTerm ? t.results : (selectedGroup?.name || t.appsTitle)}
                </h3>
              </div>
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
                  className="w-[22px] h-[22px] rounded-md bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 flex items-center justify-center transition-colors cursor-pointer"
                  title={t.newApp}
                >
                  <Plus size={13} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Lista Applicazioni */}
            <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5 custom-scrollbar">
              {searchTerm ? (
                searchedApps && searchedApps.length > 0 ? (
                  searchedApps.map(({ app, groupName, groupId }) => {
                    const isSelected = selectedAppId === app.id;
                    const initial = (app.name || '?').charAt(0).toUpperCase();
                    return (
                      <div
                        key={app.id}
                        onClick={() => {
                          setSelectedGroupId(groupId);
                          setSelectedAppId(app.id);
                        }}
                        className={`group relative p-2.5 rounded-xl cursor-pointer transition-all border flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-blue-500/15 border-blue-500/40 text-white shadow-sm'
                            : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05] text-zinc-300'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 text-white shadow-sm ${
                            isSelected
                              ? 'bg-gradient-to-br from-blue-600 to-purple-600'
                              : 'bg-white/10 border border-white/10'
                          }`}
                        >
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-white truncate">{app.name}</div>
                          <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
                            <span>{groupName}</span>
                            {app.url && <span>• {app.url.replace(/^https?:\/\//, '')}</span>}
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            isSelected ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-zinc-400'
                          }`}
                        >
                          {app.credentials?.length || 0}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-zinc-500 text-center mt-8">{t.noResults}</div>
                )
              ) : selectedGroup ? (
                selectedGroup.applications.length > 0 ? (
                  selectedGroup.applications.map((app) => {
                    const isSelected = selectedAppId === app.id;
                    const initial = (app.name || '?').charAt(0).toUpperCase();
                    const displaySub = app.url
                      ? app.url.replace(/^https?:\/\//, '')
                      : app.credentials[0]?.username || t.noAccount;
                    return (
                      <div
                        key={app.id}
                        onClick={() => setSelectedAppId(app.id)}
                        className={`group relative p-2.5 rounded-xl cursor-pointer transition-all border flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-blue-500/15 border-blue-500/40 text-white shadow-sm'
                            : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05] text-zinc-300'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 text-white shadow-sm ${
                            isSelected
                              ? 'bg-gradient-to-br from-blue-600 to-purple-600'
                              : 'bg-white/10 border border-white/10'
                          }`}
                        >
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-white truncate">{app.name}</div>
                          <div className="text-[11px] text-zinc-400 truncate">{displaySub}</div>
                        </div>

                        {/* Modifica/Elimina al passaggio del mouse */}
                        <div className="hidden group-hover:flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAppId(app.id);
                              setAppNameInput(app.name);
                              setAppUrlInput(app.url || '');
                              setShowAppModal(true);
                            }}
                            className="p-1 text-zinc-400 hover:text-white rounded transition-colors"
                            title={t.editApp}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              requestDeleteApp(app.id);
                            }}
                            className="p-1 text-zinc-400 hover:text-red-400 rounded transition-colors"
                            title={t.deleteApp}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            isSelected ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-zinc-400'
                          }`}
                        >
                          {app.credentials?.length || 0}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 mt-12 gap-3">
                    <FolderPlus size={32} className="text-zinc-600" />
                    <div className="text-sm font-semibold text-zinc-300">
                      {t.noApps}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {t.noAppsInGroupDesc} "{selectedGroup.name}".
                    </p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 mt-12 gap-3">
                  <Folder size={32} className="text-zinc-600" />
                  <div className="text-sm font-semibold text-zinc-300">
                    {t.selectOrCreateGroupTitle}
                  </div>
                  <p className="text-xs text-zinc-500">
                    {t.selectOrCreateGroupDesc}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Colonna Applicazioni */}
            {selectedGroupId && !searchTerm && (
              <div className="p-3 border-t border-white/[0.06]">
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
                  className="w-full py-2 px-3 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Plus size={14} className="text-blue-400" />
                  <span>{t.addAppBtn}</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* COLONNA 3: DETTAGLI APPLICAZIONE / AUDIT / STATO SBLOCCATO */}
        {isAuditActive ? (
          <main className="flex-1 p-6 overflow-y-auto bg-[#0a0a0f] flex flex-col items-center">
            {renderSecurityAuditDashboard()}
          </main>
        ) : (
          <main className="flex-1 flex flex-col bg-[#0a0a0f] overflow-hidden">
            {selectedApp ? (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header Applicazione Selezionata */}
                <div className="border-b border-white/[0.07] px-6 py-4 bg-[#0e0e16]/80 backdrop-blur flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-[48px] h-[48px] rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-white/15 flex items-center justify-center font-bold text-2xl text-white shadow-lg">
                      {(selectedApp.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">{selectedApp.name}</h2>
                      {selectedApp.url ? (
                        <a
                          href={selectedApp.url.startsWith('http') ? selectedApp.url : `https://${selectedApp.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1.5 mt-0.5 inline-flex"
                        >
                          <Globe size={11} />
                          <span>{selectedApp.url}</span>
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {selectedApp.credentials.length}{' '}
                          {selectedApp.credentials.length === 1
                            ? t.credentialsProtectedSingular
                            : t.credentialsProtectedPlural}
                        </div>
                      )}
                    </div>
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
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:brightness-110 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>{t.newCredentialBtn}</span>
                  </button>
                </div>

                {/* Lista Credenziali dell'applicazione */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                  {selectedApp.credentials.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16 gap-3">
                      <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <Key size={28} />
                      </div>
                      <h3 className="text-base font-bold text-white">
                        {t.noCredentialsInAppTitle}
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-xs">
                        {t.noCredentialsInAppDesc} {selectedApp.name}.
                      </p>
                      <button
                        onClick={() => {
                          setEditingCredId(null);
                          setCredUsernameInput('');
                          setCredPasswordInput('');
                          setCredNotesInput('');
                          setCredTotpSecretInput('');
                          setShowCredModal(true);
                        }}
                        className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>{t.addCredentialBtn}</span>
                      </button>
                    </div>
                  ) : (
                    selectedApp.credentials.map((cred, index) => (
                      <div
                        key={cred.id}
                        className="bg-[#11121d] border border-white/[0.08] hover:border-white/15 rounded-xl p-4 flex flex-col gap-3 transition-all shadow-md"
                      >
                        {/* Riga Superiore della Card */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
                              <Key size={18} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-white truncate">
                                {cred.username || `${t.accountNum} #${index + 1}`}
                              </div>
                              <div className="text-xs text-zinc-400 flex items-center gap-2 truncate">
                                {cred.username && (
                                  <span className="flex items-center gap-1">
                                    <User size={11} className="text-zinc-500" />
                                    <span className="truncate">{cred.username}</span>
                                  </span>
                                )}
                                {selectedApp.url && (
                                  <>
                                    <span className="text-zinc-600">•</span>
                                    <span className="text-blue-400 truncate">{selectedApp.url.replace(/^https?:\/\//, '')}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Azioni Rapide a Destra */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Pillola Password */}
                            <div className="flex items-center bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 gap-2">
                              <span className="font-mono text-xs text-zinc-200 tracking-wider">
                                {visiblePasswords[cred.id] ? cred.passwordCiphertext : '••••••••••••'}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(cred.id)}
                                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                title={visiblePasswords[cred.id] ? t.hidePassword : t.showPassword}
                              >
                                {visiblePasswords[cred.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                            </div>

                            {/* Tasto Copia Password */}
                            <button
                              onClick={() => copyToClipboard(cred.passwordCiphertext, t.passwordLabel)}
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 text-zinc-300 hover:text-emerald-400 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                              title={t.copyPasswordTitle}
                            >
                              <Copy size={12} />
                              <span>Password</span>
                            </button>

                            {/* Tasto Copia Username */}
                            {cred.username && (
                              <button
                                onClick={() => copyToClipboard(cred.username, t.username)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                title={t.copyUsernameTitle}
                              >
                                <User size={13} />
                              </button>
                            )}

                            {/* Tasto Modifica */}
                            <button
                              onClick={() => {
                                setEditingCredId(cred.id);
                                setCredUsernameInput(cred.username);
                                setCredPasswordInput(cred.passwordCiphertext);
                                setCredNotesInput(cred.notes || '');
                                setCredTotpSecretInput(cred.totpSecret || '');
                                setShowCredModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                              title={t.editAccount}
                            >
                              <Edit2 size={13} />
                            </button>

                            {/* Tasto Elimina */}
                            <button
                              onClick={() => requestDeleteCred(cred.id)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 transition-colors cursor-pointer"
                              title={t.deleteAccount}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Blocco 2FA TOTP se presente */}
                        {cred.totpSecret && (
                          <div className="bg-purple-950/20 border border-purple-500/20 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-purple-400">2FA:</span>
                              <span className="font-mono text-purple-300 font-bold tracking-widest text-sm">
                                {totpCodes[cred.id]
                                  ? `${totpCodes[cred.id].slice(0, 3)} ${totpCodes[cred.id].slice(3)}`
                                  : '------'}
                              </span>
                              <span
                                className={`text-[10px] ${
                                  totpSecondsRemaining <= 5 ? 'text-red-400' : 'text-zinc-500'
                                }`}
                              >
                                ({totpSecondsRemaining}s)
                              </span>
                            </div>
                            <button
                              onClick={() => copyToClipboard(totpCodes[cred.id] || '', t.totpLabel)}
                              className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Copy size={11} />
                              <span>{t.copyBtn}</span>
                            </button>
                          </div>
                        )}

                        {/* Note se presenti */}
                        {cred.notes && (
                          <div className="bg-black/20 rounded-lg p-2.5 text-xs text-zinc-400 border border-white/5 whitespace-pre-wrap">
                            {cred.notes}
                          </div>
                        )}

                        {/* Cronologia Password se presente */}
                        {cred.passwordHistory && cred.passwordHistory.length > 0 && (
                          <details className="text-xs text-zinc-500">
                            <summary className="cursor-pointer hover:text-zinc-400 select-none">
                              {t.passwordHistory} ({cred.passwordHistory.length})
                            </summary>
                            <div className="mt-2 space-y-1 pl-2 border-l border-white/10">
                              {cred.passwordHistory.map((hist, idx) => (
                                <div key={idx} className="flex items-center justify-between py-1">
                                  <span className="font-mono text-zinc-400">
                                    {visiblePasswords[`hist_${cred.id}_${idx}`]
                                      ? hist.passwordValue
                                      : '••••••••••••'}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-zinc-600 mr-2">
                                      {new Date(hist.updatedAt).toLocaleDateString()}
                                    </span>
                                    <button
                                      onClick={() => togglePasswordVisibility(`hist_${cred.id}_${idx}`)}
                                      className="text-zinc-400 hover:text-white p-1 cursor-pointer"
                                    >
                                      {visiblePasswords[`hist_${cred.id}_${idx}`] ? (
                                        <EyeOff size={11} />
                                      ) : (
                                        <Eye size={11} />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => copyToClipboard(hist.passwordValue, t.passwordLabel)}
                                      className="text-zinc-400 hover:text-white p-1 cursor-pointer"
                                    >
                                      <Copy size={11} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(t.restoreOldPasswordConfirm)) {
                                          handleRestorePassword(cred.id, hist.passwordValue);
                                        }
                                      }}
                                      className="text-zinc-400 hover:text-purple-400 p-1 cursor-pointer"
                                      type="button"
                                      title={t.restoreBtn}
                                    >
                                      <RefreshCw size={11} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* STATO VUOTO ELEGANTE AL CENTRO (UGUALE A MACOS SCREENSHOT) */
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0a0a0f]">
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-10 max-w-md w-full text-center flex flex-col items-center gap-6 shadow-2xl backdrop-blur-xl">
                  {/* Icona Vault LocKey */}
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur-lg opacity-40"></div>
                    <div className="relative w-[84px] h-[84px] rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-2xl flex items-center justify-center">
                      <div className="w-full h-full bg-[#0e0e16] rounded-2xl flex items-center justify-center">
                        <ShieldCheck
                          size={44}
                          className="text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Testo Hero */}
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {t.vaultUnlockedTitle}
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                      {t.vaultUnlockedSubtitle}
                    </p>
                  </div>

                  {/* Badge di Sicurezza Ufficiali */}
                  <div className="flex items-center gap-2.5 flex-wrap justify-center">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/12 border border-purple-500/25 text-purple-300 text-xs font-semibold">
                      <Lock size={12} className="text-purple-400" />
                      <span>AES-256-GCM</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/12 border border-emerald-500/25 text-emerald-300 text-xs font-semibold">
                      <WifiOff size={12} className="text-emerald-400" />
                      <span>{t.zeroNetwork}</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/12 border border-blue-500/25 text-blue-300 text-xs font-semibold">
                      <ShieldCheck size={12} className="text-blue-400" />
                      <span>{t.localSecurity}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}
      </div>

      {/* --------------------------------------------- */}
      
      {/* Modal Conferma Eliminazione in-app (non blocca né sfuoca la finestra) */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141522] border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center flex flex-col items-center gap-4 shadow-2xl animate-fade-in relative">
            <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{deleteConfirmModal.title}</h3>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                {deleteConfirmModal.message}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full mt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  const run = deleteConfirmModal.onConfirm;
                  setDeleteConfirmModal((prev) => ({ ...prev, isOpen: false }));
                  run();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/30 transition-colors cursor-pointer"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS SECTION */}

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#11121c] border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center flex flex-col items-center gap-4 shadow-2xl animate-fade-in relative">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-[#0e0e16] rounded-2xl flex items-center justify-center">
                <ShieldCheck size={32} className="text-purple-400" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{t.aboutAppTitle}</h3>
              <p className="text-xs text-purple-400 font-semibold mt-0.5">{t.aboutVersionPrefix} v1.0.6</p>
              <p className="text-xs text-zinc-400 mt-2">
                {t.aboutDescription}
              </p>
            </div>

            {/* Language toggle inside About modal */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={toggleLang}
                className="btn btn-secondary flex items-center gap-1.5 py-1 px-3 text-xs"
              >
                <Globe size={13} className="text-indigo-400" />
                <span>{lang === 'it' ? 'Passa a Inglese (Switch to English)' : 'Passa a Italiano (Switch to Italian)'}</span>
              </button>
            </div>

            <div className="w-full border-t border-white/10 pt-4 flex flex-col gap-2">
              <button
                onClick={checkForUpdates}
                disabled={isCheckingUpdate}
                className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={13} className={isCheckingUpdate ? 'animate-spin text-blue-400' : 'text-blue-400'} />
                <span>{isCheckingUpdate ? t.checkingUpdatesText : t.checkUpdatesBtn}</span>
              </button>

              {updateStatus && (
                <div className="text-[11px] text-zinc-300 bg-black/30 rounded-lg p-2 border border-white/5">
                  {updateStatus}
                </div>
              )}

              {updateAvailable && updateUrl && (
                <a
                  href={updateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30"
                >
                  <ExternalLink size={13} />
                  <span>{t.downloadUpdateBtn}</span>
                </a>
              )}
            </div>

            <div className="pt-2 text-[11px] text-zinc-500">
              {t.developedBy}{' '}
              <a
                href="https://www.biragodev.it"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline font-semibold"
              >
                BiragoDev
              </a>
            </div>
          </div>
        </div>
      )}

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
                        title={t.generatePassword}
                      >
                        {t.generate}
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
              {editingCredId ? t.editAccount : `${t.newAccountFor} ${selectedApp?.name || ''}`}
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
                    title={t.generatePassword}
                  >
                    {t.generate}
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
