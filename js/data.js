// ─────────────────────────────────────────────────────────────
// Data Management Module
// Section defaults, loading, saving, and auto-save coordination
// ─────────────────────────────────────────────────────────────

// Tracks saves made by this browser so realtime updates from our own saves
// do not re-render the section and steal focus from the next cell.
const localSaveTimestamps = {};

/**
 * Get default data structure for a section
 * @param {string} sec - Section name
 * @returns {object} Default data structure
 */
function defaultSection(sec) {
  const d = {
    plan: {
      tasks: [
        {
          phase: 'Kickoff Prep',
          section: 'Assign Work Groups',
          items: [
            { t: '6369/6773 will split and work separately but share results', d: false },
            { t: 'Update work groups tab', d: false },
            { t: 'Assign table seating', d: false }
          ]
        },
        {
          phase: 'Kickoff Prep',
          section: 'Admin Prep',
          items: [
            { t: 'Setup and test connection to Live Stream', d: false },
            { t: 'Test mic', d: false },
            { t: 'Setup group work tables', d: false },
            { t: 'Build Google Form rules review worksheet', d: false },
            { t: 'Make prototyping shopping list', d: false },
            { t: 'Setup Advantage Scope Field Simulator', d: false }
          ]
        },
        {
          phase: 'Kickoff Prep',
          section: 'Watch Kickoff Stream',
          items: [
            { t: 'Watch x2 more times', d: false },
            { t: 'Download game manual', d: false },
            { t: 'Download and print field diagram', d: false }
          ]
        },
        {
          phase: 'Define the Problem',
          section: 'Analyze Game Rules',
          items: [
            { t: 'Individually read manual in entirety', d: false },
            { t: 'Focus on requirements/constraints that affect robot design', d: false },
            { t: 'Review Pre-BOM needs', d: false }
          ]
        },
        {
          phase: 'Research',
          section: 'Analyze Strategies',
          items: [
            { t: 'Examine potential robot archetypes', d: false },
            { t: "Evaluate Karthik's CPM model", d: false },
            { t: 'Simulate gameplay and evaluate CPM and SWOT', d: false },
            { t: 'Brainstorm programming solutions', d: false },
            { t: 'Watch field tour video and review strategies', d: false }
          ]
        },
        {
          phase: 'Generate Specs',
          section: 'Identify Robot Specifications',
          items: [
            { t: 'Review rules and consolidate into desired specs', d: false },
            { t: 'Document only must-do items', d: false },
            { t: 'Identify prototyping and proof of concept needs', d: false }
          ]
        },
        {
          phase: 'Develop Concepts',
          section: 'Brainstorm & Prototype',
          items: [
            { t: 'Sketch/KCAD in relation to field/game elements', d: false },
            { t: 'Show geometrical proof against field/game elements', d: false },
            { t: 'Develop & assign prototype/proof of concept tasks', d: false },
            { t: 'Review Ri3D designs', d: false },
            { t: 'Assess Everybot / REVbot / WCPbot', d: false }
          ]
        },
        {
          phase: 'Choose Concept',
          section: 'Final Selection',
          items: [
            { t: 'Choose concept, kitbot, or hybrid', d: false },
            { t: 'Update EN with Robot Concept and requirements/constraints', d: false }
          ]
        }
      ],
      notes: ''
    },

    wg: {
      students: [],
      groups: [
        { name: 'Drive Base', lead: '', cad: '', members: [] },
        { name: 'Intake', lead: '', cad: '', members: [] },
        { name: 'Scoring', lead: '', cad: '', members: [] },
        { name: 'Climb', lead: '', cad: '', members: [] },
        { name: 'Index', lead: '', cad: '', members: [] }
      ],
      notes: ''
    },

    gr: {
      intake: [{ loc: '', diff: '', val: '' }],
      rp: [{ task: '', loc: '', pts: '', diff: '' }],
      scoring: [{ task: '', loc: '', pts: '', diff: '' }],
      pps: [{ task: '', time: '', pps: '' }],
      defense: [{ task: '', loc: '', diff: '', val: '' }],
      penalty: [{ task: '', loc: '', pts: '', impact: '' }],
      constraints: [{ name: 'Max Frame Size', val: '27.5 × 27.5" MAX' }],
      qa: [{ q: '', a: '' }],
      notes: ''
    },

    cpm: {
      scenario: 'Drive to pose Shooter (positions 4,5,6,7)',
      cycles: '10',
      points: '264',
      time: '69.6s',
      intake: '10 sec',
      recover: '0.081 sec',
      spinup: '0.9 sec',
      speed: '10 fps',
      window: '105 sec (omits 15s auton + 30s endgame)',
      analysis: 'Shooters require time to spin up and recover between shots.',
      notes: ''
    },

    strat: {
      summary: '',
      archetypes: [
        { name: '', pros: '', cpm: '', score: '~50' },
        { name: '', pros: '', cpm: '', score: '~80' },
        { name: '', pros: '', cpm: '', score: '~120' },
        { name: '', pros: '', cpm: '', score: '~200' }
      ],
      swot: { s: '', w: '', o: '', t: '' },
      eng: [{ sub: '', cap: '', ben: '', diff: '' }],
      prog: [{ cap: '', ben: '', diff: '', val: '' }],
      notes: ''
    },

    specs: {
      caps: [],
      quals: [
        { name: 'Weight', target: '', notes: '' },
        { name: 'CG', target: '', notes: '' },
        { name: 'Drivebase dimensions', target: '', notes: '' },
        { name: 'Drive gear ratio', target: '', notes: '' },
        { name: 'Drivebase type', target: '', notes: '' },
        { name: 'Reliability', target: '', notes: '' }
      ],
      prog: [],
      notes: ''
    },

    proto: {
      tasks: [],
      notes: ''
    },

    eval: {
      overview: [
        { c: 'Archetype', base: '', c1: '', c2: '', c3: '' },
        { c: 'Anticipated CPM', base: '', c1: '', c2: '', c3: '' },
        { c: 'Proven CAD Geometry?', base: '', c1: '', c2: '', c3: '' }
      ],

      simplicity: [
        { m: 'Number of Subsystems', base: '', c1: '', c2: '', c3: '' },
        { m: 'Scoring DOFs', base: '', c1: '', c2: '', c3: '' },
        { m: 'Number of Handoffs', base: '', c1: '', c2: '', c3: '' },
        { m: 'Custom Concepts', base: '', c1: '', c2: '', c3: '' }
      ],

      matrix: [
        {
          lbl: 'Design Difficulty (×1)',
          desc: 'Custom designs, tight fits, many subsystems add difficulty',
          base: 3,
          c1: 0,
          c2: 0,
          c3: 0
        },
        {
          lbl: 'Build Difficulty (×1)',
          desc: "Look at old robots — if we haven't done it before",
          base: 3,
          c1: 0,
          c2: 0,
          c3: 0
        },
        {
          lbl: 'Programming Difficulty (×1)',
          desc: 'Many DOFs and subsystems add difficulty',
          base: 2,
          c1: 0,
          c2: 0,
          c3: 0
        },
        {
          lbl: 'Risk Level (×1)',
          desc: "How far within or outside of team's capabilities",
          base: 3,
          c1: 0,
          c2: 0,
          c3: 0
        },
        {
          lbl: 'Robot Capability (×1)',
          desc: 'CPM Performance',
          base: 3,
          c1: 0,
          c2: 0,
          c3: 0
        }
      ],

      notes: ''
    }
  };

  return d[sec] || {};
}

