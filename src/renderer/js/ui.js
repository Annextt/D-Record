// ========== MÓDULO DE UI ==========
// Gerencia todos os elementos da interface e interações básicas




// Elementos DOM
const UI = {
    video: document.getElementById('video'),
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    captureBtn: document.getElementById('captureBtn'),
    statusDiv: document.getElementById('status'),
    recordingIndicator: document.getElementById('recordingIndicator'),
    timerDiv: document.getElementById('timer'),
    replaySettings: document.getElementById('replaySettings'),
    controlsDiv: document.querySelector('.controls'),
    modeBtns: document.querySelectorAll('.mode-btn'),
    timeBtns: document.querySelectorAll('.time-btn'),
    settingsPanel: document.getElementById('settingsPanel'), // ✅ ADICIONADO AQUI
    btnConfig: document.getElementById('btn-config') // ✅ ADICIONADO AQUI
};

// Estado global
const State = {
    isReplayMode: false,
    stream: null,
    timerInterval: null,
    seconds: 0
};

console.log('🎬 UI Elements:', {
    video: !!UI.video,
    startBtn: !!UI.startBtn,
    stopBtn: !!UI.stopBtn,
    captureBtn: !!UI.captureBtn,
    modeBtns: UI.modeBtns.length,
    timeBtns: UI.timeBtns.length,
    settingsPanel: !!UI.settingsPanel,
    btnConfig: !!UI.btnConfig
});

// Configurar tela
async function getMainScreen() {
    try {
        const sources = await electronAPI.getSources();
        console.log('📺 Fontes encontradas:', sources.length);
        const mainScreen = sources.find(source => 
            source.name.includes('Entire') || source.name.includes('Screen')
        );
        return mainScreen || sources[0];
    } catch (error) {
        console.error('❌ Erro ao obter tela:', error);
        return null;
    }
}

async function setupScreen() {
    updateStatus('Preparando captura 60 FPS...', 'idle');
    
    const screen = await getMainScreen();
    
    if (!screen) {
        updateStatus('Erro: Nenhuma tela encontrada', 'idle');
        return false;
    }
    
    try {
        const constraints = {
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: screen.id,
                    minWidth: 1920,
                    maxWidth: 1920,
                    minHeight: 1080,
                    maxHeight: 1080,
                    minFrameRate: 60,
                    maxFrameRate: 60,
                    frameRate: 60
                }
            }
        };

        State.stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        const videoTrack = State.stream.getVideoTracks()[0];
        
        await videoTrack.applyConstraints({
            frameRate: { ideal: 60, min: 60, max: 60 },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        });
        
        const settings = videoTrack.getSettings();
        console.log('📹 Configurações aplicadas:', settings);
        console.log('🎬 FPS detectado:', settings.frameRate || 'não informado');
        console.log('📐 Resolução:', settings.width + 'x' + settings.height);
        
        UI.video.srcObject = State.stream;
        UI.video.play();
        
        const fps = settings.frameRate || '??';
        updateStatus(`Pronto (${fps} FPS)`, 'idle');
        console.log('✅ Stream configurado com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Erro ao capturar tela:', error);
        updateStatus('Erro ao acessar tela', 'idle');
        return false;
    }
}

// Funções de UI
function updateStatus(message, type) {
    UI.statusDiv.textContent = message;
    UI.statusDiv.className = `status ${type}`;
    console.log('📊 Status:', message);
}

function startTimer() {
    State.seconds = 0;
    updateTimerDisplay();
    State.timerInterval = setInterval(() => {
        State.seconds++;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    if (State.timerInterval) {
        clearInterval(State.timerInterval);
        State.timerInterval = null;
        State.seconds = 0;
        updateTimerDisplay();
    }
}

function updateTimerDisplay() {
    const mins = Math.floor(State.seconds / 60);
    const secs = State.seconds % 60;
    UI.timerDiv.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Alternar entre modos
UI.modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        console.log('🔄 Modo selecionado:', btn.dataset.mode);
        
        UI.modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const mode = btn.dataset.mode;
        State.isReplayMode = mode === 'replay';
        
        if (State.isReplayMode) {
            switchToReplayMode();
        } else {
            switchToNormalMode();
        }
    });
});

function switchToReplayMode() {
    console.log('🎮 Mudando para modo Replay');
    UI.replaySettings.style.display = 'block';
    UI.startBtn.style.display = 'none';
    UI.stopBtn.style.display = 'none';
    UI.captureBtn.style.display = 'block';
    UI.controlsDiv.classList.add('replay-mode');
    
    window.dispatchEvent(new CustomEvent('replayModeEnabled'));
}

function switchToNormalMode() {
    console.log('📹 Mudando para modo Normal');
    UI.replaySettings.style.display = 'none';
    UI.startBtn.style.display = 'block';
    UI.stopBtn.style.display = 'block';
    UI.captureBtn.style.display = 'none';
    UI.controlsDiv.classList.remove('replay-mode');
    
    window.dispatchEvent(new CustomEvent('replayModeDisabled'));
}

// ========== ATALHOS DE TECLADO ==========

electronAPI.onShortcutsInfo((shortcuts) => {
    console.log('⌨️ Atalhos disponíveis:', shortcuts);
    
    const isMac = process.platform === 'darwin';
    const normalKey = isMac ? '⌘⇧R' : 'Ctrl+Shift+R';
    const replayKey = isMac ? '⌘⇧S' : 'Ctrl+Shift+S';
    
    console.log(`📌 Gravação Normal: ${normalKey}`);
    console.log(`📌 Instant Replay: ${replayKey}`);
});

electronAPI.onShortcutNormalRecording(() => {
    console.log('🎬 Atalho executado: Gravação Normal');
    
    if (!State.isReplayMode) {
        if (UI.startBtn.disabled === false) {
            UI.startBtn.click();
            console.log('▶️ Gravação Normal iniciada via atalho');
        } else if (UI.stopBtn.disabled === false) {
            UI.stopBtn.click();
            console.log('⏹️ Gravação Normal parada via atalho');
        }
    } else {
        const normalBtn = Array.from(UI.modeBtns).find(btn => btn.dataset.mode === 'normal');
        if (normalBtn) {
            normalBtn.click();
            console.log('🔄 Mudou para modo Normal via atalho');
            
            setTimeout(() => {
                if (UI.startBtn.disabled === false) {
                    UI.startBtn.click();
                }
            }, 300);
        }
    }
});

electronAPI.onShortcutInstantReplay(() => {
    console.log('💾 Atalho executado: Instant Replay');
    
    if (!State.isReplayMode) {
        const replayBtn = Array.from(UI.modeBtns).find(btn => btn.dataset.mode === 'replay');
        if (replayBtn) {
            replayBtn.click();
            console.log('🔄 Mudou para modo Replay via atalho');
        }
    } else {
        if (UI.captureBtn && UI.captureBtn.style.display !== 'none') {
            UI.captureBtn.click();
            console.log('💾 Replay capturado via atalho');
        }
    }
});

console.log('⌨️ Listeners de atalhos registrados');


// Inicializar
setupScreen();

console.log('✅ Módulo UI carregado');

// Exportar para uso global
window.UI = UI;
window.State = State;
window.updateStatus = updateStatus;
window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.setupScreen = setupScreen;