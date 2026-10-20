import SwiftUI
import LocalAuthentication

public struct LockScreenView: View {
    @ObservedObject var vaultStore: VaultStore
    
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var isSettingUp = false
    @State private var shakeOffset: CGFloat = 0
    @State private var showResetConfirmation = false
    @State private var hasAttemptedInitialBiometrics = false
    
    public init(vaultStore: VaultStore) {
        self.vaultStore = vaultStore
    }
    
    public var body: some View {
        ZStack {
            // Sfondo Dark Glassmorphic con gradienti moderni
            ZStack {
                Color(red: 0.06, green: 0.06, blue: 0.09)
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color.purple.opacity(0.18),
                        Color.clear,
                        Color.blue.opacity(0.18)
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            }
            .ignoresSafeArea()
            
            // Card centrale Glassmorphic
            VStack(spacing: 20) {
                // Icona ufficiale del programma LocKey
                Image(nsImage: NSApp.applicationIconImage)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 76, height: 76)
                    .cornerRadius(18)
                    .shadow(color: .purple.opacity(0.35), radius: 12, x: 0, y: 6)
                
                VStack(spacing: 4) {
                    Text("LocKey")
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                    
                    Text("by BiragoDev • 100% Offline")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing))
                }
                
                Text(isSettingUp ? "Configura la tua Master Password" : "Sblocca il tuo Vault protetto")
                    .font(.subheadline.weight(.medium))
                    .foregroundColor(.secondary)
                
                if vaultStore.hasVaultFile && !isSettingUp {
                    // Vista Sblocco
                    VStack(spacing: 16) {
                        SecureField("Master Password", text: $password, onCommit: unlockWithPassword)
                            .textFieldStyle(.plain)
                            .padding()
                            .background(VisualEffectView(material: .selection, blendingMode: .withinWindow).cornerRadius(10))
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.white.opacity(0.1), lineWidth: 1)
                            )
                            .frame(width: 280)
                            .offset(x: shakeOffset)
                        
                        HStack(spacing: 12) {
                            Button(action: unlockWithPassword) {
                                Text("Sblocca")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(
                                        LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing)
                                    )
                                    .cornerRadius(8)
                            }
                            .buttonStyle(.plain)
                            .frame(width: vaultStore.isTouchIDAvailableForUnlock ? 180 : 280)
                            
                            if vaultStore.isTouchIDAvailableForUnlock {
                                Button(action: unlockWithTouchID) {
                                    HStack(spacing: 4) {
                                        Image(systemName: "touchid")
                                            .font(.title3)
                                        Text("Touch ID")
                                            .font(.system(size: 11, weight: .semibold))
                                    }
                                    .foregroundColor(.white)
                                    .frame(width: 88, height: 38)
                                    .background(
                                        LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing)
                                    )
                                    .cornerRadius(8)
                                }
                                .buttonStyle(.plain)
                                .help("Sblocca tramite Touch ID")
                            }
                        }
                        .frame(width: 280)
                        
                        if let errorMsg = vaultStore.errorMessage {
                            Text(errorMsg)
                                .font(.caption)
                                .foregroundColor(.red)
                                .frame(width: 280)
                                .multilineTextAlignment(.center)
                                .padding(.top, 5)
                        }
                        
                        Divider()
                            .padding(.vertical, 10)
                            .frame(width: 280)
                        
                        Button(action: { showResetConfirmation = true }) {
                            Text("Inizializza Vault (Cancella tutto)")
                                .font(.caption)
                                .foregroundColor(.red.opacity(0.7))
                        }
                        .buttonStyle(.plain)
                    }
                } else {
                    // Vista Configurazione
                    VStack(spacing: 16) {
                        SecureField("Scegli Master Password", text: $password)
                            .textFieldStyle(.plain)
                            .padding()
                            .background(VisualEffectView(material: .selection, blendingMode: .withinWindow).cornerRadius(10))
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.white.opacity(0.1), lineWidth: 1))
                            .frame(width: 280)
                        
                        SecureField("Conferma Master Password", text: $confirmPassword)
                            .textFieldStyle(.plain)
                            .padding()
                            .background(VisualEffectView(material: .selection, blendingMode: .withinWindow).cornerRadius(10))
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.white.opacity(0.1), lineWidth: 1))
                            .frame(width: 280)
                        
                        Button(action: setupVault) {
                            Text("Crea Nuovo Vault")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(width: 280)
                                .padding(.vertical, 12)
                                .background(
                                    LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing)
                                )
                                .cornerRadius(8)
                        }
                        .buttonStyle(.plain)
                        .disabled(password.isEmpty || password != confirmPassword)
                        
                        if let errorMsg = vaultStore.errorMessage {
                            Text(errorMsg)
                                .font(.caption)
                                .foregroundColor(.red)
                                .frame(width: 280)
                                .multilineTextAlignment(.center)
                        }
                        
                        if vaultStore.hasVaultFile {
                            Button("Annulla") {
                                isSettingUp = false
                                password = ""
                                confirmPassword = ""
                                vaultStore.errorMessage = nil
                            }
                            .buttonStyle(.link)
                        }
                    }
                }
                
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.shield.fill")
                        .foregroundColor(.green)
                        .font(.caption2)
                    Text("Zero-Network • Distribuito da BiragoDev (www.biragodev.it)")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 4)
            }
            .padding(40)
            .background(
                VisualEffectView(material: .hudWindow, blendingMode: .withinWindow)
                    .cornerRadius(24)
                    .shadow(color: .black.opacity(0.3), radius: 30, x: 0, y: 15)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 24)
                    .stroke(Color.white.opacity(0.15), lineWidth: 1)
            )
        }
        .frame(minWidth: 500, minHeight: 450)
        .onAppear {
            password = ""
            confirmPassword = ""
            // All'avvio iniziale dell'app (se non è stato bloccato manualmente), tentiamo Touch ID una volta
            if vaultStore.isTouchIDAvailableForUnlock && !vaultStore.isManualLock && !hasAttemptedInitialBiometrics {
                hasAttemptedInitialBiometrics = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    unlockWithTouchID()
                }
            } else if !vaultStore.hasVaultFile {
                isSettingUp = true
            }
        }
        .alert("Sei sicuro di voler inizializzare il Vault?", isPresented: $showResetConfirmation) {
            Button("Annulla", role: .cancel) { }
            Button("Elimina Tutto", role: .destructive) {
                vaultStore.resetVault()
                isSettingUp = true
                password = ""
                confirmPassword = ""
            }
        } message: {
            Text("Questa azione eliminerà permanentemente tutte le credenziali salvate locali e le chiavi nel portachiavi. Questa operazione non può essere annullata.")
        }
    }
    
    private func unlockWithPassword() {
        guard !password.isEmpty else { return }
        let success = vaultStore.unlockWithPassword(password: password)
        if success {
            password = ""
        } else {
            shakeField()
        }
    }
    
    private func unlockWithTouchID() {
        vaultStore.unlockWithTouchID { success in
            if success {
                password = ""
            }
        }
    }
    
    private func setupVault() {
        guard !password.isEmpty && password == confirmPassword else {
            vaultStore.errorMessage = "Le password inserite non corrispondono."
            return
        }
        vaultStore.createVault(password: password)
    }
    
    private func shakeField() {
        withAnimation(.default) {
            self.shakeOffset = 10
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            withAnimation(.default) { self.shakeOffset = -10 }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                withAnimation(.default) { self.shakeOffset = 10 }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    withAnimation(.default) { self.shakeOffset = 0 }
                }
            }
        }
    }
}
