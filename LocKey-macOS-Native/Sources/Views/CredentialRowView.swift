import SwiftUI
import Combine

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
            // Icona Chiave
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(
                        LinearGradient(
                            colors: [Color.purple.opacity(0.18), Color.blue.opacity(0.18)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 40, height: 40)
                
                Image(systemName: "key.fill")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(
                        LinearGradient(colors: [.purple, .blue], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
            }
            
            // Dettagli Credenziale
            VStack(alignment: .leading, spacing: 4) {
                Text(decrypted.title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.primary)
                
                HStack(spacing: 8) {
                    if !decrypted.username.isEmpty {
                        HStack(spacing: 4) {
                            Image(systemName: "person.fill")
                                .font(.system(size: 10))
                                .foregroundColor(.secondary)
                            Text(decrypted.username)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .lineLimit(1)
                        }
                    } else {
                        Text("Nessun nome utente")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .italic()
                    }
                    
                    if !decrypted.url.isEmpty {
                        Text("•")
                            .foregroundColor(.secondary.opacity(0.6))
                        Text(decrypted.url)
                            .font(.subheadline)
                            .foregroundColor(.blue)
                            .lineLimit(1)
                    }
                }
                
                if !decrypted.notes.isEmpty {
                    Text(decrypted.notes)
                        .font(.caption)
                        .foregroundColor(.secondary.opacity(0.85))
                        .lineLimit(2)
                        .padding(.top, 1)
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
                            .foregroundColor(timeRemaining <= 5 ? .red : .secondary)
                        
                        Button(action: copyTOTP) {
                            HStack(spacing: 3) {
                                Image(systemName: justCopiedTOTP ? "checkmark" : "doc.on.doc")
                                Text(justCopiedTOTP ? "Copiato" : "Copia")
                            }
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(justCopiedTOTP ? .green : .purple)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.purple.opacity(0.1))
                            .cornerRadius(4)
                        }
                        .buttonStyle(.plain)
                        .help("Copia codice 2FA")
                    }
                    .padding(.top, 3)
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
            HStack(spacing: 8) {
                if !decrypted.password.isEmpty {
                    // Visualizzazione Password in chiaro/protetta
                    SwiftUI.Group {
                        if isPasswordVisible {
                            Text(decrypted.password)
                                .font(.system(.subheadline, design: .monospaced))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.primary.opacity(0.08))
                                .cornerRadius(6)
                                .textSelection(.enabled)
                        } else {
                            Text("••••••••")
                                .font(.system(.subheadline, design: .monospaced))
                                .foregroundColor(.secondary)
                                .padding(.horizontal, 4)
                        }
                    }
                    
                    // Tasto Mostra/Nascondi
                    Button(action: { isPasswordVisible.toggle() }) {
                        Image(systemName: isPasswordVisible ? "eye.slash.fill" : "eye.fill")
                            .font(.system(size: 13))
                            .foregroundColor(isPasswordVisible ? .purple : .secondary)
                            .frame(width: 30, height: 30)
                            .background(Color.primary.opacity(0.05))
                            .cornerRadius(6)
                    }
                    .buttonStyle(.plain)
                    .help(isPasswordVisible ? "Nascondi password" : "Mostra password")
                    
                    // Tasto Copia Password
                    Button(action: copyPassword) {
                        HStack(spacing: 4) {
                            Image(systemName: justCopiedPassword ? "checkmark" : "doc.on.doc")
                                .font(.system(size: 12, weight: .semibold))
                            Text(justCopiedPassword ? "Copiata" : "Password")
                                .font(.system(size: 11, weight: .medium))
                        }
                        .foregroundColor(justCopiedPassword ? .green : .primary)
                        .padding(.horizontal, 8)
                        .frame(height: 30)
                        .background(justCopiedPassword ? Color.green.opacity(0.15) : Color.primary.opacity(0.06))
                        .cornerRadius(6)
                    }
                    .buttonStyle(.plain)
                    .help("Copia password negli appunti (auto-pulizia 30s)")
                }
                
                if !decrypted.username.isEmpty {
                    // Tasto Copia Username
                    Button(action: copyUsername) {
                        Image(systemName: justCopiedUsername ? "checkmark" : "person.badge.key.fill")
                            .font(.system(size: 13))
                            .foregroundColor(justCopiedUsername ? .green : .secondary)
                            .frame(width: 30, height: 30)
                            .background(justCopiedUsername ? Color.green.opacity(0.15) : Color.primary.opacity(0.05))
                            .cornerRadius(6)
                    }
                    .buttonStyle(.plain)
                    .help(justCopiedUsername ? "Nome utente copiato!" : "Copia nome utente")
                }
                
                // Menu contestuale per Modifica ed Eliminazione
                Menu {
                    Button(action: onEdit) {
                        Label("Modifica credenziale", systemImage: "pencil")
                    }
                    Divider()
                    Button(role: .destructive, action: onDelete) {
                        Label("Elimina credenziale", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .font(.system(size: 15))
                        .foregroundColor(.secondary)
                        .frame(width: 30, height: 30)
                        .contentShape(Rectangle())
                }
                .menuStyle(.borderlessButton)
                .frame(width: 30)
            }
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(red: 0.11, green: 0.12, blue: 0.18))
                .shadow(color: Color.black.opacity(0.25), radius: 6, x: 0, y: 3)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
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
