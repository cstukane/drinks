// common.js
// Common view helpers and constants

// Shared CSS selectors
export const SELECTORS = {
    APP_CONTAINER: '#app-container',
    OPTION: '.option',
    OPTION_LIST: '.option-list',
    OPTIONS_CONTAINER: '.options-container',
    HIGHLIGHTED: '.highlighted',
    PRIMARY_ROLL_BTN: '.primary-roll-btn',
    ROLL_ACTIONS: '.roll-actions'
};

// Create a header element
export function createHeader(text) {
    const header = document.createElement('h2');
    header.textContent = text;
    return header;
}

// Create a paragraph element
export function createParagraph(text) {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    return paragraph;
}

// Run a coin flip animation in a given parent overlay container, then call onComplete
export function runCoinFlip(parent, onComplete) {
  try {
    if (parent) parent.style.display = 'block';
    if (window && typeof window.coinFlip === 'function') {
      window.coinFlip({ parent, onComplete: () => {
        try { if (parent) parent.style.display = 'none'; } catch {}
        try { onComplete && onComplete(); } catch {}
      }});
    } else {
      // Fallback: no animation available
      setTimeout(() => {
        try { if (parent) parent.style.display = 'none'; } catch {}
        try { onComplete && onComplete(); } catch {}
      }, 150);
    }
  } catch {
    try { if (parent) parent.style.display = 'none'; } catch {}
    try { onComplete && onComplete(); } catch {}
  }
}
