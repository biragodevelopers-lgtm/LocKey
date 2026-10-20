import SwiftUI

/// Vista riga per visualizzare e gestire in sicurezza una credenziale.
public struct CredentialRowView: View {
    @ObservedObject var vaultStore: VaultStore
    let credential: Credential
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    @State private var isPasswordVisible = false
    @State private var justCopiedUsername = false
    @State private var justCopiedPassword = false
    
    @State private var totpCode = ""
    @State private var timeRemaining = 30
    @State private var justCopiedTOTP = false
    
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    private var decrypted: DecryptedCredential {
        vaultStore.decryptCredential(credential)
    }
    
    public init(
        vaultStore: VaultStore,
        credential: Credential,
        onEdit: @escaping () -> Void,
        onDelete: @escaping () -> Void
    ) {
        self.vaultStore = vaultStore
        self.credential = credential
        self.onEdit = onEdit
        self.onDelete = onDelete
    }
    
    public var body: some View {
        HStack(alignment: .center, spacing: 16) {
            // Icona Lucchetto
            Image(systemName: "key.fill")
                .font(.system(size: 16))
                .foregroundColor(.purple)
                .frame(width: 32, height: 32)
                .background(Color.purple.opacity(0.1))
                .cornerRadius(8)
            
            // Dettagli Credenziale
            VStack(alignment: .leading, spacing: 3) {
                Text(decrypted.title)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                HStack(spacing: 8) {
                    if !decrypted.username.isEmpty {
                        Text(decrypted.username)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    } else {
                        Text("Nessun nome utente")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .italic()
                    }
                    
                    if !decrypted.url.isEmpty {
                        Text("•")
                            .foregroundColor(.secondary)
                        Text(decrypted.url)
                            .font(.subheadline)
                            .foregroundColor(.blue)
                            .lineLimit(1)
                    }
                }
                
                if !decrypted.totpSecret.isEmpty {
                    HStack(spacing: 6) {
                        Image(systemName: "clock.fill")
                            .font(.caption)
                            .foregroundColor(.purple)
                        Text("2FA:")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)
                        Text(totpCodeFormatted)
                            .font(.system(.subheadline, design: .monospaced))
                            .fontWeight(.bold)
                            .foregroundColor(.purple)
                        Text("(\(timeRemaining)s)")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        
                        Button(action: copyTOTP) {
                            Image(systemName: justCopiedTOTP ? "checkmark" : "doc.on.doc")
                                .font(.system(size: 10))
                                .foregroundColor(justCopiedTOTP ? .green : .secondary)
                        }
                        .buttonStyle(.plain)
                        .help(justCopiedTOTP ? "Copiato!" : "Copia codice OTP")
                    }
                    .padding(.top, 2)
                    .onReceive(timer) { _ in
                        updateTOTP()
                    }
                    .onAppear {
                        updateTOTP()
                    }
                }
            }
            
            Spacer()
            
            // Pulsanti e Azioni Rapide
            HStack(spacing: 12) {
                if !decrypted.password.isEmpty {
                    // Visualizzazione Password in chiaro/protetta
                    SwiftUI.Group {
                        if isPasswordVisible {
                            Text(decrypted.password)
                                .font(.system(.subheadline, design: .monospaced))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.primary.opacity(0.08))
                                .cornerRadius(4)
                        } else {
                            Text("••••••••")
                                .font(.system(.subheadline, design: .monospaced))
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    // Tasto Mostra/Nascondi
                    Button(action: { isPasswordVisible.toggle() }) {
                        Image(systemName: isPasswordVisible ? "eye.slash" : "eye")
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                            .frame(width: 28, height: 28)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .help(isPasswordVisible ? "Nascondi password" : "Mostra password")
                    
                    // Tasto Copia Password
                    Button(action: copyPassword) {
                        Image(systemName: justCopiedPassword ? "checkmark" : "doc.on.doc")
                            .font(.system(size: 13))
                            .foregroundColor(justCopiedPassword ? .green : .secondary)
                            .frame(width: 28, height: 28)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .help(justCopiedPassword ? "Copiata!" : "Copia password")
                }
                
                if !decrypted.username.isEmpty {
                    // Tasto Copia Username
                    Button(action: copyUsername) {
                        Image(systemName: justCopiedUsername ? "checkmark" : "person.badge.key")
                            .font(.system(size: 13))
                            .foregroundColor(justCopiedUsername ? .green : .secondary)
                            .frame(width: 28, height: 28)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .help(justCopiedUsername ? "Copiato!" : "Copia nome utente")
                }
                
                // Menu contestuale per Modifica ed Eliminazione
                Menu {
                    Button(action: onEdit) {
                        Label("Modifica", systemImage: "pencil")
                    }
                    Button(role: .destructive, action: onDelete) {
                        Label("Elimina credenziale", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                        .frame(width: 28, height: 28)
                        .contentShape(Rectangle())
                }
                .menuStyle(.borderlessButton)
                .frame(width: 28)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            Color(nsColor: .controlBackgroundColor)
                .opacity(0.5)
                .cornerRadius(12)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.primary.opacity(0.06), lineWidth: 1)
        )
    }
    
    private func copyUsername() {
        ClipboardManager.shared.copy(text: decrypted.username)
        withAnimation {
            justCopiedUsername = true
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            justCopiedUsername = false
        }
    }
    
    private func copyPassword() {
        ClipboardManager.shared.copy(text: decrypted.password)
        withAnimation {
            justCopiedPassword = true
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            justCopiedPassword = false
        }
    }
    
    private var totpCodeFormatted: String {
        guard totpCode.count == 6 else { return totpCode }
        let index3 = totpCode.index(totpCode.startIndex, offsetBy: 3)
        return String(totpCode[..<index3]) + " " + String(totpCode[index3...])
    }
    
    private func updateTOTP() {
        guard !decrypted.totpSecret.isEmpty else { return }
        if let code = CryptoManager.generateTOTP(secretBase32: decrypted.totpSecret) {
            self.totpCode = code
        }
        let seconds = Int(Date().timeIntervalSince1970)
        self.timeRemaining = 30 - (seconds % 30)
    }
    
    private func copyTOTP() {
        ClipboardManager.shared.copy(text: totpCode)
        withAnimation {
            justCopiedTOTP = true
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            justCopiedTOTP = false
        }
    }
}
