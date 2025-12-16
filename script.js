// --- CONFIGURATION ---
// Changed from const to let, initialized to 4, then overwritten by loadSettings()
let maxDigits = 6; 

// --- STATE ---
let enteredCode = "";
let referenceNumber = 4050; // Default
let isUnlocked = false;

// --- DOM ELEMENTS ---
const lockscreen = document.getElementById('lockscreen');
const homescreen = document.getElementById('homescreen');
const dotsContainer = document.getElementById('dots');
const keypad = document.getElementById('keypad');
const magicResult = document.getElementById('magicResult');
const cancelBtn = document.getElementById('cancelBtn'); // Near-dot button

// NEW: Footer buttons
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

// Ignore click on near-dot button if you want only the footer button to work
cancelBtn.addEventListener('click', () => {
  enteredCode = ""; 
  renderDots();
});

// NEW: Footer Cancel/Delete Button Logic (This is the primary Cancel/Delete button)
if (cancelFooterBtn) {
    cancelFooterBtn.addEventListener('click', () => {
      // Clear the input on tap to perform "Delete/Cancel" action
      enteredCode = ""; 
      renderDots();
    });
}
// NEW: Footer Emergency Button Logic (Example)
if (emergencyBtn) {
    emergencyBtn.addEventListener('click', () => {
      alert("Emergency dialer functionality would go here.");
    });
}

// --- CORE LOGIC ---
function handleInput(digit) {
  if (isUnlocked) return;
  // Uses maxDigits variable
  if (enteredCode.length < maxDigits) { 
    enteredCode += digit;
    renderDots();
    
    // Uses maxDigits variable
    if (enteredCode.length === maxDigits) { 
      performUnlock();
    }
  }
}

function renderDots() {
  dotsContainer.innerHTML = '';
  // Uses maxDigits variable
  for (let i = 0; i < maxDigits; i++) { 
    const dot = document.createElement('div');
    dot.className = 'dot' + (i < enteredCode.length ? ' filled' : '');
    dotsContainer.appendChild(dot);
  }
  
  // 1. Logic for the NEAR-DOT cancel button (Ensure it is visually hidden/ignored)
  cancelBtn.classList.remove('visible'); 
  cancelBtn.textContent = 'Cancel';

  // 2. Logic for the NEW FOOTER button (This handles the "Delete" / "Cancel" text)
  if (cancelFooterBtn) {
    if (enteredCode.length > 0) {
        cancelFooterBtn.textContent = "Delete";
    } else {
        cancelFooterBtn.textContent = "Cancel";
    }
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

// --- NEW FUNCTION: Set Max Digits ---
function setMaxDigits() {
  const input = prompt("Set Passcode Length (4 or 6):", maxDigits);
  if (input) {
    const num = parseInt(input, 10);
    if (num === 4 || num === 6) {
      maxDigits = num;
      // Clear entered code when changing length to prevent issues
      enteredCode = ""; 
      saveSettings(); // Save new setting
      renderDots();
      // Optional visual feedback
      alert(`Passcode length set to ${maxDigits} digits. Refreshing display.`);
    } else {
      alert("Invalid input. Please enter 4 or 6.");
    }
  }
}

// --- STORAGE & SETTINGS ---

function saveSettings() {
  localStorage.setItem('magicRefNum', referenceNumber);
  // NEW: Save the max digit count
  localStorage.setItem('maxDigits', maxDigits); 
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
  
  // NEW: Load max digit count
  const savedMaxDigits = localStorage.getItem('maxDigits');
  if (savedMaxDigits) maxDigits = parseInt(savedMaxDigits, 10);

  // Load Images
  const savedLock = localStorage.getItem('bgLock');
  if (savedLock) lockscreen.style.backgroundImage = `url('${savedLock}')`;

  const savedHome = localStorage.getItem('bgHome');
  if (savedHome) homescreen.style.backgroundImage = `url('${savedHome}')`;
}


// --- INVISIBLE CONTROLS (UPDATED FOR ROBUST TAPPING) ---

// Helper updated for robust tapping (longer timeout)
function createTouchZone(x, y, w, h, callback, requiredTaps = 2) {
  let tapCount = 0;
  let tapTimer = null;
  
  window.addEventListener('touchend', (e) => {
    // Only process single touch events in this zone handler
    if (e.touches.length > 0) return;
    
    const touch = e.changedTouches[0];
    
    // Check if the tap originated in the defined zone
    if (touch.clientX >= x && touch.clientX <= x + w &&
        touch.clientY >= y && touch.clientY <= y + h) {
      
      tapCount++;
      if (tapTimer) clearTimeout(tapTimer);
      
      // Increased tap window to 500ms for better usability
      tapTimer = setTimeout(() => { tapCount = 0; }, 500); 
      
      if (tapCount === requiredTaps) {
        // Prevent default tap behavior (like synthetic click)
        e.preventDefault(); 
        callback();
        tapCount = 0; 
        clearTimeout(tapTimer);
      }
    }
  }, {passive: false}); 
}


// 1. Double Tap Top-Left: Upload LOCK BG
createTouchZone(0, 0, 100, 100, () => uploadLock.click(), 2);

// 2. Double Tap Top-Right: Upload HOME BG
createTouchZone(window.innerWidth - 100, 0, 100, 100, () => uploadHome.click(), 2);

// 3. Triple Tap Top-Center: Set Max Digits
// Width 200px, 100px down from the top.
createTouchZone(window.innerWidth / 2 - 100, 0, 200, 100, setMaxDigits, 3);

// 4. Triple Tap Bottom-Center (on Homescreen): Re-Lock (Uses standard click listener)
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

// 5. Two-Finger Swipe: Set Reference Number (Vertical swipe detection)
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
