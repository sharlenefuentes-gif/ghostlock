// ... (Omitted imports/constants)

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
    // These keys are functional but are usually invisible in the iOS lockscreen style
    // The visual styling for these icons is controlled by the CSS above, not inline styles.
  }

  // FIX: Add content using the CSS classes for proper styling and visibility
  // The '⌫' and '↵' icons are simplified to text here but styled by CSS:
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

// ... (Rest of the script.js remains the same)
