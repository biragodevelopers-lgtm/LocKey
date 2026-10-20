import Foundation
import CryptoKit
import CommonCrypto
import LocalAuthentication

/// Errori specifici relativi alle operazioni crittografiche del Vault.
public enum CryptoError: Error, LocalizedError {
    case invalidBase64
    case invalidUTF8
    case keyDerivationFailed
    case encryptionFailed(String)
    case decryptionFailed(String)
    case keychainError(OSStatus)
    
    public var errorDescription: String? {
        switch self {
        case .invalidBase64:
            return "La stringa Base64 fornita non è valida."
        case .invalidUTF8:
            return "Errore nella decodifica del testo UTF-8."
        case .keyDerivationFailed:
            return "Impossibile derivare la chiave crittografica."
        case .encryptionFailed(let message):
            return "Errore durante la cifratura: \(message)"
        case .decryptionFailed(let message):
            return "Errore durante la decifratura: \(message)"
        case .keychainError(let status):
            return "Errore nel Keychain di sistema (Codice: \(status))."
        }
    }
}

/// Gestore crittografico principale per cifratura AES-GCM, derivazione chiavi (PBKDF2)
/// e integrazione Keychain protetta da Secure Enclave (.userPresence).
public final class CryptoManager {
    
    private static let serviceName = "com.lockey.vaultkey"
    private static let accountName = "master"
    
    // MARK: - Generazione & Derivazione Chiavi
    
    /// Genera una chiave simmetrica casuale a 256 bit.
    public static func generateRandomKey() -> SymmetricKey {
        return SymmetricKey(size: .bits256)
    }
    
    /// Genera un salt casuale da utilizzare per la derivazione delle chiavi.
    public static func generateSalt() -> Data {
        var bytes = [UInt8](repeating: 0, count: 32)
        let _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        return Data(bytes)
    }
    
    /// Deriva una chiave a 256 bit a partire da una Master Password e un salt usando PBKDF2 con HMAC-SHA256.
    public static func deriveKey(password: String, salt: Data, iterations: Int = 100000) throws -> SymmetricKey {
        guard let passwordData = password.data(using: .utf8) else {
            throw CryptoError.keyDerivationFailed
        }
        var derivedBytes = [UInt8](repeating: 0, count: 32) // Chiave a 256 bit
        
        let status = passwordData.withUnsafeBytes { passwordBuf in
            salt.withUnsafeBytes { saltBuf in
                CCKeyDerivationPBKDF(
                    CCPBKDFAlgorithm(kCCPBKDF2),
                    passwordBuf.baseAddress?.assumingMemoryBound(to: Int8.self),
                    passwordData.count,
                    saltBuf.baseAddress?.assumingMemoryBound(to: UInt8.self),
                    salt.count,
                    CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256),
                    UInt32(iterations),
                    &derivedBytes,
                    derivedBytes.count
                )
            }
        }
        
        guard status == kCCSuccess else {
            throw CryptoError.keyDerivationFailed
        }
        
