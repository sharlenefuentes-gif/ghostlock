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
let historyLog = [];
let detectedZodiac = null;
let ghostTapCount = 0; 

// --- DOM ELEMENTS ---
const lockscreen = document.getElementById('lockscreen');
const homescreen = document.getElementById('homescreen');
const wallpaperImg = document.getElementById('wallpaperImg');

const panel = document.getElementById('panel'); 
const dotsContainer = document.getElementById('dots');
const keypad = document.getElementById('keypad');
const magicResult = document.getElementById('magicResult');
const historyResult = document.getElementById('historyResult');
const notesContent = document.getElementById('notesContent');

// Footer
const cancelFooterBtn = document.getElementById('cancelFooterBtn');
const emergencyBtn = document.getElementById('emergencyBtn');

// Dialer
const dialerScreen = document.getElementById('dialerScreen');
const dialerDisplay = document.getElementById('dialerDisplay');
const dialerKeypad = document.getElementById('dialerKeypad');

// Upload
const uploadLock = document.getElementById('uploadLock');
const uploadHome = document.getElementById('uploadHome');
const uploadNotes = document.getElementById('uploadNotes');

// Settings
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
const btnUploadNotes = document.getElementById('btnUploadNotes');

// --- AUDIO HAPTICS (ULTRA LOW) ---
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function triggerHaptic() {
  // 1. Android Native Vibration (Still nice to have)
  if (navigator.vibrate) navigator.vibrate(8); 
  
  // 2. iOS "Acoustic Haptic" (Micro Click)
  if (!audioCtx) return;

  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.015);
  
  // VOLUME: 0.05 (5%) - Very faint
  gain.gain.setValueAtTime(0.05, t); 
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
  
  osc.start(t);
  osc.stop(t + 0.015);
}

// --- INITIALIZATION ---
loadSettings(); 
initLockKeypad();
initDialerKeypad();
renderDots();
initSettingsTabs(); // New tab handler

// Initialize Audio on first touch anywhere
document.addEventListener('touchstart', initAudio, {once:true});
document.addEventListener('click', initAudio, {once:true});

// --- GHOST UNLOCK LOGIC ---
document.addEventListener('touchstart', (e) => {
  if (isUnlocked || !ghostMode) return;
  if (settingsOverlay.classList.contains('open')) return;
  if (dialerScreen.classList.contains('active')) return;
  
  // If we already have a full code (processing), ignore
  if (enteredCode.length >= maxDigits) return;

  // SEQUENCE LOGIC
  // If we need more digits to reach "1 less than max":
  if (enteredCode.length < maxDigits - 1) {
      // This is a "random" filler tap. 
      e.preventDefault();
      e.stopPropagation();

      const randomDigit = Math.floor(Math.random() * 10).toString();
      enteredCode += randomDigit;
      renderDots();
      triggerHaptic();
  } 
  else if (enteredCode.length === maxDigits - 1) {
      // We are at 5/6 dots. The NEXT tap must be a key.
      if (e.target.closest('.key')) {
         // Let standard handler take over.
      } else {
         // Ignore background taps
      }
  }
}, {capture: true});

// --- ZODIAC LOGIC ---
function getZodiacSign(day, month) {
  if (!day || !month || month < 1 || month > 12 || day < 1 || day > 31) return null;
  if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return "Aquarius";
  if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return "Pisces";
  if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "Aries";
  if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "Taurus";
  if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return "Gemini";
  if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return "Cancer";
  if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "Leo";
  if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return "Virgo";
  if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return "Libra";
  if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return "Scorpio";
  if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return "Sagittarius";
  if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return "Capricorn";
  return null;
}

