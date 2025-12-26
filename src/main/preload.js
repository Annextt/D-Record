const { contextBridge, ipcRenderer } = require('electron');

// ===== PONTE ÚNICA ENTRE ELECTRON E INTERFACE =====
contextBridge.exposeInMainWorld('electronAPI', {
  // ===== GRAVAÇÃO =====
  getSources: () => ipcRenderer.invoke('get-sources'),

  // ===== ARQUIVOS =====
  writeFile: (filePath, buffer) => {
    return ipcRenderer.invoke('write-file', { filePath, buffer });
  },

  // ===== ATALHOS =====
  updateShortcut: (type, key) => {
    ipcRenderer.send('update-shortcut', { type, key });
  },

  onShortcutUpdated: (callback) => {
    ipcRenderer.on('shortcut-updated', (event, data) => callback(data));
  },

  onShortcutsInfo: (callback) => {
    ipcRenderer.on('shortcuts-info', (event, data) => callback(data));
  },

  onShortcutNormalRecording: (callback) => {
    ipcRenderer.on('shortcut-normal-recording', () => callback());
  },

  onShortcutInstantReplay: (callback) => {
    ipcRenderer.on('shortcut-instant-replay', () => callback());
  },

  // ===== PASTA =====
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // ===== LIMPEZA =====
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

console.log('✅ Preload carregado corretamente');
