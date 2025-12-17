// --- CONFIGURATION ---
let maxDigits = 6; 
let referenceNumber = 4050; 
let forcedErrors = 0; 
let notesMode = false;
let spectatorName = "Someone";

// --- STATE ---
let enteredCode = "";
let isUnlocked = false;
let currentErrors = 0; 

// --- DOM ELEMENTS ---
const lockscreen = document.getElementById('lockscreen');
const homescreen = document.getElementById('homescreen');
const panel = document.getElementById('panel'); 
const dotsContainer = document.getElementById('dots');
const keypad = document.getElementById('keypad');
const magicResult = document.getElementById('magicResult');
const notesContent = document.getElementById('notesContent');
const cancelFooterBtn = document.getElementById('cancelFooterBtn');
const emergencyBtn = document.getElementById('emergencyBtn');

// Dialer Elements
const dialerScreen = document.getElementById('dialerScreen');
const dialerDisplay = document.getElementById('dialerDisplay');
const dialerKeypad = document.getElementById('dialerKeypad');

// Upload Inputs
const uploadLock = document.getElementById('uploadLock');
const uploadHome = document.getElementById('uploadHome');

// Settings Elements
const settingsOverlay = document.getElementById('settingsOverlay');
const refInput = document.getElementById('refInput');
const lenInput = document.getElementById('lenInput');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const notesToggle = document.getElementById('notesToggle');
const nameInputRow = document.getElementById('nameInputRow');
const spectatorNameInput = document.getElementById('spectatorName');

// --- INITIALIZATION ---
loadSettings(); 
initLockKeypad();
initDialerKeypad();
renderDots();

// --- KEYPAD GENERATION (Lockscreen) ---
function initLockKeypad() {
  // Lockscreen keypad: No * or #
  const keys = [
    { n: '1', s: '' }, { n: '2', s: 'ABC' }, { n: '3', s: 'DEF' },
    { n: '4', s: 'GHI' }, { n: '5', s: 'JKL' }, { n: '6', s: 'MNO' },
    { n: '7', s: 'PQRS' }, { n: '8', s: 'TUV' }, { n: '9', s: 'WXYZ' },
    { n: null, s: '' }, { n: '0', s: '' }, { n: null, s: '' }
  ];
  keypad.innerHTML = keys.map(k => {
    if (k.n === null) return `<div class="key empty"></div>`;
    return `<div class="key" data-digit="${k.n}"><div class="key-digit">${k.n}</div><div class="key-sub">${k.s}</div></div>`;
  }).join('');
  attachKeyEvents(keypad, handleLockTap);
}

// --- KEYPAD GENERATION (Emergency Dialer) ---
function initDialerKeypad() {
  // Dialer keypad: Has * and #
  const keys = [
    { n: '1', s: '' }, { n: '2', s: 'ABC' }, { n: '3', s: 'DEF' },
    { n: '4', s: 'GHI' }, { n: '5', s: 'JKL' }, { n: '6', s: 'MNO' },
    { n: '7', s: 'PQRS' }, { n: '8', s: 'TUV' }, { n: '9', s: 'WXYZ' },
    { n: '*', s: '' }, { n: '0', s: '+' }, { n: '#', s: '' }
  ];
  dialerKeypad.innerHTML = keys.map(k => {
    return `<div class="key" data-digit="${k.n}"><div class="key-digit">${k.n}</div><div class="key-sub">${k.s}</div></div>`;
  }).join('');
  attachKeyEvents(dialerKeypad, handleDialerTap);
}

function attachKeyEvents(container, handler) {
  container.querySelectorAll('.key').forEach(key => {
    if (key.classList.contains('empty')) return;
    key.addEventListener('touchstart', (e) => {
      e.preventDefault(); 
      const digit = key.getAttribute('data-digit');
      handler(digit);
      key.classList.add('active');
      setTimeout(() => key.classList.remove('active'), 100);
    }, { passive: false });
    key.addEventListener('click', (e) => {
      const digit = key.getAttribute('data-digit');
      handler(digit);
    });
  });
}

function renderDots() {
  dotsContainer.innerHTML = Array(maxDigits).fill(0).map((_, i) => 
    `<div class="dot ${i < enteredCode.length ? 'filled' : ''}"></div>`
  ).join('');
}

// --- LOGIC ---
function handleLockTap(digit) {
  if (isUnlocked) return;
  if (enteredCode.length < maxDigits) {
    enteredCode += digit;
    renderDots();
    if (enteredCode.length === maxDigits) setTimeout(attemptUnlock, 50);
  }
}

function handleDialerTap(digit) {
  // Just append to the display text
  dialerDisplay.textContent += digit;
}

function attemptUnlock() {
  if (currentErrors < forcedErrors) {
    currentErrors++;
    triggerError();
    return;
  }
  const inputNum = parseInt(enteredCode, 10);
  const result = inputNum - referenceNumber;
  
  // UNLOCK SUCCESS
  if (notesMode) {
    // Hide standard result, show notes
    magicResult.style.display = 'none';
    notesContent.classList.add('active');
    notesContent.textContent = `Today, ${spectatorName} will choose the number ${result}.`;
  } else {
    // Show standard result
    magicResult.style.display = 'block';
    notesContent.classList.remove('active');
    magicResult.textContent = result;
  }
  
  unlock();
}

function triggerError() {
  panel.classList.add('shake');
  if (navigator.vibrate) navigator.vibrate(200);
  setTimeout(() => {
    panel.classList.remove('shake');
    enteredCode = "";
    renderDots();
  }, 500);
}

