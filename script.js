// Completely invisible overlay lockscreen
// - Double-tap top-left to upload screenshot (no visible button)
// - Triple-tap EMERGENCY button to set reference number (NEW CONTROL)
// - All keypad areas invisible but fully functional
// - Difference value ALWAYS shows at bottom for 8 seconds after unlock

const bgUpload = document.getElementById('bgUpload');
const lockscreen = document.getElementById('lockscreen');
const keypad = document.getElementById('keypad');
const dots = document.getElementById('dots');
const indicatorContainer = document.getElementById('indicatorContainer');
const indicatorValue = document.getElementById('indicatorValue');
// NEW: Get the Emergency Button
const emergencyBtn = document.getElementById('emergencyBtn'); 

let entered = '';
let referenceNumber = 1000; // default reference number (set via Emergency Triple-Tap)
let subtractDirection = 'entered-minus-ref'; // entered - reference (default)
const maxDigits = 4;
let hideTimer = null;
const DISPLAY_MS = 8000; // 8 seconds

// Build keypad (1.. 9, erase, 0, enter)
const labels = [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '↵'];
labels.forEach(l => makeKey(l));

function makeKey(label) {
  const btn = document.createElement('div');
  btn.className = 'key';
  keypad.appendChild(btn);

  btn.addEventListener('click', () => {
    if (label === '⌫') {
      removeDigit();
    } else if (label === '↵') {
      attemptUnlock();
    } else {
      addDigit(String(label));
    }
  });
}

function renderDots() {
  dots.innerHTML = '';
  for (let i = 0; i < maxDigits; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i < entered.length ? ' filled' : '');
    dots.appendChild(d);
  }
}

function addDigit(d) {
  if (entered.length >= maxDigits) return;
  entered += d;
  renderDots();
}

function removeDigit() {
  entered = entered.slice(0, -1);
  renderDots();
}

function attemptUnlock() {
  if (entered.length !== maxDigits) return;
  const enteredNum = parseInt(entered, 10);
  const diff = subtractDirection === 'entered-minus-ref' 
    ? (enteredNum - referenceNumber) 
    : (referenceNumber - enteredNum);

  // ALWAYS show the difference for 8 seconds
  showDifferenceTemporarily(diff, DISPLAY_MS);

  // subtle feedback
  flashUnlock();

  // clear for next attempt
  entered = '';
  renderDots();
}

function showDifferenceTemporarily(diff, ms) {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  indicatorValue.textContent = String(diff);
  indicatorContainer.classList.remove('hidden');

  hideTimer = setTimeout(() => {
    indicatorValue.textContent = '—';
    indicatorContainer.classList.add('hidden');
    hideTimer = null;
  }, ms);
}

function flashUnlock() {
  lockscreen.animate(
    [
      { transform:  'scale(1)' },
      { transform: 'scale(1.006)' },
      { transform: 'scale(1)' }
    ],
    { duration: 180, easing: 'ease-out' }
  );
}

// --- CONFIGURATION & PERSISTENCE ---

function loadSettings() {
    // Load background image from local storage
    const savedBg = localStorage.getItem('lockscreenBg');
    if (savedBg) {
        lockscreen.style.backgroundImage = `url('${savedBg}')`;
        lockscreen.style.backgroundSize = 'cover';
        lockscreen.style.backgroundPosition = 'center';
    }

    // Load reference number from local storage
    const savedRef = localStorage.getItem('referenceNumber');
    if (savedRef) {
        referenceNumber = parseFloat(savedRef);
    }
}

// --- Double-tap top-left to upload screenshot ---
(function() {
  let lastTap = 0;
  const DOUBLE_TAP_MS = 300;
  const TOP_LEFT_MAX_X = 120;
  const TOP_LEFT_MAX_Y = 120;

  function isInTopLeft(x, y) {
    return x <= TOP_LEFT_MAX_X && y <= TOP_LEFT_MAX_Y;
  }

  // Touch-based double-tap
  window.addEventListener('touchend', (ev) => {
    if (! ev.changedTouches || ev.changedTouches.length !== 1) return;
    const t = ev.changedTouches[0];
    if (! isInTopLeft(t.clientX, t.clientY)) return;
    const now = Date.now();
    if (now - lastTap <= DOUBLE_TAP_MS) {
      bgUpload.click();
      lastTap = 0;
    } else {
      lastTap = now;
    }
  }, { passive: true });

  // Mouse double-click fallback for desktop testing
  window.addEventListener('dblclick', (ev) => {
    if (isInTopLeft(ev.clientX, ev.clientY)) bgUpload.click();
  });
})();

// --- NEW CONTROL: Triple-tap Emergency Button to Set Reference Number ---
(function() {
  let tapCount = 0;
  let tapTimer = null;
  const TRIPLE_TAP_MS = 500; // Allow 500ms between taps

  if (emergencyBtn) {
    emergencyBtn.addEventListener('click', (ev) => {
      ev.preventDefault(); // Stop default link behavior
      tapCount++;

      if (tapTimer) clearTimeout(tapTimer);
      
      tapTimer = setTimeout(() => {
        tapCount = 0;
      }, TRIPLE_TAP_MS);

      if (tapCount === 3) {
        tapCount = 0;
        clearTimeout(tapTimer);
        
        // Action: Prompt to set the reference number
        const current = String(referenceNumber);
        const input = prompt('Enter NEW reference number:', current);
        if (input !== null) {
          const num = parseFloat(input);
          if (!isNaN(num)) {
            referenceNumber = num;
            localStorage.setItem('referenceNumber', String(referenceNumber)); // Save new reference number
          }
        }
      }
    });
  }
})();
// --- END NEW CONTROL ---

// --- Background upload handler ---
bgUpload.addEventListener('change', (ev) => {
  const f = ev.target.files && ev.target.files[0];
  if (! f) return;
  const reader = new FileReader();
  reader.onload = () => {
    lockscreen.style.backgroundImage = `url('${reader.result}')`;
    lockscreen.style.backgroundSize = 'cover';
    lockscreen.style.backgroundPosition = 'center';
    // Save background to local storage for persistence
    localStorage.setItem('lockscreenBg', reader.result);
  };
  reader.readAsDataURL(f);
});

// --- Init ---
loadSettings(); 
renderDots();
indicatorContainer.classList.add('hidden');
indicatorValue.textContent = '—';
