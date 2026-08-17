// ─────────────────────────────────────────────────────────────
// Work Groups Section Renderer
// Student roster and subteam assignments
// ─────────────────────────────────────────────────────────────

/**
 * Render Work Groups section with student roster and teams
 */
function renderWG() {
  const c = document.getElementById('wg-body');
  if (!c) return;
  c.innerHTML = '';
  const wg = D.wg;
  if (!wg) return;

  // Student Roster
  const rCard = el('div', 'card');
  const rT = el('div', 'ctitle');
  rT.textContent = 'Student Roster';
  rCard.appendChild(rT);

  const pool = el('div', 'pool');
  (wg.students || []).forEach((s, si) => {
    const chip = el('span', 's-chip');
    chip.textContent = s;
    if (canEdit) {
      const rm = el('span');
      rm.textContent = ' ✕';
      rm.style.cssText = 'color:var(--dim);font-size:10px;cursor:pointer;margin-left:2px;';
      rm.onclick = () => {
        wg.students.splice(si, 1);
        wg.groups.forEach(g => {
          const i = g.members.indexOf(s);
          if (i > -1) g.members.splice(i, 1);
        });
        renderWG();
        changed('wg');
      };
      chip.appendChild(rm);
    }
    pool.appendChild(chip);
  });
  rCard.appendChild(pool);

  if (canEdit) {
    const addRow = el('div', 's-add-row');
    const sInp = el('input', 's-inp');
    sInp.placeholder = 'Add student name...';
    const sBtn = el('button', 'sm-btn');
    sBtn.textContent = '+ Add';
    sBtn.onclick = () => {
      const n = sInp.value.trim();
      if (n && !wg.students.includes(n)) {
        wg.students.push(n);
        sInp.value = '';
        renderWG();
        changed('wg');
      }
    };
    sInp.onkeydown = e => {
      if (e.key === 'Enter') sBtn.click();
    };
    addRow.appendChild(sInp);
    addRow.appendChild(sBtn);
    rCard.appendChild(addRow);
  }
  c.appendChild(rCard);

  // Subteams
  const ph = el('div', 'phase-lbl');
  ph.textContent = 'Design Subteams';
  c.appendChild(ph);

  const gCard = el('div', 'card');
  const gT = el('div', 'ctitle');
  gT.textContent = 'Subteam Assignments';
  gCard.appendChild(gT);

  const tbl = el('table', 'dtbl');
  tbl.innerHTML =
    '<thead><tr><th>Subteam</th><th>Lead</th><th>CAD Lead</th><th>Members</th>' +
    (canEdit ? '<th></th>' : '') +
    '</tr></thead>';

  const tbody = el('tbody');
  (wg.groups || []).forEach((g, gi) => {
    const tr = el('tr');

    const tdN = el('td');
    tdN.appendChild(inp(g.name, 'Subteam...', v => { g.name = v; changed('wg'); }, !canEdit));
    tr.appendChild(tdN);

    const tdL = el('td');
    tdL.appendChild(
      sel(['',...(wg.students || [])], g.lead, v => { g.lead = v; changed('wg'); }, !canEdit)
    );
    tr.appendChild(tdL);

    const tdC = el('td');
    tdC.appendChild(
      sel(['',...(wg.students || [])], g.cad, v => { g.cad = v; changed('wg'); }, !canEdit)
    );
    tr.appendChild(tdC);

    const tdM = el('td');
    const mList = el('div');
    mList.style.cssText = 'display:flex;flex-wrap:wrap;min-height:24px;';
    (g.members || []).forEach((m, mi) => {
      const tag = el('span', 'm-tag');
      tag.innerHTML = canEdit ? `${m} <span class="m-rm" onclick="rmMember(${gi},${mi})">✕</span>` : m;
      mList.appendChild(tag);
    });
    tdM.appendChild(mList);

    if (canEdit) {
      const mSel = sel(
        ['',...(wg.students || []).filter(s => !(g.members || []).includes(s))],
        '',
        v => {
          if (v) {
            if (!g.members) g.members = [];
            g.members.push(v);
            renderWG();
            changed('wg');
          }
        },
        !canEdit
      );
      mSel.options[0].textContent = '+ Add member';
      mSel.style.marginTop = '4px';
      tdM.appendChild(mSel);
    }
    tr.appendChild(tdM);

    if (canEdit) {
      const tdDel = el('td');
      const db = el('button', 'del-btn');
      db.textContent = '✕';
      db.onclick = () => {
        wg.groups.splice(gi, 1);
        renderWG();
        changed('wg');
      };
      tdDel.appendChild(db);
      tr.appendChild(tdDel);
    }
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  gCard.appendChild(tbl);

  if (canEdit) {
    const addRow = el('div');
    addRow.style.cssText = 'display:flex;gap:8px;margin-top:8px;';
    const grpInp = el('input', 'finp');
    grpInp.placeholder = '+ New subteam name (press Enter)...';
    grpInp.onkeydown = e => {
      if (e.key === 'Enter' && grpInp.value.trim()) {
        wg.groups.push({ name: grpInp.value.trim(), lead: '', cad: '', members: [] });
        grpInp.value = '';
        renderWG();
        changed('wg');
      }
    };
    addRow.appendChild(grpInp);
    gCard.appendChild(addRow);
  }
  c.appendChild(gCard);

  // Notes
  const ns = el('div', 'notes-sec');
  const nt = el('div', 'notes-ttl');
  nt.textContent = 'Notes';
  ns.appendChild(nt);
  const na = el('textarea', 'notes-area');
  na.id = 'n-wg';
  na.placeholder = 'Work group notes...';
  na.value = wg.notes || '';
  na.disabled = !canEdit;
  na.oninput = () => {
    wg.notes = na.value;
    changed('wg');
  };
  ns.appendChild(na);
  c.appendChild(ns);
}

/**
 * Remove a member from a subteam
 * @param {number} gi - Group index
 * @param {number} mi - Member index
 */
function rmMember(gi, mi) {
  if (!canEdit) return;
  D.wg.groups[gi].members.splice(mi, 1);
  renderWG();
  changed('wg');
}
