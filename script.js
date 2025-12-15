// Stable, functional version of Invisible Lockscreen Overlay
// - Double-tap top-left to upload screenshot
// - Set reference number via PROMPT (removed complicated gestures)
// - Keypad fully functional
// - Footer links are PASSIVE placeholders (Emergency/Cancel)

const bgUpload = document.getElementById('bgUpload');
const lockscreen = document.getElementById('lockscreen');
const keypad = document.getElementById('keypad');
const dots = document.getElementById('dots');
const indicatorContainer = document.getElementById('indicatorContainer');
const indicatorValue = document.getElementById('indicatorValue');
const emergencyBtn = document.getElementById('emergencyBtn'); 
const cancelLink = document.getElementById('cancelLink'); 
const promptElement = document.querySelector('.prompt'); // Used for a hidden control

let entered = '';
let referenceNumber = 1000; 
let subtractDirection = 'entered-minus-ref'; 
const maxDigits = 4;
let hideTimer = null;
const DISPLAY_MS = 8000; 

// --- Keypad Building (Simple & Stable) ---
const labels = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '↵'
];
labels.forEach(l => makeKey(l));

function makeKey(label) {
  const btn = document.createElement('div');
  btn.className = 'key';
  keypad.appendChild(btn);

  // FIX: Key content is just the label, CSS styles the size/font
  btn.textContent = label; 

  btn.addEventListener('click', () => {
    if (label === '⌫' || label === '↵') {
        // These keys are functionally invisible and handled by the standard input
        attemptUnlock(); 
    } else {
      addDigit(String(label));
    }
  });
  // Note: Since '⌫' and '↵' are not standard numbers, they won't trigger addDigit.
  // We handle input and delete via the Cancel link and maxDigits check.
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
    cancelLink.textContent = 'Delete';
  } else {
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

// --- Footer Link Functionality ---
cancelLink.addEventListener('click', (ev) => {
    ev.preventDefault();
    if (entered.length > 0) {
        removeDigit(); // Delete last digit
    } else {
        // "Cancel" state: No action needed for a simple overlay
    }
});

// Triple-tap the 'Enter Passcode' prompt to set reference number (NEW STABLE CONTROL)
(function() {
  let tapCount = 0;
  let tapTimer = null;
  const TRIPLE_TAP_MS = 500; 

  if (promptElement) {
    promptElement.addEventListener('click', (ev) => {
      ev.preventDefault();
      
      tapCount++;

      if (tapTimer) clearTimeout(tapTimer);
      
      tapTimer = setTimeout(() => {
        tapCount = 0;
      }, TRIPLE_TAP_MS);

      if (tapCount === 3) {
        tapCount = 0;
        clearTimeout(tapTimer);
        
        const current = String(referenceNumber);
        const input = prompt('Enter NEW reference number:', current);
        if (input !== null) {
          const num = parseFloat(input);
          if (!isNaN(num)) {
            referenceNumber = num;
            localStorage.setItem('referenceNumber', String(referenceNumber));
          }
        }
      }
    });
  }
})();
// --- End Stable Control ---


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

// --- Double-tap top-left to upload screenshot (Retained) ---
(function() {
  let lastTap = 0;
  const DOUBLE_TAP_MS = 300;
  const TOP_LEFT_MAX_X = 120;
  const TOP_LEFT_MAX_Y = 120;

  function isInTopLeft(x, y) {
    return x <= TOP_LEFT_MAX_X && y <= TOP_LEFT_MAX_Y;
  }

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

  window.addEventListener('dblclick', (ev) => {
    if (isInTopLeft(ev.clientX, ev.clientY)) bgUpload.click();
  });
})();

// --- Background upload handler (Retained) ---
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
