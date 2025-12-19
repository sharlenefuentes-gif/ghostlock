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
const wallpaperImg = document.getElementById('wallpaperImg');
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
const btnUploadNotes = document.getElementById('btnUploadNotes');

// Uploads
const uploadLock = document.getElementById('uploadLock');
const uploadHome = document.getElementById('uploadHome');
const uploadNotes = document.getElementById('uploadNotes');

// --- AUDIO HAPTICS (HIDDEN FROM GUIDE) ---
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}
function triggerHaptic() {
  if (navigator.vibrate) navigator.vibrate(8); 
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
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
document.addEventListener('touchstart', initAudio, {once:true});
document.addEventListener('click', initAudio, {once:true});

// --- GHOST UNLOCK LOGIC (FIXED) ---
document.addEventListener('touchstart', (e) => {
  if (isUnlocked || !ghostMode) return;
  if (settingsOverlay.classList.contains('open')) return;
  if (dialerScreen.classList.contains('active')) return;
  
  // FIX: If 2 or more fingers, it's a gesture (Swipe). Ignore Ghost Logic.
  if (e.touches.length > 1) return;

  if (enteredCode.length >= maxDigits) return;

  if (enteredCode.length < maxDigits - 1) {
      // If tapping background (not a key)
      if (!e.target.closest('.key')) {
          e.preventDefault();
          e.stopPropagation();
          const randomDigit = Math.floor(Math.random() * 10).toString();
          enteredCode += randomDigit;
          renderDots();
          triggerHaptic();
      }
  } 
}, {capture: true});

// --- ZODIAC CALCULATOR ---
function getZodiacSign(day, month) {
  // Try DDMM format first
  let d = day, m = month;
  // Basic sanity check, swap if month > 12 (assuming US format input error)
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
      const digit = key.getAttribute('data-digit');
      handler(digit);
      triggerHaptic();
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
  // 1. Check for Forced Errors (Unless Ghost Mode is active and bypassing)
  if (!ghostMode || (ghostMode && enteredCode.length === maxDigits)) {
    // Note: In strict ghost mode, we might want to skip error check, 
    // but usually, we want the error check if the "Key" was pressed.
    // Simplifying: If current errors < forced, trigger error.
    if (currentErrors < forcedErrors) {
        currentErrors++;
        // Try to detect Zodiac from this "wrong" code
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

  // 2. Unlock Success
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
    historyResult.style.display = 'flex';
    notesContent.classList.remove('active');
    magicResult.textContent = result;
    if (detectedZodiac) historyResult.innerHTML = `<span>${detectedZodiac}</span>`;
  }
  
  unlock();
}

function triggerError() {
  panel.classList.add('shake');
  if(navigator.vibrate) navigator.vibrate(200);
  setTimeout(() => { panel.classList.remove('shake'); enteredCode = ""; renderDots(); }, 500);
}
function unlock() {
  isUnlocked = true;
  lockscreen.classList.add('unlocked');
  enteredCode = ""; renderDots(); currentErrors = 0; ghostTapCount = 0;
  updateWallpaper();
}
function reLock() {
  isUnlocked = false;
  lockscreen.classList.remove('unlocked');
  dialerScreen.classList.remove('active');
  magicResult.textContent = "";
  historyResult.innerHTML = "";
  detectedZodiac = null;
  notesContent.classList.remove('active');
  updateWallpaper();
}

// --- BUTTONS ---
emergencyBtn.addEventListener('click', () => { dialerScreen.classList.add('active'); dialerDisplay.textContent = enteredCode; });
dialerScreen.querySelector('.call-btn').addEventListener('click', () => { if(navigator.vibrate) navigator.vibrate(50); });
cancelFooterBtn.addEventListener('click', () => { enteredCode = ""; renderDots(); });
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
// 1. Uploads (Double Tap Top Corners)
let topTapCount = 0, topTapTimer = null;
document.addEventListener('touchstart', (e) => {
  if (e.touches[0].clientY > 100) return;
  topTapCount++;
  if (topTapTimer) clearTimeout(topTapTimer);
  topTapTimer = setTimeout(() => topTapCount = 0, 300);
  if (topTapCount === 2) {
    const w = window.innerWidth;
    const x = e.touches[0].clientX;
    if (x < w * 0.3) uploadLock.click();
    else if (x > w * 0.7) uploadHome.click();
  }
});

// 2. Settings (2 Finger Swipe Down)
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

// 3. Relock (3 Taps Bottom)
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

// --- SAVE/LOAD/WALLPAPER ---
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
function updateWallpaper() {
  const l = localStorage.getItem('bgLock');
  const h = localStorage.getItem('bgHome');
  const nb = localStorage.getItem('bgNotes');
  if (!isUnlocked) wallpaperImg.src = l || "";
  else {
    if (notesMode && nb) wallpaperImg.src = nb;
    else wallpaperImg.src = h || "";
  }
}
function handleFile(key, file) {
    const r = new FileReader();
    r.onload = (e) => { try { localStorage.setItem(key, e.target.result); updateWallpaper(); } catch(err){ alert("Image too big!"); } };
    r.readAsDataURL(file);
}
uploadLock.addEventListener('change', (e) => { if(e.target.files[0]) handleFile('bgLock', e.target.files[0]); });
uploadHome.addEventListener('change', (e) => { if(e.target.files[0]) handleFile('bgHome', e.target.files[0]); });
uploadNotes.addEventListener('change', (e) => { if(e.target.files[0]) handleFile('bgNotes', e.target.files[0]); });
