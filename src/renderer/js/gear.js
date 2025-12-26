// ===== USAR API DO PRELOAD =====


// ===== ESTADO GLOBAL =====
let activeTab = 'shortcuts';
let isListening = false;
let currentBinding = null;

let shortcuts = {
  normal: 'F9',
  replay: 'F10'
};

let savePath = 'C:\\Users\\Videos\\Gravações';

// ===== ELEMENTOS =====
const gearBtn = document.getElementById('btn-config');
const settingsPanel = document.getElementById('settingsPanel');
const closeBtn = document.querySelector('.close-btn');

const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.tab-content');

const normalValue = document.getElementById('normalValue');
const replayValue = document.getElementById('replayValue');
const bindNormalBtn = document.getElementById('bindNormal');
const bindReplayBtn = document.getElementById('bindReplay');
const warning = document.getElementById('shortcutWarning');

const savePathInput = document.getElementById('savePath');
const selectFolderBtn = document.getElementById('selectFolder');

// ===== ABRIR/FECHAR PAINEL =====
gearBtn.addEventListener('click', () => {
  settingsPanel.classList.remove('hidden');
  gearBtn.classList.add('hidden');
});

closeBtn.addEventListener('click', () => {
  settingsPanel.classList.add('hidden');
  gearBtn.classList.remove('hidden');
  stopListening();
});

// ===== NAVEGAÇÃO ENTRE TABS =====
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    activeTab = tab.dataset.tab;

    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(activeTab).classList.add('active');
  });
});

// ===== VALIDAÇÃO DE ATALHOS =====
function validateShortcuts() {
  if (shortcuts.normal === shortcuts.replay && shortcuts.normal !== 'Não configurado') {
    warning.classList.remove('hidden');
    return false;
  } else {
    warning.classList.add('hidden');
    return true;
  }
}

// ===== SISTEMA DE CAPTURA DE TECLAS =====
function startListening(type) {
  if (isListening) return;
  
  isListening = true;
  currentBinding = type;
  
  const btn = type === 'normal' ? bindNormalBtn : bindReplayBtn;
  btn.classList.add('listening');
  btn.textContent = '🎧 Pressione uma tecla...';
  
  // Desabilitar o outro botão
  const otherBtn = type === 'normal' ? bindReplayBtn : bindNormalBtn;
  otherBtn.disabled = true;
  otherBtn.style.opacity = '0.5';
}

function stopListening() {
  if (!isListening) return;
  
  isListening = false;
  currentBinding = null;
  
  bindNormalBtn.classList.remove('listening');
  bindReplayBtn.classList.remove('listening');
  bindNormalBtn.textContent = '🔗 Vincular Tecla';
  bindReplayBtn.textContent = '🔗 Vincular Tecla';
  
  bindNormalBtn.disabled = false;
  bindReplayBtn.disabled = false;
  bindNormalBtn.style.opacity = '1';
  bindReplayBtn.style.opacity = '1';
}

function captureKey(event) {
  if (!isListening) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  let keyName = '';
  
  // Detectar teclas especiais
  if (event.key.startsWith('F') && event.key.length <= 3) {
    keyName = event.key.toUpperCase();
  } else if (event.key === ' ') {
    keyName = 'SPACE';
  } else if (event.key === 'Control') {
    keyName = 'CTRL';
  } else if (event.key === 'Shift') {
    keyName = 'SHIFT';
  } else if (event.key === 'Alt') {
    keyName = 'ALT';
  } else if (event.key === 'Tab') {
    keyName = 'TAB';
  } else if (event.key === 'Enter') {
    keyName = 'ENTER';
  } else if (event.key === 'Escape') {
    keyName = 'ESC';
  } else if (event.key.length === 1) {
    keyName = event.key.toUpperCase();
  } else {
    keyName = event.key.toUpperCase();
  }
  
  // Verificar se já está em uso
  const otherType = currentBinding === 'normal' ? 'replay' : 'normal';
  if (shortcuts[otherType] === keyName) {
    alert('⚠️ Esta tecla já está sendo usada pelo outro modo!');
    stopListening();
    return;
  }
  
  // Salvar a tecla
  shortcuts[currentBinding] = keyName;
  
  // Atualizar display
  if (currentBinding === 'normal') {
    normalValue.textContent = keyName;
  } else {
    replayValue.textContent = keyName;
  }
  
  validateShortcuts();
  stopListening();
  
  // ✅ Notificar o processo principal via API
  electronAPI.updateShortcut(currentBinding, keyName);
  console.log(`✅ Tecla ${keyName} vinculada ao modo ${currentBinding}`);
}

