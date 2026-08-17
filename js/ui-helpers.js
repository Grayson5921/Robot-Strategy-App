// ─────────────────────────────────────────────────────────────
// UI Helper Functions
// Basic DOM creation and form utilities
// ─────────────────────────────────────────────────────────────

/**
 * Create an HTML element with optional class and content
 * @param {string} tag - HTML tag name
 * @param {string} cls - Optional CSS class name
 * @param {string} html - Optional inner HTML
 * @returns {HTMLElement}
 */
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

/**
 * Create a select element with options
 * @param {array} opts - Array of option values
 * @param {string} cur - Currently selected value
 * @param {function} cb - Callback when selection changes
 * @param {boolean} disabled - Disable the select
 * @returns {HTMLSelectElement}
 */
function sel(opts, cur, cb, disabled) {
  const s = el('select', 'fsel');
  if (disabled) s.disabled = true;
  opts.forEach(o => {
    const op = el('option');
    op.value = o;
    op.textContent = o || '— select —';
    if (o === cur) op.selected = true;
    s.appendChild(op);
  });
  s.onchange = () => {
    if (!canEdit) return;
    cb(s.value);
  };
  return s;
}

/**
 * Create a text input element
 * @param {string} v - Initial value
 * @param {string} ph - Placeholder text
 * @param {function} cb - Callback on blur or Enter
 * @param {boolean} disabled - Disable the input
 * @returns {HTMLInputElement}
 */
function inp(v, ph, cb, disabled) {
  const i = el('input', 'finp');
  i.value = v || '';
  i.placeholder = ph || '';
  if (disabled) i.disabled = true;
  i.addEventListener('blur', () => {
    if (!canEdit) return;
    cb(i.value);
  });
  i.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      if (!canEdit) return;
      cb(i.value);
      i.blur();
    }
  });
  return i;
}

/**
 * Create a textarea element
 * @param {string} v - Initial value
 * @param {string} ph - Placeholder text
 * @param {function} cb - Callback on blur
 * @param {boolean} disabled - Disable the textarea
 * @returns {HTMLTextAreaElement}
 */
function txt(v, ph, cb, disabled) {
  const t = el('textarea', 'ftxt');
  t.value = v || '';
  t.placeholder = ph || '';
  if (disabled) t.disabled = true;
  t.addEventListener('blur', () => {
    if (!canEdit) return;
    cb(t.value);
  });
  return t;
}

/**
 * Show a toast notification
 * @param {string} msg - Message to display
 * @param {string} type - Toast type ('saved', 'live', etc.)
 */
function showToast(msg, type = 'saved') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2200);
}

/**
 * Simple hash function for password obfuscation
 * @param {string} pw - Password to hash
 * @returns {string} Hash result
 */
function hashPw(pw) {
  let h = 0;
  for (let i = 0; i < pw.length; i++) {
    h = ((h << 5) - h) + pw.charCodeAt(i);
    h |= 0;
  }
  return h.toString(36);
}