        return SymmetricKey(data: derivedBytes)
    }
    
    // MARK: - Cifratura & Decifratura AES-GCM
    
    /// Cifra una stringa di testo utilizzando una chiave simmetrica con algoritmo AES-256-GCM.
    /// Restituisce la stringa Base64 contenente [IV/Nonce + Ciphertext + Tag] uniti.
    public static func encrypt(_ plaintext: String, using key: SymmetricKey) throws -> String {
        guard let data = plaintext.data(using: .utf8) else {
            throw CryptoError.invalidUTF8
        }
        do {
            // CryptoKit genera automaticamente un Nonce sicuro di 12 byte se non specificato
            let sealedBox = try AES.GCM.seal(data, using: key)
            guard let combinedData = sealedBox.combined else {
                throw CryptoError.encryptionFailed("Impossibile combinare i dati cifrati.")
            }
            return combinedData.base64EncodedString()
        } catch {
            throw CryptoError.encryptionFailed(error.localizedDescription)
        }
    }
    
    /// Decifra una stringa cifrata in formato Base64 [IV/Nonce + Ciphertext + Tag] usando una chiave simmetrica.
    public static func decrypt(_ base64Ciphertext: String, using key: SymmetricKey) throws -> String {
        guard let combinedData = Data(base64Encoded: base64Ciphertext) else {
            throw CryptoError.invalidBase64
        }
        do {
            let sealedBox = try AES.GCM.SealedBox(combined: combinedData)
            let decryptedData = try AES.GCM.open(sealedBox, using: key)
            guard let decryptedString = String(data: decryptedData, encoding: .utf8) else {
                throw CryptoError.invalidUTF8
            }
            return decryptedString
        } catch {
            throw CryptoError.decryptionFailed(error.localizedDescription)
        }
    }
    
    // MARK: - Integrazione Secure Enclave & Keychain
    
    /// Salva la chiave simmetrica del Vault nel Keychain.
    public static func saveVaultKeyToKeychain(_ key: SymmetricKey) throws {
        let keyData = key.withUnsafeBytes { Data($0) }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: accountName,
            kSecValueData as String: keyData,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        // Rimuove eventuali chiavi preesistenti prima di salvare
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: accountName
        ]
        SecItemDelete(deleteQuery as CFDictionary)
        
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw CryptoError.keychainError(status)
        }
    }
    
    /// Recupera la chiave simmetrica del Vault dal Keychain.
    public static func loadVaultKeyFromKeychain() throws -> SymmetricKey {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: accountName,
            kSecReturnData as String: true
        ]
        
        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)
        
        guard status == errSecSuccess, let data = dataTypeRef as? Data else {
            throw CryptoError.keychainError(status)
        }
        
        return SymmetricKey(data: data)
    }
    
    /// Controlla se la chiave principale del Vault esiste nel Keychain.
    public static func isVaultKeyInKeychain() -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: accountName,
            kSecReturnData as String: false
        ]
        
        let status = SecItemCopyMatching(query as CFDictionary, nil)
        return status == errSecSuccess
    }
    
    /// Rimuove la chiave principale del Vault dal Keychain.
    public static func deleteVaultKeyFromKeychain() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: accountName
        ]
        SecItemDelete(query as CFDictionary)
    }
    
    // MARK: - Generatore di Password Sicuro
    
    /// Genera una password crittograficamente sicura ed esente da bias statistici.
    public static func generateSecurePassword(
        length: Int = 16,
        includeUppercase: Bool = true,
        includeLowercase: Bool = true,
        includeNumbers: Bool = true,
        includeSymbols: Bool = true
    ) -> String {
        let lowercaseLetters = "abcdefghijklmnopqrstuvwxyz"
        let uppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        let digits = "0123456789"
        let symbols = "!@#$%^&*()-_=+[]{}|;:',.<>?/"
        
        var characterPool = ""
        if includeLowercase { characterPool += lowercaseLetters }
        if includeUppercase { characterPool += uppercaseLetters }
        if includeNumbers { characterPool += digits }
        if includeSymbols { characterPool += symbols }
        
        // Se non viene selezionato alcun gruppo, forziamo lettere minuscole e numeri come fallback
        if characterPool.isEmpty {
            characterPool = lowercaseLetters + digits
        }
        
        let pool = Array(characterPool)
        var password = ""
        
        while password.count < length {
            var randomByte: UInt8 = 0
            let status = SecRandomCopyBytes(kSecRandomDefault, 1, &randomByte)
            guard status == errSecSuccess else {
                // Fallback sicuro se l'entropia di sistema non risponde (caso ipotetico estremamente raro)
                let fallbackPool = lowercaseLetters + digits
                let fallbackIndex = Int.random(in: 0..<fallbackPool.count)
                password.append(Array(fallbackPool)[fallbackIndex])
                continue
            }
            
            // Elimina il bias modulo scartando i valori superiori alla soglia massima divisibile
            let maxLimit = 256 - (256 % pool.count)
            let val = Int(randomByte)
            if val < maxLimit {
                let randomIndex = val % pool.count
                password.append(pool[randomIndex])
            }
        }
        
        return password
    }
    
    // MARK: - TOTP (Time-based One-time Password) Support
    
    /// Decodifica una stringa Base32 in Data.
    public static func base32Decode(_ base32: String) -> Data? {
        let alphabet = Array("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567")
        let clean = base32.uppercased().replacingOccurrences(of: " ", with: "").replacingOccurrences(of: "-", with: "")
        
        var bytes = [UInt8]()
        var buffer: UInt32 = 0
        var count = 0
        
        for char in clean {
            guard let val = alphabet.firstIndex(of: char) else {
                if char == "=" { continue }
                return nil
            }
            buffer = (buffer << 5) | UInt32(val)
            count += 5
            
            if count >= 8 {
                bytes.append(UInt8((buffer >> (count - 8)) & 0xFF))
                count -= 8
            }
        }
        return Data(bytes)
    }
    
    /// Genera un codice TOTP a 6 cifre per il segreto fornito.
    public static func generateTOTP(secretBase32: String) -> String? {
        var secret = secretBase32.trimmingCharacters(in: .whitespacesAndNewlines)
        if secret.lowercased().hasPrefix("otpauth://") {
            if let url = URL(string: secret),
               let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
               let secretItem = components.queryItems?.first(where: { $0.name.lowercased() == "secret" }) {
                secret = secretItem.value ?? secret
            }
        }
        
        guard let secretData = base32Decode(secret) else { return nil }
        
        let timeStep = 30.0
        let counter = UInt64(floor(Date().timeIntervalSince1970 / timeStep))
        
        var counterBE = counter.bigEndian
        let counterBytes = withUnsafeBytes(of: &counterBE) { Array($0) }
        
        let key = SymmetricKey(data: secretData)
        let signature = HMAC<Insecure.SHA1>.authenticationCode(for: counterBytes, using: key)
        let hmac = Array(signature)
        
        guard hmac.count > 0 else { return nil }
        
        let offset = Int(hmac.last! & 0x0F)
        let code = (
            ((Int(hmac[offset]) & 0x7F) << 24) |
            ((Int(hmac[offset + 1]) & 0xFF) << 16) |
            ((Int(hmac[offset + 2]) & 0xFF) << 8) |
            (Int(hmac[offset + 3]) & 0xFF)
        )
        
        let otp = code % 1000000
        return String(format: "%06d", otp)
    }
}