/**
 * Load all sections from database
 */
async function loadAllSections() {
  const { data, error } = await sb
    .from('sheet_data')
    .select('section,data')
    .eq('sheet_id', currentSheet.id);

  if (error) {
    console.error('loadAllSections:', error);
    return;
  }

  D = {};

  SECTIONS.forEach(sec => {
    const found = (data || []).find(r => r.section === sec);
    D[sec] = found?.data || defaultSection(sec);
  });
}

/**
 * Mark section as changed and queue save
 * @param {string} sec - Section name
 */
function changed(sec) {
  if (!canEdit) return;

  const nEl = document.getElementById('n-' + sec);

  if (nEl && D[sec]) {
    D[sec].notes = nEl.value;
  }

  // Wait briefly after changes before sending to Supabase.
  // This happens completely in the background and does NOT block editing.
  clearTimeout(saveTimers[sec]);

  saveTimers[sec] = setTimeout(() => {
    saveSection(sec);
  }, 400);
}

/**
 * Save section to database
 * @param {string} sec - Section name
 */
async function saveSection(sec) {
  if (!currentSheet || !D[sec] || !canEdit) return;

  const nEl = document.getElementById('n-' + sec);

  if (nEl && D[sec]) {
    D[sec].notes = nEl.value;
  }

  const updatedAt = new Date().toISOString();
  const timestamp = Date.parse(updatedAt);

  /*
   * Remember that THIS browser is causing this update.
   *
   * Supabase Realtime sends database updates back to the browser
   * that originally made the update too.
   *
   * realtime.js will see this timestamp and know not to re-render
   * the section, preventing your current cell from losing focus.
   */
  if (!localSaveTimestamps[sec]) {
    localSaveTimestamps[sec] = new Set();
  }

  localSaveTimestamps[sec].add(timestamp);

  const { error } = await sb
    .from('sheet_data')
    .upsert(
      {
        sheet_id: currentSheet.id,
        section: sec,
        data: D[sec],
        updated_at: updatedAt
      },
      {
        onConflict: 'sheet_id,section'
      }
    );

  if (!error) {
    showToast('Saved ✓', 'saved');
  } else {
    console.error('save error:', error);

    // Remove timestamp if the database save failed because
    // there will not be a matching realtime event.
    localSaveTimestamps[sec]?.delete(timestamp);

    if (localSaveTimestamps[sec]?.size === 0) {
      delete localSaveTimestamps[sec];
    }
  }
}