function captureMouseButton(event) {
  if (!isListening) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  let buttonName = '';
  
  switch (event.button) {
    case 0:
      buttonName = 'MOUSE1';
      break;
    case 1:
      buttonName = 'MOUSE3';
      break;
    case 2:
      buttonName = 'MOUSE2';
      break;
    case 3:
      buttonName = 'MOUSE4';
      break;
    case 4:
      buttonName = 'MOUSE5';
      break;
    default:
      buttonName = `MOUSE${event.button + 1}`;
  }
  
  // Verificar se já está em uso
  const otherType = currentBinding === 'normal' ? 'replay' : 'normal';
  if (shortcuts[otherType] === buttonName) {
    alert('⚠️ Este botão já está sendo usado pelo outro modo!');
    stopListening();
    return;
  }
  
  // Salvar o botão
  shortcuts[currentBinding] = buttonName;
  
  // Atualizar display
  if (currentBinding === 'normal') {
    normalValue.textContent = buttonName;
  } else {
    replayValue.textContent = buttonName;
  }
  
  validateShortcuts();
  stopListening();
  
  // ✅ Notificar o processo principal via API
  electronAPI.updateShortcut(currentBinding, buttonName);
  console.log(`✅ Botão ${buttonName} vinculado ao modo ${currentBinding}`);
}

// ===== EVENT LISTENERS PARA CAPTURA =====
document.addEventListener('keydown', captureKey);
document.addEventListener('mousedown', captureMouseButton);

// Prevenir menu de contexto enquanto está escutando
document.addEventListener('contextmenu', (e) => {
  if (isListening) {
    e.preventDefault();
  }
});

// ===== BOTÕES DE VINCULAR =====
bindNormalBtn.addEventListener('click', () => {
  startListening('normal');
});

bindReplayBtn.addEventListener('click', () => {
  startListening('replay');
});

// ===== PASTA DE SALVAMENTO =====
savePathInput.value = savePath;

selectFolderBtn.addEventListener('click', async () => {
  try {
    const result = await electronAPI.selectFolder();
    if (result) {
      savePath = result;
      savePathInput.value = savePath;
      console.log('✅ Pasta atualizada:', savePath);
    }
  } catch (error) {
    console.error('❌ Erro ao selecionar pasta:', error);
  }
});

// ===== LISTENERS DO MAIN PROCESS =====

// Listener para confirmação de atalho atualizado
electronAPI.onShortcutUpdated((data) => {
  console.log('✅ Atalho confirmado pelo main process:', data);
  
  // Mostrar feedback visual
  const btn = data.type === 'normal' ? bindNormalBtn : bindReplayBtn;
  const originalBg = btn.style.background;
  
  btn.textContent = '✅ Salvo!';
  btn.style.background = '#10b981';
  
  setTimeout(() => {
    btn.textContent = '🔗 Vincular Tecla';
    btn.style.background = originalBg;
  }, 1500);
});

// Listener para receber atalhos do main process ao iniciar
electronAPI.onShortcutsInfo((mainShortcuts) => {
  console.log('📥 Atalhos recebidos do main process:', mainShortcuts);
  
  // Sincronizar com os atalhos do main
  if (mainShortcuts.normal) {
    shortcuts.normal = mainShortcuts.normal;
    normalValue.textContent = mainShortcuts.normal;
  }
  
  if (mainShortcuts.replay) {
    shortcuts.replay = mainShortcuts.replay;
    replayValue.textContent = mainShortcuts.replay;
  }
});

// ===== INICIALIZAÇÃO =====
console.log('✅ Sistema de configurações carregado');
console.log('⌨️ Atalhos atuais:', shortcuts);
console.log('✅ IPC listeners do gear.js registrados');

// Atualizar displays iniciais
normalValue.textContent = shortcuts.normal;
replayValue.textContent = shortcuts.replay;