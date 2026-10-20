import Foundation
import LocalAuthentication

/// Gestore dell'autenticazione biometrica (Touch ID) tramite LocalAuthentication.
public final class BiometricAuthenticator {
    
    /// Rappresenta il tipo di autenticazione biometrica disponibile sul dispositivo.
    public enum BiometricType {
        case none
        case touchID
        case faceID
        case opticID // Per visori o hardware futuri
        
        public var localizedName: String {
            switch self {
            case .none: return "Password"
            case .touchID: return "Touch ID"
            case .faceID: return "Face ID"
            case .opticID: return "Optic ID"
            }
        }
    }
    
    /// Verifica se l'autenticazione biometrica è configurata e disponibile sul Mac.
    public static var isBiometricsAvailable: Bool {
        let context = LAContext()
        var error: NSError?
        // Verifichiamo solo la disponibilità biometrica
        let available = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        return available && error == nil
    }
    
    /// Restituisce il tipo specifico di biometria supportato dal Mac attuale (es. Touch ID).
    public static var biometricType: BiometricType {
        let context = LAContext()
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            return .none
        }
        
        switch context.biometryType {
        case .none:
            return .none
        case .touchID:
            return .touchID
        case .faceID:
            return .faceID
        case .opticID:
            return .opticID
        @unknown default:
            return .none
        }
    }
    
    /// Richiede esplicitamente l'autenticazione tramite Touch ID per una determinata operazione.
    /// - Parameters:
    ///   - reason: Il motivo visualizzato all'utente nella finestra di dialogo di sistema.
    ///   - completion: Callback asincrona chiamata sul thread principale.
    public static func authenticateUser(
        reason: String = "Accedi alle tue credenziali protette in LocKey",
        completion: @escaping (Result<Void, Error>) -> Void
    ) {
        let context = LAContext()
        context.localizedFallbackTitle = "Inserisci Master Password"
        
        // Esegue la verifica biometrica
        context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { success, error in
            DispatchQueue.main.async {
                if success {
                    completion(.success(()))
                } else if let error = error {
                    completion(.failure(error))
                } else {
                    let unknownError = NSError(
                        domain: "BiometricAuthenticator",
                        code: -1,
                        userInfo: [NSLocalizedDescriptionKey: "Autenticazione biometrica fallita."]
                    )
                    completion(.failure(unknownError))
                }
            }
        }
    }
}
