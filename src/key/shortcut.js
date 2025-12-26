// ========== MÓDULO DE ATALHOS DE TECLADO ==========
// Gerencia teclas de atalho para gravação rápida

const { globalShortcut } = require('electron');

class ShortcutManager {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.shortcuts = {
            normalRecording: 'F9',
            instantReplay: 'F7'
        };
    }

    // Registrar todos os atalhos
    registerAll() {
        console.log('⌨️ Registrando atalhos de teclado...');

        // Atalho para Gravação Normal
        const normalSuccess = globalShortcut.register(this.shortcuts.normalRecording, () => {
            console.log('🎬 Atalho pressionado: Gravação Normal');
            this.mainWindow.webContents.send('shortcut-normal-recording');
        });

        // Atalho para Instant Replay
        const replaySuccess = globalShortcut.register(this.shortcuts.instantReplay, () => {
            console.log('💾 Atalho pressionado: Instant Replay');
            this.mainWindow.webContents.send('shortcut-instant-replay');
        });

        if (normalSuccess) {
            console.log('✅ Atalho registrado:', this.shortcuts.normalRecording, '→ Gravação Normal');
        } else {
            console.error('❌ Falha ao registrar atalho de Gravação Normal');
        }

        if (replaySuccess) {
            console.log('✅ Atalho registrado:', this.shortcuts.instantReplay, '→ Instant Replay');
        } else {
            console.error('❌ Falha ao registrar atalho de Instant Replay');
        }

        return normalSuccess && replaySuccess;
    }

    // Desregistrar todos os atalhos
    unregisterAll() {
        globalShortcut.unregisterAll();
        console.log('🔓 Todos os atalhos desregistrados');
    }

    // Verificar se atalhos estão ativos
    isRegistered(shortcut) {
        return globalShortcut.isRegistered(shortcut);
    }

    // Obter lista de atalhos
    getShortcuts() {
        return this.shortcuts;
    }
}

module.exports = ShortcutManager;