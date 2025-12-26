const { app, BrowserWindow, ipcMain, desktopCapturer, globalShortcut, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Performance
app.commandLine.appendSwitch('disable-frame-rate-limit');
app.commandLine.appendSwitch('disable-gpu-vsync');

let mainWindow;
let currentShortcuts = {
  normal: 'F9',
  replay: 'F10'
};

const indexPath = path.join(__dirname, '../renderer/index.html');

// ===== IPC HANDLER (FORA DO createWindow) =====
ipcMain.handle('write-file', async (event, { filePath, buffer }) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, buffer, (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        resizable: true,
        webPreferences: {
            // ✅ CONFIGURAÇÃO SEGURA E CORRETA
            nodeIntegration: false,      // ❌ Desabilitar Node no renderer
            contextIsolation: true,      // ✅ Isolar contextos
            preload: path.join(__dirname, 'preload.js') 
        }
    });

    


    mainWindow.loadFile(indexPath);
    if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
}
 // Dev only

    // Registrar atalhos após página carregar
    mainWindow.webContents.on('did-finish-load', () => {
        registerShortcuts();
        
        // Enviar atalhos atuais para o renderer
        mainWindow.webContents.send('shortcuts-info', currentShortcuts);
        console.log('✅ Atalhos enviados para renderer:', currentShortcuts);
    });

    mainWindow.on('closed', () => {
        globalShortcut.unregisterAll();
        mainWindow = null;
    });
}

// ===== FUNÇÃO PARA REGISTRAR ATALHOS =====
function registerShortcuts() {
    // Limpar atalhos antigos
    globalShortcut.unregisterAll();
    
    // Re-registrar atalho DevTools
    globalShortcut.register('Control+Shift+I', () => {
        if (mainWindow) mainWindow.webContents.openDevTools();
    });
    
    // Registrar atalho de gravação normal
    try {
        globalShortcut.register(currentShortcuts.normal, () => {
            console.log(`🎬 Atalho ${currentShortcuts.normal} pressionado (Normal)`);
            if (mainWindow) {
                mainWindow.webContents.send('shortcut-normal-recording');
            }
        });
        console.log(`✅ Atalho Normal registrado: ${currentShortcuts.normal}`);
    } catch (error) {
        console.error(`❌ Erro ao registrar ${currentShortcuts.normal}:`, error);
    }
    
    // Registrar atalho de instant replay
    try {
        globalShortcut.register(currentShortcuts.replay, () => {
            console.log(`💾 Atalho ${currentShortcuts.replay} pressionado (Replay)`);
            if (mainWindow) {
                mainWindow.webContents.send('shortcut-instant-replay');
            }
        });
        console.log(`✅ Atalho Replay registrado: ${currentShortcuts.replay}`);
    } catch (error) {
        console.error(`❌ Erro ao registrar ${currentShortcuts.replay}:`, error);
    }
}

// ===== IPC HANDLERS =====

// Handler para atualizar atalhos
ipcMain.on('update-shortcut', (event, { type, key }) => {
    console.log(`📥 Recebido pedido para atualizar atalho: ${type} = ${key}`);
    
    // Atualizar atalho
    currentShortcuts[type] = key;
    
    // Re-registrar todos os atalhos
    registerShortcuts();
    
    // Confirmar para o renderer
    event.reply('shortcut-updated', { type, key, success: true });
    
    console.log(`✅ Atalhos atualizados:`, currentShortcuts);
});

// Handler para selecionar pasta
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Selecione a pasta para salvar as gravações'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        console.log('📁 Pasta selecionada:', result.filePaths[0]);
        return result.filePaths[0];
    }
    
    return null;
});

// Handler para obter fontes de vídeo (captura de tela)
ipcMain.handle('get-sources', async () => {
    const sources = await desktopCapturer.getSources({ 
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }
    });
    
    console.log(`📺 ${sources.length} fontes de vídeo encontradas`);
    return sources;
});

// ===== LIFECYCLE =====
app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    globalShortcut.unregisterAll();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// Logs de debug
if (!app.isPackaged) {
    console.log('==========================================');
    console.log('📂 __dirname:', __dirname);
    console.log('📂 Caminho do HTML:', indexPath);
    console.log('📂 Preload:', path.join(__dirname, 'preload.js'));
    console.log('==========================================');
}