// --- KEYPAD GENERATION ---
function initLockKeypad() {
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

function initDialerKeypad() {
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

// --- KEY HANDLER ---
function attachKeyEvents(container, handler) {
  container.querySelectorAll('.key').forEach(key => {
    if (key.classList.contains('empty')) return;

    key.addEventListener('touchstart', (e) => {
      e.preventDefault(); 
      const digit = key.getAttribute('data-digit');
      handler(digit);
      triggerHaptic();
      key.classList.add('active');
    }, { passive: false });

    const resetKey = () => { setTimeout(() => key.classList.remove('active'), 70); };
    key.addEventListener('touchend', resetKey);
    key.addEventListener('touchcancel', resetKey);
  });
}

function renderDots() {
  dotsContainer.innerHTML = Array(maxDigits).fill(0).map((_, i) => 
    `<div class="dot ${i < enteredCode.length ? 'filled' : ''}"></div>`
  ).join('');
}

function updateHistoryDisplay() {
  historyResult.innerHTML = historyLog.join('<br>');
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
  dialerDisplay.textContent += digit;
  triggerHaptic();
}

function attemptUnlock() {
  if (!ghostMode) {
      if (enteredCode.length === maxDigits && currentErrors < forcedErrors) {
        currentErrors++;
        let resultText = enteredCode;
        if (currentErrors === 1) {
          const d = parseInt(enteredCode.substring(0, 2), 10);
          const m = parseInt(enteredCode.substring(2, 4), 10);
          const sign = getZodiacSign(d, m);
          if (sign) { resultText = sign; detectedZodiac = sign; }
        }
        historyLog.push(resultText);
        triggerError();
        return;
      }
  }
  
  const inputNum = enteredCode ? parseInt(enteredCode, 10) : 0;
  const result = inputNum - referenceNumber;

  if (notesMode) {
    magicResult.style.display = 'none';
    historyResult.style.display = 'none'; 
    notesContent.classList.add('active');
    let htmlContent = `<span class="note-header">INTUITION LOG</span>`;
    htmlContent += `Earlier today, someone came to mind.\n\n`;
    htmlContent += `I couldn’t tell if it was someone I already knew\nor someone I hadn’t met yet.\n\n`;
    htmlContent += `The feeling stayed.\n\n`;
    htmlContent += `A name surfaced.\n`;
    htmlContent += `<strong>${spectatorName}</strong>\n\n`;
    if (detectedZodiac) {
      htmlContent += `Along with a personality that felt much of a <strong>${detectedZodiac}</strong>.\n\n`;
    }
    htmlContent += `Then a number followed.\nNot random.\n\n`;
    htmlContent += `<strong>${result}</strong>\n\n`;
    htmlContent += `Intuition or not, still amazes me.`;
    notesContent.innerHTML = htmlContent;
  } else {
    magicResult.style.display = 'block';
    historyResult.style.display = 'flex';
    notesContent.classList.remove('active');
    magicResult.textContent = result;
    updateHistoryDisplay();
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
  enteredCode = "";
  renderDots();
  currentErrors = 0; 
  ghostTapCount = 0; 
  updateWallpaper(); 
}

function reLock() {
  isUnlocked = false;
  lockscreen.classList.remove('unlocked');
  dialerScreen.classList.remove('active');
  magicResult.textContent = "";
  historyLog = [];
  historyResult.innerHTML = "";
  detectedZodiac = null; 
  notesContent.classList.remove('active');
  notesContent.innerHTML = "";
  ghostTapCount = 0;
  updateWallpaper(); 
}

// --- BUTTONS ---
emergencyBtn.addEventListener('click', () => {
  dialerScreen.classList.add('active');
  dialerDisplay.textContent = enteredCode;
});
dialerScreen.querySelector('.call-btn').addEventListener('click', () => {
  if(navigator.vibrate) navigator.vibrate(50);
});
cancelFooterBtn.addEventListener('click', () => {
  enteredCode = "";
  renderDots();
});
btnUploadNotes.addEventListener('click', () => {
  uploadNotes.click();
});

// --- SETTINGS TABS ---
function initSettingsTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const sections = document.querySelectorAll('.menu-section');
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      sections[index].classList.add('active');
    });
  });
}

// --- SETTINGS UI ---
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
function closeSettings() {
  settingsOverlay.classList.remove('open');
  saveSettings();
  updateWallpaper();
}
closeSettingsBtn.addEventListener('click', closeSettings);

