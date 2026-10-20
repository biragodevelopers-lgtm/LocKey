import Foundation

/// Rappresenta una credenziale protetta all'interno di un'applicazione.
/// Tutti i campi sensibili sono cifrati individualmente.
public struct Credential: Identifiable, Codable, Equatable {
    public let id: UUID
    public var title: String
    
    /// Username cifrato individualmente (Base64 contenente IV + Ciphertext + Tag)
    public var encryptedUsername: String?
    /// Password cifrata individualmente (Base64 contenente IV + Ciphertext + Tag)
    public var encryptedPassword: String?
    /// Note cifrate individualmente (Base64 contenente IV + Ciphertext + Tag)
    public var encryptedNotes: String?
    /// URL cifrato individualmente (Base64 contenente IV + Ciphertext + Tag)
    public var encryptedUrl: String?
    /// Segreto TOTP cifrato individualmente (Base64 contenente IV + Ciphertext + Tag)
    public var encryptedTotpSecret: String?
    
    public var createdAt: Date
    public var updatedAt: Date
    
    public init(
        id: UUID = UUID(),
        title: String,
        encryptedUsername: String? = nil,
        encryptedPassword: String? = nil,
        encryptedNotes: String? = nil,
        encryptedUrl: String? = nil,
        encryptedTotpSecret: String? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.title = title
        self.encryptedUsername = encryptedUsername
        self.encryptedPassword = encryptedPassword
        self.encryptedNotes = encryptedNotes
        self.encryptedUrl = encryptedUrl
        self.encryptedTotpSecret = encryptedTotpSecret
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

/// Rappresenta un'applicazione definita dall'utente.
/// Contiene una o più credenziali associate.
public struct Application: Identifiable, Codable, Equatable {
    public let id: UUID
    public var name: String
    public var website: String // URL visibile in chiaro per facilitare la navigazione
    public var credentials: [Credential]
    
    public init(
        id: UUID = UUID(),
        name: String,
        website: String = "",
        credentials: [Credential] = []
    ) {
        self.id = id
        self.name = name
        self.website = website
        self.credentials = credentials
    }
}

/// Rappresenta un gruppo logico di applicazioni (es. "Lavoro", "Personale").
public struct Group: Identifiable, Codable, Equatable {
    public let id: UUID
    public var name: String
    public var icon: String // Nome dell'icona SF Symbols
    public var applications: [Application]
    
    public init(
        id: UUID = UUID(),
        name: String,
        icon: String = "folder",
        applications: [Application] = []
    ) {
        self.id = id
        self.name = name
        self.icon = icon
        self.applications = applications
    }
}

/// Rappresenta la struttura del database salvato su disco.
/// Segue i principi di sicurezza Zero-Knowledge.
public struct VaultDatabase: Codable {
    public var version: Int
    /// Salt generato casualmente al momento della configurazione (Base64)
    public var salt: String
    /// La chiave master del Vault cifrata con la chiave derivata dalla Master Password (Base64)
    public var encryptedVaultKey: String
    /// L'intera struttura dei Gruppi cifrata con la chiave master del Vault (Base64)
    public var encryptedGroups: String
    
    public init(
        version: Int = 1,
        salt: String,
        encryptedVaultKey: String,
        encryptedGroups: String
    ) {
        self.version = version
        self.salt = salt
        self.encryptedVaultKey = encryptedVaultKey
        self.encryptedGroups = encryptedGroups
    }
}

/// Modello in chiaro per scopi di UI e manipolazione dati in memoria dopo lo sblocco.
public struct DecryptedCredential: Identifiable, Hashable {
    public let id: UUID
    public var title: String
    public var username: String
    public var password: String
    public var notes: String
    public var url: String
    public var totpSecret: String
    public var createdAt: Date
    public var updatedAt: Date
    
    public init(
        id: UUID = UUID(),
        title: String,
        username: String = "",
        password: String = "",
        notes: String = "",
        url: String = "",
        totpSecret: String = "",
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.title = title
        self.username = username
        self.password = password
        self.notes = notes
        self.url = url
        self.totpSecret = totpSecret
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}
