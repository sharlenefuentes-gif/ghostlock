// --- CONFIGURATION ---
let maxDigits = 6; 
let referenceNumber = 4050; 
let forcedErrors = 0; 

// --- STATE ---
let enteredCode = "";
let isUnlocked = false;
let currentErrors = 0; 
let failedAttempts = []; 

// --- DOM ELEMENTS ---
const lockscreen = document.getElementById('lockscreen');
const homescreen = document.getElementById('homescreen');
const panel = document.getElementById('panel'); 
const promptText = document.getElementById('promptText');
const dotsContainer = document.getElementById('dots');
const keypad = document.getElementById('keypad');
const magicResult = document.getElementById('magicResult');
const historyResult = document.getElementById('historyResult'); 
const emergencyBtn = document.getElementById('emergencyBtn');
const cancelFooterBtn = document.getElementById('cancelFooterBtn');

// Upload Inputs
const uploadLock = document.getElementById('uploadLock');
const uploadHome = document.getElementById('uploadHome');

// Settings Elements
const settingsOverlay = document.getElementById('settingsOverlay');
const refInput = document.getElementById('refInput');
const errorCountDisplay = document.getElementById('errorCountDisplay');
const decErrors = document.getElementById('decErrors');
const incErrors = document.getElementById('incErrors');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');

// --- INITIALIZATION ---
loadSettings(); 
initKeypad();
renderDots();

// --- KEYPAD GENERATION ---
function initKeypad() {
  const keys = [
    { n: '1', s: '' }, { n: '2', s: 'ABC' }, { n: '3', s: 'DEF' },
    { n: '4', s: 'GHI' }, { n: '5', s: 'JKL' }, { n: '6', s: 'MNO' },
    { n: '7', s: 'PQRS' }, { n: '8', s: 'TUV' }, { n: '9', s: 'WXYZ' },
    { n: '', s: '' }, { n: '0', s: '' }, { n: '⌫', s: '' }
  ];

  keys.forEach(k => {
    const btn = document.createElement('div');
    if (k.n === '') {
      btn.className = 'key empty';
    } else if (k.n === '⌫') {
      btn.className = 'key empty'; 
    } else {
      btn.className = 'key';
      btn.innerHTML =
        `<span class="key-digit">${k.n}</span>` +
        (k.s ? `<span class="key-sub">${k.s}</span>` : '');
      
      // Haptics on touch start
      btn.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        triggerHaptic('light');
        handleInput(k.n); 
      });

      // Mouse fallback
      btn.addEventListener('click', () => {
        handleInput(k.n);
      });
    }
    keypad.appendChild(btn);
  });
}

// --- HAPTICS ---
function triggerHaptic(type) {
  if (!navigator.vibrate) return;
  if (type === 'light') {
    navigator.vibrate(15);
  } else if (type === 'error') {
    navigator.vibrate([50, 30, 50, 30, 50]);
  }
}

// --- FOOTER BUTTONS ---
if (cancelFooterBtn) {
  cancelFooterBtn.addEventListener('click', () => {
    triggerHaptic('light');
    enteredCode = ""; 
    renderDots();
  });
}

if (emergencyBtn) {
  emergencyBtn.addEventListener('click', () => {
    alert("Emergency call logic.");
  });
}

// --- CORE LOGIC ---
function handleInput(digit) {
  if (isUnlocked) return;
  if (enteredCode.length < maxDigits) { 
    enteredCode += digit;
    renderDots();
    if (enteredCode.length === maxDigits) {
      setTimeout(attemptUnlock, 150);
    }
  }
}

function attemptUnlock() {
  if (currentErrors < forcedErrors) {
    triggerHaptic('error');
    failedAttempts.push(enteredCode);
    panel.classList.add('shake');
    currentErrors++;

    setTimeout(() => {
      enteredCode = "";
      renderDots();
      panel.classList.remove('shake');
    }, 500);
  } else {
    performUnlock();
  }
}

function renderDots() {
  dotsContainer.innerHTML = '';
  for (let i = 0; i < maxDigits; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i < enteredCode.length ? ' filled' : '');
    dotsContainer.appendChild(dot);
  }

  if (cancelFooterBtn) {
    cancelFooterBtn.textContent =
      enteredCode.length > 0 ? "Delete" : "Cancel";
  }
}

function performUnlock() {
  const userNum = parseInt(enteredCode, 10);
  const result = referenceNumber - userNum;

  magicResult.textContent = result;
  historyResult.textContent =
    failedAttempts.length ? failedAttempts.join('\n') : "";

  isUnlocked = true;
  lockscreen.classList.add('unlocked');

  setTimeout(() => {
    enteredCode = "";
    currentErrors = 0; 
    failedAttempts = [];
    renderDots();
  }, 500);
}

