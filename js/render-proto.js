// ─────────────────────────────────────────────────────────────
// Prototype Section Renderer
// Prototyping tasks with lead, members, and priority assignment
// ─────────────────────────────────────────────────────────────

/**
 * Render Prototype section with task list
 */
function renderProto() {
  const c = document.getElementById('proto-body');
  if (!c) return;
  c.innerHTML = '';
  const pt = D.proto;
  if (!pt) return;

  const ib = el('div', 'info-box');
  ib.textContent =
    'Be specific and detailed. State if CAD is required. Each task must be replicated in the EN with the end result.';
  c.appendChild(ib);

  const card = el('div', 'card');
  const ct = el('div', 'ctitle');
  ct.textContent = 'Tasks';
  card.appendChild(ct);

  const tbl = el('table', 'dtbl');
  tbl.innerHTML =
    '<thead><tr><th>Task</th><th>Lead</th><th>Group Members</th><th>Priority</th>' +
    (canEdit ? '<th></th>' : '') +
    '</tr></thead>';

  const tbody = el('tbody');
  (pt.tasks || []).forEach((task, ti) => {
    const tr = el('tr');

    const tdT = el('td');
    tdT.appendChild(txt(task.task, 'Task description...', v => { task.task = v; changed('proto'); }, !canEdit));
    tr.appendChild(tdT);

    const tdL = el('td');
    tdL.appendChild(
      sel(['',...(D.wg?.students || [])], task.lead, v => { task.lead = v; changed('proto'); }, !canEdit)
    );
    tr.appendChild(tdL);

    const tdM = el('td');
    tdM.appendChild(inp(task.members, 'Members...', v => { task.members = v; changed('proto'); }, !canEdit));
    tr.appendChild(tdM);

    const tdP = el('td');
    tdP.appendChild(sel(PRI, task.pri, v => { task.pri = v; changed('proto'); }, !canEdit));
    tr.appendChild(tdP);

    if (canEdit) {
      const tdD = el('td');
      const db = el('button', 'del-btn');
      db.textContent = '✕';
      db.onclick = () => {
        pt.tasks.splice(ti, 1);
        renderProto();
        changed('proto');
      };
      tdD.appendChild(db);
      tr.appendChild(tdD);
    }
    tbody.appendChild(tr);
  });

  if (canEdit) {
    const addTr = el('tr');
    const addTd = el('td');
    addTd.colSpan = 5;
    const addI = el('input', 'finp');
    addI.placeholder = '+ Add task (press Enter)...';
    addI.style.fontSize = '12px';
    addI.onkeydown = e => {
      if (e.key === 'Enter' && addI.value.trim()) {
        pt.tasks.push({ task: addI.value.trim(), lead: '', members: '', pri: '' });
        addI.value = '';
        renderProto();
        changed('proto');
      }
    };
    addTd.appendChild(addI);
    addTr.appendChild(addTd);
    tbody.appendChild(addTr);
  }

  tbl.appendChild(tbody);
  card.appendChild(tbl);
  c.appendChild(card);
}
