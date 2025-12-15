// --- CONFIGURATION ---
let maxDigits = 4; 

// --- ACTIVATION & STATE ---
let isActivated = false;
let activationKey = "Zaq12wsx"; // User-set Key. TRIPLE-TAP BOTTOM-LEFT TO CHANGE!

// --- MAGIC TRICK STATE ---
let enteredCode = "";
let referenceNumber = 2024; 
let isLocked = true; // Use isLocked to control the temporary lockscreen state

// --- DOM ELEMENTS ---
const activationScreen = document.getElementById('activationScreen');
const activationInput = document.getElementById('activationInput');
const activateBtn = document.getElementById('activateBtn');
const activationError = document.getElementById('activationError');

const lockscreen = document.getElementById('lockscreen');
const homescreen = document.getElementById('homescreen');
const dotsContainer = document.getElementById('dots');
const keypad = document.getElementById('keypad');
const magicResult = document.getElementById('magicResult');
const cancelBtn = document.getElementById('cancelBtn');

const uploadLock = document.getElementById('uploadLock');
const uploadHome = document.getElementById('uploadHome');

// --- INITIALIZATION ---
loadSettings(); 
initializeApp();
initKeypad();
renderDots();

// --- ACTIVATION FLOW ---

function initializeApp() {
    if (isActivated) {
        unlockPermanently();
    } else {
        showActivationScreen();
    }
}

function showActivationScreen() {
    activationScreen.style.opacity = 1;
    activationScreen.style.pointerEvents = 'auto';
    activationInput.focus();
    
    // Wire up button and enter key
    activateBtn.addEventListener('click', handleActivationAttempt);
    activationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleActivationAttempt();
    });
}

function handleActivationAttempt() {
    const input = activationInput.value.trim();
    if (input === activationKey) {
        isActivated = true;
        saveSettings(); // Save the permanent unlock state
        unlockPermanently();
    } else {
        activationError.textContent = "Invalid Key";
        activationError.style.opacity = 1;
        setTimeout(() => activationError.style.opacity = 0, 1500);
        activationInput.value = '';
    }
}

function unlockPermanently() {
    // Hide the activation screen
    activationScreen.style.opacity = 0;
    activationScreen.style.pointerEvents = 'none';

    // Set the main lockscreen to be hidden and unlocked 
    lockscreen.classList.add('permanently-unlocked');
    lockscreen.classList.add('unlocked');
    isLocked = false;
}

// --- MAGIC TRICK LOGIC ---

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

cancelBtn.addEventListener('click', () => {
  enteredCode = "";
  renderDots();
});

function handleInput(digit) {
  if (!isLocked) return;
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
  
  if (enteredCode.length > 0) {
    cancelBtn.classList.add('visible');
    cancelBtn.textContent = enteredCode.length === maxDigits ? 'Done' : 'Delete'; 
  } else {
    cancelBtn.classList.remove('visible');
    cancelBtn.textContent = 'Cancel';
  }
}

function performUnlock() {
  const userNum = parseInt(enteredCode, 10);
  const result = referenceNumber - userNum;

  magicResult.textContent = result;
  
  lockscreen.classList.add('unlocked');
  isLocked = false;

  setTimeout(() => {
    enteredCode = "";
    renderDots();
  }, 500);
}

// Hidden control to SHOW the lock screen (for the trick)
function reLock() {
  if (!isActivated) return; // Only allow relock if app is activated
  
  // Show the lock screen animation
  lockscreen.classList.remove('permanently-unlocked');
  lockscreen.classList.remove('unlocked');

  magicResult.textContent = "";
  enteredCode = "";
  isLocked = true;
  renderDots();
}


// --- CONFIGURATION CONTROLS ---

function setMaxDigits() {
  const input = prompt("Set Passcode Length (4 or 6):", maxDigits);
  if (input) {
    const num = parseInt(input, 10);
    if (num === 4 || num === 6) {
      maxDigits = num;
      enteredCode = ""; 
      saveSettings();
      renderDots();
      alert(`Passcode length set to ${maxDigits} digits.`);
    } else {
      alert("Invalid input. Please enter 4 or 6.");
    }
  }
}

// Set the Master Activation Key
function setActivationKey() {
    const input = prompt("SET NEW MASTER ACTIVATION KEY:", activationKey);
    if (input && input.trim() !== "") {
        activationKey = input.trim();
        saveSettings();
        alert(`Master Key updated to: ${activationKey}`);
    } else {
        alert("Activation Key not changed.");
    }
}


// --- STORAGE & SETTINGS ---

function saveSettings() {
  localStorage.setItem('magicRefNum', referenceNumber);
  localStorage.setItem('maxDigits', maxDigits); 
  // Save the activation state and key
  localStorage.setItem('isActivated', isActivated ? 'true' : 'false');
  localStorage.setItem('activationKey', activationKey); 
}

function saveImage(key, dataUrl) {
  try {
    localStorage.setItem(key, dataUrl);
  } catch (e) {
    alert("Image too large to save! Try a screenshot or smaller image.");
  }
}

function loadSettings() {
  const savedRef = localStorage.getItem('magicRefNum');
  if (savedRef) referenceNumber = parseInt(savedRef, 10);
  
  const savedMaxDigits = localStorage.getItem('maxDigits');
  if (savedMaxDigits) maxDigits = parseInt(savedMaxDigits, 10);
  
  // Load activation state and key
  isActivated = localStorage.getItem('isActivated') === 'true';
  const savedActivationKey = localStorage.getItem('activationKey');
  if (savedActivationKey) activationKey = savedActivationKey;


  const savedLock = localStorage.getItem('bgLock');
  if (savedLock) lockscreen.style.backgroundImage = `url('${savedLock}')`;

  const savedHome = localStorage.getItem('bgHome');
  if (savedHome) homescreen.style.backgroundImage = `url('${savedHome}')`;
}


// --- INVISIBLE CONTROLS ---

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
createTouchZone(window.innerWidth / 2 - 100, 0, 200, 100, setMaxDigits, 3);

// **CONTROL** 4. Triple Tap Bottom-Left: Set Activation Key
createTouchZone(0, window.innerHeight - 100, 100, 100, setActivationKey, 3);

// 5. Triple Tap Bottom-Right: Relock Screen (Brings back the magic lock)
createTouchZone(window.innerWidth - 100, window.innerHeight - 100, 100, 100, reLock, 3);


// 6. Two-Finger Swipe: Set Reference Number (Vertical swipe detection)
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
        saveSettings(); 
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
