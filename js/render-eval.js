// ─────────────────────────────────────────────────────────────
// Evaluation Section Renderer
// Concept evaluation with photos, matrices, and risk assessment
// ─────────────────────────────────────────────────────────────

/**
 * Render Evaluation section with concepts, matrices, and risk assessment
 */
function renderEval() {
  const c = document.getElementById('eval-body');
  if (!c) return;
  c.innerHTML = '';
  const ev = D.eval;
  if (!ev) return;

  if (!ev.concepts) ev.concepts = [{ name: 'Concept 1', desc: '', photo: null }];

  // CONCEPTS WITH PHOTOS
  const conCard = el('div', 'card');
  const conTitle = el('div', 'ctitle');
  conTitle.textContent = 'Design Concepts';
  conCard.appendChild(conTitle);

  const conGrid = el('div');
  conGrid.style.cssText =
    'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;margin-bottom:0.75rem;';

  ev.concepts.forEach((concept, ci) => {
    const cell = el('div');
    cell.style.cssText =
      'background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;display:flex;flex-direction:column;gap:8px;';

    const photoWrap = el('div');
    photoWrap.style.cssText =
      'width:100%;aspect-ratio:4/3;background:var(--bg2);border:1px dashed var(--border2);border-radius:4px;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;position:relative;';

    if (concept.photo) {
      const img = el('img');
      img.src = concept.photo;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      photoWrap.appendChild(img);

      if (canEdit) {
        const rmPhoto = el('button');
        rmPhoto.textContent = 'x';
        rmPhoto.style.cssText =
          'position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.7);color:#fff;border:none;border-radius:3px;padding:2px 6px;cursor:pointer;font-size:11px;';
        rmPhoto.onclick = e2 => {
          e2.stopPropagation();
          concept.photo = null;
          renderEval();
          changed('eval');
        };
        photoWrap.appendChild(rmPhoto);
      }
    } else {
      const ph = el('div');
      ph.style.cssText = 'text-align:center;color:var(--dim);font-size:12px;padding:1rem;';
      ph.textContent = canEdit ? 'Click to upload photo' : 'No photo';
      photoWrap.appendChild(ph);
    }

    if (canEdit) {
      const fileInp = el('input');
      fileInp.type = 'file';
      fileInp.accept = 'image/*';
      fileInp.style.display = 'none';
      fileInp.onchange = ev2 => {
        const f = ev2.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = ev3 => {
          concept.photo = ev3.target.result;
          renderEval();
          changed('eval');
        };
        r.readAsDataURL(f);
      };
      photoWrap.appendChild(fileInp);
      photoWrap.onclick = () => {
        if (!concept.photo) fileInp.click();
      };
    }
    cell.appendChild(photoWrap);

    const nameInp = inp(concept.name, 'Concept name...', v => { concept.name = v; renderEval(); changed('eval'); }, !canEdit);
    nameInp.style.fontWeight = '600';
    cell.appendChild(nameInp);

    const descTxt = txt(concept.desc, 'Brief description...', v => { concept.desc = v; changed('eval'); }, !canEdit);
    descTxt.style.minHeight = '54px';
    cell.appendChild(descTxt);

    if (canEdit && ev.concepts.length > 1) {
      const delBtn = el('button');
      delBtn.textContent = 'Remove';
      delBtn.style.cssText =
        'background:none;border:1px solid var(--border2);color:var(--muted);font-size:11px;padding:4px 8px;border-radius:4px;cursor:pointer;';
      delBtn.onclick = () => {
        ev.concepts.splice(ci, 1);
        renderEval();
        changed('eval');
      };
      cell.appendChild(delBtn);
    }
    conGrid.appendChild(cell);
  });
  conCard.appendChild(conGrid);

  if (canEdit) {
    const addConBtn = el('button');
    addConBtn.style.cssText =
      'background:none;border:1px dashed var(--dim);border-radius:4px;color:var(--dim);font-size:12px;font-family:"IBM Plex Mono",monospace;padding:8px;width:100%;text-align:center;cursor:pointer;margin-top:4px;';
    addConBtn.textContent = '+ Add concept';
    addConBtn.onclick = () => {
      ev.concepts.push({ name: 'Concept ' + (ev.concepts.length + 1), desc: '', photo: null });
      renderEval();
      changed('eval');
    };
    conCard.appendChild(addConBtn);
  }
  c.appendChild(conCard);

  // OVERVIEW + SIMPLICITY TABLES
  const conceptNames = ['Baseline',...ev.concepts.map(con => con.name || 'Concept')];

  function evT(title, rows, labelKey, labelHdr) {
    const card = el('div', 'card');
    const ct = el('div', 'ctitle');
    ct.textContent = title;
    card.appendChild(ct);

    const tbl = el('table', 'dtbl');
    const thead = el('thead');
    const htr = el('tr');
    htr.innerHTML =
      '<th>' + labelHdr + '</th>' +
      conceptNames.map(n => '<th>' + n + '</th>').join('') +
      (canEdit ? '<th></th>' : '');
    thead.appendChild(htr);
    tbl.appendChild(thead);

    const tbody = el('tbody');
    rows.forEach((row, ri) => {
      const tr = el('tr');
      const td0 = el('td');
      td0.appendChild(inp(row[labelKey], '...', v => { row[labelKey] = v; changed('eval'); }, !canEdit));
      tr.appendChild(td0);

      const keys = ['base',...ev.concepts.map((_, i) => 'c' + i)];
      keys.forEach(k => {
        if (row[k] === undefined) row[k] = '';
        const td = el('td');
        td.appendChild(inp(row[k], '—', v => { row[k] = v; changed('eval'); }, !canEdit));
        tr.appendChild(td);
      });

      if (canEdit) {
        const tdD = el('td');
        const db = el('button', 'del-btn');
        db.textContent = 'x';
        db.onclick = () => {
          rows.splice(ri, 1);
          renderEval();
          changed('eval');
        };
        tdD.appendChild(db);
        tr.appendChild(tdD);
      }
      tbody.appendChild(tr);
    });

    if (canEdit) {
      const addTr = el('tr');
      const addTd = el('td');
      addTd.colSpan = conceptNames.length + 2;
      const addI = el('input', 'finp');
      addI.placeholder = '+ Add row (press Enter)...';
      addI.style.fontSize = '12px';
      addI.onkeydown = e => {
        if (e.key === 'Enter' && addI.value.trim()) {
          const r = { base: '' };
          ev.concepts.forEach((_, i) => {
            r['c' + i] = '';
          });
          r[labelKey] = addI.value.trim();
          rows.push(r);
          addI.value = '';
          renderEval();
          changed('eval');
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

  c.appendChild(evT('Concept Overview', ev.overview, 'c', 'Criteria'));
  c.appendChild(evT('Simplicity Level', ev.simplicity, 'm', 'Metric'));

  // DESIGN RISK MATRIX - included in separate function
  renderEvalRiskMatrix(c, ev);

  // WEIGHTED MATRIX
  renderEvalWeightedMatrix(c, ev);
}

/**
 * Render risk matrix section
 * @param {HTMLElement} c - Container
 * @param {object} ev - Eval data
 */
function renderEvalRiskMatrix(c, ev) {
  const dmCard = el('div', 'card');
  dmCard.style.cssText = 'border-color:rgba(230,58,46,0.2);';
  const dmTitle = el('div', 'ctitle');
  dmTitle.textContent = 'Design Risk Matrix';
  dmCard.appendChild(dmTitle);

  const dmDesc = el('p');
  dmDesc.style.cssText = 'font-size:12px;color:var(--muted);margin-bottom:1rem;';
  dmDesc.textContent =
    'Each cell shows which concept fits that consequence/risk combination. Green = low risk, Yellow = medium, Red = high.';
  dmCard.appendChild(dmDesc);

  const defaultColors = [
    ['green', 'green', 'green'],
    ['green', 'yellow', 'yellow'],
    ['green', 'yellow', 'red']
  ];

  if (!ev.riskMatrix) {
    ev.riskMatrix = {
      rows: [
        {
          label: 'Small Consequence',
          cells: [
            { color: 'green', conceptIdxs: [] },
            { color: 'green', conceptIdxs: [] },
            { color: 'green', conceptIdxs: [] }
          ]
        },
        {
          label: 'Medium Consequence',
          cells: [
            { color: 'green', conceptIdxs: [] },
            { color: 'yellow', conceptIdxs: [] },
            { color: 'yellow', conceptIdxs: [] }
          ]
        },
        {
          label: 'High Consequence',
          cells: [
            { color: 'green', conceptIdxs: [] },
            { color: 'yellow', conceptIdxs: [] },
            { color: 'red', conceptIdxs: [] }
          ]
        }
      ],
      riskLevels: ['Low Risk', 'Medium Risk', 'High Risk']
    };
  }

  ev.riskMatrix.rows.forEach((row, ri) => {
    while (row.cells.length < ev.riskMatrix.riskLevels.length) {
      const ci = row.cells.length;
      const color = (defaultColors[ri] && defaultColors[ri][ci]) || 'green';
      row.cells.push({ color, conceptIdxs: [] });
    }
  });

  const colorMap = {
    green: 'rgba(46,204,113,0.25)',
    yellow: 'rgba(245,166,35,0.35)',
    red: 'rgba(230,58,46,0.35)'
  };
  const conceptOptions = ev.concepts.map((con, i) => ({
    label: con.name || 'Concept ' + (i + 1),
    value: i
  }));

  const dmTbl = el('table', 'dtbl');
  dmTbl.style.cssText = 'table-layout:fixed;width:100%;';
  const dmHead = el('thead');
  const dmHtr = el('tr');

  const th0 = el('th');
  th0.style.cssText = 'width:130px;font-size:11px;color:var(--muted);';
  th0.textContent = 'Consequence / Risk';
  dmHtr.appendChild(th0);

  ev.riskMatrix.riskLevels.forEach((rl, ri) => {
    const th = el('th');
    if (canEdit) {
      const i = inp(rl, 'Risk level...', v => { ev.riskMatrix.riskLevels[ri] = v; changed('eval'); });
      th.appendChild(i);
    } else {
      th.textContent = rl;
    }
    dmHtr.appendChild(th);
  });

  dmHead.appendChild(dmHtr);
  dmTbl.appendChild(dmHead);

  const dmBody = el('tbody');
  ev.riskMatrix.rows.forEach((row, ri) => {
    const tr = el('tr');
    const tdLbl = el('td');
    tdLbl.style.cssText = 'font-size:12px;font-weight:500;padding:8px;background:var(--bg3);vertical-align:middle;';
    if (canEdit) {
      const i = inp(row.label, 'Consequence...', v => { row.label = v; changed('eval'); });
      tdLbl.appendChild(i);
    } else {
      tdLbl.textContent = row.label;
    }
    tr.appendChild(tdLbl);

    row.cells.forEach((cell, ci) => {
      if (!Array.isArray(cell.conceptIdxs)) {
        cell.conceptIdxs = cell.conceptIdx != null ? [cell.conceptIdx] : [];
        delete cell.conceptIdx;
      }

      const td = el('td');
      td.style.cssText = 'background:' + colorMap[cell.color || 'green'] + ';padding:8px;vertical-align:top;';

      const tagsDiv = el('div');
      tagsDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;min-height:24px;';

      cell.conceptIdxs.forEach((idx, ti) => {
        const con = ev.concepts[idx];
        if (!con) return;
        const tag = el('span');
        tag.style.cssText =
          'background:rgba(0,0,0,0.4);color:var(--text);border-radius:100px;padding:2px 8px;font-size:11px;display:inline-flex;align-items:center;gap:4px;';
        tag.textContent = con.name || 'Concept ' + (idx + 1);
        if (canEdit) {
          const rm = el('span');
          rm.textContent = '×';
          rm.style.cssText = 'cursor:pointer;opacity:0.6;font-size:12px;';
          rm.onclick = () => {
            cell.conceptIdxs.splice(ti, 1);
            renderEval();
            changed('eval');
          };
          tag.appendChild(rm);
        }
        tagsDiv.appendChild(tag);
      });
      td.appendChild(tagsDiv);

      if (canEdit) {
        const addSel = document.createElement('select');
        addSel.style.cssText =
          'width:100%;font-size:12px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);color:var(--text);border-radius:4px;padding:4px 7px;cursor:pointer;margin-bottom:5px;';
        const defOpt = document.createElement('option');
        defOpt.value = '';
        defOpt.textContent = '+ Add concept...';
        addSel.appendChild(defOpt);

        conceptOptions.forEach(opt => {
          if (cell.conceptIdxs.includes(opt.value)) return;
          const o = document.createElement('option');
          o.value = opt.value;
          o.textContent = opt.label;
          addSel.appendChild(o);
        });

        addSel.onchange = () => {
          const v = parseInt(addSel.value);
          if (!isNaN(v) && !cell.conceptIdxs.includes(v)) {
            cell.conceptIdxs.push(v);
            renderEval();
            changed('eval');
          }
          addSel.value = '';
        };
        td.appendChild(addSel);

        const colorSel = document.createElement('select');
        colorSel.style.cssText =
          'width:100%;font-size:11px;background:rgba(0,0,0,0.35);border:none;color:var(--text);border-radius:3px;padding:2px;cursor:pointer;';
        [
          ['green', '🟢 Low risk'],
          ['yellow', '🟡 Med risk'],
          ['red', '🔴 High risk']
        ].forEach(([v, lbl]) => {
          const o = document.createElement('option');
          o.value = v;
          o.textContent = lbl;
          if (v === cell.color) o.selected = true;
          colorSel.appendChild(o);
        });
        colorSel.onchange = () => {
          cell.color = colorSel.value;
          td.style.background = colorMap[cell.color];
          changed('eval');
        };
        td.appendChild(colorSel);
      }
      tr.appendChild(td);
    });
    dmBody.appendChild(tr);
  });

  if (canEdit) {
    const addTr = el('tr');
    const addTd = el('td');
    addTd.colSpan = ev.riskMatrix.riskLevels.length + 1;
    const addBtn = el('button');
    addBtn.style.cssText =
      'width:100%;background:none;border:1px dashed var(--dim);border-radius:4px;color:var(--dim);font-size:12px;padding:6px;cursor:pointer;margin-top:4px;';
    addBtn.textContent = '+ Add consequence row';
    addBtn.onclick = () => {
      const newCells = ev.riskMatrix.riskLevels.map(() => ({ color: 'green', conceptIdxs: [] }));
      ev.riskMatrix.rows.push({ label: 'Consequence', cells: newCells });
      renderEval();
      changed('eval');
    };
    addTd.appendChild(addBtn);
    addTr.appendChild(addTd);
    dmBody.appendChild(addTr);
  }

  dmTbl.appendChild(dmBody);
  dmCard.appendChild(dmTbl);
  c.appendChild(dmCard);
}

/**
 * Render weighted matrix section
 * @param {HTMLElement} c - Container
 * @param {object} ev - Eval data
 */
function renderEvalWeightedMatrix(c, ev) {
  const mCard = el('div', 'card');
  mCard.style.cssText = 'border-color:rgba(245,166,35,0.3);background:rgba(245,166,35,0.04);';
  const mTitle = el('div', 'ctitle');
  mTitle.textContent = 'Weighted Decision Matrix';
  mCard.appendChild(mTitle);

  const mDesc2 = el('p');
  mDesc2.style.cssText = 'font-size:12px;color:var(--muted);margin-bottom:1rem;';
  mDesc2.textContent = 'Assign value 1-5 for each concept. Higher is better. Totals auto-calculate.';
  mCard.appendChild(mDesc2);

  (ev.matrix || []).forEach((row, ri) => {
    const mRow = el('div', 'mx-row');
    const mLbl = el('div', 'mx-label');
    mLbl.appendChild(inp(row.lbl, 'Criterion...', v => { row.lbl = v; changed('eval'); }, !canEdit));
    mRow.appendChild(mLbl);

    const mScores = el('div', 'mx-scores');
    const allKeys = ['base',...ev.concepts.map((_, i) => 'c' + i)];
    const allLabels = ['Base',...ev.concepts.map(con => (con.name || 'C').substring(0, 4))];

    allKeys.forEach((k, ki) => {
      if (row[k] === undefined) row[k] = 0;
      const box = el('div', 'mx-box');
      const lbl = el('label');
      lbl.textContent = allLabels[ki];

      const i = el('input');
      i.type = 'number';
      i.min = 0;
      i.max = 5;
      i.className = 'mx-inp' + (ki > 0 ? ' c' : '');
      i.value = row[k] || 0;
      i.disabled = !canEdit;
      i.oninput = () => {
        if (!canEdit) return;
        row[k] = parseInt(i.value) || 0;
        updateTotals();
        changed('eval');
      };

      box.appendChild(lbl);
      box.appendChild(i);
      mScores.appendChild(box);
    });
    mRow.appendChild(mScores);

    const mD = el('div', 'mx-desc');
    mD.appendChild(inp(row.desc, 'Description...', v => { row.desc = v; changed('eval'); }, !canEdit));
    mRow.appendChild(mD);

    if (canEdit) {
      const db = el('button', 'del-btn');
      db.textContent = 'x';
      db.onclick = () => {
        ev.matrix.splice(ri, 1);
        renderEval();
        changed('eval');
      };
      mRow.appendChild(db);
    }
    mCard.appendChild(mRow);
  });

  if (canEdit) {
    const addRow = el('div');
    addRow.style.cssText = 'margin-top:8px;';
    const addI = el('input', 'finp');
    addI.placeholder = '+ Add criterion (press Enter)...';
    addI.style.fontSize = '12px';
    addI.onkeydown = e => {
      if (e.key === 'Enter' && addI.value.trim()) {
        const r = { lbl: addI.value.trim(), desc: '', base: 0 };
        ev.concepts.forEach((_, i) => {
          r['c' + i] = 0;
        });
        ev.matrix.push(r);
        addI.value = '';
        renderEval();
        changed('eval');
      }
    };
    addRow.appendChild(addI);
    mCard.appendChild(addRow);
  }

  const tots = el('div', 'mx-totals');
  tots.id = 'mx-totals';
  const totKeys = ['base',...ev.concepts.map((_, i) => 'c' + i)];
  const totLabels = ['Base',...ev.concepts.map(con => (con.name || 'C').substring(0, 8))];

  totKeys.forEach((k, i) => {
    const col = el('div', 'tot-col');
    col.innerHTML =
      '<div class="tot-lbl">' + totLabels[i] + '</div><div class="tot-val' + (i > 0 ? ' c' : '') + '" id="tot-' + k + '">0</div>';
    tots.appendChild(col);
  });

  mCard.appendChild(tots);
  c.appendChild(mCard);
  updateTotals();
}

/**
 * Update weighted matrix totals
 */
function updateTotals() {
  if (!D.eval?.matrix || !D.eval?.concepts) return;
  const keys = ['base',...D.eval.concepts.map((_, i) => 'c' + i)];
  keys.forEach(k => {
    const s = (D.eval.matrix || []).reduce((a, r) => a + (parseInt(r[k]) || 0), 0);
    const e = document.getElementById('tot-' + k);
    if (e) e.textContent = s;
  });
}
