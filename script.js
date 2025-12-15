// Completely invisible overlay lockscreen
// - Double-tap top-left to upload screenshot (no visible button)
// - Triple-tap EMERGENCY button to set reference number
// - All keypad areas invisible but fully functional

const bgUpload = document.getElementById('bgUpload');
const lockscreen = document.getElementById('lockscreen');
const keypad = document.getElementById('keypad');
const dots = document.getElementById('dots');
const indicatorContainer = document.getElementById('indicatorContainer');
const indicatorValue = document.getElementById('indicatorValue');
const emergencyBtn = document.getElementById('emergencyBtn'); 
// NEW: Get the Cancel Link
const cancelLink = document.getElementById('cancelLink'); 

let entered = '';
let referenceNumber = 1000; 
let subtractDirection = 'entered-minus-ref'; 
const maxDigits = 4;
let hideTimer = null;
const DISPLAY_MS = 8000; 

// Build keypad (1.. 9, erase, 0, enter)
const labels = [
    { n: '1', s: '' }, { n: '2', s: 'ABC' }, { n: '3', s: 'DEF' },
    { n: '4', s: 'GHI' }, { n: '5', s: 'JKL' }, { n: '6', s: 'MNO' },
    { n: '7', s: 'PQRS' }, { n: '8', s: 'TUV' }, { n: '9', s: 'WXYZ' },
    { n: '⌫', s: '' }, { n: '0', s: '' }, { n: '↵', s: '' }
];
labels.forEach(l => makeKey(l));

function makeKey(key) {
  const btn = document.createElement('div');
  btn.className = 'key';
  keypad.appendChild(btn);

  if (key.n === '⌫' || key.n === '↵') {
    // Hidden keys that are only functional
    btn.style.opacity = 0; 
    btn.style.background = 'transparent';
    btn.style.backdropFilter = 'none';
    btn.style.WebkitBackdropFilter = 'none';
  }

  // FIX: Add content to keys
  btn.innerHTML = `<span class="key-digit">${key.n}</span>` + 
                  (key.s ? `<span class="key-sub">${key.s}</span>` : '');

  btn.addEventListener('click', () => {
    if (key.n === '⌫') {
      removeDigit();
    } else if (key.n === '↵') {
      attemptUnlock();
    } else {
      addDigit(String(key.n));
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
  updateCancelLink();
}

function updateCancelLink() {
  if (entered.length > 0) {
    // If input is present, change to "Delete" and clear last digit on click
    cancelLink.textContent = 'Delete';
  } else {
    // If input is empty, function as "Cancel" (which currently does nothing)
    cancelLink.textContent = 'Cancel';
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

// FIX: Handle Delete/Cancel functionality
cancelLink.addEventListener('click', (ev) => {
    ev.preventDefault();
    if (entered.length > 0) {
        removeDigit(); // Delete last digit
    } else {
        // If it says "Cancel", we can add a future feature here (e.g., dismissing notifications)
        // For now, it just resets the whole UI (if needed) but primarily acts as a placeholder.
        // We'll leave it as a reset-all for now:
        entered = '';
        renderDots();
    }
});

function attemptUnlock() {
  if (entered.length !== maxDigits) return;
  const enteredNum = parseInt(entered, 10);
  const diff = subtractDirection === 'entered-minus-ref' 
    ? (enteredNum - referenceNumber) 
    : (referenceNumber - enteredNum);

  showDifferenceTemporarily(diff, DISPLAY_MS);
  flashUnlock();
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
    const savedBg = localStorage.getItem('lockscreenBg');
    if (savedBg) {
        lockscreen.style.backgroundImage = `url('${savedBg}')`;
        lockscreen.style.backgroundSize = 'cover';
        lockscreen.style.backgroundPosition = 'center';
    }

    const savedRef = localStorage.getItem('referenceNumber');
    if (savedRef) {
        referenceNumber = parseFloat(savedRef);
    }
}

// --- Double-tap top-left to upload screenshot ---
// (Logic for double-tap remains the same)

// --- Triple-tap Emergency Button to Set Reference Number ---
// (Logic for triple-tap remains the same)

// --- Background upload handler ---
bgUpload.addEventListener('change', (ev) => {
  const f = ev.target.files && ev.target.files[0];
  if (! f) return;
  const reader = new FileReader();
  reader.onload = () => {
    lockscreen.style.backgroundImage = `url('${reader.result}')`;
    lockscreen.style.backgroundSize = 'cover';
    lockscreen.style.backgroundPosition = 'center';
    localStorage.setItem('lockscreenBg', reader.result);
  };
  reader.readAsDataURL(f);
});

// --- Init ---
loadSettings(); 
renderDots(); 
indicatorContainer.classList.add('hidden');
indicatorValue.textContent = '—';
