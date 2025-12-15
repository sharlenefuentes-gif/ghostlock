// Invisible overlay mock lockscreen
// - Upload your screenshot and enable "Invisible overlay" to make UI visuals transparent but still interactive.
// - Nothing is stored. The computed difference can be shown for 8 seconds if you enable the indicator.

const bgUpload = document.getElementById('bgUpload');
const lockscreen = document.getElementById('lockscreen');
const keypad = document.getElementById('keypad');
const dots = document.getElementById('dots');
const eraseBtn = document.getElementById('erase');
const unlockBtn = document.getElementById('unlock');
const referenceNumberInput = document.getElementById('referenceNumber');
const directionSelect = document.getElementById('direction');
const showIndicatorCheckbox = document.getElementById('showIndicator');
const indicatorContainer = document.getElementById('indicatorContainer');
const indicatorValue = document.getElementById('indicatorValue');
const indicatorLabel = document.getElementById('indicatorLabel');
const invisibleModeCheckbox = document.getElementById('invisibleMode');
const devOutlinesCheckbox = document.getElementById('devOutlines');

let entered = '';
const maxDigits = 4;
let hideTimer = null;
const DISPLAY_MS = 8000; // 8 seconds

// build keypad (1..9, erase, 0, enter)
const labels = [1,2,3,4,5,6,7,8,9,'⌫',0,'↵'];
labels.forEach(l => makeKey(l));

function makeKey(label){
  const btn = document.createElement('div');
  btn.className = 'key';
  // if numeric show number and small sub text, otherwise just symbol
  if(typeof label === 'number' || /^[0-9]$/.test(String(label))){
    btn.innerHTML = `<div class="num">${label}</div>`;
  } else {
    btn.textContent = label;
  }
  keypad.appendChild(btn);

  btn.addEventListener('click', () => {
    if(label === '⌫') {
      removeDigit();
    } else if(label === '↵') {
      attemptUnlock();
    } else {
      addDigit(String(label));
    }
  });
}

function renderDots(){
  dots.innerHTML = '';
  for(let i=0;i<maxDigits;i++){
    const d = document.createElement('div');
    d.className = 'dot' + (i < entered.length ? ' filled' : '');
    dots.appendChild(d);
  }
  unlockBtn.disabled = (entered.length !== maxDigits);
}
function addDigit(d){
  if(entered.length >= maxDigits) return;
  entered += d;
  renderDots();
}
function removeDigit(){
  entered = entered.slice(0,-1);
  renderDots();
}

eraseBtn.addEventListener('click', () => { entered=''; renderDots(); });
unlockBtn.addEventListener('click', attemptUnlock);

function attemptUnlock(){
  if(entered.length !== maxDigits) return;
  const enteredNum = parseInt(entered, 10);
  const refNum = parseFloat(referenceNumberInput.value) || 0;
  const dir = directionSelect.value;
  const diff = dir === 'entered-minus-ref' ? (enteredNum - refNum) : (refNum - enteredNum);

  // Only display difference if indicator is enabled.
  if(showIndicatorCheckbox.checked){
    showDifferenceTemporarily(diff, DISPLAY_MS);
  }

  // visually "flash" (very subtle) so user knows input registered
  flashUnlock();

  // clear entered for the next attempt
  entered = '';
  renderDots();
}

function showDifferenceTemporarily(diff, ms){
  if(hideTimer){
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  indicatorValue.textContent = String(diff);
  indicatorLabel.textContent = 'Difference';
  indicatorContainer.classList.remove('hidden');

  hideTimer = setTimeout(() => {
    indicatorValue.textContent = '—';
    indicatorContainer.classList.add('hidden');
    hideTimer = null;
  }, ms);
}

// invisible mode handler
invisibleModeCheckbox.addEventListener('change', () => {
  if(invisibleModeCheckbox.checked){
    document.body.classList.add('invisible');
  } else {
    document.body.classList.remove('invisible');
  }
});

// dev outlines toggle
devOutlinesCheckbox.addEventListener('change', () => {
  if(devOutlinesCheckbox.checked){
    document.body.classList.add('dev-outlines');
  } else {
    document.body.classList.remove('dev-outlines');
  }
});

// indicator toggle handler
showIndicatorCheckbox.addEventListener('change', () => {
  if(!showIndicatorCheckbox.checked){
    indicatorValue.textContent = '—';
    indicatorContainer.classList.add('hidden');
  }
});

// background upload handler
bgUpload.addEventListener('change', (ev) => {
  const f = ev.target.files && ev.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    lockscreen.style.backgroundImage = `url('${reader.result}')`;
    // default background sizing is cover; if you want exact pixel fit try contain
    lockscreen.style.backgroundSize = 'cover';
  };
  reader.readAsDataURL(f);
});

function flashUnlock(){
  // subtle pulse so an unlock attempt is obvious to the operator
  lockscreen.animate([
    { transform: 'scale(1)' },
    { transform: 'scale(1.008)' },
    { transform: 'scale(1)' }
  ], {duration:220, easing:'ease-out'});
}

// init
renderDots();
indicatorContainer.classList.add('hidden');
indicatorValue.textContent = '—';