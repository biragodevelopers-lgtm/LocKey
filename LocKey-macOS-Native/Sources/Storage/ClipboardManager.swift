import AppKit

/// Gestore centralizzato del portachiavi degli appunti (Pasteboard) per LocKey.
/// Offre la pulizia automatica di sicurezza dopo un intervallo di tempo prestabilito.
public final class ClipboardManager {
    
    /// Istanza condivisa del gestore degli appunti.
    public static let shared = ClipboardManager()
    
    private var clearWorkItem: DispatchWorkItem?
    private var lastCopiedContentHash: Int?
    
    private init() {}
    
    /// Copia il testo specificato negli appunti di macOS e programma la pulizia automatica.
    /// - Parameters:
    ///   - text: La stringa da copiare.
    ///   - seconds: I secondi prima di svuotare gli appunti (default: 30.0).
    public func copy(text: String, clearAfter seconds: Double = 30.0) {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(text, forType: .string)
        
        // Memorizziamo l'hash per verificare l'identità del contenuto al momento del trigger
        lastCopiedContentHash = text.hashValue
        
        // Cancella eventuali timer di svuotamento precedenti
        clearWorkItem?.cancel()
        
        let workItem = DispatchWorkItem { [weak self] in
            guard let self = self else { return }
            let currentText = pasteboard.string(forType: .string) ?? ""
            // Svuota gli appunti solo se l'utente non ha copiato altro nel frattempo
            if currentText.hashValue == self.lastCopiedContentHash {
                pasteboard.clearContents()
            }
        }
        
        clearWorkItem = workItem
        DispatchQueue.main.asyncAfter(deadline: .now() + seconds, execute: workItem)
    }
}
