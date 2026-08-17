// ─────────────────────────────────────────────────────────────
// Field Simulator Module
// Canvas-based waypoint and path visualization
// ─────────────────────────────────────────────────────────────

let simState = {
  mode: 'place',  // 'place', 'move'
  img: null,
  imgLoaded: false,
  waypoints: [],
  path: [],
  selectedPoint: null,
  dragging: null,
  fieldW: 54,
  fieldH: 27,
  maxSpeed: 16,
  accel: 12
};

/**
 * Load and display field image
 */
function simLoadImg(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      simState.img = img;
      simState.imgLoaded = true;
      simDraw();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/**
 * Set simulator mode (place or move)
 */
function simSetMode(mode) {
  simState.mode = mode;
  const canvas = document.getElementById('sim-canvas');
  if (mode === 'place') {
    canvas.style.cursor = 'crosshair';
  } else {
    canvas.style.cursor = 'grab';
  }
}

/**
 * Clear all waypoints and path
 */
function simClearAll() {
  if (confirm('Clear all waypoints and path?')) {
    simState.waypoints = [];
    simState.path = [];
    simState.selectedPoint = null;
    simUpdateUI();
    simDraw();
  }
}

/**
 * Clear only the path
 */
function simClearPath() {
  if (confirm('Clear path?')) {
    simState.path = [];
    simUpdateUI();
    simDraw();
  }
}

/**
 * Get canvas coordinates from mouse event
 */
function simGetCoords(e) {
  const canvas = document.getElementById('sim-canvas');
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  
  simState.fieldW = parseFloat(document.getElementById('sim-fw').value) || 54;
  simState.fieldH = parseFloat(document.getElementById('sim-fh').value) || 27;
  
  const ftX = (x / canvas.width) * simState.fieldW;
  const ftY = (y / canvas.height) * simState.fieldH;
  
  return { x, y, ftX, ftY };
}

/**
 * Handle canvas mouse down
 */
function simCanvasMouseDown(e) {
  const { x, y } = simGetCoords(e);
  
  if (simState.mode === 'place') {
    // Place new waypoint
    const wp = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Waypoint ' + (simState.waypoints.length + 1),
      type: 'transit',
      x, y,
      duration: 0,
      desc: ''
    };
    simState.waypoints.push(wp);
    simState.selectedPoint = wp.id;
    simUpdateUI();
    simDraw();
  } else if (simState.mode === 'move') {
    // Check if clicking on existing waypoint
    for (const wp of simState.waypoints) {
      const dx = wp.x - x;
      const dy = wp.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < 8) {
        simState.dragging = wp.id;
        simState.selectedPoint = wp.id;
        simUpdateUI();
        document.getElementById('sim-canvas').style.cursor = 'grabbing';
        break;
      }
    }
  }
}

/**
 * Handle canvas mouse move
 */
function simCanvasMouseMove(e) {
  const canvas = document.getElementById('sim-canvas');
  
  if (simState.dragging) {
    const { x, y } = simGetCoords(e);
    const wp = simState.waypoints.find(w => w.id === simState.dragging);
    if (wp) {
      wp.x = Math.max(0, Math.min(x, canvas.width));
      wp.y = Math.max(0, Math.min(y, canvas.height));
      simDraw();
    }
  }
}

/**
 * Handle canvas mouse up
 */
function simCanvasMouseUp(e) {
  if (simState.dragging) {
    simState.dragging = null;
    document.getElementById('sim-canvas').style.cursor = 'grab';
    simUpdateUI();
  }
}

/**
 * Update waypoint display
 */
function simUpdateUI() {
  // Update waypoint list
  const list = document.getElementById('sim-pt-list');
  list.innerHTML = '';
  simState.waypoints.forEach((wp, i) => {
    const div = document.createElement('div');
    div.style.cssText = 'padding:8px;border-bottom:1px solid var(--border);cursor:pointer;background:' +
      (wp.id === simState.selectedPoint ? 'var(--bg2)' : 'transparent');
    div.textContent = (i + 1) + '. ' + wp.name + ' (' + wp.type + ')';
    div.onclick = () => {
      simState.selectedPoint = wp.id;
      simUpdateUI();
      simShowEditPanel();
    };
    list.appendChild(div);
  });
  
  // Update path selector
  const pathSel = document.getElementById('sim-path-sel');
  pathSel.innerHTML = '';
  simState.waypoints.forEach((wp, i) => {
    const opt = document.createElement('option');
    opt.value = wp.id;
    opt.textContent = (i + 1) + '. ' + wp.name;
    pathSel.appendChild(opt);
  });
  
  // Show/hide edit panel
  if (simState.selectedPoint) {
    simShowEditPanel();
  } else {
    document.getElementById('sim-edit-panel').style.display = 'none';
    document.getElementById('sim-no-select').style.display = 'block';
  }
}

/**
 * Show edit panel for selected waypoint
 */
function simShowEditPanel() {
  const wp = simState.waypoints.find(w => w.id === simState.selectedPoint);
  if (!wp) return;
  
  const panel = document.getElementById('sim-edit-panel');
  const noSelect = document.getElementById('sim-no-select');
  panel.style.display = 'block';
  noSelect.style.display = 'none';
  
  document.getElementById('sim-edit-title').textContent = wp.name;
  document.getElementById('sim-ep-name').value = wp.name;
  document.getElementById('sim-ep-type').value = wp.type;
  document.getElementById('sim-ep-dur').value = wp.duration || 0;
  document.getElementById('sim-ep-desc').value = wp.desc || '';
  
  // Show duration row only for certain types
  const durRow = document.getElementById('sim-ep-dur-row');
  durRow.style.display = ['intake', 'shoot', 'climb', 'wait', 'custom'].includes(wp.type) ? 'block' : 'none';
}