notesToggle.addEventListener('change', () => { notesMode = notesToggle.checked; toggleNameInput(); });
ghostToggle.addEventListener('change', () => { ghostMode = ghostToggle.checked; });

function toggleNameInput() { 
  nameInputRow.style.display = notesMode ? 'flex' : 'none'; 
  notesUploadRow.style.display = notesMode ? 'flex' : 'none'; 
}
refInput.addEventListener('input', (e) => referenceNumber = parseInt(e.target.value) || 0);
lenInput.addEventListener('input', (e) => { let val = parseInt(e.target.value); if(val === 4 || val === 6) maxDigits = val; });
spectatorNameInput.addEventListener('input', (e) => spectatorName = e.target.value);
decErrors.addEventListener('click', () => { if(forcedErrors>0) forcedErrors--; errorCountDisplay.textContent = forcedErrors; });
incErrors.addEventListener('click', () => { forcedErrors++; errorCountDisplay.textContent = forcedErrors; });

// --- GESTURES ---
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
let twoFingerStart = null;
window.addEventListener('touchstart', (e) => { if (e.touches.length === 2) twoFingerStart = e.touches[0].clientY; }, {passive: false});
window.addEventListener('touchend', (e) => {
  if (twoFingerStart !== null) {
    if ((e.changedTouches[0].clientY - twoFingerStart) > 50) openSettings();
    twoFingerStart = null;
  }
}, {passive: false});
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
  localStorage.setItem('ghostMode', ghostMode);
  localStorage.setItem('spectatorName', spectatorName);
  localStorage.setItem('forcedErrors', forcedErrors);
}
function loadSettings() {
  const savedRef = localStorage.getItem('magicRefNum'); if (savedRef) referenceNumber = parseInt(savedRef, 10);
  const savedMaxDigits = localStorage.getItem('maxDigits'); if (savedMaxDigits) maxDigits = parseInt(savedMaxDigits, 10);
  const savedNotes = localStorage.getItem('notesMode'); if (savedNotes !== null) notesMode = (savedNotes === 'true');
  const savedGhost = localStorage.getItem('ghostMode'); if (savedGhost !== null) ghostMode = (savedGhost === 'true');
  const savedName = localStorage.getItem('spectatorName'); if (savedName) spectatorName = savedName;
  const savedErrors = localStorage.getItem('forcedErrors'); if (savedErrors) forcedErrors = parseInt(savedErrors, 10);
  updateWallpaper();
}

// --- WALLPAPER MANAGER ---
function updateWallpaper() {
  const savedLock = localStorage.getItem('bgLock');
  const savedHome = localStorage.getItem('bgHome');
  const savedNotesBG = localStorage.getItem('bgNotes');
  
  if (!isUnlocked) {
    wallpaperImg.src = savedLock || "";
  } else {
    if (notesMode && savedNotesBG) wallpaperImg.src = savedNotesBG;
    else if (savedHome) wallpaperImg.src = savedHome;
    else wallpaperImg.src = "";
  }
}

function saveImage(key, dataUrl) { try { localStorage.setItem(key, dataUrl); } catch (e) { alert("Image too large!"); } }
uploadLock.addEventListener('change', (e) => { const f=e.target.files[0]; if(f){ const r=new FileReader(); r.onload=(v)=>{ saveImage('bgLock',v.target.result); updateWallpaper(); }; r.readAsDataURL(f); }});
uploadHome.addEventListener('change', (e) => { const f=e.target.files[0]; if(f){ const r=new FileReader(); r.onload=(v)=>{ saveImage('bgHome',v.target.result); updateWallpaper(); }; r.readAsDataURL(f); }});
uploadNotes.addEventListener('change', (e) => { const f=e.target.files[0]; if(f){ const r=new FileReader(); r.onload=(v)=>{ saveImage('bgNotes',v.target.result); updateWallpaper(); alert("Notes background saved!"); }; r.readAsDataURL(f); }});
