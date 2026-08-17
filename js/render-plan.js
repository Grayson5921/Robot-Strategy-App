// ─────────────────────────────────────────────────────────────
// Plan Section Renderer
// Displays project phases, sections, and task checklists
// ─────────────────────────────────────────────────────────────

/**
 * Render The Plan section with phases and checklists
 */
function renderPlan() {
  const c = document.getElementById('plan-body');
  if (!c) return;
  c.innerHTML = '';
  const p = D.plan;
  if (!p?.tasks) return;

  let lastPhase = '';
  p.tasks.forEach((g, gi) => {
    if (g.phase !== lastPhase) {
      const ph = el('div', 'phase-lbl');
      ph.textContent = g.phase;
      c.appendChild(ph);
      lastPhase = g.phase;
    }

    const card = el('div', 'card');
    const ct = el('div', 'ctitle');
    ct.textContent = g.section;
    card.appendChild(ct);

    const ul = el('ul', 'checklist');
    (g.items || []).forEach((item, ii) => {
      const li = el('li');
      const icon = el('span', 'chk' + (item.d ? ' done' : ''));
      icon.textContent = item.d ? '✓' : '';
      icon.onclick = () => {
        if (!canEdit) return;
        item.d = !item.d;
        icon.classList.toggle('done', item.d);
        icon.textContent = item.d ? '✓' : '';
        lbl.classList.toggle('done', item.d);
        changed('plan');
      };

      const lbl = el('span', 'chk-lbl' + (item.d ? ' done' : ''));
      lbl.textContent = item.t;

      const db = el('button', 'del-btn');
      db.textContent = '✕';
      db.style.display = canEdit ? '' : 'none';
      db.onclick = () => {
        if (!canEdit) return;
        g.items.splice(ii, 1);
        renderPlan();
        changed('plan');
      };

      li.appendChild(icon);
      li.appendChild(lbl);
      li.appendChild(db);
      ul.appendChild(li);
    });

    if (canEdit) {
      const addLi = el('li');
      addLi.style.paddingTop = '8px';
      const addInp = el('input', 'finp');
      addInp.placeholder = '+ Type task and press Enter...';
      addInp.style.fontSize = '13px';
      addInp.onkeydown = e => {
        if (e.key === 'Enter' && addInp.value.trim()) {
          g.items.push({ t: addInp.value.trim(), d: false });
          addInp.value = '';
          renderPlan();
          changed('plan');
        }
      };
      addLi.appendChild(addInp);
      ul.appendChild(addLi);
    }

    card.appendChild(ul);
    c.appendChild(card);
  });
}
