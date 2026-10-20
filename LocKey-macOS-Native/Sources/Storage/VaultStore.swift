import Foundation
import CryptoKit
import Combine
import LocalAuthentication

/// Gestisce lo stato e la persistenza dei dati cifrati del Vault.
/// Implementa sia lo sblocco biometrico che quello tramite Master Password.
public final class VaultStore: ObservableObject {
    
    @Published public var isUnlocked: Bool = false
    @Published public var isManualLock: Bool = false
    @Published public var groups: [Group] = []
    @Published public var hasVaultFile: Bool = false
    @Published public var errorMessage: String? = nil
    
    /// Riferimento alla chiave del Vault decifrata in memoria.
    private var vaultKey: SymmetricKey? = nil
    
    private var vaultDirectory: URL {
        let paths = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)
        return paths[0].appendingPathComponent("LocKey", isDirectory: true)
    }
    
    private var vaultURL: URL {
        return vaultDirectory.appendingPathComponent("vault.json")
    }
    
    public init() {
        self.hasVaultFile = FileManager.default.fileExists(atPath: vaultURL.path)
    }
    
    /// Ritorna true se il file del Vault esiste e se la chiave è presente nel portachiavi.
    public var isTouchIDAvailableForUnlock: Bool {
        return hasVaultFile && CryptoManager.isVaultKeyInKeychain() && BiometricAuthenticator.isBiometricsAvailable
    }
    
    // MARK: - Inizializzazione del Vault
    
    /// Configura per la prima volta il database del Vault, impostando la Master Password
    /// e salvando la chiave master nel Keychain (per Touch ID).
    public func createVault(password: String) {
        do {
            // 1. Crea la chiave principale del Vault e il salt
            let newVaultKey = CryptoManager.generateRandomKey()
            let salt = CryptoManager.generateSalt()
            
            // 2. Deriva la PDK (Password Derived Key) dalla password fornita
            let pdk = try CryptoManager.deriveKey(password: password, salt: salt)
            
            // 3. Cifra la chiave del vault con la PDK
            let rawVaultKeyData = newVaultKey.withUnsafeBytes { Data($0) }
            let encryptedVaultKey = try CryptoManager.encrypt(rawVaultKeyData.base64EncodedString(), using: pdk)
            
            // 4. Salva la chiave principale del vault nel Keychain per Touch ID
            try CryptoManager.saveVaultKeyToKeychain(newVaultKey)
            
            // 5. Cifra la struttura vuota dei gruppi usando la chiave principale del vault
            let emptyGroups: [Group] = []
            let groupsData = try JSONEncoder().encode(emptyGroups)
            let encryptedGroups = try CryptoManager.encrypt(String(decoding: groupsData, as: UTF8.self), using: newVaultKey)
            
            // 6. Crea il database e salvalo su disco
            let database = VaultDatabase(
                salt: salt.base64EncodedString(),
                encryptedVaultKey: encryptedVaultKey,
                encryptedGroups: encryptedGroups
            )
            
            try saveDatabaseToDisk(database)
            
            // 7. Imposta lo stato in memoria
            self.vaultKey = newVaultKey
            self.groups = emptyGroups
            self.hasVaultFile = true
            self.isUnlocked = true
            self.errorMessage = nil
            
        } catch {
            self.errorMessage = "Errore durante la creazione del Vault: \(error.localizedDescription)"
        }
    }
    
    // MARK: - Sblocco del Vault
    
    /// Sblocca il Vault decifrando la chiave principale tramite la Master Password dell'utente.
    public func unlockWithPassword(password: String) -> Bool {
        do {
            let database = try loadDatabaseFromDisk()
            guard let saltData = Data(base64Encoded: database.salt) else {
                throw CryptoError.invalidBase64
            }
            
            // 1. Deriva la chiave PDK
            let pdk = try CryptoManager.deriveKey(password: password, salt: saltData)
            
            // 2. Decifra la VaultKey usando la PDK
            let decryptedVaultKeyBase64 = try CryptoManager.decrypt(database.encryptedVaultKey, using: pdk)
            guard let rawVaultKey = Data(base64Encoded: decryptedVaultKeyBase64) else {
                throw CryptoError.invalidBase64
            }
            let key = SymmetricKey(data: rawVaultKey)
            
            // 3. Decifra i gruppi usando la VaultKey
            let decryptedGroupsJSON = try CryptoManager.decrypt(database.encryptedGroups, using: key)
            guard let groupsData = decryptedGroupsJSON.data(using: .utf8) else {
                throw CryptoError.invalidUTF8
            }
            
            let loadedGroups = try JSONDecoder().decode([Group].self, from: groupsData)
            
            // 4. Salva la chiave decifrata nel Keychain per abilitare Touch ID ai successivi sblocchi
            try? CryptoManager.saveVaultKeyToKeychain(key)
            
            // 5. Aggiorna lo stato in memoria
            self.vaultKey = key
            self.groups = loadedGroups
            self.isUnlocked = true
            self.isManualLock = false
            self.errorMessage = nil
            return true
            
        } catch {
            self.errorMessage = "Master Password errata o database danneggiato."
            return false
        }
    }
    
    /// Sblocca il Vault richiedendo esplicitamente l'autenticazione biometrica (Touch ID).
    public func unlockWithTouchID(completion: ((Bool) -> Void)? = nil) {
        guard isTouchIDAvailableForUnlock else {
            self.errorMessage = "Touch ID non disponibile su questo dispositivo."
            completion?(false)
            return
        }
        
        BiometricAuthenticator.authenticateUser(reason: "Sblocca il tuo Vault protetto LocKey") { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success:
                do {
                    let database = try self.loadDatabaseFromDisk()
                    let key = try CryptoManager.loadVaultKeyFromKeychain()
                    let decryptedGroupsJSON = try CryptoManager.decrypt(database.encryptedGroups, using: key)
                    guard let groupsData = decryptedGroupsJSON.data(using: .utf8) else {
                        throw CryptoError.invalidUTF8
                    }
                    
                    let loadedGroups = try JSONDecoder().decode([Group].self, from: groupsData)
                    
                    self.vaultKey = key
                    self.groups = loadedGroups
                    self.isUnlocked = true
                    self.isManualLock = false
                    self.errorMessage = nil
                    completion?(true)
                    
                } catch {
                    self.errorMessage = "Errore durante la decifratura del database: \(error.localizedDescription)"
                    completion?(false)
                }
            case .failure(let error):
                if let laError = error as? LAError, laError.code == .userCancel || laError.code == .appCancel || laError.code == .systemCancel {
                    // L'utente ha annullato la richiesta biometrica, non mostriamo errori allarmanti
                    self.errorMessage = nil
                } else {
                    self.errorMessage = "Autenticazione biometrica non riuscita: \(error.localizedDescription)"
                }
                completion?(false)
            }
        }
    }
    
    // MARK: - Chiusura (Lock)
    
    /// Chiude il Vault azzerando tutti i dati in chiaro in memoria.
    public func lock() {
        self.vaultKey = nil
        self.groups = []
        self.isUnlocked = false
        self.isManualLock = true
        self.errorMessage = nil
    }
    
    // MARK: - Salvataggio Modifiche
    
    /// Salva le modifiche in memoria crittografandole nuovamente su disco.
    public func save() {
        guard let key = vaultKey else {
            self.errorMessage = "Vault non sbloccato. Impossibile salvare."
            return
        }
        
        do {
            // 1. Legge il database corrente per mantenere salt e encryptedVaultKey intatti
            var database = try loadDatabaseFromDisk()
            
            // 2. Cifra la nuova lista gruppi con la chiave principale
            let groupsData = try JSONEncoder().encode(self.groups)
            let encryptedGroups = try CryptoManager.encrypt(String(decoding: groupsData, as: UTF8.self), using: key)
            
            // 3. Aggiorna e salva
            database.encryptedGroups = encryptedGroups
            try saveDatabaseToDisk(database)
            self.errorMessage = nil
            
        } catch {
            self.errorMessage = "Errore durante il salvataggio dei dati: \(error.localizedDescription)"
        }
    }
    
    // MARK: - Gestione Credenziali (Cifratura Atomica)
    
    /// Decifra on-the-fly una singola credenziale per l'utilizzo nell'interfaccia utente.
    public func decryptCredential(_ credential: Credential) -> DecryptedCredential {
        guard let key = vaultKey else {
            return DecryptedCredential(id: credential.id, title: credential.title)
        }
        
        let username = credential.encryptedUsername.flatMap { try? CryptoManager.decrypt($0, using: key) } ?? ""
        let password = credential.encryptedPassword.flatMap { try? CryptoManager.decrypt($0, using: key) } ?? ""
        let notes = credential.encryptedNotes.flatMap { try? CryptoManager.decrypt($0, using: key) } ?? ""
        let url = credential.encryptedUrl.flatMap { try? CryptoManager.decrypt($0, using: key) } ?? ""
        let totpSecret = credential.encryptedTotpSecret.flatMap { try? CryptoManager.decrypt($0, using: key) } ?? ""
        
        return DecryptedCredential(
            id: credential.id,
            title: credential.title,
            username: username,
            password: password,
            notes: notes,
            url: url,
            totpSecret: totpSecret,
            createdAt: credential.createdAt,
            updatedAt: credential.updatedAt
        )
    }
    
    /// Cifra individualmente i campi di una DecryptedCredential per produrre una Credential protetta.
    public func encryptCredential(_ decrypted: DecryptedCredential) throws -> Credential {
        guard let key = vaultKey else {
            throw CryptoError.decryptionFailed("Chiave del vault non trovata in memoria.")
        }
        
        let encUsername = try CryptoManager.encrypt(decrypted.username, using: key)
        let encPassword = try CryptoManager.encrypt(decrypted.password, using: key)
        let encNotes = try CryptoManager.encrypt(decrypted.notes, using: key)
        let encUrl = try CryptoManager.encrypt(decrypted.url, using: key)
        let encTotpSecret = decrypted.totpSecret.isEmpty ? nil : try CryptoManager.encrypt(decrypted.totpSecret, using: key)
        
        return Credential(
            id: decrypted.id,
            title: decrypted.title,
            encryptedUsername: encUsername,
            encryptedPassword: encPassword,
            encryptedNotes: encNotes,
            encryptedUrl: encUrl,
            encryptedTotpSecret: encTotpSecret,
            createdAt: decrypted.createdAt,
            updatedAt: Date()
        )
    }
    
    /// Reimposta interamente il Vault, cancellando i file locali e la chiave nel Keychain.
    public func resetVault() {
        lock()
        CryptoManager.deleteVaultKeyFromKeychain()
        try? FileManager.default.removeItem(at: vaultURL)
        self.hasVaultFile = false
    }
    
    // MARK: - File Helper
    
    private func saveDatabaseToDisk(_ database: VaultDatabase) throws {
        if !FileManager.default.fileExists(atPath: vaultDirectory.path) {
            try FileManager.default.createDirectory(at: vaultDirectory, withIntermediateDirectories: true, attributes: nil)
        }
        
        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted
        let data = try encoder.encode(database)
        try data.write(to: vaultURL, options: .atomic)
    }
    
    private func loadDatabaseFromDisk() throws -> VaultDatabase {
        let data = try Data(contentsOf: vaultURL)
        return try JSONDecoder().decode(VaultDatabase.self, from: data)
    }
    
    // MARK: - Backup Export / Import (.lockey)
    
    /// Esporta il vault decifrato in un file JSON cifrato con una password di backup.
    public func exportBackup(to url: URL, password: String) throws {
        guard isUnlocked, vaultKey != nil else {
            throw CryptoError.decryptionFailed("Vault non sbloccato.")
        }
        
        var decryptedGroups: [DecryptedGroupBackup] = []
        for g in self.groups {
            var apps: [DecryptedApplicationBackup] = []
            for app in g.applications {
                var creds: [DecryptedCredentialBackup] = []
                for cred in app.credentials {
                    let dec = decryptCredential(cred)
                    creds.append(DecryptedCredentialBackup(
                        title: dec.title,
                        username: dec.username,
                        password: dec.password,
                        notes: dec.notes,
                        url: dec.url,
                        totpSecret: dec.totpSecret,
                        createdAt: dec.createdAt,
                        updatedAt: dec.updatedAt
                    ))
                }
                apps.append(DecryptedApplicationBackup(name: app.name, website: app.website, credentials: creds))
            }
            decryptedGroups.append(DecryptedGroupBackup(name: g.name, icon: g.icon, applications: apps))
        }
        
        let backupObj = LockeyBackup(groups: decryptedGroups)
        let backupData = try JSONEncoder().encode(backupObj)
        let backupJSON = String(decoding: backupData, as: UTF8.self)
        
        let salt = CryptoManager.generateSalt()
        let pdk = try CryptoManager.deriveKey(password: password, salt: salt)
        let ciphertext = try CryptoManager.encrypt(backupJSON, using: pdk)
        
        let backupFile = VaultDatabase(
            version: 1,
            salt: salt.base64EncodedString(),
            encryptedVaultKey: ciphertext,
            encryptedGroups: ""
        )
        
        let fileData = try JSONEncoder().encode(backupFile)
        try fileData.write(to: url, options: .atomic)
    }
    
    /// Importa il vault da un file .lockey decifrandolo con una password fornita.
    public func importBackup(from url: URL, password: String) throws {
        guard isUnlocked, vaultKey != nil else {
            throw CryptoError.decryptionFailed("Vault non sbloccato per l'importazione.")
        }
        
        let fileData = try Data(contentsOf: url)
        let backupFile = try JSONDecoder().decode(VaultDatabase.self, from: fileData)
        
        guard let saltData = Data(base64Encoded: backupFile.salt) else {
            throw CryptoError.invalidBase64
        }
        
        let pdk = try CryptoManager.deriveKey(password: password, salt: saltData)
        let decryptedJSON = try CryptoManager.decrypt(backupFile.encryptedVaultKey, using: pdk)
        
        guard let backupData = decryptedJSON.data(using: .utf8) else {
            throw CryptoError.invalidUTF8
        }
        
        let backupObj = try JSONDecoder().decode(LockeyBackup.self, from: backupData)
        
        var importedGroups: [Group] = []
        for gBackup in backupObj.groups {
            var apps: [Application] = []
            for appBackup in gBackup.applications {
                var creds: [Credential] = []
                for credBackup in appBackup.credentials {
                    let dec = DecryptedCredential(
                        id: UUID(),
                        title: credBackup.title,
                        username: credBackup.username,
                        password: credBackup.password,
                        notes: credBackup.notes,
                        url: credBackup.url,
                        totpSecret: credBackup.totpSecret,
                        createdAt: credBackup.createdAt,
                        updatedAt: credBackup.updatedAt
                    )
                    let enc = try encryptCredential(dec)
                    creds.append(enc)
                }
                apps.append(Application(name: appBackup.name, website: appBackup.website, credentials: creds))
            }
            importedGroups.append(Group(name: gBackup.name, icon: gBackup.icon, applications: apps))
        }
        
        for impGroup in importedGroups {
            if let existingIdx = self.groups.firstIndex(where: { $0.name.lowercased() == impGroup.name.lowercased() }) {
                for impApp in impGroup.applications {
                    if let existingAppIdx = self.groups[existingIdx].applications.firstIndex(where: { $0.name.lowercased() == impApp.name.lowercased() }) {
                        for impCred in impApp.credentials {
                            let decImp = decryptCredential(impCred)
                            let isDup = self.groups[existingIdx].applications[existingAppIdx].credentials.contains { c in
                                let decC = decryptCredential(c)
                                return decC.username == decImp.username
                            }
                            if !isDup {
                                self.groups[existingIdx].applications[existingAppIdx].credentials.append(impCred)
                            }
                        }
                    } else {
                        self.groups[existingIdx].applications.append(impApp)
                    }
                }
            } else {
                self.groups.append(impGroup)
            }
        }
        
        save()
    }
}

// MARK: - Backup Support Codable Structs

public struct LockeyBackup: Codable {
    public var version: Int = 1
    public var groups: [DecryptedGroupBackup]
}

public struct DecryptedGroupBackup: Codable {
    public var name: String
    public var icon: String
    public var applications: [DecryptedApplicationBackup]
}

public struct DecryptedApplicationBackup: Codable {
    public var name: String
    public var website: String
    public var credentials: [DecryptedCredentialBackup]
}

public struct DecryptedCredentialBackup: Codable {
    public var title: String
    public var username: String
    public var password: String
    public var notes: String
    public var url: String
    public var totpSecret: String
    public var createdAt: Date
    public var updatedAt: Date
}
