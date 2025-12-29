// --- CONFIGURATION ---
let maxDigits = 6; 
let referenceNumber = 4050; 
let forcedErrors = 0; 
let notesMode = false;
let ghostMode = false; 
let spectatorName = "Someone";

// --- STATE ---
let enteredCode = "";
let isUnlocked = false;
let currentErrors = 0; 
let detectedZodiac = null;

// --- MEMORY FALLBACKS (Fixes "Image too big" black screen) ---
let memBgLock = null;
let memBgHome = null;
let memBgNotes = null;

// --- DOM ELEMENTS ---
const lockscreen = document.getElementById('lockscreen');
const wallpaperImg = document.getElementById('wallpaperImg');
const bgContainer = document.getElementById('bgContainer');
const panel = document.getElementById('panel'); 
const dotsContainer = document.getElementById('dots');
const keypad = document.getElementById('keypad');
const magicResult = document.getElementById('magicResult');
const historyResult = document.getElementById('historyResult');
const notesContent = document.getElementById('notesContent');

// Footer & Dialer
const cancelFooterBtn = document.getElementById('cancelFooterBtn');
const emergencyBtn = document.getElementById('emergencyBtn');
const dialerScreen = document.getElementById('dialerScreen');
const dialerDisplay = document.getElementById('dialerDisplay');
const dialerKeypad = document.getElementById('dialerKeypad');

// Settings & Inputs
const settingsOverlay = document.getElementById('settingsOverlay');
const refInput = document.getElementById('refInput');
const lenInput = document.getElementById('lenInput');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const notesToggle = document.getElementById('notesToggle');
const ghostToggle = document.getElementById('ghostToggle'); 
const nameInputRow = document.getElementById('nameInputRow');
const notesUploadRow = document.getElementById('notesUploadRow');
const spectatorNameInput = document.getElementById('spectatorName');
const errorCountDisplay = document.getElementById('errorCountDisplay');
const decErrors = document.getElementById('decErrors');
const incErrors = document.getElementById('incErrors');

// Upload Buttons
const btnUploadNotes = document.getElementById('btnUploadNotes');
const btnUploadLock = document.getElementById('btnUploadLock');
const btnUploadHome = document.getElementById('btnUploadHome');

// Hidden Inputs
const uploadLock = document.getElementById('uploadLock');
const uploadHome = document.getElementById('uploadHome');
const uploadNotes = document.getElementById('uploadNotes');

// --- AUDIO HAPTICS (MODIFIED) ---
let audioCtx = null;

function ensureAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function triggerHaptic() {
  // 1. Android System Vibration
  if (navigator.vibrate) navigator.vibrate(8); 

  // 2. iOS Switch Hack (The "Click") - NEW ADDITION
  // This toggles the invisible checkbox we added to HTML to trick Safari
  const switchEl = document.getElementById('haptic-switch');
  if (switchEl) {
    switchEl.checked = !switchEl.checked; 
  }

  // 3. Audio Rumble (The "Thump") - EXISTING LOGIC
  ensureAudioContext(); 
  if (!audioCtx) return;

  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  // A low 800Hz->100Hz drop feels like a "Thud"
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.015);
  
  gain.gain.setValueAtTime(0.05, t); 
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
  
  osc.start(t);
  osc.stop(t + 0.015);
}

// --- INIT ---
loadSettings(); 
initLockKeypad();
initDialerKeypad();
renderDots();
initSettingsTabs();

// --- GHOST UNLOCK LOGIC ---
document.addEventListener('touchstart', (e) => {
  if (isUnlocked || !ghostMode) return;
  if (settingsOverlay.classList.contains('open')) return;
  if (dialerScreen.classList.contains('active')) return;
  if (e.touches.length > 1) return;

  if (enteredCode.length >= maxDigits) return;

  if (enteredCode.length < maxDigits - 1) {
      if (!e.target.closest('.key')) {
          e.preventDefault();
          e.stopPropagation();
          const randomDigit = Math.floor(Math.random() * 10).toString();
          enteredCode += randomDigit;
          renderDots();
          triggerHaptic(); // This will now trigger the "Click" too!
      }
  } 
}, {capture: true});