function unlock() {
  isUnlocked = true;
  lockscreen.classList.add('unlocked');
  enteredCode = ""; // Clear code
  renderDots();
  currentErrors = 0; 
}

function reLock() {
  isUnlocked = false;
  lockscreen.classList.remove('unlocked');
  dialerScreen.classList.remove('active'); // Ensure dialer is closed
  magicResult.textContent = "";
}

// --- EMERGENCY BUTTON ---
emergencyBtn.addEventListener('click', () => {
  // Open Dialer
  dialerScreen.classList.add('active');
  // Pre-fill with what they typed
  dialerDisplay.textContent = enteredCode;
});

// To close dialer, you usually swipe home or cancel. 
// For this app, let's make the "Call" button just close it for now (or nothing).
// Or tapping the top area closes it.
dialerScreen.querySelector('.call-btn').addEventListener('click', () => {
    // Fake call or just close? Let's just vibrate.
    if(navigator.vibrate) navigator.vibrate(50);
});

// Cancel Button on Lockscreen
cancelFooterBtn.addEventListener('click', () => {
  enteredCode = "";
  renderDots();
});

// --- SETTINGS & GESTURES ---
function openSettings() {
  settingsOverlay.classList.add('open');
  refInput.value = referenceNumber;
  lenInput.value = maxDigits;
  notesToggle.checked = notesMode;
  spectatorNameInput.value = spectatorName;
  toggleNameInput();
}
function closeSettings() {
  settingsOverlay.classList.remove('open');
  saveSettings();
}
closeSettingsBtn.addEventListener('click', closeSettings);

// Toggle UI Logic
notesToggle.addEventListener('change', () => {
    notesMode = notesToggle.checked;
    toggleNameInput();
});
function toggleNameInput() {
    nameInputRow.style.display = notesMode ? 'flex' : 'none';
}

// Data Binding
refInput.addEventListener('input', (e) => referenceNumber = parseInt(e.target.value) || 0);
lenInput.addEventListener('input', (e) => {
    let val = parseInt(e.target.value);
    if(val === 4 || val === 6) maxDigits = val;
});
spectatorNameInput.addEventListener('input', (e) => spectatorName = e.target.value);

// Gesture: Double Tap Top Corners (Uploads)
let topTapCount = 0; let topTapTimer = null;
document.addEventListener('click', (e) => {
  if (e.clientY > 100) return; 
  topTapCount++;
  if (topTapTimer) clearTimeout(topTapTimer);
  topTapTimer = setTimeout(() => { topTapCount = 0; }, 300);
  if (topTapCount === 2) {
    const width = window.innerWidth;
    if (e.clientX < width * 0.3) uploadLock.click();
    else if (e.clientX > width * 0.7) uploadHome.click();
  }
});

// Gesture: Two Finger Swipe Down (Menu)
let twoFingerStart = null;
window.addEventListener('touchstart', (e) => { if (e.touches.length === 2) twoFingerStart = e.touches[0].clientY; }, {passive: false});
window.addEventListener('touchend', (e) => {
  if (twoFingerStart !== null) {
    if ((e.changedTouches[0].clientY - twoFingerStart) > 50) openSettings();
    twoFingerStart = null;
  }
}, {passive: false});

// Gesture: Triple Tap Bottom to ReLock
let bottomTapCount = 0; let bottomTapTimer = null;
document.addEventListener('click', (e) => {
  if (!isUnlocked) return;
  if (e.clientY > window.innerHeight - 150) {
    bottomTapCount++;
    if (bottomTapTimer) clearTimeout(bottomTapTimer);
    bottomTapTimer = setTimeout(() => { bottomTapCount = 0; }, 400);
    if (bottomTapCount === 3) reLock();
  }
});

// --- SAVE / LOAD ---
function saveSettings() {
  localStorage.setItem('magicRefNum', referenceNumber);
  localStorage.setItem('maxDigits', maxDigits); 
  localStorage.setItem('notesMode', notesMode);
  localStorage.setItem('spectatorName', spectatorName);
}
function loadSettings() {
  const savedRef = localStorage.getItem('magicRefNum'); if (savedRef) referenceNumber = parseInt(savedRef, 10);
  const savedMaxDigits = localStorage.getItem('maxDigits'); if (savedMaxDigits) maxDigits = parseInt(savedMaxDigits, 10);
  
  const savedNotes = localStorage.getItem('notesMode'); 
  if (savedNotes !== null) notesMode = (savedNotes === 'true');
  
  const savedName = localStorage.getItem('spectatorName'); if (savedName) spectatorName = savedName;

  const savedLock = localStorage.getItem('bgLock'); if (savedLock) lockscreen.style.backgroundImage = `url('${savedLock}')`;
  const savedHome = localStorage.getItem('bgHome'); if (savedHome) homescreen.style.backgroundImage = `url('${savedHome}')`;
}

// Image Handling
function saveImage(key, dataUrl) { try { localStorage.setItem(key, dataUrl); } catch (e) { alert("Image too large!"); } }
uploadLock.addEventListener('change', (e) => {
  const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (evt) => { lockscreen.style.backgroundImage = `url('${evt.target.result}')`; saveImage('bgLock', evt.target.result); }; reader.readAsDataURL(file); }
});
uploadHome.addEventListener('change', (e) => {
  const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (evt) => { homescreen.style.backgroundImage = `url('${evt.target.result}')`; saveImage('bgHome', evt.target.result); }; reader.readAsDataURL(file); }
});
