// ========== MÓDULO DE INSTANT REPLAY ==========
// Responsável pelo buffer circular e captura de replays

(function() {

    let replayRecorder = null;
    let replayBuffer = [];
    let replayDuration = 60;
    let isReplayActive = false;

    console.log('🎮 Módulo Replay inicializado');

    setTimeout(() => {
        setupReplayListeners();
    }, 100);

    function setupReplayListeners() {
        const timeBtns = document.querySelectorAll('.time-btn');
        const captureBtn = document.getElementById('captureBtn');
        
        timeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();

                timeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                replayDuration = parseInt(btn.dataset.time) * 60;

                if (isReplayActive) {
                    stopReplayBuffer();
                    setTimeout(startReplayBuffer, 100);
                }
            });
        });
        
        if (captureBtn) {
            captureBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await captureReplay();
            });
        }
    }

    async function startReplayBuffer() {
        if (!window.State.stream) {
            const success = await window.setupScreen();
            if (!success) return;
        }

        if (replayRecorder && replayRecorder.state !== 'inactive') {
            replayRecorder.stop();
            await new Promise(r => setTimeout(r, 100));
        }

        let options;
        if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
            options = { mimeType: 'video/webm; codecs=vp9', videoBitsPerSecond: 10000000 };
        } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp8')) {
            options = { mimeType: 'video/webm; codecs=vp8', videoBitsPerSecond: 10000000 };
        } else {
            options = { videoBitsPerSecond: 10000000 };
        }

        replayRecorder = new MediaRecorder(window.State.stream, options);
        replayBuffer = [];

        replayRecorder.ondataavailable = (e) => {
            if (e.data?.size) {
                replayBuffer.push({ data: e.data, timestamp: Date.now() });
                const cutoff = Date.now() - replayDuration * 1000;
                replayBuffer = replayBuffer.filter(c => c.timestamp > cutoff);
            }
        };

        replayRecorder.start(500);
        isReplayActive = true;

        window.updateStatus(`🔄 Buffer: ${replayDuration / 60} min`, 'recording');
    }

    function stopReplayBuffer() {
        if (replayRecorder && replayRecorder.state !== 'inactive') {
            replayRecorder.stop();
        }
        replayRecorder = null;
        replayBuffer = [];
        isReplayActive = false;
    }

    async function captureReplay() {
        if (replayBuffer.length < 5) {
            window.updateStatus('⚠️ Buffer insuficiente', 'idle');
            return;
        }

        window.updateStatus('💾 Salvando replay...', 'idle');

        try {
            const chunks = replayBuffer.map(c => c.data);
            const blob = new Blob(chunks, { type: 'video/webm' });
            const buffer = new Uint8Array(await blob.arrayBuffer());

            const folder = await window.electronAPI.selectFolder();
            if (!folder) return;

            const date = new Date();
            const fileName =
                `replay-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-` +
                `${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}` +
                `${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}.webm`;

            const filePath = `${folder}/${fileName}`;

            await window.electronAPI.writeFile(filePath, buffer);

            window.updateStatus('✅ Replay salvo!', 'recording');
        } catch (err) {
            console.error(err);
            window.updateStatus('❌ Erro ao salvar replay', 'idle');
        }
    }

    window.addEventListener('replayModeEnabled', startReplayBuffer);
    window.addEventListener('replayModeDisabled', () => {
        stopReplayBuffer();
        window.updateStatus('Pronto', 'idle');
    });

    console.log('✅ Módulo REPLAY carregado');
})();
