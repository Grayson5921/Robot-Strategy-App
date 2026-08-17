// ─────────────────────────────────────────────────────────────
// App Initialization
// Startup sequence, app launch, and role-based UI setup
// Note: Global variables are declared in index.html before module loading
// ─────────────────────────────────────────────────────────────

/**
 * Initialize and launch the app with a specific sheet
 * @param {string} sheetId - Sheet ID to load
 * @param {boolean} adminMode - Whether user is admin
 * @param {boolean} editMode - Whether user can edit
 */
function launchApp(sheetId, adminMode = false, editMode = false) {
  currentSheet = sheetId;
  isAdmin = adminMode;
  canEdit = editMode;

  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('picker-view').style.display = 'none';
  document.getElementById('app-view').style.display = 'block';
  
  document.getElementById('sheet-pill').textContent = currentSheet.name;
  updateUiState();
  loadAllSections();
  renderAll();
  subscribeRealtime();
}

/**
 * Update UI state based on current permissions
 */
function updateUiState() {
  const statusEl = document.getElementById('edit-status');
  if (statusEl) {
    statusEl.textContent = canEdit ? '✎ Edit Mode' : '👁 View Only';
    statusEl.className = canEdit ? 'status editing' : 'status viewing';
  }

  // Disable/enable form inputs
  document.querySelectorAll('input, textarea, select').forEach(el => {
    if (el.id !== 'search-input') el.disabled = !canEdit;
  });

  // Show/hide edit buttons
  document.querySelectorAll('.del-btn, .sm-btn').forEach(btn => {
    btn.style.display = canEdit ? '' : 'none';
  });
}

/**
 * Return to sheet picker
 */
function backToPicker() {
  currentSheet = null;
  isAdmin = false;
  canEdit = false;

  const appView = document.getElementById('app-view');
  const pickerView = document.getElementById('picker-view');

  if (appView) appView.style.display = 'none';
  if (pickerView) pickerView.style.display = 'flex';

  renderSheetList();
}

/**
 * Global window error handler
 */
window.onerror = function(msg, url, line, col, err) {
  console.error('Error:', msg, 'at', url, ':', line, ':', col);
  showToast('Error: ' + msg, 'error');
  return false;
};

/**
 * Initialize app on page load
 */
window.addEventListener('load', () => {
  // Check if there's a current sheet in session
  if (currentSheet) {
    launchApp(currentSheet, isAdmin, canEdit);
  } else {
    // Show picker
    const pickerView = document.getElementById('picker-view');
    if (pickerView) pickerView.style.display = 'flex';
    renderSheetList();
  }
});
