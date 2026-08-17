// ─────────────────────────────────────────────────────────────
// CPM Section Renderer
// Cycles per match analysis with field simulator
// ─────────────────────────────────────────────────────────────

// Track active CPM tab
let cpmActiveTab = 0;

/**
 * Render CPM Analysis section with subtabs and simulator
 */
function renderCPM() {
  const cpm = D.cpm;
  if (!cpm) return;

  if (!cpm.setups) {
    cpm.setups = Array.from({ length: 10 }, (_, i) => ({
      label: 'Setup ' + (i + 1),
      scenario: '',
      cycles: '',
      points: '',
      time: '',
      intake: '',
      recover: '',
      spinup: '',
      speed: '',
      window: '',
      analysis: ''
    }));
  }

  const nav = document.getElementById('cpm-subtab-nav');
  const body = document.getElementById('cpm-subtab-body');
  if (!nav || !body) return;

  nav.innerHTML = '';
  cpm.setups.forEach((setup, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (i === cpmActiveTab ? ' active' : '');
    btn.style.cssText = 'font-size:11px;padding:10px 13px;';
    const nameEl = document.createElement('span');
    nameEl.textContent = setup.label || 'Setup ' + (i + 1);
    btn.appendChild(nameEl);
    btn.onclick = () => {
      cpmActiveTab = i;
      renderCPM();
    };
    nav.appendChild(btn);
  });

  body.innerHTML = '';
  const setup = cpm.setups[cpmActiveTab];

  const labelRow = document.createElement('div');
  labelRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:1rem;';
  const labelLbl = document.createElement('span');
  labelLbl.style.cssText = 'font-size:12px;color:var(--muted);font-family:"IBM Plex Mono",monospace;';
  labelLbl.textContent = 'Tab name:';

  const labelInp = document.createElement('input');
  labelInp.className = 'finp';
  labelInp.style.cssText = 'max-width:200px;';
  labelInp.value = setup.label || '';
  labelInp.placeholder = 'Setup ' + (cpmActiveTab + 1);
  labelInp.disabled = !canEdit;
  labelInp.oninput = () => {
    setup.label = labelInp.value;
    const navBtns = nav.querySelectorAll('.tab-btn');
    if (navBtns[cpmActiveTab]) {
      navBtns[cpmActiveTab].querySelector('span').textContent =
        labelInp.value || 'Setup ' + (cpmActiveTab + 1);
    }
    changed('cpm');
  };

  labelRow.appendChild(labelLbl);
  labelRow.appendChild(labelInp);
  body.appendChild(labelRow);
}
