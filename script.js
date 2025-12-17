// --- CONFIGURATION ---
let maxDigits = 6; 

// --- STATE ---
let enteredCode = "";
let referenceNumber = 4050; 
let isUnlocked = false;

// --- DOM ELEMENTS ---
const lockscreen = document.getElementById('lockscreen');
const homescreen = document.getElementById('homescreen');
const dotsContainer = document.getElementById('dots');
const keypad = document.getElementById('keypad');
const magicResult = document.getElementById('magicResult');

// Footer buttons
const emergencyBtn = document.getElementById('emergencyBtn');
const cancelFooterBtn = document.getElementById('cancelFooterBtn');

// Upload Inputs
const uploadLock = document.getElementById('uploadLock');
const uploadHome = document.getElementById('uploadHome');

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
    // Bottom Row: Empty, 0, Empty (Removed buttons beside 0)
    { n: null, s: '' }, { n: '0', s: '' }, { n: null, s: '' }
  ];

  keypad.innerHTML = ''; // Clear existing
  keys.forEach(k => {
    const btn = document.createElement('div');
    if (k.n === null) {
      btn.className = 'key empty'; // Pure empty spacer
    } else {
      btn.className = 'key';
      btn.innerHTML = `<span class="key-digit">${k.n}</span>` + 
                      (k.s ? `<span class="key-sub">${k.s}</span>` : '');
      
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(k.n); });
      btn.addEventListener('click', () => handleInput(k.n));
    }
    keypad.appendChild(btn);
  });
}

// Footer Cancel/Delete Button Logic
if (cancelFooterBtn) {
    cancelFooterBtn.addEventListener('click', () => {
      // Clear the input on tap to perform "Delete/Cancel" action
      enteredCode = ""; 
      renderDots();
    });
}
// Footer Emergency Button Logic
if (emergencyBtn) {
    emergencyBtn.addEventListener('click', () => {
      alert("Emergency dialer not configured.");
    });
}

// --- CORE LOGIC ---
function handleInput(digit) {
  if (isUnlocked) return;
  if (enteredCode.length < maxDigits) { 
    enteredCode += digit;
    renderDots();
    if (enteredCode.length === maxDigits) { 
      performUnlock();
    }
  }
}

function renderDots() {
  dotsContainer.innerHTML = '';
  for (let i = 0; i < maxDigits; i++) { 
    const dot = document.createElement('div');
    dot.className = 'dot' + (i < enteredCode.length ? ' filled' : '');
    dotsContainer.appendChild(dot);
  }

  // Logic for the FOOTER button
  if (cancelFooterBtn) {
    if (enteredCode.length > 0) {
        cancelFooterBtn.textContent = "Delete";
    } else {
        cancelFooterBtn.textContent = "Cancel";
    }
  }
}

function performUnlock() {
  const userNum = parseInt(enteredCode, 10);
  const result = referenceNumber - userNum;

  magicResult.textContent = result;
  
  isUnlocked = true;
  lockscreen.classList.add('unlocked');

  setTimeout(() => {
    enteredCode = "";
    renderDots();
  }, 500);
}

function reLock() {
  isUnlocked = false;
  lockscreen.classList.remove('unlocked');
  magicResult.textContent = "";
  enteredCode = "";
  renderDots();
}

// --- SETTINGS (Gestures) ---

// 1. Triple Tap Top-Center: Set Max Digits
function setMaxDigits() {
  const input = prompt("Set Passcode Length (4 or 6):", maxDigits);
  if (input) {
    const num = parseInt(input, 10);
    if (num === 4 || num === 6) {
      maxDigits = num;
      enteredCode = ""; 
      saveSettings();
      renderDots();
      initKeypad(); // Re-init in case
    }
  }
}

// Helper for Robust Tapping
function createTouchZone(x, y, w, h, callback, requiredTaps = 2) {
  let tapCount = 0;
  let tapTimer = null;
  
  window.addEventListener('touchend', (e) => {
    if (e.touches.length > 0) return;
    const touch = e.changedTouches[0];
    if (touch.clientX >= x && touch.clientX <= x + w &&
        touch.clientY >= y && touch.clientY <= y + h) {
      
      tapCount++;
      if (tapTimer) clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { tapCount = 0; }, 500); 
      
      if (tapCount === requiredTaps) {
        e.preventDefault(); 
        callback();
        tapCount = 0; 
      }
    }
  }, {passive: false}); 
}

// Setup Zones
createTouchZone(0, 0, 100, 100, () => uploadLock.click(), 2);
createTouchZone(window.innerWidth - 100, 0, 100, 100, () => uploadHome.click(), 2);
createTouchZone(window.innerWidth / 2 - 100, 0, 200, 100, setMaxDigits, 3);

// 4. Triple Tap Bottom-Center (on Homescreen): Re-Lock
let bottomTapCount = 0;
let bottomTapTimer = null;
document.addEventListener('click', (e) => {
  if (!isUnlocked) return;
  if (e.clientY > window.innerHeight - 150) {
    bottomTapCount++;
    if (bottomTapTimer) clearTimeout(bottomTapTimer);
    bottomTapTimer = setTimeout(() => { bottomTapCount = 0; }, 400);
    if (bottomTapCount === 3) reLock();
  }
});

// 5. Two-Finger Swipe: Set Reference Number
let twoFingerStart = null;
window.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    twoFingerStart = e.touches[0].clientY;
  }
}, {passive: false});

window.addEventListener('touchend', (e) => {
  if (twoFingerStart !== null) {
    const endY = e.changedTouches[0].clientY;
    if (Math.abs(endY - twoFingerStart) > 50) { 
      const input = prompt("Set Reference Number:", referenceNumber);
      if (input) {
        referenceNumber = parseInt(input, 10);
        saveSettings();
      }
    }
    twoFingerStart = null;
  }
}, {passive: false});


// --- STORAGE ---
function saveSettings() {
  localStorage.setItem('magicRefNum', referenceNumber);
  localStorage.setItem('maxDigits', maxDigits); 
}

function saveImage(key, dataUrl) {
  try { localStorage.setItem(key, dataUrl); } catch (e) { alert("Image too large!"); }
}

function loadSettings() {
  const savedRef = localStorage.getItem('magicRefNum');
  if (savedRef) referenceNumber = parseInt(savedRef, 10);
  
  const savedMaxDigits = localStorage.getItem('maxDigits');
  if (savedMaxDigits) maxDigits = parseInt(savedMaxDigits, 10);

  const savedLock = localStorage.getItem('bgLock');
  if (savedLock) lockscreen.style.backgroundImage = `url('${savedLock}')`;

  const savedHome = localStorage.getItem('bgHome');
  if (savedHome) homescreen.style.backgroundImage = `url('${savedHome}')`;
}

// File Handlers
uploadLock.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      lockscreen.style.backgroundImage = `url('${evt.target.result}')`;
      saveImage('bgLock', evt.target.result); 
    };
    reader.readAsDataURL(file);
  }
});

uploadHome.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      homescreen.style.backgroundImage = `url('${evt.target.result}')`;
      saveImage('bgHome', evt.target.result); 
    };
    reader.readAsDataURL(file);
  }
});
