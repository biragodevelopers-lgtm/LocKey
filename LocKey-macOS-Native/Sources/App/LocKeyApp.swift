import SwiftUI
import AppKit

@main
struct LocKeyApp: App {
    @StateObject private var vaultStore = VaultStore()
    
    init() {
        // Registra l'HotKey globale (Option + L) per mostrare/nascondere l'app
        // Carbon: keyCode 37 = 'L', modifiers 2048 = optionKey
        HotKeyManager.shared.register(keyCode: 37, modifiers: 2048) {
            if NSApp.isActive {
                NSApp.hide(nil)
            } else {
                NSApp.activate(ignoringOtherApps: true)
            }
        }
    }
    
    var body: some Scene {
        WindowGroup {
            SwiftUI.Group {
                if vaultStore.isUnlocked {
                    MainSplitView(vaultStore: vaultStore)
                        .frame(minWidth: 920, minHeight: 600)
                } else {
                    LockScreenView(vaultStore: vaultStore)
                        .frame(minWidth: 560, minHeight: 500)
                }
            }
            .preferredColorScheme(.dark)
            .onAppear {
                NSApp.appearance = NSAppearance(named: .darkAqua)
            }
            .onReceive(NSWorkspace.shared.notificationCenter.publisher(for: NSWorkspace.willSleepNotification)) { _ in
                if vaultStore.isUnlocked {
                    vaultStore.lock()
                }
            }
        }
        .commands {
            CommandMenu("Vault") {
                Button("Blocca Vault") {
                    vaultStore.lock()
                }
                .keyboardShortcut("l", modifiers: .command)
            }
        }
        
        MenuBarExtra("LocKey", systemImage: "lock.shield") {
            MenuBarView(vaultStore: vaultStore)
        }
        .menuBarExtraStyle(.window)
    }
}

/// Vista compatta per l'accesso rapido della Menu Bar (Menulet)
struct MenuBarView: View {
    @ObservedObject var vaultStore: VaultStore
    @State private var searchQuery = ""
    @State private var copiedId: UUID? = nil
    
    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: "lock.shield")
                    .foregroundColor(.purple)
                    .font(.title3)
                Text("LocKey Quick Access")
                    .font(.headline)
                    .foregroundColor(.primary)
                Spacer()
                if vaultStore.isUnlocked {
                    Button(action: { vaultStore.lock() }) {
                        Image(systemName: "lock.fill")
                            .foregroundColor(.secondary)
                    }
                    .buttonStyle(.plain)
                    .help("Blocca Vault")
                }
            }
            .padding([.horizontal, .top], 10)
            
            Divider()
            
            if vaultStore.isUnlocked {
                HStack(spacing: 6) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)
                    TextField("Cerca password...", text: $searchQuery)
                        .textFieldStyle(.plain)
                }
                .padding(6)
                .background(Color.primary.opacity(0.06))
                .cornerRadius(6)
                .padding(.horizontal, 10)
                
                let credentials = filteredCredentials()
                if credentials.isEmpty {
                    VStack {
                        Spacer()
                        Text(searchQuery.isEmpty ? "Nessuna credenziale presente" : "Nessun risultato")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Spacer()
                    }
                    .frame(height: 200)
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 6) {
                            ForEach(credentials, id: \.id) { item in
                                let dec = vaultStore.decryptCredential(item)
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(dec.title)
                                            .font(.subheadline)
                                            .fontWeight(.semibold)
                                            .foregroundColor(.primary)
                                        if !dec.username.isEmpty {
                                            Text(dec.username)
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                        }
                                    }
                                    Spacer()
                                    
                                    Button(action: {
                                        ClipboardManager.shared.copy(text: dec.password)
                                        withAnimation {
                                            copiedId = dec.id
                                        }
                                        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                                            if copiedId == dec.id {
                                                copiedId = nil
                                            }
                                        }
                                    }) {
                                        Image(systemName: copiedId == dec.id ? "checkmark" : "doc.on.doc")
                                            .foregroundColor(copiedId == dec.id ? .green : .blue)
                                            .font(.system(size: 11))
                                    }
                                    .buttonStyle(.plain)
                                    .help("Copia password")
                                }
                                .padding(8)
                                .background(Color.primary.opacity(0.04))
                                .cornerRadius(8)
                            }
                        }
                        .padding(.horizontal, 10)
                        .padding(.bottom, 10)
                    }
                    .frame(height: 200)
                }
            } else {
                VStack(spacing: 12) {
                    Spacer()
                    Image(systemName: "lock.fill")
                        .font(.largeTitle)
                        .foregroundColor(.secondary)
                    Text("Il Vault è bloccato")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Text("Sbloccalo dall'applicazione principale.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    Spacer()
                }
                .frame(height: 230)
                .padding()
            }
        }
        .frame(width: 280, height: 280)
    }
    
    private func filteredCredentials() -> [Credential] {
        var allCreds: [Credential] = []
        for g in vaultStore.groups {
            for app in g.applications {
                allCreds.append(contentsOf: app.credentials)
            }
        }
        
        if searchQuery.isEmpty {
            return allCreds
        }
        
        return allCreds.filter { cred in
            let dec = vaultStore.decryptCredential(cred)
            return dec.title.localizedCaseInsensitiveContains(searchQuery) ||
                   dec.username.localizedCaseInsensitiveContains(searchQuery)
        }
    }
}
