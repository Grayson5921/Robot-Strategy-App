// ─────────────────────────────────────────────────────────────
// Robot Specs Section Renderer
// Robot capabilities, qualities, and programming priorities
// ─────────────────────────────────────────────────────────────

/**
 * Render Robot Specs section with capabilities, qualities, and priorities
 */
function renderSpecs() {
  const c = document.getElementById('specs-body');
  if (!c) return;
  c.innerHTML = '';
  const sp = D.specs;
  if (!sp) return;

  /**
   * Helper to create spec table
   * @param {string} title - Table title
   * @param {array} rows - Data rows
   * @param {array} cols - Column definitions
   * @param {function} newRowFn - Function to create new row
   * @returns {HTMLElement} Card containing table
   */
  function spT(title, rows, cols, newRowFn) {
    const card = el('div', 'card');
    const ct = el('div', 'ctitle');
    ct.textContent = title;
    card.appendChild(ct);

    const tbl = el('table', 'dtbl');
    tbl.innerHTML =
      `<thead><tr>${cols.map(col => `<th>${col.lbl}</th>`).join('')}${canEdit ? '<th></th>' : ''}</tr></thead>`;

    const tbody = el('tbody');
    rows.forEach((row, ri) => {
      const tr = el('tr');
      cols.forEach(col => {
        const td = el('td');
        if (col.opts)
          td.appendChild(sel(col.opts, row[col.k], v => { row[col.k] = v; changed('specs'); }, !canEdit));
        else
          td.appendChild(inp(row[col.k], col.ph || '', v => { row[col.k] = v; changed('specs'); }, !canEdit));
        tr.appendChild(td);
      });
      if (canEdit) {
        const tdD = el('td');
        const db = el('button', 'del-btn');
        db.textContent = '✕';
        db.onclick = () => {
          rows.splice(ri, 1);
          renderSpecs();
          changed('specs');
        };
        tdD.appendChild(db);
        tr.appendChild(tdD);
      }
      tbody.appendChild(tr);
    });

    if (canEdit) {
      const addTr = el('tr');
      const addTd = el('td');
      addTd.colSpan = cols.length + 1;
      const addI = el('input', 'finp');
      addI.placeholder = '+ Add row (press Enter)...';
      addI.style.fontSize = '12px';
      addI.onkeydown = e => {
        if (e.key === 'Enter' && addI.value.trim()) {
          rows.push(newRowFn(addI.value.trim()));
          addI.value = '';
          renderSpecs();
          changed('specs');
        }
      };
      addTd.appendChild(addI);
      addTr.appendChild(addTd);
      tbody.appendChild(addTr);
    }

    tbl.appendChild(tbody);
    card.appendChild(tbl);
    return card;
  }

  c.appendChild(
    spT(
      'Robot Capabilities',
      sp.caps,
      [
        { lbl: 'Capability', k: 'name', ph: 'Capability...' },
        { lbl: 'Description', k: 'desc', ph: 'Description...' },
        { lbl: 'By When', k: 'when', opts: MS }
      ],
      v => ({ name: v, desc: '', when: '' })
    )
  );

  c.appendChild(
    spT(
      'Robot Qualities',
      sp.quals,
      [
        { lbl: 'Quality', k: 'name', ph: 'Quality...' },
        { lbl: 'Target', k: 'target', ph: 'Target...' },
        { lbl: 'Notes', k: 'notes', ph: 'Notes...' }
      ],
      v => ({ name: v, target: '', notes: '' })
    )
  );

  c.appendChild(
    spT(
      'Programming Priorities',
      sp.prog,
      [
        { lbl: 'Task', k: 'task', ph: 'Task...' },
        { lbl: 'By When', k: 'when', opts: MS },
        { lbl: 'Notes', k: 'notes', ph: 'Notes...' }
      ],
      v => ({ task: v, when: '', notes: '' })
    )
  );
}
