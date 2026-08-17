// ─────────────────────────────────────────────────────────────
// Game Rules Section Renderer
// Intake, scoring, penalties, constraints, and Q&A tables
// ─────────────────────────────────────────────────────────────

/**
 * Render Game Rules section with multiple data tables
 */
function renderGR() {
  const c = document.getElementById('gr-body');
  if (!c) return;
  c.innerHTML = '';
  const gr = D.gr;
  if (!gr) return;

  /**
   * Helper to create a data table with rows
   * @param {string} title - Table title
   * @param {array} rows - Data rows
   * @param {array} cols - Column definitions
   * @param {function} newRowFn - Function to create new row
   * @returns {HTMLElement} Card containing table
   */
  function grT(title, rows, cols, newRowFn) {
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
          td.appendChild(sel(col.opts, row[col.k], v => { row[col.k] = v; changed('gr'); }, !canEdit));
        else
          td.appendChild(inp(row[col.k], col.ph || '', v => { row[col.k] = v; changed('gr'); }, !canEdit));
        tr.appendChild(td);
      });
      if (canEdit) {
        const tdD = el('td');
        const db = el('button', 'del-btn');
        db.textContent = '✕';
        db.onclick = () => {
          rows.splice(ri, 1);
          renderGR();
          changed('gr');
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
          renderGR();
          changed('gr');
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
    grT(
      'Intaking Locations',
      gr.intake,
      [
        { lbl: 'Location', k: 'loc', ph: 'Location...' },
        { lbl: 'Difficulty', k: 'diff', opts: DIFF },
        { lbl: 'Value', k: 'val', opts: VAL }
      ],
      v => ({ loc: v, diff: '', val: '' })
    )
  );

  c.appendChild(
    grT(
      'Ranking Points',
      gr.rp,
      [
        { lbl: 'Task', k: 'task', ph: 'Task...' },
        { lbl: 'Location', k: 'loc', ph: 'e.g. Wing, Stage...' },
        { lbl: 'Points', k: 'pts', ph: 'Pts' },
        { lbl: 'Difficulty', k: 'diff', opts: DIFF }
      ],
      v => ({ task: v, loc: '', pts: '', diff: '' })
    )
  );

  c.appendChild(
    grT(
      'Scoring',
      gr.scoring,
      [
        { lbl: 'Task', k: 'task', ph: 'Task...' },
        { lbl: 'Location', k: 'loc', ph: 'e.g. Speaker, Amp...' },
        { lbl: 'Points', k: 'pts', ph: 'Pts' },
        { lbl: 'Difficulty', k: 'diff', opts: DIFF }
      ],
      v => ({ task: v, loc: '', pts: '', diff: '' })
    )
  );

  c.appendChild(
    grT(
      'Points Per Second',
      gr.pps,
      [
        { lbl: 'Task', k: 'task', ph: 'Task...' },
        { lbl: 'Time/Cycle', k: 'time', ph: 'sec' },
        { lbl: 'Pts/Sec', k: 'pps', ph: 'pts/s' }
      ],
      v => ({ task: v, time: '', pps: '' })
    )
  );

  const g2 = el('div', 'grid2');
  g2.appendChild(
    grT(
      'Defense Opportunities',
      gr.defense,
      [
        { lbl: 'Task', k: 'task', ph: 'Task...' },
        { lbl: 'Location', k: 'loc', ph: 'e.g. Wing, Mid...' },
        { lbl: 'Difficulty', k: 'diff', opts: DIFF },
        { lbl: 'Value', k: 'val', opts: VAL }
      ],
      v => ({ task: v, loc: '', diff: '', val: '' })
    )
  );
  g2.appendChild(
    grT(
      'Penalties',
      gr.penalty,
      [
        { lbl: 'Task', k: 'task', ph: 'Task...' },
        { lbl: 'Location', k: 'loc', ph: 'e.g. Opponent Zone...' },
        { lbl: 'Penalty Pts', k: 'pts', ph: 'Pts' },
        { lbl: 'Impact', k: 'impact', opts: DIFF }
      ],
      v => ({ task: v, loc: '', pts: '', impact: '' })
    )
  );
  c.appendChild(g2);

  c.appendChild(
    grT(
      'Design Constraints',
      gr.constraints,
      [
        { lbl: 'Constraint', k: 'name', ph: 'Constraint...' },
        { lbl: 'Value', k: 'val', ph: 'Value...' }
      ],
      v => ({ name: v, val: '' })
    )
  );

  c.appendChild(
    grT(
      'Rules Q&A',
      gr.qa,
      [
        { lbl: 'Question', k: 'q', ph: 'Question...' },
        { lbl: 'Answer', k: 'a', ph: 'Answer...' }
      ],
      v => ({ q: v, a: '' })
    )
  );
}