// --- ZODIAC CALCULATOR ---
function getZodiacSign(day, month) {
  let d = day, m = month;
  if (m > 12 && d <= 12) { let temp = d; d = m; m = temp; }
  if (!d || !m || m < 1 || m > 12 || d < 1 || d > 31) return null;

  if ((m == 1 && d >= 20) || (m == 2 && d <= 18)) return "Aquarius";
  if ((m == 2 && d >= 19) || (m == 3 && d <= 20)) return "Pisces";
  if ((m == 3 && d >= 21) || (m == 4 && d <= 19)) return "Aries";
  if ((m == 4 && d >= 20) || (m == 5 && d <= 20)) return "Taurus";
  if ((m == 5 && d >= 21) || (m == 6 && d <= 20)) return "Gemini";
  if ((m == 6 && d >= 21) || (m == 7 && d <= 22)) return "Cancer";
  if ((m == 7 && d >= 23) || (m == 8 && d <= 22)) return "Leo";
  if ((m == 8 && d >= 23) || (m == 9 && d <= 22)) return "Virgo";
  if ((m == 9 && d >= 23) || (m == 10 && d <= 22)) return "Libra";
  if ((m == 10 && d >= 23) || (m == 11 && d <= 21)) return "Scorpio";
  if ((m == 11 && d >= 22) || (m == 12 && d <= 21)) return "Sagittarius";
  if ((m == 12 && d >= 22) || (m == 1 && d <= 19)) return "Capricorn";
  return null;
}

// --- KEYPADS ---
function initLockKeypad() {
  const keys = [
    { n: '1', s: '' }, { n: '2', s: 'ABC' }, { n: '3', s: 'DEF' },
    { n: '4', s: 'GHI' }, { n: '5', s: 'JKL' }, { n: '6', s: 'MNO' },
    { n: '7', s: 'PQRS' }, { n: '8', s: 'TUV' }, { n: '9', s: 'WXYZ' },
    { n: null, s: '' }, { n: '0', s: '' }, { n: null, s: '' }
  ];
  keypad.innerHTML = keys.map(k => k.n === null ? `<div class="key empty"></div>` : `<div class="key" data-digit="${k.n}"><div class="key-digit">${k.n}</div><div class="key-sub">${k.s}</div></div>`).join('');
  attachKeyEvents(keypad, handleLockTap);
}
function initDialerKeypad() {
  const keys = [
    { n: '1', s: '' }, { n: '2', s: 'ABC' }, { n: '3', s: 'DEF' },
    { n: '4', s: 'GHI' }, { n: '5', s: 'JKL' }, { n: '6', s: 'MNO' },
    { n: '7', s: 'PQRS' }, { n: '8', s: 'TUV' }, { n: '9', s: 'WXYZ' },
    { n: '*', s: '' }, { n: '0', s: '+' }, { n: '#', s: '' }
  ];
  dialerKeypad.innerHTML = keys.map(k => `<div class="key" data-digit="${k.n}"><div class="key-digit">${k.n}</div><div class="key-sub">${k.s}</div></div>`).join('');
  attachKeyEvents(dialerKeypad, handleDialerTap);
}

function attachKeyEvents(container, handler) {
  container.querySelectorAll('.key').forEach(key => {
    if (key.classList.contains('empty')) return;
    key.addEventListener('touchstart', (e) => {
      e.preventDefault(); 
      ensureAudioContext(); 
      const digit = key.getAttribute('data-digit');
      handler(digit);
      triggerHaptic(); // Triggers the click/rumble
      key.classList.add('active');
    }, { passive: false });
    const reset = () => { setTimeout(() => key.classList.remove('active'), 70); };
    key.addEventListener('touchend', reset);
  });
}
function renderDots() {
  dotsContainer.innerHTML = Array(maxDigits).fill(0).map((_, i) => `<div class="dot ${i < enteredCode.length ? 'filled' : ''}"></div>`).join('');
}

// --- CORE LOGIC ---
function handleLockTap(digit) {
  if (isUnlocked) return;
  if (enteredCode.length < maxDigits) {
    enteredCode += digit;
    renderDots();
    if (enteredCode.length === maxDigits) setTimeout(attemptUnlock, 50);
  }
}
function handleDialerTap(digit) { dialerDisplay.textContent += digit; triggerHaptic(); }

