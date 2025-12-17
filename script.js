// --- CONFIGURATION ---
let maxDigits = 6; 
let referenceNumber = 4050; 
let forcedErrors = 0; // Set this to 3 in your settings menu to test the full sequence

// --- STATE ---
let enteredCode = "";
let isUnlocked = false;
let currentErrors = 0; 

// --- DOM ELEMENTS ---
const lockscreen = document.getElementById('lockscreen');
const homescreen = document.getElementById('homescreen');
const panel = document.getElementById('panel'); 
const promptText = document.getElementById('promptText');
const dotsContainer = document.getElementById('dots');
const keypad = document.getElementById('keypad');
const magicResult = document.getElementById('magicResult');     // Bottom Right (Unlock Result)
const historyResult = document.getElementById('historyResult'); // Bottom Left (Error/History)
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

// --- HELPER: ZODIAC CALCULATION ---
function getZodiacSign(day, month) {
  // Validate basic ranges
  if (!day || !month || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const days = [20, 19, 21, 20, 21, 22, 23, 23, 23, 23, 22, 22];
  const signs = ["Capricorn", "Aquarius", "Pisces", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius"];
  
  // Logic: specific cutoff days
  if (month === 1 && day <= 19) return "Capricorn";
  if (month === 12 && day >= 22) return "Capricorn";
  
  // Lookup based on month index (0-11)
  if (day < days[month - 1]) {
    return signs[month - 2];
  } else {
    return signs[month - 1];
  }
}

// --- KEYPAD GENERATION ---
function initKeypad() {
  const keys = [
    { n: '1', s: '' }, { n: '2', s: 'ABC' }, { n: '3', s: 'DEF' },
    { n: '4', s: 'GHI' }, { n: '5', s: 'JKL' }, { n: '6', s: 'MNO' },
    { n: '7', s: 'PQRS' }, { n: '8', s: 'TUV' }, { n: '9', s: 'WXYZ' },
    { n: null, s: '' }, { n: '0', s: '' }, { n: null, s: '' }
  ];

  keypad.innerHTML = keys.map(k => {
    if (k.n === null) return `<div class="key empty"></div>`;
    return `
      <div class="key" onclick="handleTap('${k.n}')">
        <div class="key-digit">${k.n}</div>
        <div class="key-sub">${k.s}</div>
      </div>
    `;
  }).join('');
}

function renderDots() {
  dotsContainer.innerHTML = Array(maxDigits).fill(0).map((_, i) => 
    `<div class="dot ${i < enteredCode.length ? 'filled' : ''}"></div>`
  ).join('');
}

// --- CORE LOGIC ---
function handleTap(digit) {
  if (isUnlocked) return;
  if (enteredCode.length < maxDigits) {
    enteredCode += digit;
    renderDots();
    
    if (enteredCode.length === maxDigits) {
      setTimeout(attemptUnlock, 100);
    }
  }
}

function attemptUnlock() {
  // === ERROR PHASE ===
  if (currentErrors < forcedErrors) {
    currentErrors++;
    
    let revelationText = enteredCode; // Default to PIN

    // 1st Error: Reveal Star Sign (DDMMYY)
    if (currentErrors === 1) {
      // Parse DD (first 2) and MM (next 2)
      const d = parseInt(enteredCode.substring(0, 2), 10);
      const m = parseInt(enteredCode.substring(2, 4), 10);
      
      const sign = getZodiacSign(d, m);
      
      // If valid date, show Sign. If invalid, show PIN.
      if (sign) {
        revelationText = sign;
      }
    } 
    // 2nd, 3rd Error: Reveal PIN (already set as default)

    // Show in Bottom Left
    historyResult.textContent = revelationText;
    historyResult.style.opacity = '1'; 

    triggerError();
    return;
  }

  // === UNLOCK PHASE ===
  const inputNum = parseInt(enteredCode, 10);
  const result = inputNum - referenceNumber;

  // Show Result in Bottom Right
  magicResult.textContent = result;
  
  // Optional: Clear the bottom left history on success? 
  // historyResult.textContent = ""; 
  
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
  enteredCode = "";
  renderDots();
  currentErrors = 0; 
}

function reLock() {
  isUnlocked = false;
  lockscreen.classList.remove('unlocked');
  // Clear displays
  magicResult.textContent = "";
  historyResult.textContent = "";
}

// --- FOOTER BUTTONS ---
if(cancelFooterBtn) {
  cancelFooterBtn.addEventListener('click', () => {
    if (enteredCode.length > 0) {
      enteredCode = "";
      renderDots();
    }
  });
}

// --- SETTINGS LOGIC ---
function openSettings() {
  settingsOverlay.classList.add('open');
  refInput.value = referenceNumber;
  errorCountDisplay.textContent = forcedErrors;
}

function closeSettings() {
  settingsOverlay.classList.remove('open');
  saveSettings();
}

closeSettingsBtn.addEventListener('click', closeSettings);

refInput.addEventListener('input', (e) => {
  referenceNumber = parseInt(e.target.value) || 0;
});

decErrors.addEventListener('click', () => {
  if (forcedErrors > 0) forcedErrors--;
  errorCountDisplay.textContent = forcedErrors;
});

incErrors.addEventListener('click', () => {
  forcedErrors++;
  errorCountDisplay.textContent = forcedErrors;
});

// --- GESTURES ---
// 1. Double Tap (Top Corners)
let topTapCount = 0;
let topTapTimer = null;
document.addEventListener('click', (e) => {
  if (e.clientY > 100) return; 
  topTapCount++;
  if (topTapTimer) clearTimeout(topTapTimer);
  topTapTimer = setTimeout(() => { topTapCount = 0; }, 300);
  
  if (topTapCount === 2) {
    const width = window.innerWidth;
    if (e.clientX < width * 0.3) {
      uploadLock.click();
    } else if (e.clientX > width * 0.7) {
      uploadHome.click();
    }
  }
});

// 2. Triple Tap (Top Center)
let centerTapCount = 0;
let centerTapTimer = null;
document.addEventListener('click', (e) => {
  if (e.clientY > 100) return;
  const width = window.innerWidth;
  if (e.clientX > width * 0.3 && e.clientX < width * 0.7) {
    centerTapCount++;
    if (centerTapTimer) clearTimeout(centerTapTimer);
    centerTapTimer = setTimeout(() => { centerTapCount = 0; }, 300);
    
    if (centerTapCount === 3) {
      maxDigits = (maxDigits === 4) ? 6 : 4;
      enteredCode = "";
      renderDots();
      alert(`Passcode length set to ${maxDigits}`);
      saveSettings();
    }
  }
});

// 3. Triple Tap Bottom (Re-Lock)
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

// 4. Two-Finger Swipe Down
let twoFingerStart = null;
window.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    twoFingerStart = e.touches[0].clientY;
  }
}, {passive: false});

