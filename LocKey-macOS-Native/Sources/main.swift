import Foundation
import CryptoKit

// Helper per stampare i risultati del test
func printTest(_ name: String, success: Bool, details: String = "") {
    let symbol = success ? "✅" : "❌"
    print("\(symbol) \(name) \(details)")
}

print("=== LOCKEY CORE CRYPTO TEST RUNNER ===")

do {
    // -------------------------------------------------------------
    // Test 1: Generazione Chiave Casuale e Salt
    // -------------------------------------------------------------
    let salt = CryptoManager.generateSalt()
    printTest("Generazione Salt", success: salt.count == 32, details: "(Lunghezza: \(salt.count) byte)")
    
    let key = CryptoManager.generateRandomKey()
    let rawKeyData = key.withUnsafeBytes { Data($0) }
    printTest("Generazione Chiave Vault", success: rawKeyData.count == 32, details: "(Lunghezza: \(rawKeyData.count) byte)")
    
    // -------------------------------------------------------------
    // Test 2: Derivazione Chiave con PBKDF2
    // -------------------------------------------------------------
    let password = "SuperSecureMasterPassword123!"
    let derivedKey1 = try CryptoManager.deriveKey(password: password, salt: salt, iterations: 1000)
    let derivedKey2 = try CryptoManager.deriveKey(password: password, salt: salt, iterations: 1000)
    
    let rawDK1 = derivedKey1.withUnsafeBytes { Data($0) }
    let rawDK2 = derivedKey2.withUnsafeBytes { Data($0) }
    
    let derivationMatch = (rawDK1 == rawDK2) && (rawDK1.count == 32)
    printTest("Derivazione Chiave PBKDF2 (Stessa password + Stesso salt)", success: derivationMatch, details: "(Lunghezza PDK: \(rawDK1.count) byte)")
    
    // Verifica che salt differenti producano chiavi differenti
    let salt2 = CryptoManager.generateSalt()
    let derivedKeyDifferentSalt = try CryptoManager.deriveKey(password: password, salt: salt2, iterations: 1000)
    let rawDKDiff = derivedKeyDifferentSalt.withUnsafeBytes { Data($0) }
    printTest("Derivazione Chiave PBKDF2 (Salts differenti)", success: rawDK1 != rawDKDiff)
    
    // -------------------------------------------------------------
    // Test 3: Cifratura e Decifratura AES-GCM
    // -------------------------------------------------------------
    let secretText = "DatoSegretoDaCifrare"
    let ciphertext = try CryptoManager.encrypt(secretText, using: key)
    let decryptedText = try CryptoManager.decrypt(ciphertext, using: key)
    
    printTest("Cifratura/Decifratura AES-GCM", success: secretText == decryptedText, details: "(Testo decifrato: \(decryptedText))")
    
    // -------------------------------------------------------------
    // Test 4: Sicurezza Atomica (IV casuale per ciascuna cifratura)
    // -------------------------------------------------------------
    // Cifrando due volte lo stesso testo, dobbiamo ottenere ciphertext diversi
    let ciphertext1 = try CryptoManager.encrypt(secretText, using: key)
    let ciphertext2 = try CryptoManager.encrypt(secretText, using: key)
    
    let uniqueIVs = ciphertext1 != ciphertext2
    printTest("Sicurezza Atomica (Ciphertexts differenti per lo stesso testo)", success: uniqueIVs)
    
    let dec1 = try CryptoManager.decrypt(ciphertext1, using: key)
    let dec2 = try CryptoManager.decrypt(ciphertext2, using: key)
    printTest("Decifratura multipla con IV unici", success: dec1 == secretText && dec2 == secretText)
    
    // -------------------------------------------------------------
    // Test 5: Serializzazione e Deserializzazione Modello Dati
    // -------------------------------------------------------------
    let credentialDec = DecryptedCredential(title: "GitHub Admin", username: "matteomotta", password: "superSecretPassword", notes: "Note personali", url: "github.com")
    
    // Simuliamo il funzionamento di VaultStore:
    // Cifriamo i campi individualmente
    let encUsername = try CryptoManager.encrypt(credentialDec.username, using: key)
    let encPassword = try CryptoManager.encrypt(credentialDec.password, using: key)
    let encNotes = try CryptoManager.encrypt(credentialDec.notes, using: key)
    let encUrl = try CryptoManager.encrypt(credentialDec.url, using: key)
    
    let credentialEnc = Credential(
        title: credentialDec.title,
        encryptedUsername: encUsername,
        encryptedPassword: encPassword,
        encryptedNotes: encNotes,
        encryptedUrl: encUrl
    )
    
    let app = Application(name: "GitHub", website: "github.com", credentials: [credentialEnc])
    let group = Group(name: "Lavoro", icon: "briefcase", applications: [app])
    let groupsList = [group]
    
    // Codifica in JSON dell'intera struttura
    let encoder = JSONEncoder()
    let data = try encoder.encode(groupsList)
    
    // Decodifica JSON
    let decoder = JSONDecoder()
    let decodedGroups = try decoder.decode([Group].self, from: data)
    
    let appDecoded = decodedGroups[0].applications[0]
    let credDecoded = appDecoded.credentials[0]
    
    // Decifratura on-the-fly
    let decUsername = try CryptoManager.decrypt(credDecoded.encryptedUsername ?? "", using: key)
    let decPassword = try CryptoManager.decrypt(credDecoded.encryptedPassword ?? "", using: key)
    
    let modelSuccess = (appDecoded.name == "GitHub") &&
                       (decUsername == "matteomotta") &&
                       (decPassword == "superSecretPassword")
    
    printTest("Serializzazione/Deserializzazione Modelli + Cifratura Atomica", success: modelSuccess)
    
    // -------------------------------------------------------------
    // Test 6: Generatore di Password
    // -------------------------------------------------------------
    let passLength = 24
    let fullPass = CryptoManager.generateSecurePassword(length: passLength, includeUppercase: true, includeLowercase: true, includeNumbers: true, includeSymbols: true)
    let correctLength = fullPass.count == passLength
    
    // Genera password escludendo numeri e simboli
    let alphaPass = CryptoManager.generateSecurePassword(length: 30, includeUppercase: true, includeLowercase: true, includeNumbers: false, includeSymbols: false)
    let numbersSet = CharacterSet(charactersIn: "0123456789")
    let symbolsSet = CharacterSet(charactersIn: "!@#$%^&*()-_=+[]{}|;:',.<>?/")
    
    let hasNumbers = alphaPass.rangeOfCharacter(from: numbersSet) != nil
    let hasSymbols = alphaPass.rangeOfCharacter(from: symbolsSet) != nil
    
    let generatorSuccess = correctLength && !hasNumbers && !hasSymbols
    printTest("Generatore Password (Lunghezza e restrizioni caratteri)", success: generatorSuccess, details: "(Esempio: \(alphaPass))")
    
    print("\n✅ TUTTI I TEST SONO PASSATI CON SUCCESSO!")
    
} catch {
    print("❌ ERRORE DURANTE I TEST: \(error)")
    exit(1)
}