function attemptUnlock() {
  if (!ghostMode || (ghostMode && enteredCode.length === maxDigits)) {
    if (currentErrors < forcedErrors) {
        currentErrors++;
        if (enteredCode.length >= 4) {
             const d = parseInt(enteredCode.substring(0, 2), 10);
             const m = parseInt(enteredCode.substring(2, 4), 10);
             const sign = getZodiacSign(d, m);
             if (sign) detectedZodiac = sign;
        }
        triggerError();
        return;
    }
  }

  const inputNum = parseInt(enteredCode, 10) || 0;
  const result = inputNum - referenceNumber;

  if (notesMode) {
    magicResult.style.display = 'none';
    historyResult.style.display = 'none'; 
    notesContent.classList.add('active');
    let html = `<span class="note-header">Intuition Log</span><br><br>`;
    html += `Someone came to mind.<br><br>`;
    html += `Name: <strong>${spectatorName}</strong><br>`;
    if (detectedZodiac) html += `Sign: <strong>${detectedZodiac}</strong><br>`;
    html += `<br>The Number: <strong>${result}</strong>`;
    notesContent.innerHTML = html;
  } else {
    magicResult.style.display = 'block';
    historyResult.style.display = 'block'; 
    notesContent.classList.remove('active');
    magicResult.textContent = result;
    if (detectedZodiac) historyResult.textContent = detectedZodiac; 
  }
  
  unlock();
}

// --- ERROR VIBRATION ---
function triggerError() {
  panel.classList.add('shake');
  if(navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 50]);
  setTimeout(() => { 
      panel.classList.remove('shake'); 
      enteredCode = ""; 
      renderDots(); 
  }, 500);
}

function unlock() {
  isUnlocked = true;
  lockscreen.classList.add('unlocked');
  enteredCode = ""; renderDots(); currentErrors = 0; 
  updateWallpaper();
}
function reLock() {
  isUnlocked = false;
  lockscreen.classList.remove('unlocked');
  dialerScreen.classList.remove('active');
  magicResult.textContent = "";
  historyResult.textContent = "";
  detectedZodiac = null;
  notesContent.classList.remove('active');
  updateWallpaper();
}

// --- BUTTONS ---
emergencyBtn.addEventListener('click', () => { dialerScreen.classList.add('active'); dialerDisplay.textContent = enteredCode; });
dialerScreen.querySelector('.call-btn').addEventListener('click', () => { triggerHaptic(); }); // Added haptic here too
cancelFooterBtn.addEventListener('click', () => { enteredCode = ""; renderDots(); });

// Upload Buttons
btnUploadLock.addEventListener('click', () => uploadLock.click());
btnUploadHome.addEventListener('click', () => uploadHome.click());
btnUploadNotes.addEventListener('click', () => uploadNotes.click());

// --- SETTINGS ---
function initSettingsTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const sections = document.querySelectorAll('.menu-section');
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      sections[i].classList.add('active');
    });
  });
}
function openSettings() {
  settingsOverlay.classList.add('open');
  refInput.value = referenceNumber;
  lenInput.value = maxDigits;
  notesToggle.checked = notesMode;
  ghostToggle.checked = ghostMode;
  spectatorNameInput.value = spectatorName;
  errorCountDisplay.textContent = forcedErrors;
  toggleNameInput();
}
function closeSettings() { settingsOverlay.classList.remove('open'); saveSettings(); updateWallpaper(); }
closeSettingsBtn.addEventListener('click', closeSettings);

notesToggle.addEventListener('change', () => { notesMode = notesToggle.checked; toggleNameInput(); });
ghostToggle.addEventListener('change', () => ghostMode = ghostToggle.checked);
function toggleNameInput() { 
  nameInputRow.style.display = notesMode ? 'flex' : 'none'; 
  notesUploadRow.style.display = notesMode ? 'flex' : 'none';
}

refInput.addEventListener('input', (e) => referenceNumber = parseInt(e.target.value) || 0);
lenInput.addEventListener('input', (e) => { let v=parseInt(e.target.value); if(v===4||v===6) maxDigits=v; });
spectatorNameInput.addEventListener('input', (e) => spectatorName = e.target.value);
decErrors.addEventListener('click', () => { if(forcedErrors>0) forcedErrors--; errorCountDisplay.textContent=forcedErrors; });
incErrors.addEventListener('click', () => { forcedErrors++; errorCountDisplay.textContent=forcedErrors; });

