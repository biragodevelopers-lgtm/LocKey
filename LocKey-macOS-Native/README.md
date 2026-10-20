# LocKey - Password Manager Nativo per macOS (.app)

LocKey è un password manager nativo per macOS basato su un modello dati **Zero-Knowledge**, sblocco biometrico tramite **Touch ID** con integrazione **Secure Enclave** e cifratura **AES-256-GCM** atomica per ciascuna credenziale.

---

## 🔒 Sicurezza & Crittografia Nativi

1. **Zero-Knowledge**: Tutti i dati vengono cifrati in locale sul dispositivo dell'utente. Nessuna password o dato in chiaro viene salvato sul disco o trasmesso all'esterno.
2. **Secure Enclave & Keychain**: La chiave di sblocco master del Vault (`VaultKey`) viene memorizzata nel portachiavi di sistema. L'accesso a questa chiave è protetto a livello hardware da flags di Access Control del Secure Enclave (`.userPresence`). Ogni tentativo di lettura forza il sistema macOS a richiedere l'autenticazione Touch ID o il PIN del dispositivo.
3. **Master Password Recovery**: Se il Touch ID non è disponibile, la chiave del Vault può essere sbloccata derivando una chiave temporanea dalla Master Password tramite l'algoritmo PBKDF2 (100.000 iterazioni SHA-256) con un salt univoco da 32 byte. Questa chiave temporanea decifra la `VaultKey` memorizzata nel database locale.
4. **Cifratura Atomica**: Ogni credenziale cifrata all'interno del database contiene i campi sensibili (username, password, note, url) cifrati singolarmente con AES-GCM (CryptoKit) usando la `VaultKey`. Ciascun campo ha un IV (vettore di inizializzazione) univoco e casuale generato al momento, impedendo correlazioni basate su valori cifrati identici.
5. **Auto-Lock (Blocco Automatico)**: Per evitare accessi non autorizzati, il vault viene bloccato istantaneamente e la chiave rimossa dalla memoria quando:
   - L'applicazione perde il focus (l'utente riduce l'app a icona o passa a un'altra finestra).
   - Il Mac entra in modalità stop (sleep).
6. **Clipboard Auto-Clear (Pulizia Appunti)**: Copiando un nome utente o una password, questa viene salvata nella Clipboard di macOS e programmata per la cancellazione dopo 30 secondi. Il gestore verifica l'hash del contenuto corrente prima della rimozione per evitare di cancellare dati che l'utente ha copiato da altre app nel frattempo.
7. **Generatore di Password Crittografico**: Genera password ad alta entropia configurabili (maiuscole, minuscole, numeri, simboli) usando `SecRandomCopyBytes` con un algoritmo di campionamento a rigetto che rimuove qualsiasi bias statistico indotto dall'operatore modulo (%).

---

## 🛠️ Configurazione del Progetto in Xcode

Segui questi passaggi per configurare ed eseguire il progetto localmente con Xcode:

### 1. Creazione del Progetto
1. Apri **Xcode** sul tuo Mac.
2. Seleziona **File > New > Project...**
3. Sotto la scheda **macOS**, seleziona **App** e clicca su *Next*.
4. Configura i dettagli del progetto:
   - **Product Name**: `LocKey`
   - **Organization Identifier**: `com.lockey` (o il tuo dominio invertito)
   - **Interface**: `SwiftUI`
   - **Language**: `Swift`
5. Clicca su *Next* e salva il progetto nella cartella desiderata.

### 2. Importazione dei File di Codice
1. Elimina i file generati automaticamente da Xcode: `ContentView.swift` e `LocKeyApp.swift` (seleziona *Move to Trash*).
2. Trascina la cartella `Sources` del workspace all'interno dell'alberatura del progetto Xcode.
3. Nella finestra di dialogo che compare, assicurati che:
   - Sia selezionato **Copy items if needed**.
   - Sia selezionato **Create groups**.
   - La spunta sul target **LocKey** sia attiva.
4. Clicca su *Finish*.

### 3. Configurazione degli Entitlements (App Sandbox & Keychain)
Per poter salvare in sicurezza i dati e interagire con il Keychain, l'app richiede la configurazione dei permessi di sicurezza di macOS:

1. Seleziona il progetto nella barra laterale sinistra di Xcode.
2. Vai sulla scheda **Signing & Capabilities** del target `LocKey`.
3. Assicurati che la sezione **App Sandbox** sia presente (se non c'è, premi il tasto `+ Capability` in alto a sinistra e aggiungi **App Sandbox**).
4. Nella configurazione dell'App Sandbox, verifica che le opzioni per la rete siano disattivate (l'app è 100% offline) e che sotto **File Access** l'opzione **User Selected Files** sia impostata su **Read/Write** per consentire il salvataggio locale del vault.
5. Clicca su `+ Capability` e aggiungi **Keychain Sharing**.
6. Aggiungi un nuovo gruppo sotto Keychain Sharing rinominandolo in: `com.lockey.vault`
   *(Xcode creerà automaticamente un file `.entitlements` contenente le chiavi specificate nel nostro file `Resources/LocKey.entitlements`).*

### 4. Permessi Biometrici (Info.plist)
Per abilitare l'autenticazione tramite LocalAuthentication e supportare appieno le API del sistema operativo:

1. Fai clic sul progetto Xcode nel navigatore e seleziona il target `LocKey`.
2. Spostati sulla scheda **Info** (oppure apri il file `Info.plist`).
3. Aggiungi una nuova riga e inserisci la chiave:
   - Chiave: `Privacy - Face ID Usage Description` (nome interno: `NSFaceIDUsageDescription`)
   - Tipo: `String`
   - Valore: `LocKey richiede l'uso dell'autenticazione biometrica per sbloccare in sicurezza le tue credenziali nel Vault.`
4. Compila ed esegui premendo `Cmd + R`.

---

## 📦 Compilazione e Distribuzione (.DMG)

Per distribuire l'applicazione come file `.dmg` di installazione:

1. In Xcode, compila l'applicazione in modalità **Release** (oppure esegui un **Product > Archive**).
2. Esporta il pacchetto compilato ottenendo il file `LocKey.app`.
3. Crea una cartella chiamata `Build` nella cartella principale del progetto:
   ```bash
   mkdir -p Build
   ```
4. Copia il file `LocKey.app` all'interno della cartella `Build`.
5. Apri il Terminale ed esegui lo script di packaging nativo:
   ```bash
   ./Scripts/create_dmg.sh
   ```
6. Verrà generato un file `LocKey.dmg` di sola lettura e compresso. Facendoci doppio clic, l'utente potrà installare comodamente l'app trascinandola nella cartella *Applications*.