function reLock() {
  isUnlocked = false;
  lockscreen.classList.remove('unlocked');
  magicResult.textContent = "";
  historyResult.textContent = "";
  enteredCode = "";
  renderDots();
}

// --- SETTINGS ---
function openSettings() {
  refInput.value = referenceNumber;
  errorCountDisplay.textContent = forcedErrors;
  settingsOverlay.classList.add('visible');
}

function closeSettings() {
  if (refInput.value) {
    referenceNumber = parseInt(refInput.value, 10);
  }
  saveSettings();
  settingsOverlay.classList.remove('visible');
}

decErrors.addEventListener('click', () => {
  if (forcedErrors > 0) {
    forcedErrors--;
    errorCountDisplay.textContent = forcedErrors;
  }
});
incErrors.addEventListener('click', () => {
  if (forcedErrors < 10) {
    forcedErrors++;
    errorCountDisplay.textContent = forcedErrors;
  }
});

closeSettingsBtn.addEventListener('click', closeSettings);

// --- STORAGE ---
function saveSettings() {
  localStorage.setItem('magicRefNum', referenceNumber);
  localStorage.setItem('maxDigits', maxDigits); 
  localStorage.setItem('forcedErrors', forcedErrors);
}

function saveImage(key, dataUrl) {
  try { localStorage.setItem(key, dataUrl); }
  catch { alert("Image too big."); }
}

function loadSettings() {
  const savedRef = localStorage.getItem('magicRefNum');
  if (savedRef) referenceNumber = parseInt(savedRef, 10);

  const savedMax = localStorage.getItem('maxDigits');
  if (savedMax) maxDigits = parseInt(savedMax, 10);

  const savedErrors = localStorage.getItem('forcedErrors');
  if (savedErrors) forcedErrors = parseInt(savedErrors, 10);

  const savedLock = localStorage.getItem('bgLock');
  if (savedLock) lockscreen.style.backgroundImage = `url('${savedLock}')`;

  const savedHome = localStorage.getItem('bgHome');
  if (savedHome) homescreen.style.backgroundImage = `url('${savedHome}')`;
}

// --- TOUCH ZONES & GESTURES ---
function createTouchZone(x, y, w, h, callback, requiredTaps = 2) {
  let tapCount = 0;
  let tapTimer = null;
  window.addEventListener('touchend', (e) => {
    if (e.touches.length > 0) return;
    const t = e.changedTouches[0];
    if (t.clientX >= x && t.clientX <= x + w &&
        t.clientY >= y && t.clientY <= y + h) {
      tapCount++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => tapCount = 0, 500);
      if (tapCount === requiredTaps) {
        e.preventDefault();
        callback();
        tapCount = 0;
      }
    }
  }, { passive: false });
}

createTouchZone(0, 0, 100, 100, () => uploadLock.click(), 2);
createTouchZone(window.innerWidth - 100, 0, 100, 100, () => uploadHome.click(), 2);
createTouchZone(window.innerWidth / 2 - 100, 0, 200, 100, setMaxDigits, 3);

function setMaxDigits() {
  const input = prompt("Set Passcode Length (4 or 6):", maxDigits);
  const num = parseInt(input, 10);
  if (num === 4 || num === 6) {
    maxDigits = num;
    enteredCode = "";
    saveSettings();
    renderDots();
  }
}

// Re-lock
let bottomTapCount = 0;
let bottomTapTimer = null;
document.addEventListener('click', (e) => {
  if (!isUnlocked) return;
  if (e.clientY > window.innerHeight - 150) {
    bottomTapCount++;
    clearTimeout(bottomTapTimer);
    bottomTapTimer = setTimeout(() => bottomTapCount = 0, 400);
    if (bottomTapCount === 3) reLock();
  }
});

// Two-finger swipe
let twoFingerStart = null;
window.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) twoFingerStart = e.touches[0].clientY;
}, { passive: false });

window.addEventListener('touchend', (e) => {
  if (twoFingerStart !== null) {
    const endY = e.changedTouches[0].clientY;
    if (Math.abs(endY - twoFingerStart) > 50) openSettings();
    twoFingerStart = null;
  }
}, { passive: false });

// Upload handlers
uploadLock.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    lockscreen.style.backgroundImage = `url('${evt.target.result}')`;
    saveImage('bgLock', evt.target.result);
  };
  reader.readAsDataURL(file);
});

uploadHome.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    homescreen.style.backgroundImage = `url('${evt.target.result}')`;
    saveImage('bgHome', evt.target.result);
  };
  reader.readAsDataURL(file);
});