window.addEventListener('touchend', (e) => {
  if (twoFingerStart !== null) {
    const endY = e.changedTouches[0].clientY;
    if ((endY - twoFingerStart) > 50) { 
      openSettings();
    }
    twoFingerStart = null;
  }
}, {passive: false});

// --- STORAGE ---
function saveSettings() {
  localStorage.setItem('magicRefNum', referenceNumber);
  localStorage.setItem('maxDigits', maxDigits); 
  localStorage.setItem('forcedErrors', forcedErrors);
}

function loadSettings() {
  const savedRef = localStorage.getItem('magicRefNum');
  if (savedRef) referenceNumber = parseInt(savedRef, 10);
  
  const savedMaxDigits = localStorage.getItem('maxDigits');
  if (savedMaxDigits) maxDigits = parseInt(savedMaxDigits, 10);

  const savedErrors = localStorage.getItem('forcedErrors');
  if (savedErrors) forcedErrors = parseInt(savedErrors, 10);

  const savedLock = localStorage.getItem('bgLock');
  if (savedLock) lockscreen.style.backgroundImage = `url('${savedLock}')`;

  const savedHome = localStorage.getItem('bgHome');
  if (savedHome) homescreen.style.backgroundImage = `url('${savedHome}')`;
}

function saveImage(key, dataUrl) {
  try { localStorage.setItem(key, dataUrl); } catch (e) { alert("Image too large to save!"); }
}

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