// --- GESTURES ---
let twoFingerStart = null;
window.addEventListener('touchstart', (e) => { 
  if (e.touches.length === 2) twoFingerStart = e.touches[0].clientY; 
}, {passive: false});

window.addEventListener('touchmove', (e) => {
  if (twoFingerStart !== null && e.touches.length === 2) {
    const diff = e.touches[0].clientY - twoFingerStart;
    if (diff > 50) { openSettings(); twoFingerStart = null; }
  }
}, {passive: false});

window.addEventListener('touchend', () => twoFingerStart = null);

let botTapCount = 0, botTapTimer = null;
document.addEventListener('click', (e) => {
  if (!isUnlocked) return;
  if (e.clientY > window.innerHeight - 150) {
    botTapCount++;
    if (botTapTimer) clearTimeout(botTapTimer);
    botTapTimer = setTimeout(() => botTapCount = 0, 400);
    if (botTapCount === 3) reLock();
  }
});

// --- SAVE/LOAD ---
function saveSettings() {
  localStorage.setItem('magicRefNum', referenceNumber);
  localStorage.setItem('maxDigits', maxDigits); 
  localStorage.setItem('notesMode', notesMode);
  localStorage.setItem('ghostMode', ghostMode);
  localStorage.setItem('spectatorName', spectatorName);
  localStorage.setItem('forcedErrors', forcedErrors);
}
function loadSettings() {
  const r = localStorage.getItem('magicRefNum'); if(r) referenceNumber = parseInt(r,10);
  const m = localStorage.getItem('maxDigits'); if(m) maxDigits = parseInt(m,10);
  const n = localStorage.getItem('notesMode'); if(n!==null) notesMode = (n==='true');
  const g = localStorage.getItem('ghostMode'); if(g!==null) ghostMode = (g==='true');
  const sn = localStorage.getItem('spectatorName'); if(sn) spectatorName = sn;
  const er = localStorage.getItem('forcedErrors'); if(er) forcedErrors = parseInt(er,10);
  updateWallpaper();
}

// --- ROBUST WALLPAPER LOGIC ---
function updateWallpaper() {
  // Try LocalStorage first, then RAM (Memory Fallback)
  const l = localStorage.getItem('bgLock') || memBgLock;
  const h = localStorage.getItem('bgHome') || memBgHome;
  const nb = localStorage.getItem('bgNotes') || memBgNotes;

  let nextSrc = null;

  if (!isUnlocked) {
    nextSrc = l;
  } 
  else if (isUnlocked && notesMode && nb) {
    nextSrc = nb;
  } 
  else if (isUnlocked) {
    nextSrc = h;
  }

  // 1. If we have an image source, show it
  if (nextSrc) {
    wallpaperImg.style.display = 'block';
    wallpaperImg.src = nextSrc;
  } 
  // 2. If NO image, hide the img element so black bgContainer shows
  else {
    wallpaperImg.style.display = 'none';
    wallpaperImg.src = '';
  }
}

function handleFile(key, file) {
  const r = new FileReader();

  r.onload = (e) => {
    const imgData = e.target.result;

    // 1. Try to save to permanent storage (LocalStorage)
    try {
      localStorage.setItem(key, imgData);
    } catch (err) {
      console.log("Image too big for storage. Using RAM fallback.");
      // 2. If too big, save to RAM variables so it still works for this session
      if(key === 'bgLock') memBgLock = imgData;
      if(key === 'bgHome') memBgHome = imgData;
      if(key === 'bgNotes') memBgNotes = imgData;
    }

    // 3. Update the screen immediately
    updateWallpaper();
  };

  r.readAsDataURL(file);

  // Reset inputs to allow re-upload
  if (uploadLock) uploadLock.value = "";
  if (uploadHome) uploadHome.value = "";
  if (uploadNotes) uploadNotes.value = "";
}

uploadLock.addEventListener('change', (e) => { if(e.target.files[0]) handleFile('bgLock', e.target.files[0]); });
uploadHome.addEventListener('change', (e) => { if(e.target.files[0]) handleFile('bgHome', e.target.files[0]); });
uploadNotes.addEventListener('change', (e) => { if(e.target.files[0]) handleFile('bgNotes', e.target.files[0]); });
