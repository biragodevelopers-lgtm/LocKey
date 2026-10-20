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
    @State private var newGroupIcon = "folder"
    
    @State private var showAddApp = false
    @State private var newAppName = ""
    @State private var newAppWebsite = ""
    
    @State private var showAddCredential = false
    @State private var editingCredential: Credential? = nil
    @State private var credentialTitle = ""
    @State private var credentialUsername = ""
    @State private var credentialPassword = ""
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
    
    // Lista di icone SF Symbols predefinite per i Gruppi
    private let groupIcons = ["folder", "briefcase", "person.fill", "house.fill", "creditcard.fill", "gamecontroller.fill", "cart.fill", "heart.fill"]
    
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
            app.credentials.contains { cred in
                let dec = vaultStore.decryptCredential(cred)
                return dec.title.localizedCaseInsensitiveContains(searchQuery) ||
                       dec.username.localizedCaseInsensitiveContains(searchQuery)
            }
        }
    }
    
    public var body: some View {
        NavigationSplitView {
            // COLONNA 1: Sidebar (Gruppi)
            VStack {
                List(selection: $selectedGroupID) {
                    Section("Gruppi") {
                        ForEach(vaultStore.groups) { group in
                            NavigationLink(value: group.id) {
                                HStack {
                                    Image(systemName: group.icon)
                                        .foregroundColor(.purple)
                                    Text(group.name)
                                    Spacer()
                                    Text("\(group.applications.count)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                }
                .listStyle(.sidebar)
                
                Spacer()
                
                // Tasto aggiungi gruppo
                Button(action: { showAddGroup = true }) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                        Text("Nuovo Gruppo")
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(Color.purple.opacity(0.1))
                    .cornerRadius(8)
                    .padding(.horizontal)
                    .padding(.top, 4)
                }
                .buttonStyle(.plain)
                
                // Branding BiragoDev Footer
                VStack(spacing: 4) {
                    Divider().opacity(0.3)
                    HStack {
                        Image(systemName: "checkmark.shield.fill")
                            .foregroundColor(.green)
                            .font(.caption2)
                        Text("100% Offline")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        Spacer()
                        Link("BiragoDev", destination: URL(string: "https://www.biragodev.it")!)
                            .font(.caption2)
                            .foregroundColor(.blue)
                    }
                    .padding(.horizontal, 14)
                    .padding(.top, 6)
                    
                    HStack {
                        Button(action: { showAbout = true; checkForUpdates() }) {
                            HStack(spacing: 4) {
                                Image(systemName: "arrow.triangle.2.circlepath")
                                Text("Verifica aggiornamenti")
                            }
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        }
                        .buttonStyle(.plain)
                        Spacer()
                    }
                    .padding(.horizontal, 14)
                    .padding(.bottom, 6)
                }
            }
            .navigationTitle("LocKey")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    HStack(spacing: 8) {
                        Button(action: { showAbout = true }) {
                            Image(systemName: "info.circle")
                        }
                        .help("Informazioni su LocKey & BiragoDev")
                        
                        Menu {
                            Button(action: exportBackupFlow) {
                                Label("Esporta Backup Cifrato", systemImage: "square.and.arrow.up")
                            }
                            Button(action: importBackupFlow) {
                                Label("Importa Backup (.lockey)", systemImage: "square.and.arrow.down")
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle")
                        }
                        .menuStyle(.borderlessButton)
                        .help("Opzioni del Vault (Backup)")
                        
                        Button(action: { vaultStore.lock() }) {
                            Label("Blocca", systemImage: "lock.fill")
                        }
                        .help("Blocca immediatamente il vault")
                    }
                }
            }
        } content: {
            // COLONNA 2: Lista Applicazioni
            VStack {
                if let group = selectedGroup {
                    List(selection: $selectedAppID) {
                        Section(group.name) {
                            ForEach(filteredApplications) { app in
                                NavigationLink(value: app.id) {
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(app.name)
                                            .font(.headline)
                                        if !app.website.isEmpty {
                                            Text(app.website)
                                                .font(.subheadline)
                                                .foregroundColor(.secondary)
                                        }
                                    }
                                }
                            }
                            .onDelete(perform: deleteApplication)
                        }
                    }
                    .searchable(text: $searchQuery, prompt: "Cerca app o account...")
                    
                    Spacer()
                    
                    Button(action: { showAddApp = true }) {
                        HStack {
                            Image(systemName: "plus")
                            Text("Aggiungi Applicazione")
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                        .padding()
                    }
                    .buttonStyle(.plain)
                } else {
                    Text("Seleziona un Gruppo")
                        .foregroundColor(.secondary)
                        .font(.headline)
                }
            }
            .navigationTitle(selectedGroup?.name ?? "Seleziona")
        } detail: {
            // COLONNA 3: Dettagli Applicazione & Credenziali
            VStack {
                if let app = selectedApp {
                    VStack(alignment: .leading, spacing: 16) {
                        // Header App
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(app.name)
                                    .font(.system(size: 28, weight: .bold, design: .rounded))
                                if !app.website.isEmpty {
                                    Link(destination: URL(string: app.website.contains("://") ? app.website : "https://\(app.website)") ?? URL(string: "https://google.com")!) {
                                        HStack(spacing: 4) {
                                            Text(app.website)
                                                .font(.subheadline)
                                            Image(systemName: "arrow.up.right.square")
                                                .font(.caption)
                                        }
                                    }
                                }
                            }
                            Spacer()
                            
                            Button(action: { showAddCredential = true }) {
                                Label("Nuova Credenziale", systemImage: "plus")
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing))
                                    .cornerRadius(8)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal)
                        
                        Divider()
                        
                        // Lista Credenziali
                        if app.credentials.isEmpty {
                            Spacer()
                            VStack(spacing: 12) {
                                Image(systemName: "key.viewfinder")
                                    .font(.system(size: 48))
                                    .foregroundColor(.secondary)
                                Text("Nessuna credenziale in questa app")
                                    .foregroundColor(.secondary)
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
                                .padding()
                            }
                        }
                    }
                    .padding(.top)
                } else {
                    VStack(spacing: 16) {
                        Image(systemName: "lock.shield")
                            .font(.system(size: 64))
                            .foregroundColor(.secondary.opacity(0.5))
                        Text("Seleziona un'applicazione per visualizzare i dettagli")
                            .foregroundColor(.secondary)
                            .font(.headline)
                    }
                }
            }
            .frame(minWidth: 400)
            .background(Color(nsColor: .windowBackgroundColor))
        }
        // Fogli modali (Sheets)
        
        // 1. Nuovo Gruppo
        .sheet(isPresented: $showAddGroup) {
            VStack(spacing: 20) {
                Text("Crea Nuovo Gruppo")
                    .font(.headline)
                
                TextField("Nome Gruppo", text: $newGroupName)
                    .textFieldStyle(.roundedBorder)
                
                VStack(alignment: .leading) {
                    Text("Seleziona Icona")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    HStack(spacing: 12) {
                        ForEach(groupIcons, id: \.self) { icon in
                            Image(systemName: icon)
                                .font(.title3)
                                .foregroundColor(newGroupIcon == icon ? .purple : .secondary)
                                .padding(8)
                                .background(newGroupIcon == icon ? Color.purple.opacity(0.2) : Color.clear)
                                .cornerRadius(6)
                                .onTapGesture {
                                    newGroupIcon = icon
                                }
                        }
                    }
                }
                
                HStack {
                    Button("Annulla") {
                        showAddGroup = false
                        newGroupName = ""
                    }
                    Spacer()
                    Button("Crea") {
                        createGroup()
                    }
                    .disabled(newGroupName.isEmpty)
                }
            }
            .padding()
            .frame(width: 320)
        }
        
        // 2. Nuova Applicazione
        .sheet(isPresented: $showAddApp) {
            VStack(spacing: 20) {
                Text("Aggiungi Applicazione")
                    .font(.headline)
                
                TextField("Nome Applicazione (es. Google, GitHub)", text: $newAppName)
                    .textFieldStyle(.roundedBorder)
                
                TextField("Sito Web (Opzionale)", text: $newAppWebsite)
                    .textFieldStyle(.roundedBorder)
                
                HStack {
                    Button("Annulla") {
                        showAddApp = false
                        newAppName = ""
                        newAppWebsite = ""
                    }
                    Spacer()
                    Button("Aggiungi") {
                        createApplication()
                    }
                    .disabled(newAppName.isEmpty)
                }
            }
            .padding()
            .frame(width: 320)
        }
        
        // 3. Nuova/Modifica Credenziale
        .sheet(isPresented: Binding(
            get: { showAddCredential || editingCredential != nil },
            set: { if !$0 { showAddCredential = false; editingCredential = nil } }
        )) {
            VStack(spacing: 16) {
                Text(editingCredential == nil ? "Aggiungi Credenziale" : "Modifica Credenziale")
                    .font(.headline)
                
                TextField("Titolo (es. Account Personale)", text: $credentialTitle)
                    .textFieldStyle(.roundedBorder)
                
                TextField("Nome Utente / Email", text: $credentialUsername)
                    .textFieldStyle(.roundedBorder)
                
                SecureField("Password", text: $credentialPassword)
                    .textFieldStyle(.roundedBorder)
                
                // Generatore di Password Integrato
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Button(action: generatePassword) {
                            HStack {
                                Image(systemName: "dice.fill")
                                Text("Genera Password")
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.purple)
                        
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
                                    .font(.caption)
                                    .frame(width: 80, alignment: .leading)
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
                        .background(Color.primary.opacity(0.04))
                        .cornerRadius(8)
                    }
                }
                .padding(.bottom, 4)
                
                TextField("Sito Web URL", text: $credentialUrl)
                    .textFieldStyle(.roundedBorder)
                
                TextField("Segreto TOTP / 2FA (Base32)", text: $credentialTotp)
                    .textFieldStyle(.roundedBorder)
                
                VStack(alignment: .leading) {
                    Text("Note")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    TextEditor(text: $credentialNotes)
                        .frame(height: 80)
                        .border(Color.gray.opacity(0.2))
                }
                
                HStack {
                    Button("Annulla") {
                        closeCredentialSheet()
                    }
                    Spacer()
                    Button("Salva") {
                        saveCredential()
                    }
                    .disabled(credentialTitle.isEmpty)
                }
            }
            .padding()
            .frame(width: 380)
        }
        .sheet(isPresented: $showAbout) {
            VStack(spacing: 16) {
                Image(systemName: "lock.shield.fill")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 54, height: 54)
                    .foregroundStyle(LinearGradient(colors: [.purple, .blue], startPoint: .topLeading, endPoint: .bottomTrailing))
                Text("LocKey")
                    .font(.title2.bold())
                Text("Versione 1.0.0 (Build Nativa macOS)")
                    .font(.caption)
                    .foregroundColor(.secondary)
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
            .frame(width: 340)
        }
    }
    
    // MARK: - Funzioni di business logic della UI
    
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
                let currentVersion = "v1.0.0"
                
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
        guard !newGroupName.isEmpty else { return }
        let group = Group(name: newGroupName, icon: newGroupIcon)
        vaultStore.groups.append(group)
        vaultStore.save()
        
        showAddGroup = false
        selectedGroupID = group.id // seleziona automaticamente il nuovo gruppo
        newGroupName = ""
    }
    
    private func createApplication() {
        guard let groupIndex = vaultStore.groups.firstIndex(where: { $0.id == selectedGroupID }), !newAppName.isEmpty else { return }
        let app = Application(name: newAppName, website: newAppWebsite)
        vaultStore.groups[groupIndex].applications.append(app)
        vaultStore.save()
        
        showAddApp = false
        selectedAppID = app.id // seleziona automaticamente la nuova app
        newAppName = ""
        newAppWebsite = ""
    }
    
    private func deleteApplication(at offsets: IndexSet) {
        guard let groupIndex = vaultStore.groups.firstIndex(where: { $0.id == selectedGroupID }) else { return }
        vaultStore.groups[groupIndex].applications.remove(atOffsets: offsets)
        vaultStore.save()
        selectedAppID = nil
    }
    
    private func startEditingCredential(_ cred: Credential) {
        let dec = vaultStore.decryptCredential(cred)
        credentialTitle = dec.title
        credentialUsername = dec.username
        credentialPassword = dec.password
        credentialNotes = dec.notes
        credentialUrl = dec.url
        credentialTotp = dec.totpSecret
        editingCredential = cred
    }
    
    private func closeCredentialSheet() {
        showAddCredential = false
        editingCredential = nil
        credentialTitle = ""
        credentialUsername = ""
        credentialPassword = ""
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
        guard let groupIndex = vaultStore.groups.firstIndex(where: { $0.id == selectedGroupID }),
              let appIndex = vaultStore.groups[groupIndex].applications.firstIndex(where: { $0.id == selectedAppID }),
              !credentialTitle.isEmpty else { return }
        
        let tempDecrypted = DecryptedCredential(
            id: editingCredential?.id ?? UUID(),
            title: credentialTitle,
            username: credentialUsername,
            password: credentialPassword,
            notes: credentialNotes,
            url: credentialUrl,
            totpSecret: credentialTotp,
            createdAt: editingCredential?.createdAt ?? Date(),
            updatedAt: Date()
        )
        
        do {
            let encrypted = try vaultStore.encryptCredential(tempDecrypted)
            
            if let editIndex = vaultStore.groups[groupIndex].applications[appIndex].credentials.firstIndex(where: { $0.id == editingCredential?.id }) {
                // Modifica esistente
                vaultStore.groups[groupIndex].applications[appIndex].credentials[editIndex] = encrypted
            } else {
                // Nuova credenziale
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