/**
 * Update waypoint properties
 */
function simUpdatePoint(field, value) {
  const wp = simState.waypoints.find(w => w.id === simState.selectedPoint);
  if (!wp) return;
  
  wp[field] = value;
  if (field === 'name') {
    document.getElementById('sim-edit-title').textContent = value;
  }
  simUpdateUI();
  simDraw();
}

/**
 * Add waypoint to path
 */
function simAddPathStep() {
  const pathSel = document.getElementById('sim-path-sel');
  const wpId = pathSel.value;
  if (wpId) {
    simState.path.push(wpId);
    simCalcPath();
    simUpdateUI();
    simDraw();
  }
}

/**
 * Undo last path step
 */
function simUndoPath() {
  if (simState.path.length > 0) {
    simState.path.pop();
    simCalcPath();
    simUpdateUI();
    simDraw();
  }
}

/**
 * Calculate path timing and segments
 */
function simCalcPath() {
  simState.maxSpeed = parseFloat(document.getElementById('sim-speed').value) || 16;
  simState.accel = parseFloat(document.getElementById('sim-accel').value) || 12;
  
  simState.fieldW = parseFloat(document.getElementById('sim-fw').value) || 54;
  simState.fieldH = parseFloat(document.getElementById('sim-fh').value) || 27;
  
  const canvas = document.getElementById('sim-canvas');
  const pxPerFtX = canvas.width / simState.fieldW;
  const pxPerFtY = canvas.height / simState.fieldH;
  
  let totalTime = 0;
  let travelTime = 0;
  let actionTime = 0;
  const segments = [];
  
  for (let i = 0; i < simState.path.length; i++) {
    const currentId = simState.path[i];
    const current = simState.waypoints.find(w => w.id === currentId);
    if (!current) continue;
    
    if (i > 0) {
      const prevId = simState.path[i - 1];
      const prev = simState.waypoints.find(w => w.id === prevId);
      if (prev) {
        // Calculate distance in feet
        const dx = (current.x - prev.x) / pxPerFtX;
        const dy = (current.y - prev.y) / pxPerFtY;
        const distFt = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate travel time with acceleration
        // t = v/a + d/v - v/(2a) assuming v = maxSpeed at end of accel
        const accelDist = (simState.maxSpeed * simState.maxSpeed) / (2 * simState.accel);
        let segTime = 0;
        
        if (distFt <= 2 * accelDist) {
          // Can't reach max speed
          segTime = 2 * Math.sqrt(distFt / simState.accel);
        } else {
          // Reaches max speed
          segTime = (2 * simState.maxSpeed) / simState.accel + (distFt - 2 * accelDist) / simState.maxSpeed;
        }
        
        travelTime += segTime;
        segments.push({
          from: prev.name,
          to: current.name,
          distFt: distFt.toFixed(1),
          time: segTime.toFixed(2)
        });
      }
    }
    
    actionTime += current.duration || 0;
  }
  
  totalTime = travelTime + actionTime;
  
  document.getElementById('sim-r-total').textContent = totalTime.toFixed(2) + 's';
  document.getElementById('sim-r-travel').textContent = travelTime.toFixed(2) + 's';
  document.getElementById('sim-r-action').textContent = actionTime.toFixed(2) + 's';
  
  // Update segments list
  const segList = document.getElementById('sim-seg-list');
  segList.innerHTML = '';
  segments.forEach(seg => {
    const div = document.createElement('div');
    div.style.cssText = 'padding:8px;border-bottom:1px solid var(--border);font-size:12px;font-family:"IBM Plex Mono",monospace;';
    div.textContent = seg.from + ' → ' + seg.to + ' | ' + seg.distFt + 'ft | ' + seg.time + 's';
    segList.appendChild(div);
  });
  
  simDraw();
}

/**
 * Draw canvas with field image and waypoints
 */
function simDraw() {
  const canvas = document.getElementById('sim-canvas');
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.fillStyle = '#0d0f14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw field image if loaded
  if (simState.imgLoaded && simState.img) {
    ctx.globalAlpha = 0.8;
    ctx.drawImage(simState.img, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;
  }
  
  // Draw path lines
  if (simState.path.length > 1) {
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    const points = simState.path
      .map(id => simState.waypoints.find(w => w.id === id))
      .filter(w => w);
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  // Draw waypoints
  simState.waypoints.forEach(wp => {
    const isSelected = wp.id === simState.selectedPoint;
    const isInPath = simState.path.includes(wp.id);
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(wp.x, wp.y, isSelected ? 10 : 6, 0, 2 * Math.PI);
    
    if (isSelected) {
      ctx.fillStyle = '#00ccff';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (isInPath) {
      ctx.fillStyle = '#ffd700';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#888';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Draw label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const idx = simState.waypoints.indexOf(wp) + 1;
    ctx.fillText(idx.toString(), wp.x, wp.y);
  });
}

/**
 * Initialize simulator event listeners
 */
function simInitialize() {
  const canvas = document.getElementById('sim-canvas');
  if (!canvas) return;
  
  canvas.addEventListener('mousedown', simCanvasMouseDown);
  canvas.addEventListener('mousemove', simCanvasMouseMove);
  canvas.addEventListener('mouseup', simCanvasMouseUp);
  canvas.addEventListener('mouseleave', simCanvasMouseUp);
  
  document.getElementById('sim-fw').addEventListener('change', simDraw);
  document.getElementById('sim-fh').addEventListener('change', simDraw);
  
  simUpdateUI();
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', simInitialize);
} else {
  simInitialize();
}
