// ─────────────────────────────────────────────────────────────
// Strategy Section Renderer
// Strategy summary, archetypes, SWOT, and solution tables
// ─────────────────────────────────────────────────────────────

/**
 * Render Strategy section with summary, archetypes, SWOT, and solutions
 */
function renderStrat() {
  const c = document.getElementById('strat-body');
  if (!c) return;
  c.innerHTML = '';
  const st = D.strat;
  if (!st) return;

  // Strategy Summary
  const sCard = el('div', 'card');
  sCard.style.borderLeft = '3px solid var(--accent)';
  const st2 = el('div', 'ctitle');
  st2.textContent = 'Strategy Summary';
  sCard.appendChild(st2);
  sCard.appendChild(
    txt(st.summary, 'Enter overall game strategy summary...', v => { st.summary = v; changed('strat'); }, !canEdit)
  );
  c.appendChild(sCard);

  // Archetypes
  const aCard = el('div', 'card');
  const at = el('div', 'ctitle');
  at.textContent = 'Anticipated Robot Archetypes';
  aCard.appendChild(at);

  const aTbl = el('table', 'dtbl');
  aTbl.innerHTML =
    '<thead><tr><th>Archetype</th><th>Pros/Cons</th><th>CPM</th><th>Score Potential</th>' +
    (canEdit ? '<th></th>' : '') +
    '</tr></thead>';

  const aBody = el('tbody');
  (st.archetypes || []).forEach((a, ai) => {
    const tr = el('tr');
    [
      ['name', 'Archetype...'],
      ['pros', 'Pros/Cons...'],
      ['cpm', 'CPM'],
      ['score', 'Score']
    ].forEach(([k, ph]) => {
      const td = el('td');
      td.appendChild(inp(a[k], ph, v => { a[k] = v; changed('strat'); }, !canEdit));
      tr.appendChild(td);
    });
    if (canEdit) {
      const tdD = el('td');
      const db = el('button', 'del-btn');
      db.textContent = '✕';
      db.onclick = () => {
        st.archetypes.splice(ai, 1);
        renderStrat();
        changed('strat');
      };
      tdD.appendChild(db);
      tr.appendChild(tdD);
    }
    aBody.appendChild(tr);
  });

  if (canEdit) {
    const addTr = el('tr');
    const addTd = el('td');
    addTd.colSpan = 5;
    const addI = el('input', 'finp');
    addI.placeholder = '+ Add archetype (press Enter)...';
    addI.style.fontSize = '12px';
    addI.onkeydown = e => {
      if (e.key === 'Enter' && addI.value.trim()) {
        st.archetypes.push({ name: addI.value.trim(), pros: '', cpm: '', score: '' });
        addI.value = '';
        renderStrat();
        changed('strat');
      }
    };
    addTd.appendChild(addI);
    addTr.appendChild(addTd);
    aBody.appendChild(addTr);
  }

  aTbl.appendChild(aBody);
  aCard.appendChild(aTbl);
  c.appendChild(aCard);

  // SWOT Analysis
  const swCard = el('div', 'card');
  const swT = el('div', 'ctitle');
  swT.textContent = 'SWOT Analysis';
  swCard.appendChild(swT);

  const swGrid = el('div', 'swot-grid');
  [
    ['S', 'Strengths', 's'],
    ['W', 'Weaknesses', 'w'],
    ['O', 'Opportunities', 'o'],
    ['T', 'Threats + Countermeasures', 't']
  ].forEach(([cls, lbl, k]) => {
    const cell = el('div', 'swot-cell ' + cls);
    const sl = el('div', 'swot-lbl');
    sl.textContent = lbl;
    cell.appendChild(sl);
    cell.appendChild(
      txt(st.swot[k], 'Enter ' + lbl.toLowerCase() + '...', v => { st.swot[k] = v; changed('strat'); }, !canEdit)
    );
    swGrid.appendChild(cell);
  });
  swCard.appendChild(swGrid);
  c.appendChild(swCard);

  // Helper for dynamic tables
  function stT(title, rows, cols, newRowFn) {
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
          td.appendChild(sel(col.opts, row[col.k], v => { row[col.k] = v; changed('strat'); }, !canEdit));
        else
          td.appendChild(inp(row[col.k], col.ph || '', v => { row[col.k] = v; changed('strat'); }, !canEdit));
        tr.appendChild(td);
      });
      if (canEdit) {
        const tdD = el('td');
        const db = el('button', 'del-btn');
        db.textContent = '✕';
        db.onclick = () => {
          rows.splice(ri, 1);
          renderStrat();
          changed('strat');
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
      addI.placeholder = '+ Add (press Enter)...';
      addI.style.fontSize = '12px';
      addI.onkeydown = e => {
        if (e.key === 'Enter' && addI.value.trim()) {
          rows.push(newRowFn(addI.value.trim()));
          addI.value = '';
          renderStrat();
          changed('strat');
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
    stT(
      'Engineering Solutions',
      st.eng,
      [
        { lbl: 'Subsystem', k: 'sub', ph: 'Subsystem...' },
        { lbl: 'Capability', k: 'cap', ph: 'Capability...' },
        { lbl: 'Benefit', k: 'ben', ph: 'Benefit...' },
        { lbl: 'Difficulty', k: 'diff', opts: DIFF }
      ],
      v => ({ sub: v, cap: '', ben: '', diff: '' })
    )
  );

  c.appendChild(
    stT(
      'Programming Solutions',
      st.prog,
      [
        { lbl: 'Capability', k: 'cap', ph: 'Capability...' },
        { lbl: 'Benefit', k: 'ben', ph: 'Benefit...' },
        { lbl: 'Difficulty', k: 'diff', opts: DIFF },
        { lbl: 'Value', k: 'val', opts: VAL }
      ],
      v => ({ cap: v, ben: '', diff: '', val: '' })
    )
  );
}
