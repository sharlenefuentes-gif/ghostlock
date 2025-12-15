// --- CONFIGURATION ---
const MAX_DIGITS = 4;
const DISPLAY_DURATION = 10000; // Result stays for 10 seconds (or until re-lock)

// --- STATE ---
let enteredCode = "";
let referenceNumber = 2024; // Default Reference (Change this via Swipe)
let isUnlocked = false;

// --- DOM ELEMENTS ---
const lockscreen = document.getElementById('lockscreen');
const homescreen = document.getElementById('homescreen');
const dotsContainer = document.getElementById('dots');
const keypad = document.getElementById('keypad');
const magicResult = document.getElementById('magicResult');

// Upload Inputs
const uploadLock = document.getElementById('uploadLock');
const uploadHome = document.getElementById('uploadHome');

// --- INITIALIZATION ---
initKeypad();
renderDots();

// --- KEYPAD GENERATION ---
function initKeypad() {
  const keys = [
    { n: '1', s: '' }, { n: '2', s: 'ABC' }, { n: '3', s: 'DEF' },
    { n: '4', s: 'GHI' }, { n: '5', s: 'JKL' }, { n: '6', s: 'MNO' },
    { n: '7', s: 'PQRS' }, { n: '8', s: 'TUV' }, { n: '9', s: 'WXYZ' },
    { n: '', s: '' }, { n: '0', s: '' }, { n: '⌫', s: '' } // Left blank, 0, Delete
  ];

  keys.forEach(k => {
    const btn = document.createElement('div');
    if (k.n === '') {
      // Empty bottom left slot
      btn.className = 'key empty';
    } else if (k.n === '⌫') {
      // Backspace logic (visual only if you want, usually hidden text "Cancel" on iOS)
      btn.className = 'key empty'; // Making visually empty but clickable for "Cancel" or hidden backspace
      btn.innerHTML = `<span class="key-sub" style="font-size:16px; font-weight:400">Cancel</span>`;
      btn.style.pointerEvents = 'auto';
      btn.addEventListener('click', () => {
        enteredCode = ""; 
        renderDots();
      });
    } else {
      // Number Keys
      btn.className = 'key';
      btn.innerHTML = `<span class="key-digit">${k.n}</span>` + 
                      (k.s ? `<span class="key-sub">${k.s}</span>` : '');
      
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(k.n); });
      btn.addEventListener('click', () => handleInput(k.n));
    }
    keypad.appendChild(btn);
  });
}

// --- CORE LOGIC ---
function handleInput(digit) {
  if (isUnlocked) return;
  if (enteredCode.length < MAX_DIGITS) {
    enteredCode += digit;
    renderDots();
    
    // Check if full
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
}

function performUnlock() {
  // 1. Calculate Magic Number
  // Logic: Reference (My Input) - Entered (User Input)
  const userNum = parseInt(enteredCode, 10);
  const result = referenceNumber - userNum;

  // 2. Set Result Text
  magicResult.textContent = result;

  // 3. Unlock Animation
  isUnlocked = true;
  lockscreen.classList.add('unlocked');

  // 4. Reset Logic (Optional: Clear code immediately for next time)
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

// --- INVISIBLE CONTROLS & SETTINGS ---

// 1. Double Tap Top-Left: Upload LOCKSCREEN Image
createTouchZone(0, 0, 100, 100, () => uploadLock.click());

// 2. Double Tap Top-Right: Upload HOMESCREEN Image
createTouchZone(window.innerWidth - 100, 0, 100, 100, () => uploadHome.click());

// 3. Triple Tap Bottom-Center (on Homescreen): Re-Lock
// We attach this to document but check if unlocked
let bottomTapCount = 0;
let bottomTapTimer = null;
document.addEventListener('click', (e) => {
  if (!isUnlocked) return;
  if (e.clientY > window.innerHeight - 100) {
    bottomTapCount++;
    if (bottomTapTimer) clearTimeout(bottomTapTimer);
    bottomTapTimer = setTimeout(() => { bottomTapCount = 0; }, 400);
    if (bottomTapCount === 3) reLock();
  }
});

// 4. Two-Finger Swipe Down: Set Reference Number
let touchStartY = 0;
document.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    touchStartY = e.touches[0].clientY;
  }
});

document.addEventListener('touchend', (e) => {
  if (e.changedTouches.length === 1 || e.changedTouches.length === 2) {
     // Simple check if it was a 2 finger gesture ending
     // A robust app might need more complex gesture tracking, 
     // but this usually works for personal tools.
  }
});

// Simpler Gesture: Long Press on the "0" key (hidden feature)
// Or use the provided 2-finger swipe logic:
let twoFingerStart = null;
window.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    twoFingerStart = e.touches[0].clientY;
  }
});
window.addEventListener('touchend', (e) => {
  if (twoFingerStart !== null && e.changedTouches.length > 0) {
    const endY = e.changedTouches[0].clientY;
    if (Math.abs(endY - twoFingerStart) > 50) {
      // Trigger Input
      const newRef = prompt("Set Reference Number:", referenceNumber);
      if (newRef) referenceNumber = parseInt(newRef, 10);
    }
    twoFingerStart = null;
  }
});


// --- FILE HANDLERS ---
uploadLock.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      lockscreen.style.backgroundImage = `url('${evt.target.result}')`;
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
  // Mouse support for desktop testing
  window.addEventListener('dblclick', (e) => {
    if (e.clientX >= x && e.clientX <= x + w &&
        e.clientY >= y && e.clientY <= y + h) {
      callback();
    }
  });
}
