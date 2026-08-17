// ─────────────────────────────────────────────────────────────
// Main Rendering Coordinator
// Tab management and section dispatch
// ─────────────────────────────────────────────────────────────

/**
 * Show a tab and render its content
 * @param {string} id - Tab ID
 * @param {HTMLElement} btn - Tab button element
 */
function showTab(id, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById('tab-' + id);
  if (tab) tab.classList.add('active');
  if (btn) btn.classList.add('active');
  if (D && Object.keys(D).length > 0 && SECTIONS.includes(id)) {
    try {
      renderSection(id);
    } catch (e) {
      console.error('Tab render:', e);
    }
  }
}

/**
 * Render all sections
 */
function renderAll() {
  SECTIONS.forEach(sec => {
    try {
      renderSection(sec);
    } catch (e) {
      console.error('renderAll err', sec, e);
    }
  });
}

/**
 * Dispatch rendering to appropriate section renderer
 * @param {string} sec - Section name
 */
function renderSection(sec) {
  const nEl = document.getElementById('n-' + sec);
  if (nEl) {
    nEl.value = D[sec]?.notes || '';
    nEl.disabled = !canEdit;
  }
  switch (sec) {
    case 'plan':
      renderPlan();
      break;
    case 'wg':
      renderWG();
      break;
    case 'gr':
      renderGR();
      break;
    case 'cpm':
      renderCPM();
      break;
    case 'strat':
      renderStrat();
      break;
    case 'specs':
      renderSpecs();
      break;
    case 'proto':
      renderProto();
      break;
    case 'eval':
      renderEval();
      break;
  }
}
