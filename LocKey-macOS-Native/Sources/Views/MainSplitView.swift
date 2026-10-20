import SwiftUI
import AppKit
import UniformTypeIdentifiers

public struct MainSplitView: View {
    @ObservedObject var vaultStore: VaultStore
    
    // Selezione dello stato
    @State private var selectedGroupID: UUID? = nil
    @State private var selectedAppID: UUID? = nil
    @State private var searchQuery = ""
    
    // Stati per i fogli modali (Sheets)
    @State private var showAbout = false
    @State private var showAddGroup = false
    @State private var newGroupName = ""
    @State private var newGroupIcon = "folder.fill"
    
    @State private var showAddApp = false
    @State private var newAppName = ""
    @State private var newAppWebsite = ""
    
    @State private var showAddCredential = false
    @State private var editingCredential: Credential? = nil
    @State private var credentialTitle = ""
    @State private var credentialUsername = ""
    @State private var credentialPassword = ""
    @State private var showPasswordInSheet = false
    @State private var credentialNotes = ""
    @State private var credentialUrl = ""
    @State private var credentialTotp = ""
    
    // Stati per il Generatore di Password
    @State private var showGeneratorOptions = false
    @State private var genLength = 16
    @State private var genUpper = true
    @State private var genLower = true
    @State private var genNum = true
    @State private var genSym = true
    
    // Stati per la Verifica Aggiornamenti (Modalità A)
    @State private var isCheckingUpdate = false
    @State private var updateCheckResult: String? = nil
    @State private var updateDownloadURL: URL? = nil
    
    // Griglia 4x2 di icone SF Symbols per i Gruppi
    private let groupIcons = [
        "folder.fill", "briefcase.fill", "person.fill", "house.fill",
        "creditcard.fill", "gamecontroller.fill", "cart.fill", "heart.fill"
    ]
    
    // Colori tema Dark Glassmorphic
    private let bgDark = Color(red: 0.06, green: 0.06, blue: 0.09)
    private let panelDark = Color(red: 0.09, green: 0.09, blue: 0.14)
    private let cardDark = Color(red: 0.12, green: 0.13, blue: 0.19)
    
    public init(vaultStore: VaultStore) {
        self.vaultStore = vaultStore
    }
    
    // Trova il gruppo selezionato
    private var selectedGroup: Group? {
        vaultStore.groups.first { $0.id == selectedGroupID }
    }
    
    // Trova l'applicazione selezionata
    private var selectedApp: Application? {
        selectedGroup?.applications.first { $0.id == selectedAppID }
    }
    
    // Applicazioni filtrate in base alla barra di ricerca
    private var filteredApplications: [Application] {
        guard let group = selectedGroup else { return [] }
        if searchQuery.isEmpty {
            return group.applications
        }
        return group.applications.filter { app in
            app.name.localizedCaseInsensitiveContains(searchQuery) ||
            app.website.localizedCaseInsensitiveContains(searchQuery) ||
            app.credentials.contains { cred in
                let dec = vaultStore.decryptCredential(cred)
                return dec.title.localizedCaseInsensitiveContains(searchQuery) ||
                       dec.username.localizedCaseInsensitiveContains(searchQuery)
            }
        }
    }
    
