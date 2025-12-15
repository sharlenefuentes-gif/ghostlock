// --- CONFIGURATION ---
const MAX_DIGITS = 4;

// --- STATE ---
let enteredCode = "";
let referenceNumber = 2024; // Default
let isUnlocked = false;

// --- DOM ELEMENTS ---
const lockscreen = document.getElementById('lockscreen');
const homescreen = document.getElementById('homescreen');
const dotsContainer = document.getElementById('dots');
const keypad = document.getElementById('keypad');
const magicResult = document.getElementById('magicResult');
const cancelBtn = document.getElementById('cancelBtn');

// Upload Inputs
const uploadLock = document.getElementById('uploadLock');
const uploadHome = document.getElementById('uploadHome');

// --- INITIALIZATION ---
initKeypad();
loadSettings(); // LOAD SAVED SETTINGS ON START
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
      btn.innerHTML = `<span class="key-digit">${k.n}</span>` + 
                      (k.s ? `<span class="key-sub">${k.s}</span>` : '');
      
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(k.n); });
      btn.addEventListener('click', () => handleInput(k.n));
    }
    keypad.appendChild(btn);
  });
}

// Cancel Button Logic (Resets input)
cancelBtn.addEventListener('click', () => {
  enteredCode = "";
  renderDots();
});

// --- CORE LOGIC ---
function handleInput(digit) {
  if (isUnlocked) return;
  if (enteredCode.length < MAX_DIGITS) {
    enteredCode += digit;
    renderDots();
    
    if (enteredCode.length === MAX_DIGITS) {
      performUnlock();
    }
  }
}

function renderDots() {
  dotsContainer.innerHTML = '';
  for (let i = 0; i < MAX_DIGITS; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i < enteredCode.length ? ' filled' : '');
    dotsContainer.appendChild(dot);
  }
  
  if (enteredCode.length > 0) {
    cancelBtn.classList.add('visible');
    cancelBtn.textContent = enteredCode.length === MAX_DIGITS ? 'Done' : 'Delete';
  } else {
    cancelBtn.classList.remove('visible');
    cancelBtn.textContent = 'Cancel';
  }
}

function performUnlock() {
  // Logic: Reference Number - Entered Number
  const userNum = parseInt(enteredCode, 10);
  const result = referenceNumber - userNum;

  // Show the result
  magicResult.textContent = result;
  
  // Unlock animation
  isUnlocked = true;
  lockscreen.classList.add('unlocked');

  // Reset input after a short delay
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

// --- STORAGE & SETTINGS (PERSISTENCE) ---

function saveSettings() {
  localStorage.setItem('magicRefNum', referenceNumber);
}

function saveImage(key, dataUrl) {
  try {
    localStorage.setItem(key, dataUrl);
  } catch (e) {
    alert("Image too large to save! Try a screenshot or smaller image.");
  }
}

function loadSettings() {
  // Load Reference Number
  const savedRef = localStorage.getItem('magicRefNum');
  if (savedRef) referenceNumber = parseInt(savedRef, 10);

  // Load Images
  const savedLock = localStorage.getItem('bgLock');
  if (savedLock) lockscreen.style.backgroundImage = `url('${savedLock}')`;

  const savedHome = localStorage.getItem('bgHome');
  if (savedHome) homescreen.style.backgroundImage = `url('${savedHome}')`;
}


// --- INVISIBLE CONTROLS ---

// 1. Double Tap Top-Left: Upload LOCKSCREEN
createTouchZone(0, 0, 100, 100, () => uploadLock.click());

// 2. Double Tap Top-Right: Upload HOMESCREEN
createTouchZone(window.innerWidth - 100, 0, 100, 100, () => uploadHome.click());

// 3. Triple Tap Bottom-Center (on Homescreen): Re-Lock
let bottomTapCount = 0;
let bottomTapTimer = null;
document.addEventListener('click', (e) => {
  if (!isUnlocked) return;
  // Detect clicks in the bottom area to prevent accidental triple-tap
  if (e.clientY > window.innerHeight - 150) {
    bottomTapCount++;
    if (bottomTapTimer) clearTimeout(bottomTapTimer);
    bottomTapTimer = setTimeout(() => { bottomTapCount = 0; }, 400);
    if (bottomTapCount === 3) reLock();
  }
});

// 4. Two-Finger Swipe: Set Reference Number (Vertical swipe detection)
let twoFingerStart = null;
window.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    twoFingerStart = e.touches[0].clientY;
  }
}, {passive: false});

window.addEventListener('touchend', (e) => {
  if (twoFingerStart !== null) {
    const endY = e.changedTouches[0].clientY;
    if (Math.abs(endY - twoFingerStart) > 50) { // Check for a vertical swipe of 50px
      const input = prompt("Set Reference Number:", referenceNumber);
      if (input) {
        referenceNumber = parseInt(input, 10);
        saveSettings(); // Save new number immediately
      }
    }
    twoFingerStart = null;
  }
}, {passive: false});


// --- FILE HANDLERS (with Save) ---
uploadLock.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      lockscreen.style.backgroundImage = `url('${data}')`;
      saveImage('bgLock', data); 
    };
    reader.readAsDataURL(file);
  }
});

uploadHome.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      homescreen.style.backgroundImage = `url('${data}')`;
      saveImage('bgHome', data); 
    };
    reader.readAsDataURL(file);
  }
});

// Helper for Invisible Buttons
function createTouchZone(x, y, w, h, callback) {
  let lastTap = 0;
  window.addEventListener('touchend', (e) => {
    const touch = e.changedTouches[0];
    if (touch.clientX >= x && touch.clientX <= x + w &&
        touch.clientY >= y && touch.clientY <= y + h) {
      const now = Date.now();
      if (now - lastTap < 300) {
        callback();
      }
      lastTap = now;
    }
  });
  // Desktop/Testing support
  window.addEventListener('dblclick', (e) => {
    if (e.clientX >= x && e.clientX <= x + w &&
        e.clientY >= y && e.clientY <= y + h) {
      callback();
    }
  });
}
