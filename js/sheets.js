// ─────────────────────────────────────────────────────────────
// Sheet Management Module
// CRUD operations for strategy worksheets
// ─────────────────────────────────────────────────────────────

/**
 * Load all sheets from database
 */
async function loadSheets() {
  const { data, error } = await sb
    .from('sheets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('loadSheets:', error);
    return;
  }
  sheets = data || [];
  renderSheetList();
}

/**
 * Render sheet list in picker
 */
function renderSheetList() {
  const list = document.getElementById('sheet-list');
  list.innerHTML = '';
  if (!sheets.length) {
    const d = el('div', 'no-sheets');
    d.textContent = isAdmin
      ? 'No sheets yet. Create one below!'
      : 'No sheets available.';
    list.appendChild(d);
    return;
  }

  sheets.forEach(sheet => {
    const item = el('div', 'sheet-item' + (currentSheet?.id === sheet.id ? ' active' : ''));

    if (isAdmin) {
      // Editable name for admins
      const nameInp = document.createElement('input');
      nameInp.className = 'sheet-name-inp';
      nameInp.value = sheet.name;
      nameInp.style.cssText =
        'flex:1;background:transparent;border:none;color:var(--text);font-size:14px;font-weight:500;font-family:"Barlow",sans-serif;outline:none;min-width:0;';
      nameInp.onclick = e => e.stopPropagation();
      nameInp.addEventListener('blur', async () => {
        const newName = nameInp.value.trim();
        if (!newName || newName === sheet.name) return;
        await sb.from('sheets').update({ name: newName }).eq('id', sheet.id);
        sheet.name = newName;
        if (currentSheet?.id === sheet.id) {
          currentSheet.name = newName;
          document.getElementById('sheet-pill').textContent = newName;
        }
      });
      nameInp.addEventListener('keydown', e => {
        if (e.key === 'Enter') nameInp.blur();
      });
      item.appendChild(nameInp);
    } else {
      const name = el('div', 'sheet-name');
      name.textContent = sheet.name;
      item.appendChild(name);
    }

    if (sheet.is_protected) {
      const lock = el('span', 'lock-icon');
      lock.textContent = '🔒';
      item.appendChild(lock);
    }
    const meta = el('div', 'sheet-meta');
    meta.textContent = new Date(sheet.created_at).toLocaleDateString();
    item.appendChild(meta);

    if (isAdmin) {
      const delBtn = el('button', 'sheet-del');
      delBtn.textContent = '✕';
      delBtn.title = 'Delete sheet';
      delBtn.onclick = async e => {
        e.stopPropagation();
        if (!confirm('Delete "' + sheet.name + '"? This cannot be undone.')) return;
        const { error } = await sb.from('sheets').delete().eq('id', sheet.id);
        if (error) {
          alert('Error deleting: ' + error.message);
          return;
        }
        if (currentSheet?.id === sheet.id) {
          currentSheet = null;
        }
        await loadSheets();
      };
      item.appendChild(delBtn);
    }

    item.onclick = () => {
      currentSheet = sheet;
      renderSheetList();
    };
    item.ondblclick = () => {
      currentSheet = sheet;
      openSheet();
    };
    list.appendChild(item);
  });
}

/**
 * Create a new sheet
 */
async function createSheet() {
  const name = document.getElementById('new-name').value.trim();
  if (!name) {
    alert('Please enter a sheet name.');
    return;
  }
  const pw = document.getElementById('new-pw').value;
  const isProtected = pw.length > 0;
  const pwHash = isProtected ? hashPw(pw) : null;
  const { data, error } = await sb
    .from('sheets')
    .insert({
      name,
      is_protected: isProtected,
      password_hash: pwHash,
      created_by: 'anonymous'
    })
    .select()
    .single();
  if (error) {
    alert('Error creating sheet: ' + error.message);
    return;
  }
  document.getElementById('new-name').value = '';
  document.getElementById('new-pw').value = '';
  currentSheet = data;
  canEdit = true;
  await loadSheets();
  openSheet();
}

/**
 * Open a sheet (with password check if needed)
 */
function openSheet() {
  if (!currentSheet) {
    alert('Select a sheet from the list first.');
    return;
  }
  if (currentSheet.is_protected && !canEdit) {
    // Admins bypass password on protected sheets
    if (isAdmin) {
      canEdit = true;
      launchApp(currentSheet, isAdmin, canEdit);
      return;
    }
    showPwModal();
    return;
  }
  // Admins can always edit; guests can only edit unprotected sheets if they enter pw
  if (isAdmin) canEdit = true;
  else if (!currentSheet.is_protected) canEdit = true;
  launchApp(currentSheet, isAdmin, canEdit);
}
