// Otimizado para 60 FPS real

(function() {

    let mediaRecorder = null;
    let recordedChunks = [];

    console.log('📹 Módulo Recorder inicializando...');

    setTimeout(() => {
        if (window.UI) {
            setupRecorderListeners();
        } else {
            console.error('❌ UI não disponível para Recorder');
        }
    }, 200);

    function setupRecorderListeners() {
        console.log('📹 Configurando listeners do Recorder...');
        
        window.UI.startBtn.addEventListener('click', async () => {
            console.log('[RECORDER] Iniciando gravação 60 FPS...');
            
            if (!window.State.stream) {
                const success = await window.setupScreen();
                if (!success) return;
            }

            const videoTrack = window.State.stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            
            let options;
            
            if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
                options = {
                    mimeType: 'video/webm; codecs=vp9',
                    videoBitsPerSecond: 20000000
                };
            } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp8')) {
                options = {
                    mimeType: 'video/webm; codecs=vp8',
                    videoBitsPerSecond: 20000000
                };
            } else {
                options = { videoBitsPerSecond: 20000000 };
            }

            mediaRecorder = new MediaRecorder(window.State.stream, options);
            recordedChunks = [];
            
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) recordedChunks.push(e.data);
            };

            mediaRecorder.onstop = saveRecording;
            mediaRecorder.start();
            
            window.UI.startBtn.disabled = true;
            window.UI.stopBtn.disabled = false;
            
            const fps = settings.frameRate || '??';
            window.updateStatus(`● Gravando (${fps} FPS)`, 'recording');
            window.UI.recordingIndicator.classList.add('active');
            window.startTimer();
        });

        window.UI.stopBtn.addEventListener('click', () => {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                window.UI.stopBtn.disabled = true;
                window.updateStatus('Processando...', 'idle');
                window.UI.recordingIndicator.classList.remove('active');
                window.stopTimer();
            }
        });
    }

    async function saveRecording() {
        console.log('[RECORDER] Salvando gravação...');
        
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const buffer = new Uint8Array(await blob.arrayBuffer());

        const folder = await window.electronAPI.selectFolder();
        if (!folder) {
            window.updateStatus('Salvamento cancelado', 'idle');
            window.UI.startBtn.disabled = false;
            return;
        }

        const date = new Date();
        const fileName = `gameplay-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}.webm`;

        const filePath = `${folder}/${fileName}`;

        try {
            await window.electronAPI.writeFile(filePath, buffer);
            window.updateStatus('✓ Gravação salva!', 'idle');
            recordedChunks = [];
        } catch (err) {
            console.error('[RECORDER] Erro ao salvar:', err);
            window.updateStatus('Erro ao salvar', 'idle');
        }

        window.UI.startBtn.disabled = false;
    }

    console.log('✅ Módulo RECORDER carregado');
})();