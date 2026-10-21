// LocKey Desktop - Main Process (Electron)

const { app, BrowserWindow, ipcMain, clipboard, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let clipboardTimer = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'LocKey',
    width: 960,
    height: 640,
    minWidth: 850,
    minHeight: 550,
    backgroundColor: '#0f0f17',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Apre i link esterni nel browser di sistema predefinito (Edge, Chrome, ecc.)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Cerca il file index.html compilato di Vite nei possibili percorsi di runtime
  const candidatePaths = [
    path.join(__dirname, 'dist', 'index.html'),
    path.join(__dirname, 'index.html'),
    path.join(app.getAppPath(), 'dist', 'index.html'),
    path.join(app.getAppPath(), 'index.html'),
    path.join(__dirname, '..', 'dist', 'index.html')
  ];

  let loaded = false;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      console.log('LocKey: Caricamento interfaccia da', p);
      mainWindow.loadFile(p);
      loaded = true;
      break;
    }
  }

  if (!loaded) {
    console.error('LocKey: Impossibile trovare index.html nei percorsi candidati:', candidatePaths);
    if (!app.isPackaged) {
      mainWindow.loadURL('http://localhost:3000');
    } else {
      mainWindow.loadURL(`data:text/html,<html><body style="background:#0f0f17;color:white;font-family:sans-serif;padding:40px;text-align:center;"><h2>Errore caricamento LocKey</h2><p>Impossibile trovare i file dell'interfaccia utente.</p></body></html>`);
    }
  }

  // Nasconde la barra dei menu di default su Windows/Linux
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Blocco automatico quando l'applicazione perde il focus (per sicurezza)
  mainWindow.on('blur', () => {
    mainWindow.webContents.send('app-blur');
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// 1. Carica il Vault locale dal disco
ipcMain.handle('load-vault', async () => {
  try {
    const dirPath = app.getPath('userData');
    const filePath = path.join(dirPath, 'vault.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
    return null;
  } catch (err) {
    console.error('Errore durante il caricamento del vault:', err);
    return null;
  }
});

// 2. Salva il Vault locale sul disco
ipcMain.handle('save-vault', async (event, payload) => {
  try {
    const dirPath = app.getPath('userData');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const filePath = path.join(dirPath, 'vault.json');
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Errore durante il salvataggio del vault:', err);
    return false;
  }
});

// 3. Copia password e avvia il timer di pulizia
ipcMain.on('copy-password', (event, text) => {
  clipboard.writeText(text);

  if (clipboardTimer) {
    clearTimeout(clipboardTimer);
  }

  clipboardTimer = setTimeout(() => {
    try {
      if (clipboard.readText() === text) {
        clipboard.writeText('');
        console.log('Appunti di LocKey puliti automaticamente per sicurezza.');
      }
    } catch (err) {
      console.error('Impossibile pulire la clipboard:', err);
    }
  }, 30000);
});

// 4. Esporta backup cifrato (.lockey)
ipcMain.handle('export-backup', async (event, content) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Esporta Backup Cifrato',
      defaultPath: path.join(app.getPath('documents'), 'backup.lockey'),
      filters: [{ name: 'LocKey Backup', extensions: ['lockey'] }]
    });

    if (filePath) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (err) {
    console.error('Errore durante l\'esportazione del backup:', err);
    return false;
  }
});

// 5. Importa backup cifrato (.lockey)
ipcMain.handle('import-backup', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Importa Backup Cifrato',
      filters: [{ name: 'LocKey Backup', extensions: ['lockey'] }],
      properties: ['openFile']
    });

    if (filePaths && filePaths[0]) {
      return fs.readFileSync(filePaths[0], 'utf8');
    }
    return null;
  } catch (err) {
    console.error('Errore durante l\'importazione del backup:', err);
    return null;
  }
});
