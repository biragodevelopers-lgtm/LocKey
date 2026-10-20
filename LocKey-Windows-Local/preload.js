const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadVault: () => ipcRenderer.invoke('load-vault'),
  saveVault: (payload) => ipcRenderer.invoke('save-vault', payload),
  copyPassword: (text) => ipcRenderer.send('copy-password', text),
  exportBackup: (content) => ipcRenderer.invoke('export-backup', content),
  importBackup: () => ipcRenderer.invoke('import-backup'),
  onAppBlur: (callback) => ipcRenderer.on('app-blur', callback)
});