    public var body: some View {
        VStack(spacing: 0) {
            // MARK: - 1. TOP NAVBAR (Barra Superiore a tutta larghezza, sempre visibile)
            HStack(spacing: 14) {
                // Brand in alto a sinistra: Icona Ufficiale + Titolo + Badge
                HStack(spacing: 10) {
                    Image(nsImage: NSApp.applicationIconImage)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 34, height: 34)
                        .cornerRadius(8)
                        .shadow(color: .purple.opacity(0.4), radius: 6, x: 0, y: 2)
                    
                    Text("LocKey")
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                    
                    HStack(spacing: 5) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 6, height: 6)
                        Text("100% OFFLINE")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white.opacity(0.85))
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.white.opacity(0.06))
                    .overlay(
                        Capsule().stroke(Color.white.opacity(0.1), lineWidth: 1)
                    )
                    .clipShape(Capsule())
                }
                
                Spacer()
                
                // Barra di Ricerca Centrale
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                    TextField("Cerca applicazione o account...", text: $searchQuery)
                        .textFieldStyle(.plain)
                        .font(.system(size: 13))
                        .foregroundColor(.white)
                    if !searchQuery.isEmpty {
                        Button(action: { searchQuery = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .font(.system(size: 12))
                                .foregroundColor(.secondary)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .frame(width: 260)
                .background(Color.white.opacity(0.06))
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                )
                
                Spacer()
                
                // Azioni a destra (Sempre visibili sia in finestra che a tutto schermo)
                HStack(spacing: 10) {
                    // Pulsante Verifica Aggiornamenti
                    Button(action: { showAbout = true; checkForUpdates() }) {
                        HStack(spacing: 6) {
                            Image(systemName: "arrow.triangle.2.circlepath")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(.blue)
                            Text("Aggiornamenti")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.white.opacity(0.9))
                            Text("v1.0.2")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.blue)
                                .padding(.horizontal, 5)
                                .padding(.vertical, 2)
                                .background(Color.blue.opacity(0.18))
                                .cornerRadius(4)
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.white.opacity(0.05))
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.white.opacity(0.08), lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                    .help("Verifica disponibilità aggiornamenti su GitHub")
                    
                    // Menu Backup (.lockey)
                    Menu {
                        Button(action: exportBackupFlow) {
                            Label("Esporta Backup Cifrato (.lockey)", systemImage: "square.and.arrow.up")
                        }
                        Button(action: importBackupFlow) {
                            Label("Importa Backup (.lockey)", systemImage: "square.and.arrow.down")
                        }
                    } label: {
                        HStack(spacing: 5) {
                            Image(systemName: "externaldrive.fill.badge.timemachine")
                                .font(.system(size: 12))
                            Text("Backup")
                                .font(.system(size: 12, weight: .medium))
                        }
                        .foregroundColor(.white.opacity(0.9))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.white.opacity(0.05))
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.white.opacity(0.08), lineWidth: 1)
                        )
                    }
                    .menuStyle(.borderlessButton)
                    .fixedSize()
                    .help("Esporta o Importa un file di backup cifrato")
                    
                    // Pulsante Info
                    Button(action: { showAbout = true }) {
                        Image(systemName: "info.circle")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.white.opacity(0.85))
                            .frame(width: 30, height: 30)
                            .background(Color.white.opacity(0.05))
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                    .help("Informazioni su LocKey & BiragoDev")
                    
                    // UNICO Pulsante Blocca Vault
                    Button(action: { vaultStore.lock() }) {
                        HStack(spacing: 6) {
                            Image(systemName: "lock.fill")
                                .font(.system(size: 12, weight: .bold))
                            Text("Blocca Vault")
                                .font(.system(size: 12, weight: .semibold))
                        }
                        .foregroundColor(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(
                            LinearGradient(
                                colors: [Color.red.opacity(0.85), Color.pink.opacity(0.8)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(8)
                        .shadow(color: Color.red.opacity(0.25), radius: 4, x: 0, y: 2)
                    }
                    .buttonStyle(.plain)
                    .keyboardShortcut("l", modifiers: .command)
                    .help("Blocca immediatamente il Vault (Cmd + L)")
                }
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 12)
            .background(panelDark)
            
            Rectangle()
                .fill(Color.white.opacity(0.08))
                .frame(height: 1)
            
            // MARK: - 2. AREA DI LAVORO A 3 COLONNE
            HStack(spacing: 0) {
                // COLONNA 1: SIDEBAR GRUPPI (Larghezza fissa generosa, nessun testo spezzato)
                VStack(spacing: 0) {
                    HStack {
                        Text("I TUOI GRUPPI")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.secondary)
                            .tracking(0.8)
                        Spacer()
                        Button(action: {
                            newGroupName = ""
                            newGroupIcon = "folder.fill"
                            showAddGroup = true
                        }) {
                            Image(systemName: "plus")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.purple)
                                .frame(width: 22, height: 22)
                                .background(Color.purple.opacity(0.15))
                                .cornerRadius(6)
                        }
                        .buttonStyle(.plain)
                        .help("Crea Nuovo Gruppo")
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 16)
                    .padding(.bottom, 10)
                    
                    if vaultStore.groups.isEmpty {
                        Spacer()
                        VStack(spacing: 10) {
                            Image(systemName: "folder.badge.plus")
                                .font(.system(size: 28))
                                .foregroundColor(.secondary.opacity(0.5))
                            Text("Nessun gruppo")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                    } else {
                        ScrollView {
                            LazyVStack(spacing: 6) {
                                ForEach(vaultStore.groups) { group in
                                    let isSelected = selectedGroupID == group.id
                                    Button(action: { selectedGroupID = group.id }) {
                                        HStack(spacing: 10) {
                                            ZStack {
                                                RoundedRectangle(cornerRadius: 7)
                                                    .fill(isSelected ? Color.purple.opacity(0.3) : Color.white.opacity(0.05))
                                                    .frame(width: 28, height: 28)
                                                Image(systemName: group.icon)
                                                    .font(.system(size: 13, weight: .semibold))
                                                    .foregroundColor(isSelected ? .purple : .secondary)
                                            }
                                            
                                            Text(group.name)
                                                .font(.system(size: 13, weight: isSelected ? .semibold : .medium))
                                                .foregroundColor(isSelected ? .white : .white.opacity(0.8))
                                                .lineLimit(1)
                                            
                                            Spacer()
                                            
                                            Text("\(group.applications.count)")
                                                .font(.system(size: 11, weight: .bold))
                                                .foregroundColor(isSelected ? .purple : .secondary)
                                                .padding(.horizontal, 7)
                                                .padding(.vertical, 2)
                                                .background(isSelected ? Color.purple.opacity(0.2) : Color.white.opacity(0.05))
                                                .cornerRadius(6)
                                        }
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 8)
                                        .background(
                                            RoundedRectangle(cornerRadius: 10)
                                                .fill(isSelected ? Color.purple.opacity(0.16) : Color.white.opacity(0.02))
                                        )
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 10)
                                                .stroke(isSelected ? Color.purple.opacity(0.45) : Color.clear, lineWidth: 1)
                                        )
                                    }
                                    .buttonStyle(.plain)
                                    .contextMenu {
                                        Button(role: .destructive, action: { deleteGroup(group) }) {
                                            Label("Elimina Gruppo", systemImage: "trash")
                                        }
                                    }
                                }
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 4)
                        }
                    }
                    
                    // Pulsante Nuovo Gruppo + Footer BiragoDev
                    VStack(spacing: 10) {
                        Rectangle()
                            .fill(Color.white.opacity(0.06))
                            .frame(height: 1)
                        
                        Button(action: {
                            newGroupName = ""
                            newGroupIcon = "folder.fill"
                            showAddGroup = true
                        }) {
                            HStack(spacing: 6) {
                                Image(systemName: "plus.circle.fill")
                                Text("Nuovo Gruppo")
                                    .font(.system(size: 13, weight: .semibold))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 9)
                            .background(
                                LinearGradient(
                                    colors: [Color.purple.opacity(0.75), Color.blue.opacity(0.75)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(8)
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 14)
                        
                        HStack {
                            Image(systemName: "checkmark.shield.fill")
                                .foregroundColor(.green)
                                .font(.caption2)
                            Text("AES-256 Locale")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            Spacer()
                            Link("BiragoDev", destination: URL(string: "https://www.biragodev.it")!)
                                .font(.caption2.weight(.semibold))
                                .foregroundColor(.purple)
                        }
                        .padding(.horizontal, 16)
                        .padding(.bottom, 12)
                    }
                }
                .frame(width: 230)
                .background(panelDark.opacity(0.85))
                
                Rectangle()
                    .fill(Color.white.opacity(0.07))
                    .frame(width: 1)
                
                // COLONNA 2: LISTA APPLICAZIONI DEL GRUPPO
                VStack(spacing: 0) {
                    if let group = selectedGroup {
                        HStack {
                            Image(systemName: group.icon)
                                .foregroundColor(.purple)
                                .font(.system(size: 13, weight: .semibold))
                            Text(group.name.uppercased())
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.secondary)
                                .tracking(0.8)
                                .lineLimit(1)
                            Spacer()
                            Button(action: {
                                newAppName = ""
                                newAppWebsite = ""
                                showAddApp = true
                            }) {
                                Image(systemName: "plus")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundColor(.blue)
                                    .frame(width: 22, height: 22)
                                    .background(Color.blue.opacity(0.15))
                                    .cornerRadius(6)
                            }
                            .buttonStyle(.plain)
                            .help("Aggiungi Applicazione")
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 16)
                        .padding(.bottom, 10)
                        
                        if filteredApplications.isEmpty {
                            Spacer()
                            VStack(spacing: 12) {
                                Image(systemName: "app.badge.plus")
                                    .font(.system(size: 36))
                                    .foregroundColor(.secondary.opacity(0.4))
                                Text(searchQuery.isEmpty ? "Nessuna applicazione" : "Nessun risultato")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.white.opacity(0.85))
                                Text(searchQuery.isEmpty ? "Aggiungi un sito o servizio dentro \"\(group.name)\"." : "Prova a modificare i termini di ricerca.")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                    .multilineTextAlignment(.center)
                                    .padding(.horizontal, 20)
                                
                                if searchQuery.isEmpty {
                                    Button(action: {
                                        newAppName = ""
                                        newAppWebsite = ""
                                        showAddApp = true
                                    }) {
                                        HStack(spacing: 5) {
                                            Image(systemName: "plus")
                                            Text("Aggiungi Applicazione")
                                        }
                                        .font(.system(size: 12, weight: .semibold))
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 8)
                                        .background(Color.blue.opacity(0.8))
                                        .cornerRadius(8)
                                    }
                                    .buttonStyle(.plain)
                                    .padding(.top, 4)
                                }
                            }
                            Spacer()
                        } else {
                            ScrollView {
                                LazyVStack(spacing: 6) {
                                    ForEach(filteredApplications) { app in
                                        let isSelected = selectedAppID == app.id
                                        Button(action: { selectedAppID = app.id }) {
                                            HStack(spacing: 10) {
                                                ZStack {
                                                    RoundedRectangle(cornerRadius: 8)
                                                        .fill(
                                                            LinearGradient(
                                                                colors: isSelected
                                                                    ? [Color.blue, Color.purple]
                                                                    : [Color.white.opacity(0.08), Color.white.opacity(0.05)],
                                                                startPoint: .topLeading,
                                                                endPoint: .bottomTrailing
                                                            )
                                                        )
                                                        .frame(width: 34, height: 34)
                                                    Text(String(app.name.prefix(1)).uppercased())
                                                        .font(.system(size: 14, weight: .bold, design: .rounded))
                                                        .foregroundColor(.white)
                                                }
                                                
                                                VStack(alignment: .leading, spacing: 2) {
                                                    Text(app.name)
                                                        .font(.system(size: 13, weight: .semibold))
                                                        .foregroundColor(.white)
                                                        .lineLimit(1)
                                                    if !app.website.isEmpty {
                                                        Text(app.website)
                                                            .font(.system(size: 11))
                                                            .foregroundColor(.secondary)
                                                            .lineLimit(1)
                                                    }
                                                }
                                                
                                                Spacer()
                                                
                                                Text("\(app.credentials.count)")
                                                    .font(.system(size: 11, weight: .bold))
                                                    .foregroundColor(isSelected ? .blue : .secondary)
                                                    .padding(.horizontal, 7)
                                                    .padding(.vertical, 2)
                                                    .background(isSelected ? Color.blue.opacity(0.2) : Color.white.opacity(0.05))
                                                    .cornerRadius(6)
                                            }
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 8)
                                            .background(
                                                RoundedRectangle(cornerRadius: 10)
                                                    .fill(isSelected ? Color.blue.opacity(0.16) : Color.white.opacity(0.02))
                                            )
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 10)
                                                    .stroke(isSelected ? Color.blue.opacity(0.45) : Color.clear, lineWidth: 1)
                                            )
                                        }
                                        .buttonStyle(.plain)
                                        .contextMenu {
                                            Button(role: .destructive, action: { deleteSingleApplication(app) }) {
                                                Label("Elimina Applicazione", systemImage: "trash")
                                            }
                                        }
                                    }
                                }
                                .padding(.horizontal, 12)
                                .padding(.vertical, 4)
                            }
                        }
                        
                        // Footer Colonna Applicazioni
                        VStack(spacing: 10) {
                            Rectangle()
                                .fill(Color.white.opacity(0.06))
                                .frame(height: 1)
                            
                            Button(action: {
                                newAppName = ""
                                newAppWebsite = ""
                                showAddApp = true
                            }) {
                                HStack(spacing: 6) {
                                    Image(systemName: "plus.circle.fill")
                                        .foregroundColor(.blue)
                                    Text("Aggiungi Applicazione")
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(.white.opacity(0.9))
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 9)
                                .background(Color.blue.opacity(0.15))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(Color.blue.opacity(0.3), lineWidth: 1)
                                )
                                .cornerRadius(8)
                            }
                            .buttonStyle(.plain)
                            .padding(.horizontal, 14)
                            .padding(.bottom, 12)
                        }
                    } else {
                        Spacer()
                        VStack(spacing: 12) {
                            Image(systemName: "folder.badge.plus")
                                .font(.system(size: 38))
                                .foregroundColor(.secondary.opacity(0.4))
                            Text("Seleziona o crea un Gruppo")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(.white.opacity(0.85))
                            Text("Crea un gruppo a sinistra (es. Lavoro, Personale, Banche) per iniziare.")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 24)
                        }
                        Spacer()
                    }
                }
                .frame(width: 260)
                .background(bgDark.opacity(0.95))
                
                Rectangle()
                    .fill(Color.white.opacity(0.07))
                    .frame(width: 1)
                
                // COLONNA 3: DETTAGLI APPLICAZIONE & CREDENZIALI
                VStack(spacing: 0) {
                    if let app = selectedApp {
                        // Header Applicazione Selezionata
                        HStack(spacing: 16) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 14)
                                    .fill(
                                        LinearGradient(
                                            colors: [Color.purple.opacity(0.35), Color.blue.opacity(0.35)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .frame(width: 52, height: 52)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 14)
                                            .stroke(Color.white.opacity(0.15), lineWidth: 1)
                                    )
                                Text(String(app.name.prefix(1)).uppercased())
                                    .font(.system(size: 24, weight: .bold, design: .rounded))
                                    .foregroundColor(.white)
                            }
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(app.name)
                                    .font(.system(size: 24, weight: .bold, design: .rounded))
                                    .foregroundColor(.white)
                                if !app.website.isEmpty,
                                   let url = URL(string: app.website.contains("://") ? app.website : "https://\(app.website)") {
                                    Link(destination: url) {
                                        HStack(spacing: 4) {
                                            Image(systemName: "globe")
                                                .font(.caption)
                                            Text(app.website)
                                                .font(.subheadline)
                                            Image(systemName: "arrow.up.right.square")
                                                .font(.caption)
                                        }
                                        .foregroundColor(.blue)
                                    }
                                } else {
                                    Text("\(app.credentials.count) credenzial\(app.credentials.count == 1 ? "e" : "i") protett\(app.credentials.count == 1 ? "a" : "e")")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                            
                            Spacer()
                            
                            Button(action: {
                                closeCredentialSheet()
                                showAddCredential = true
                            }) {
                                HStack(spacing: 6) {
                                    Image(systemName: "plus")
                                        .font(.system(size: 13, weight: .bold))
                                    Text("Nuova Credenziale")
                                        .font(.system(size: 13, weight: .semibold))
                                }
                                .foregroundColor(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 10)
                                .background(
                                    LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing)
                                )
                                .cornerRadius(10)
                                .shadow(color: .purple.opacity(0.3), radius: 8, x: 0, y: 4)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, 24)
                        .padding(.vertical, 20)
                        .background(panelDark.opacity(0.5))
                        
                        Rectangle()
                            .fill(Color.white.opacity(0.07))
                            .frame(height: 1)
                        
                        if app.credentials.isEmpty {
                            Spacer()
                            VStack(spacing: 16) {
                                ZStack {
                                    Circle()
                                        .fill(Color.purple.opacity(0.1))
                                        .frame(width: 72, height: 72)
                                    Image(systemName: "key.viewfinder")
                                        .font(.system(size: 34))
                                        .foregroundColor(.purple)
                                }
                                Text("Nessuna credenziale salvata")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                                Text("Aggiungi il primo account o password per \(app.name).")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                
                                Button(action: {
                                    closeCredentialSheet()
                                    showAddCredential = true
                                }) {
                                    HStack(spacing: 6) {
                                        Image(systemName: "plus")
                                        Text("Aggiungi Credenziale")
                                    }
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 18)
                                    .padding(.vertical, 10)
                                    .background(
                                        LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing)
                                    )
                                    .cornerRadius(10)
                                }
                                .buttonStyle(.plain)
                                .padding(.top, 4)
                            }
                            Spacer()
                        } else {
                            ScrollView {
                                LazyVStack(spacing: 12) {
                                    ForEach(app.credentials) { cred in
                                        CredentialRowView(
                                            vaultStore: vaultStore,
                                            credential: cred,
                                            onEdit: { startEditingCredential(cred) },
                                            onDelete: { deleteCredential(cred) }
                                        )
                                    }
                                }
                                .padding(24)
                            }
                        }
                    } else {
                        // Stato vuoto elegante al centro della dashboard
                        Spacer()
                        VStack(spacing: 20) {
                            Image(nsImage: NSApp.applicationIconImage)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 84, height: 84)
                                .cornerRadius(20)
                                .shadow(color: .purple.opacity(0.35), radius: 16, x: 0, y: 8)
                            
                            VStack(spacing: 6) {
                                Text("Il tuo Vault LocKey è Sbloccato")
                                    .font(.system(size: 20, weight: .bold, design: .rounded))
                                    .foregroundColor(.white)
                                Text("Seleziona un'applicazione a sinistra o creane una nuova per gestire le tue password.")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                    .multilineTextAlignment(.center)
                                    .frame(maxWidth: 380)
                            }
                            
                            HStack(spacing: 12) {
                                Label("AES-256-GCM", systemImage: "lock.shield.fill")
                                    .font(.caption.weight(.semibold))
                                    .foregroundColor(.purple)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(Color.purple.opacity(0.12))
                                    .cornerRadius(8)
                                
                                Label("Zero-Network", systemImage: "wifi.slash")
                                    .font(.caption.weight(.semibold))
                                    .foregroundColor(.green)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(Color.green.opacity(0.12))
                                    .cornerRadius(8)
                                
                                Label("Touch ID Attivo", systemImage: "touchid")
                                    .font(.caption.weight(.semibold))
                                    .foregroundColor(.blue)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(Color.blue.opacity(0.12))
                                    .cornerRadius(8)
                            }
                        }
                        .padding(36)
                        .background(
                            RoundedRectangle(cornerRadius: 24)
                                .fill(Color.white.opacity(0.03))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 24)
                                        .stroke(Color.white.opacity(0.07), lineWidth: 1)
                                )
                        )
                        Spacer()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(bgDark)
            }
        }
        .background(bgDark)
        .onAppear {
            autoSelectInitialItems()
        }
        .onChange(of: selectedGroupID) { _ in
            if let group = selectedGroup {
                selectedAppID = group.applications.first?.id
            } else {
                selectedAppID = nil
            }
        }
        // MARK: - Fogli Modali (Sheets)
        
        // 1. Nuovo Gruppo (Griglia 4x2 ordinata)
        .sheet(isPresented: $showAddGroup) {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color.purple.opacity(0.2))
                            .frame(width: 40, height: 40)
                        Image(systemName: newGroupIcon)
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.purple)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Crea Nuovo Gruppo")
                            .font(.system(size: 16, weight: .bold))
                        Text("Organizza le tue applicazioni per categoria")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    Text("Nome del Gruppo")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.secondary)
                    TextField("Es. Lavoro, Personale, Finanza...", text: $newGroupName)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit {
                            if !newGroupName.trimmingCharacters(in: .whitespaces).isEmpty {
                                createGroup()
                            }
                        }
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Seleziona Icona")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.secondary)
                    
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 4), spacing: 10) {
                        ForEach(groupIcons, id: \.self) { icon in
                            Button(action: { newGroupIcon = icon }) {
                                Image(systemName: icon)
                                    .font(.system(size: 18))
                                    .foregroundColor(newGroupIcon == icon ? .purple : .secondary)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 42)
                                    .background(
                                        RoundedRectangle(cornerRadius: 8)
                                            .fill(newGroupIcon == icon ? Color.purple.opacity(0.22) : Color.white.opacity(0.05))
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(newGroupIcon == icon ? Color.purple : Color.white.opacity(0.08), lineWidth: 1.5)
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                
                Divider().opacity(0.3)
                
                HStack {
                    Button("Annulla") {
                        showAddGroup = false
                        newGroupName = ""
                    }
                    .keyboardShortcut(.cancelAction)
                    
                    Spacer()
                    
                    Button(action: createGroup) {
                        Text("Crea Gruppo")
                            .fontWeight(.semibold)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.purple)
                    .disabled(newGroupName.trimmingCharacters(in: .whitespaces).isEmpty)
                    .keyboardShortcut(.defaultAction)
                }
            }
            .padding(24)
            .frame(width: 360)
            .preferredColorScheme(.dark)
        }
        
        // 2. Nuova Applicazione
        .sheet(isPresented: $showAddApp) {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color.blue.opacity(0.2))
                            .frame(width: 40, height: 40)
                        Image(systemName: "app.badge.plus")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.blue)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Aggiungi Applicazione")
                            .font(.system(size: 16, weight: .bold))
                        Text("Inserisci il nome del sito o servizio")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    Text("Nome Applicazione")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.secondary)
                    TextField("Es. Google, GitHub, Intesa Sanpaolo", text: $newAppName)
                        .textFieldStyle(.roundedBorder)
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    Text("Sito Web (Opzionale)")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(.secondary)
                    TextField("Es. https://github.com", text: $newAppWebsite)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit {
                            if !newAppName.trimmingCharacters(in: .whitespaces).isEmpty {
                                createApplication()
                            }
                        }
                }
                
                Divider().opacity(0.3)
                
                HStack {
                    Button("Annulla") {
                        showAddApp = false
                        newAppName = ""
                        newAppWebsite = ""
                    }
                    .keyboardShortcut(.cancelAction)
                    
                    Spacer()
                    
                    Button(action: createApplication) {
                        Text("Aggiungi")
                            .fontWeight(.semibold)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.blue)
                    .disabled(newAppName.trimmingCharacters(in: .whitespaces).isEmpty)
                    .keyboardShortcut(.defaultAction)
                }
            }
            .padding(24)
            .frame(width: 360)
            .preferredColorScheme(.dark)
        }
        
        // 3. Nuova/Modifica Credenziale
        .sheet(isPresented: Binding(
            get: { showAddCredential || editingCredential != nil },
            set: { if !$0 { closeCredentialSheet() } }
        )) {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 12) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color.purple.opacity(0.2))
                            .frame(width: 40, height: 40)
                        Image(systemName: "key.fill")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.purple)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(editingCredential == nil ? "Nuova Credenziale" : "Modifica Credenziale")
                            .font(.system(size: 16, weight: .bold))
                        Text("I dati verranno cifrati con AES-256-GCM")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                }
                .padding(.bottom, 4)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Titolo Account")
                        .font(.caption.weight(.semibold))
                        .foregroundColor(.secondary)
                    TextField("Es. Account Personale, PEC, Admin", text: $credentialTitle)
                        .textFieldStyle(.roundedBorder)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Nome Utente o Email")
                        .font(.caption.weight(.semibold))
                        .foregroundColor(.secondary)
                    TextField("Es. nome@dominio.it", text: $credentialUsername)
                        .textFieldStyle(.roundedBorder)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Password")
                        .font(.caption.weight(.semibold))
                        .foregroundColor(.secondary)
                    HStack(spacing: 6) {
                        if showPasswordInSheet {
                            TextField("Password", text: $credentialPassword)
                                .textFieldStyle(.roundedBorder)
                                .font(.system(.body, design: .monospaced))
                        } else {
                            SecureField("Password", text: $credentialPassword)
                                .textFieldStyle(.roundedBorder)
                        }
                        
                        Button(action: { showPasswordInSheet.toggle() }) {
                            Image(systemName: showPasswordInSheet ? "eye.slash.fill" : "eye.fill")
                                .foregroundColor(.secondary)
                                .frame(width: 28, height: 24)
                        }
                        .buttonStyle(.plain)
                        .help(showPasswordInSheet ? "Nascondi password" : "Mostra password")
                    }
                }
                
                // Generatore di Password Integrato
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Button(action: {
                            generatePassword()
                            showPasswordInSheet = true
                        }) {
                            HStack(spacing: 5) {
                                Image(systemName: "dice.fill")
                                Text("Genera Password Sicura")
                            }
                            .font(.caption.weight(.semibold))
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.purple)
                        .controlSize(.small)
                        
                        Spacer()
                        
                        Button(action: { withAnimation { showGeneratorOptions.toggle() } }) {
                            HStack(spacing: 4) {
                                Text("Opzioni")
                                Image(systemName: showGeneratorOptions ? "chevron.up" : "chevron.down")
                            }
                            .font(.caption)
                            .foregroundColor(.secondary)
                        }
                        .buttonStyle(.plain)
                    }
                    
                    if showGeneratorOptions {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text("Lunghezza: \(genLength)")
                                    .font(.caption.weight(.medium))
                                    .frame(width: 90, alignment: .leading)
                                Slider(value: Binding(
                                    get: { Double(genLength) },
                                    set: { genLength = Int($0) }
                                ), in: 8...64, step: 1)
                            }
                            
                            HStack(spacing: 16) {
                                Toggle("A-Z", isOn: $genUpper)
                                Toggle("a-z", isOn: $genLower)
                                Toggle("0-9", isOn: $genNum)
                                Toggle("Simboli", isOn: $genSym)
                            }
                            .toggleStyle(.checkbox)
                            .font(.caption)
                        }
                        .padding(10)
                        .background(Color.white.opacity(0.05))
                        .cornerRadius(8)
                    }
                }
                
                HStack(spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Sito Web URL (Opzionale)")
                            .font(.caption.weight(.semibold))
                            .foregroundColor(.secondary)
                        TextField("https://...", text: $credentialUrl)
                            .textFieldStyle(.roundedBorder)
                    }
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Segreto 2FA / TOTP (Base32)")
                            .font(.caption.weight(.semibold))
                            .foregroundColor(.secondary)
                        TextField("Es. JBSWY3DPEHPK3PXP", text: $credentialTotp)
                            .textFieldStyle(.roundedBorder)
                    }
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Note")
                        .font(.caption.weight(.semibold))
                        .foregroundColor(.secondary)
                    TextEditor(text: $credentialNotes)
                        .font(.body)
                        .frame(height: 64)
                        .padding(4)
                        .background(Color(nsColor: .textBackgroundColor))
                        .cornerRadius(6)
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(Color.white.opacity(0.15), lineWidth: 1)
                        )
                }
                
                Divider().opacity(0.3)
                
                HStack {
                    Button("Annulla") {
                        closeCredentialSheet()
                    }
                    .keyboardShortcut(.cancelAction)
                    
                    Spacer()
                    
                    Button(action: saveCredential) {
                        Text("Salva Credenziale")
                            .fontWeight(.semibold)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.purple)
                    .disabled(credentialTitle.trimmingCharacters(in: .whitespaces).isEmpty)
                    .keyboardShortcut(.defaultAction)
                }
            }
            .padding(24)
            .frame(width: 420)
            .preferredColorScheme(.dark)
        }
        
        // 4. Informazioni & Aggiornamenti
        .sheet(isPresented: $showAbout) {
            VStack(spacing: 16) {
                Image(nsImage: NSApp.applicationIconImage)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 72, height: 72)
                    .cornerRadius(16)
                    .shadow(color: .purple.opacity(0.35), radius: 10, x: 0, y: 4)
                
                VStack(spacing: 4) {
                    Text("LocKey")
                        .font(.title2.bold())
                    Text("Versione 1.0.2 (Build Nativa macOS)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Text("Sviluppato e distribuito gratuitamente da\nBiragoDev")
                    .multilineTextAlignment(.center)
                    .font(.subheadline)
                
                Link("www.biragodev.it", destination: URL(string: "https://www.biragodev.it")!)
                    .font(.subheadline.bold())
                
                Text("Tutti i dati sono protetti in locale tramite Secure Enclave e crittografia AES-256-GCM. Nessun dato lascia mai questo Mac.")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                Divider().opacity(0.3)
                
                // Sezione Verifica Aggiornamenti
                VStack(spacing: 8) {
                    if isCheckingUpdate {
                        HStack(spacing: 6) {
                            ProgressView()
                                .scaleEffect(0.7)
                            Text("Verifica aggiornamenti in corso...")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    } else {
                        Button(action: checkForUpdates) {
                            Label("Verifica disponibilità aggiornamenti", systemImage: "arrow.triangle.2.circlepath")
                                .font(.caption)
                        }
                        .buttonStyle(.bordered)
                        
                        if let result = updateCheckResult {
                            Text(result)
                                .font(.caption2)
                                .foregroundColor(updateDownloadURL != nil ? .green : .secondary)
                                .multilineTextAlignment(.center)
                            
                            if let downloadURL = updateDownloadURL {
                                Button(action: { NSWorkspace.shared.open(downloadURL) }) {
                                    Label("Scarica Aggiornamento", systemImage: "arrow.down.circle.fill")
                                        .font(.caption.bold())
                                }
                                .buttonStyle(.borderedProminent)
                                .controlSize(.small)
                            }
                        }
                    }
                }
                
                Button("Chiudi") { showAbout = false }
                    .keyboardShortcut(.defaultAction)
            }
            .padding(24)
            .frame(width: 360)
            .preferredColorScheme(.dark)
        }
    }
    
    // MARK: - Funzioni di business logic della UI
    
    private func autoSelectInitialItems() {
        if selectedGroupID == nil, let firstGroup = vaultStore.groups.first {
            selectedGroupID = firstGroup.id
            selectedAppID = firstGroup.applications.first?.id
        }
    }
    
    private func checkForUpdates() {
        isCheckingUpdate = true
        updateCheckResult = nil
        updateDownloadURL = nil
        
        guard let url = URL(string: "https://api.github.com/repos/biragodevelopers-lgtm/LocKey/releases/latest") else {
            isCheckingUpdate = false
            return
        }
        
        var request = URLRequest(url: url)
        request.setValue("LocKey-macOS-Client", forHTTPHeaderField: "User-Agent")
        request.timeoutInterval = 8
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                self.isCheckingUpdate = false
                if error != nil {
                    self.updateCheckResult = "Nessuna connessione internet disponibile (100% offline)."
                    return
                }
                guard let data = data,
                      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                    self.updateCheckResult = "Nessun aggiornamento trovato su GitHub."
                    return
                }
                
                let latestTag = (json["tag_name"] as? String) ?? ""
                let currentVersion = "v1.0.2"
                
                if !latestTag.isEmpty && latestTag != currentVersion {
                    self.updateCheckResult = "Nuova versione disponibile: \(latestTag)!"
                    if let htmlUrlStr = json["html_url"] as? String, let htmlUrl = URL(string: htmlUrlStr) {
                        self.updateDownloadURL = htmlUrl
                    }
                } else {
                    self.updateCheckResult = "LocKey è aggiornato all'ultima versione (\(currentVersion))."
                }
            }
        }.resume()
    }
    
    private func createGroup() {
        let trimmed = newGroupName.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        let group = Group(name: trimmed, icon: newGroupIcon)
        vaultStore.groups.append(group)
        vaultStore.save()
        
        showAddGroup = false
        selectedGroupID = group.id
        newGroupName = ""
    }
    
    private func deleteGroup(_ group: Group) {
        vaultStore.groups.removeAll { $0.id == group.id }
        vaultStore.save()
        if selectedGroupID == group.id {
            selectedGroupID = vaultStore.groups.first?.id
            selectedAppID = selectedGroup?.applications.first?.id
        }
    }
    
    private func createApplication() {
        let trimmed = newAppName.trimmingCharacters(in: .whitespaces)
        guard let groupIndex = vaultStore.groups.firstIndex(where: { $0.id == selectedGroupID }), !trimmed.isEmpty else { return }
        let app = Application(name: trimmed, website: newAppWebsite.trimmingCharacters(in: .whitespaces))
        vaultStore.groups[groupIndex].applications.append(app)
        vaultStore.save()
        
        showAddApp = false
        selectedAppID = app.id
        newAppName = ""
        newAppWebsite = ""
    }
    
    private func deleteSingleApplication(_ app: Application) {
        guard let groupIndex = vaultStore.groups.firstIndex(where: { $0.id == selectedGroupID }) else { return }
        vaultStore.groups[groupIndex].applications.removeAll { $0.id == app.id }
        vaultStore.save()
        if selectedAppID == app.id {
            selectedAppID = vaultStore.groups[groupIndex].applications.first?.id
        }
    }
    
    private func startEditingCredential(_ cred: Credential) {
        let dec = vaultStore.decryptCredential(cred)
        credentialTitle = dec.title
        credentialUsername = dec.username
        credentialPassword = dec.password
        credentialNotes = dec.notes
        credentialUrl = dec.url
        credentialTotp = dec.totpSecret
        showPasswordInSheet = false
        editingCredential = cred
    }
    
    private func closeCredentialSheet() {
        showAddCredential = false
        editingCredential = nil
        credentialTitle = ""
        credentialUsername = ""
        credentialPassword = ""
        showPasswordInSheet = false
        credentialNotes = ""
        credentialUrl = ""
        credentialTotp = ""
        showGeneratorOptions = false
    }
    
    private func generatePassword() {
        credentialPassword = CryptoManager.generateSecurePassword(
            length: genLength,
            includeUppercase: genUpper,
            includeLowercase: genLower,
            includeNumbers: genNum,
            includeSymbols: genSym
        )
    }
    
    private func saveCredential() {
        let trimmedTitle = credentialTitle.trimmingCharacters(in: .whitespaces)
        guard let groupIndex = vaultStore.groups.firstIndex(where: { $0.id == selectedGroupID }),
              let appIndex = vaultStore.groups[groupIndex].applications.firstIndex(where: { $0.id == selectedAppID }),
              !trimmedTitle.isEmpty else { return }
        
        let tempDecrypted = DecryptedCredential(
            id: editingCredential?.id ?? UUID(),
            title: trimmedTitle,
            username: credentialUsername.trimmingCharacters(in: .whitespaces),
            password: credentialPassword,
            notes: credentialNotes,
            url: credentialUrl.trimmingCharacters(in: .whitespaces),
            totpSecret: credentialTotp.trimmingCharacters(in: .whitespaces),
            createdAt: editingCredential?.createdAt ?? Date(),
            updatedAt: Date()
        )
        
        do {
            let encrypted = try vaultStore.encryptCredential(tempDecrypted)
            
            if let editIndex = vaultStore.groups[groupIndex].applications[appIndex].credentials.firstIndex(where: { $0.id == editingCredential?.id }) {
                vaultStore.groups[groupIndex].applications[appIndex].credentials[editIndex] = encrypted
            } else {
                vaultStore.groups[groupIndex].applications[appIndex].credentials.append(encrypted)
            }
            
            vaultStore.save()
            closeCredentialSheet()
            
        } catch {
            print("Errore nel salvataggio della credenziale: \(error)")
        }
    }
    
    private func deleteCredential(_ cred: Credential) {
        guard let groupIndex = vaultStore.groups.firstIndex(where: { $0.id == selectedGroupID }),
              let appIndex = vaultStore.groups[groupIndex].applications.firstIndex(where: { $0.id == selectedAppID }),
              let credIndex = vaultStore.groups[groupIndex].applications[appIndex].credentials.firstIndex(where: { $0.id == cred.id }) else { return }
        
        vaultStore.groups[groupIndex].applications[appIndex].credentials.remove(at: credIndex)
        vaultStore.save()
    }
    
    // MARK: - Backup Flows
    
    private func exportBackupFlow() {
        let savePanel = NSSavePanel()
        savePanel.allowedContentTypes = [UTType(filenameExtension: "lockey")].compactMap { $0 }
        savePanel.nameFieldStringValue = "backup_lockey.lockey"
        savePanel.title = "Esporta Backup Cifrato"
        savePanel.message = "Scegli dove salvare il backup cifrato"
        
        savePanel.begin { response in
            if response == .OK, let url = savePanel.url {
                promptPassword(title: "Password di Backup", message: "Inserisci una password per cifrare il file di backup:") { pwd in
                    do {
                        try vaultStore.exportBackup(to: url, password: pwd)
                    } catch {
                        alertError(message: "Errore durante l'esportazione: \(error.localizedDescription)")
                    }
                }
            }
        }
    }
    
    private func importBackupFlow() {
        let openPanel = NSOpenPanel()
        openPanel.allowedContentTypes = [UTType(filenameExtension: "lockey")].compactMap { $0 }
        openPanel.allowsMultipleSelection = false
        openPanel.canChooseDirectories = false
        openPanel.canChooseFiles = true
        openPanel.title = "Importa Backup"
        openPanel.message = "Seleziona il file .lockey da importare"
        
        openPanel.begin { response in
            if response == .OK, let url = openPanel.url {
                promptPassword(title: "Password di Backup", message: "Inserisci la password utilizzata per cifrare questo backup:") { pwd in
                    do {
                        try vaultStore.importBackup(from: url, password: pwd)
                        autoSelectInitialItems()
                    } catch {
                        alertError(message: "Errore durante l'importazione: \(error.localizedDescription)")
                    }
                }
            }
        }
    }
    
    private func promptPassword(title: String, message: String, completion: @escaping (String) -> Void) {
        let alert = NSAlert()
        alert.messageText = title
        alert.informativeText = message
        alert.addButton(withTitle: "OK")
        alert.addButton(withTitle: "Annulla")
        
        let passwordField = NSSecureTextField(frame: NSRect(x: 0, y: 0, width: 220, height: 24))
        alert.accessoryView = passwordField
        
        let response = alert.runModal()
        if response == .alertFirstButtonReturn {
            completion(passwordField.stringValue)
        }
    }
    
    private func alertError(message: String) {
        let alert = NSAlert()
        alert.messageText = "LocKey"
        alert.informativeText = message
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }
}

// MARK: - Helper Glassmorphism SwiftUI Wrapper per NSVisualEffectView

public struct VisualEffectView: NSViewRepresentable {
    public var material: NSVisualEffectView.Material
    public var blendingMode: NSVisualEffectView.BlendingMode
    
    public func makeNSView(context: Context) -> NSVisualEffectView {
        let visualEffectView = NSVisualEffectView()
        visualEffectView.material = material
        visualEffectView.blendingMode = blendingMode
        visualEffectView.state = .active
        return visualEffectView
    }
    
    public func updateNSView(_ nsView: NSVisualEffectView, context: Context) {
        nsView.material = material
        nsView.blendingMode = blendingMode
    }
}
