// Completely invisible overlay lockscreen
// - Double-tap top-left to upload screenshot (no visible button)
// - Two-finger swipe to set reference number (no visible input)
// - All keypad areas invisible but fully functional
// - Difference value ALWAYS shows at bottom for 8 seconds after unlock
// - Nothing is stored or logged anywhere

const bgUpload = document.getElementById('bgUpload');
const lockscreen = document.getElementById('lockscreen');
const keypad = document.getElementById('keypad');
const dots = document.getElementById('dots');
const indicatorContainer = document.getElementById('indicatorContainer');
const indicatorValue = document.getElementById('indicatorValue');

let entered = '';
let referenceNumber = 1000; // default reference number (set via swipe)
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
    d.className = 'dot' + (i < entered. length ? ' filled' : '');
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
    indicatorContainer. classList.add('hidden');
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
  window. addEventListener('touchend', (ev) => {
    if (! ev.changedTouches || ev.changedTouches. length !== 1) return;
    const t = ev.changedTouches[0];
    if (! isInTopLeft(t.clientX, t.clientY)) return;
    const now = Date. now();
    if (now - lastTap <= DOUBLE_TAP_MS) {
      bgUpload.click();
      lastTap = 0;
    } else {
      lastTap = now;
    }
  }, { passive: true });

  // Mouse double-click fallback for desktop testing
  window.addEventListener('dblclick', (ev) => {
    if (isInTopLeft(ev.clientX, ev. clientY)) bgUpload.click();
  });
})();

// --- Two-finger swipe to set reference number ---
(function() {
  let twoTouchStart = null;
  const MIN_SWIPE_DISTANCE = 40;

  window.addEventListener('touchstart', (ev) => {
    if (ev.touches && ev.touches.length === 2) {
      twoTouchStart = [
        { x: ev.touches[0]. clientX, y: ev.touches[0].clientY },
        { x: ev.touches[1].clientX, y: ev. touches[1].clientY }
      ];
    }
  }, { passive: true });

  window.addEventListener('touchend', (ev) => {
    if (!twoTouchStart) return;

    const changed = ev.changedTouches;
    if (! changed || changed.length === 0) {
      twoTouchStart = null;
      return;
    }

    const startAvgY = (twoTouchStart[0].y + twoTouchStart[1].y) / 2;
    let endAvgY;

    if (changed. length >= 2) {
      endAvgY = (changed[0].clientY + changed[1].clientY) / 2;
    } else if (changed. length === 1) {
      endAvgY = (changed[0].clientY + startAvgY * 2 - twoTouchStart[0].y) / 2;
    } else {
      twoTouchStart = null;
      return;
    }

    const deltaY = startAvgY - endAvgY;

    if (Math. abs(deltaY) >= MIN_SWIPE_DISTANCE) {
      // Two-finger swipe detected — prompt for reference number
      const current = String(referenceNumber);
      const input = prompt('Enter reference number:', current);
      if (input !== null) {
        const num = parseFloat(input);
        if (!isNaN(num)) {
          referenceNumber = num;
        }
      }
    }

    twoTouchStart = null;
  }, { passive: true });
})();

// --- Background upload handler ---
bgUpload.addEventListener('change', (ev) => {
  const f = ev.target. files && ev.target.files[0];
  if (! f) return;
  const reader = new FileReader();
  reader.onload = () => {
    lockscreen.style.backgroundImage = `url('${reader.result}')`;
    lockscreen.style.backgroundSize = 'cover';
    lockscreen.style.backgroundPosition = 'center';
  };
  reader.readAsDataURL(f);
});

// --- Init ---
renderDots();
indicatorContainer.classList.add('hidden');
indicatorValue.textContent = '—';
