// ─────────────────────────────────────────────────────────────
// Authentication Module
// Login, admin panel, and password management
// ─────────────────────────────────────────────────────────────

// ADMIN PASSWORD (hashed)
// Change this to set your admin password. Current password: Mercs6369
const ADMIN_PW_HASH = hashPw('Mercs6369');

/**
 * Show admin login form
 */
function showAdminLogin() {
  document.getElementById('admin-login-form').style.display = 'block';
  setTimeout(() => document.getElementById('admin-pw-inp').focus(), 50);
}

/**
 * Submit admin login form
 */
function submitAdminLogin() {
  const pw = document.getElementById('admin-pw-inp').value;
  if (hashPw(pw) === ADMIN_PW_HASH) {
    isAdmin = true;
    document.getElementById('admin-login-err').style.display = 'none';
    document.getElementById('admin-pw-inp').value = '';
    enterPicker(true);
  } else {
    document.getElementById('admin-login-err').style.display = 'block';
    document.getElementById('admin-pw-inp').value = '';
    document.getElementById('admin-pw-inp').focus();
  }
}

/**
 * Login as guest (view-only for protected sheets)
 */
function loginGuest() {
  isAdmin = false;
  enterPicker(false);
}

/**
 * Enter sheet picker interface
 * @param {boolean} admin - Whether logged in as admin
 */
function enterPicker(admin) {
  document.getElementById('picker-view').style.display = 'flex';
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('picker-sub').textContent = admin
    ? 'Logged in as Admin · 2026'
    : 'Viewing as Guest · 2026';
  document.getElementById('picker-role-lbl').textContent = admin ? 'ADMIN' : 'GUEST';
  document.getElementById('admin-create-area').style.display = admin ? 'block' : 'none';
  document.getElementById('guest-open-area').style.display = admin ? 'none' : 'block';
  loadSheets();
  subscribeSheetsList();
}

/**
 * Logout and return to login screen
 */
function logoutToLogin() {
  if (realtimeSub) {
    sb.removeChannel(realtimeSub);
    realtimeSub = null;
  }
  if (sheetsRTSub) {
    sb.removeChannel(sheetsRTSub);
    sheetsRTSub = null;
  }
  currentSheet = null;
  canEdit = false;
  isAdmin = false;
  D = {};
  document.getElementById('picker-view').style.display = 'none';
  document.getElementById('app-view').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-login-form').style.display = 'none';
}

/**
 * Show password modal for protected sheets
 */
function showPwModal() {
  document.getElementById('pw-modal').classList.add('show');
  document.getElementById('pw-input').value = '';
  document.getElementById('pw-err').classList.remove('show');
  setTimeout(() => document.getElementById('pw-input').focus(), 100);
}

/**
 * Close password modal
 */
function closePwModal() {
  document.getElementById('pw-modal').classList.remove('show');
}

/**
 * Submit password for sheet access
 */
function submitPw() {
  const pw = document.getElementById('pw-input').value;
  if (!pw) return;
  if (hashPw(pw) === currentSheet.password_hash) {
    canEdit = true;
    closePwModal();
    launchApp(currentSheet, isAdmin, canEdit);
  } else {
    document.getElementById('pw-err').classList.add('show');
    document.getElementById('pw-input').value = '';
  }
}

/**
 * Open sheet in view-only mode without editing
 */
function openViewOnly() {
  canEdit = false;
  closePwModal();
  launchApp(currentSheet, isAdmin, canEdit);
}
