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
        NavigationSplitView {
            // COLONNA 1: Sidebar (Brand Header + Gruppi + Azioni)
            VStack(spacing: 0) {
                // Header con Icona Programma in alto a sinistra + Pulsanti Info & Menu sempre visibili
                HStack(spacing: 10) {
                    Image(nsImage: NSApp.applicationIconImage)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 32, height: 32)
                        .cornerRadius(8)
                        .shadow(color: .purple.opacity(0.25), radius: 4, x: 0, y: 2)
                    
                    VStack(alignment: .leading, spacing: 1) {
                        Text("LocKey")
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                            .foregroundColor(.primary)
                        Text("Vault Protetto")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    // Pulsante Informazioni (sempre visibile, sia in finestra che a tutto schermo)
                    Button(action: { showAbout = true }) {
                        Image(systemName: "info.circle")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.secondary)
                            .frame(width: 26, height: 26)
                            .background(Color.primary.opacity(0.05))
                            .cornerRadius(6)
                    }
                    .buttonStyle(.plain)
                    .help("Informazioni su LocKey & Aggiornamenti")
                    
                    // Menu Opzioni Backup (sempre visibile, sia in finestra che a tutto schermo)
                    Menu {
                        Button(action: exportBackupFlow) {
                            Label("Esporta Backup Cifrato (.lockey)", systemImage: "square.and.arrow.up")
                        }
                        Button(action: importBackupFlow) {
                            Label("Importa Backup (.lockey)", systemImage: "square.and.arrow.down")
                        }
                        Divider()
                        Button(action: { showAbout = true; checkForUpdates() }) {
                            Label("Verifica Aggiornamenti...", systemImage: "arrow.triangle.2.circlepath")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.secondary)
                            .frame(width: 26, height: 26)
                            .background(Color.primary.opacity(0.05))
                            .cornerRadius(6)
                    }
                    .menuStyle(.borderlessButton)
                    .frame(width: 26)
                    .help("Backup e Opzioni del Vault")
                }
                .padding(.horizontal, 14)
                .padding(.top, 10)
                .padding(.bottom, 10)
                
                Divider().opacity(0.3)
                
                // Lista Gruppi
                List(selection: $selectedGroupID) {
                    Section("I Tuoi Gruppi") {
                        ForEach(vaultStore.groups) { group in
                            NavigationLink(value: group.id) {
                                HStack(spacing: 8) {
                                    Image(systemName: group.icon)
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(.purple)
                                        .frame(width: 20)
                                    Text(group.name)
                                        .font(.system(size: 13, weight: .medium))
                                        .lineLimit(1)
                                    Spacer()
                                    Text("\(group.applications.count)")
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundColor(.secondary)
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 1)
                                        .background(Color.primary.opacity(0.06))
                                        .cornerRadius(6)
                                }
                                .padding(.vertical, 2)
                            }
                            .contextMenu {
                                Button(role: .destructive, action: { deleteGroup(group) }) {
                                    Label("Elimina Gruppo", systemImage: "trash")
                                }
                            }
                        }
                    }
                }
                .listStyle(.sidebar)
                
                // Sezione Pulsanti Inferiori Sidebar
                VStack(spacing: 8) {
                    Divider().opacity(0.3)
                    
                    // Tasto Nuovo Gruppo
                    Button(action: {
                        newGroupName = ""
                        newGroupIcon = "folder.fill"
                        showAddGroup = true
                    }) {
                        HStack(spacing: 6) {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(.purple)
                            Text("Nuovo Gruppo")
                                .font(.system(size: 13, weight: .semibold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.purple.opacity(0.12))
                        .cornerRadius(8)
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 12)
                    
                    // UNICO Pulsante Blocca Vault (senza duplicati in alto)
                    Button(action: { vaultStore.lock() }) {
                        HStack(spacing: 6) {
                            Image(systemName: "lock.fill")
                                .font(.system(size: 13, weight: .bold))
                            Text("Blocca Vault")
                                .font(.system(size: 13, weight: .semibold))
                            Spacer()
                            Text("⌘L")
                                .font(.caption2.bold())
                                .opacity(0.85)
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(
                            LinearGradient(
                                colors: [Color.red.opacity(0.88), Color.pink.opacity(0.78)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(8)
                    }
                    .buttonStyle(.plain)
                    .keyboardShortcut("l", modifiers: .command)
                    .help("Blocca immediatamente il Vault (Cmd + L)")
                    .padding(.horizontal, 12)
                    
                    // Pulsante Verifica Aggiornamenti
                    Button(action: { showAbout = true; checkForUpdates() }) {
                        HStack(spacing: 6) {
                            Image(systemName: "arrow.triangle.2.circlepath")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(.blue)
                            Text("Verifica aggiornamenti")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(.primary)
                                .lineLimit(1)
                            Spacer()
                            Text("v1.0.1")
                                .font(.system(size: 10, weight: .bold))
                                .padding(.horizontal, 5)
                                .padding(.vertical, 2)
                                .background(Color.blue.opacity(0.15))
                                .cornerRadius(4)
                                .foregroundColor(.blue)
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.primary.opacity(0.04))
                        .cornerRadius(6)
                    }
                    .buttonStyle(.plain)
                    .help("Verifica disponibilità nuove versioni di LocKey")
                    .padding(.horizontal, 12)
                    
                    // Footer Branding
                    HStack {
                        Image(systemName: "checkmark.shield.fill")
                            .foregroundColor(.green)
                            .font(.caption2)
                        Text("100% Offline")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Spacer()
                        Link("BiragoDev", destination: URL(string: "https://www.biragodev.it")!)
                            .font(.caption2.weight(.semibold))
                            .foregroundColor(.blue)
                    }
                    .padding(.horizontal, 14)
                    .padding(.top, 2)
                    .padding(.bottom, 8)
                }
            }
            .navigationSplitViewColumnWidth(min: 210, ideal: 230, max: 280)
        } content: {
            // COLONNA 2: Lista Applicazioni
            VStack(spacing: 0) {
                if let group = selectedGroup {
                    // Header Colonna Applicazioni
                    HStack {
                        Image(systemName: group.icon)
                            .foregroundColor(.purple)
                            .font(.system(size: 14, weight: .semibold))
                        Text(group.name)
                            .font(.system(size: 15, weight: .bold))
                            .lineLimit(1)
                        Spacer()
                        Button(action: {
                            newAppName = ""
                            newAppWebsite = ""
                            showAddApp = true
                        }) {
                            Image(systemName: "plus")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(.blue)
                                .frame(width: 26, height: 26)
                                .background(Color.blue.opacity(0.12))
                                .cornerRadius(6)
                        }
                        .buttonStyle(.plain)
                        .help("Aggiungi Applicazione")
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    
                    Divider().opacity(0.3)
                    
                    if group.applications.isEmpty {
                        Spacer()
                        VStack(spacing: 14) {
                            Image(systemName: "app.badge.plus")
                                .font(.system(size: 40))
                                .foregroundColor(.secondary.opacity(0.5))
                            Text("Nessuna applicazione")
                                .font(.headline)
                                .foregroundColor(.secondary)
                            Text("Aggiungi un servizio o sito web (es. Google, Amazon, Banca) in \"\(group.name)\".")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 20)
                            
                            Button(action: {
                                newAppName = ""
                                newAppWebsite = ""
                                showAddApp = true
                            }) {
                                Label("Aggiungi Applicazione", systemImage: "plus")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 8)
                                    .background(Color.blue)
                                    .cornerRadius(8)
                            }
                            .buttonStyle(.plain)
                        }
                        Spacer()
                    } else {
                        List(selection: $selectedAppID) {
                            ForEach(filteredApplications) { app in
                                NavigationLink(value: app.id) {
                                    HStack(spacing: 10) {
                                        ZStack {
                                            RoundedRectangle(cornerRadius: 7)
                                                .fill(Color.blue.opacity(0.12))
                                                .frame(width: 30, height: 30)
                                            Text(String(app.name.prefix(1)).uppercased())
                                                .font(.system(size: 13, weight: .bold, design: .rounded))
                                                .foregroundColor(.blue)
                                        }
                                        
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(app.name)
                                                .font(.system(size: 13, weight: .semibold))
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
                                            .font(.system(size: 10, weight: .semibold))
                                            .foregroundColor(.secondary)
                                            .padding(.horizontal, 6)
                                            .padding(.vertical, 2)
                                            .background(Color.primary.opacity(0.06))
                                            .cornerRadius(6)
                                    }
                                    .padding(.vertical, 3)
                                }
                                .contextMenu {
                                    Button(role: .destructive, action: { deleteSingleApplication(app) }) {
                                        Label("Elimina Applicazione", systemImage: "trash")
                                    }
                                }
                            }
                            .onDelete(perform: deleteApplication)
                        }
                        .searchable(text: $searchQuery, prompt: "Cerca app o account...")
                    }
                    
                    Divider().opacity(0.3)
                    
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
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                        .padding(12)
                    }
                    .buttonStyle(.plain)
                } else {
                    VStack(spacing: 14) {
                        Image(systemName: "folder.badge.plus")
                            .font(.system(size: 42))
                            .foregroundColor(.secondary.opacity(0.45))
                        Text("Seleziona o crea un Gruppo")
                            .foregroundColor(.secondary)
                            .font(.headline)
                        Text("Organizza le tue password in gruppi (es. Personale, Lavoro, Finanza).")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 24)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .navigationSplitViewColumnWidth(min: 220, ideal: 250, max: 320)
        } detail: {
            // COLONNA 3: Dettagli Applicazione & Credenziali
            VStack(spacing: 0) {
                if let app = selectedApp {
                    VStack(alignment: .leading, spacing: 0) {
                        // Header App
                        HStack(spacing: 14) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(
                                        LinearGradient(
                                            colors: [Color.purple.opacity(0.2), Color.blue.opacity(0.2)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .frame(width: 48, height: 48)
                                Text(String(app.name.prefix(1)).uppercased())
                                    .font(.system(size: 22, weight: .bold, design: .rounded))
                                    .foregroundStyle(
                                        LinearGradient(colors: [.purple, .blue], startPoint: .topLeading, endPoint: .bottomTrailing)
                                    )
                            }
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(app.name)
                                    .font(.system(size: 24, weight: .bold, design: .rounded))
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
                                .padding(.horizontal, 14)
                                .padding(.vertical, 9)
                                .background(
                                    LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing)
                                )
                                .cornerRadius(8)
                                .shadow(color: .purple.opacity(0.25), radius: 6, x: 0, y: 3)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, 24)
                        .padding(.vertical, 18)
                        
                        Divider().opacity(0.4)
                        
                        // Lista Credenziali
                        if app.credentials.isEmpty {
                            Spacer()
                            VStack(spacing: 14) {
                                Image(systemName: "key.viewfinder")
                                    .font(.system(size: 48))
                                    .foregroundColor(.secondary.opacity(0.45))
                                Text("Nessuna credenziale salvata")
                                    .font(.headline)
                                    .foregroundColor(.secondary)
                                Text("Aggiungi il primo account o password per \(app.name).")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                
                                Button(action: {
                                    closeCredentialSheet()
                                    showAddCredential = true
                                }) {
                                    Label("Aggiungi Credenziale", systemImage: "plus")
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 9)
                                        .background(
                                            LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing)
                                        )
                                        .cornerRadius(8)
                                }
                                .buttonStyle(.plain)
                                .padding(.top, 4)
                            }
                            .frame(maxWidth: .infinity)
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
                                .padding(20)
                            }
                        }
                    }
                } else {
                    VStack(spacing: 16) {
                        Image(nsImage: NSApp.applicationIconImage)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 64, height: 64)
                            .cornerRadius(14)
                            .opacity(0.6)
                        Text("Seleziona un'applicazione per visualizzare le credenziali")
                            .foregroundColor(.secondary)
                            .font(.headline)
                        Text("Tutte le tue password sono cifrate localmente con AES-256-GCM.")
                            .font(.caption)
                            .foregroundColor(.secondary.opacity(0.8))
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .frame(minWidth: 420)
            .background(Color(nsColor: .windowBackgroundColor))
        }
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
        
        // 1. Nuovo Gruppo (con Griglia 4x2 senza errori di visualizzazione!)
        .sheet(isPresented: $showAddGroup) {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(Color.purple.opacity(0.15))
                            .frame(width: 36, height: 36)
                        Image(systemName: newGroupIcon)
                            .font(.system(size: 16, weight: .semibold))
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
                            if !newGroupName.isEmpty {
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
                                            .fill(newGroupIcon == icon ? Color.purple.opacity(0.18) : Color.primary.opacity(0.05))
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(newGroupIcon == icon ? Color.purple : Color.clear, lineWidth: 1.5)
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                
                Divider().opacity(0.4)
                
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
        }
        
        // 2. Nuova Applicazione
        .sheet(isPresented: $showAddApp) {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(Color.blue.opacity(0.15))
                            .frame(width: 36, height: 36)
                        Image(systemName: "app.badge.plus")
                            .font(.system(size: 16, weight: .semibold))
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
                            if !newAppName.isEmpty {
                                createApplication()
                            }
                        }
                }
                
                Divider().opacity(0.4)
                
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
        }
        
        // 3. Nuova/Modifica Credenziale
        .sheet(isPresented: Binding(
            get: { showAddCredential || editingCredential != nil },
            set: { if !$0 { closeCredentialSheet() } }
        )) {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(Color.purple.opacity(0.15))
                            .frame(width: 36, height: 36)
                        Image(systemName: "key.fill")
                            .font(.system(size: 15, weight: .semibold))
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
                        .background(Color.primary.opacity(0.05))
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
                                .stroke(Color.primary.opacity(0.15), lineWidth: 1)
                        )
                }
                
                Divider().opacity(0.4)
                
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
        }
        
        // 4. Informazioni & Aggiornamenti
        .sheet(isPresented: $showAbout) {
            VStack(spacing: 16) {
                Image(nsImage: NSApp.applicationIconImage)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 68, height: 68)
                    .cornerRadius(16)
                    .shadow(color: .purple.opacity(0.3), radius: 8, x: 0, y: 4)
                
                VStack(spacing: 4) {
                    Text("LocKey")
                        .font(.title2.bold())
                    Text("Versione 1.0.1 (Build Nativa macOS)")
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
                
                Divider().opacity(0.4)
                
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
                let currentVersion = "v1.0.1"
                
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
    
    private func deleteApplication(at offsets: IndexSet) {
        guard let groupIndex = vaultStore.groups.firstIndex(where: { $0.id == selectedGroupID }) else { return }
        vaultStore.groups[groupIndex].applications.remove(atOffsets: offsets)
        vaultStore.save()
        selectedAppID = vaultStore.groups[groupIndex].applications.first?.id
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
