// Live editor logic for examples.html

import { renderToString } from './kern/kern.js';
import { GALLERY } from './examples.js';

const textarea = document.getElementById('editor-textarea');
const output = document.getElementById('editor-output');
const displayToggle = document.getElementById('display-toggle');
const permalinkBtn = document.getElementById('permalink-btn');

let displayMode = displayToggle ? displayToggle.checked : true;
let debounceTimer = null;

function renderEditor() {
  const src = textarea.value.trim();
  if (!src) { output.innerHTML = ''; return; }
  try {
    output.innerHTML = renderToString(src, { output: 'mathml', displayMode });
  } catch (e) {
    output.innerHTML = `<span style="color:#cc0000;font-size:0.85rem;font-family:monospace">${escHtml(e.message)}</span>`;
  }
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

textarea.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(renderEditor, 50);
});

if (displayToggle) {
  displayToggle.addEventListener('change', e => {
    displayMode = e.target.checked;
    renderEditor();
  });
}

if (permalinkBtn) {
  permalinkBtn.addEventListener('click', () => {
    const encoded = btoa(unescape(encodeURIComponent(textarea.value)));
    history.replaceState(null, '', '#' + encoded);
    permalinkBtn.textContent = 'copied!';
    setTimeout(() => { permalinkBtn.textContent = 'permalink'; }, 1500);
    try { navigator.clipboard.writeText(location.href); } catch {}
  });
}

// Load from hash on page load
if (location.hash.length > 1) {
  try {
    const decoded = decodeURIComponent(escape(atob(location.hash.slice(1))));
    textarea.value = decoded;
  } catch {}
}

// Build gallery
const galleryEl = document.getElementById('gallery');
if (galleryEl) {
  for (const item of GALLERY) {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.title = `Load: ${item.name}`;

    const srcEl = document.createElement('div');
    srcEl.className = 'gallery-card-src';
    srcEl.textContent = item.src;

    const outEl = document.createElement('div');
    outEl.className = 'gallery-card-out';
    try {
      outEl.innerHTML = renderToString(item.src, { output: 'mathml', displayMode: true });
    } catch {
      outEl.textContent = '(error)';
    }

    card.appendChild(srcEl);
    card.appendChild(outEl);
    card.addEventListener('click', () => {
      textarea.value = item.src;
      renderEditor();
      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    galleryEl.appendChild(card);
  }
}

// Initial render
renderEditor();
