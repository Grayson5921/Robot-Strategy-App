// ─────────────────────────────────────────────────────────────
// Real-time Synchronization Module
// Supabase channel subscriptions for live updates
// ─────────────────────────────────────────────────────────────

/**
 * Subscribe to sheet data changes for current sheet
 */
function subscribeRealtime() {
  if (realtimeSub) {
    sb.removeChannel(realtimeSub);
  }

  realtimeSub = sb
    .channel('sheet-' + currentSheet.id)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'sheet_data',
        filter: 'sheet_id=eq.' + currentSheet.id
      },

      payload => {
        const sec = payload.new?.section;
        const newData = payload.new?.data;
        const updatedAt = payload.new?.updated_at;

        if (!sec || !newData) {
          return;
        }

        /*
         * IMPORTANT:
         *
         * Supabase sends us our OWN database updates too.
         *
         * Previously, every save would call renderSection(sec).
         * That destroyed and recreated every input in the section.
         *
         * So you would:
         *
         * edit cell 1
         * click cell 2
         * start typing
         * save finishes
         * section re-renders
         * cell 2 loses focus
         *
         * This checks whether the update came from this browser.
         */
        if (updatedAt && localSaveTimestamps[sec]) {
          const timestamp = Date.parse(updatedAt);

          if (localSaveTimestamps[sec].has(timestamp)) {
            localSaveTimestamps[sec].delete(timestamp);

            if (localSaveTimestamps[sec].size === 0) {
              delete localSaveTimestamps[sec];
            }

            // Our own save — DO NOT re-render.
            return;
          }
        }

        /*
         * If we got here, the update came from another
         * browser/user, so update our local data.
         */
        D[sec] = newData;

        try {
          renderSection(sec);
        } catch (e) {
          console.error('RT render err:', sec, e);
        }

        showCollab(sec);
      }
    )
    .subscribe();
}

/**
 * Subscribe to sheet list changes
 * Handles newly-created and deleted sheets
 */
function subscribeSheetsList() {
  if (sheetsRTSub) {
    sb.removeChannel(sheetsRTSub);
  }

  sheetsRTSub = sb
    .channel('sheets-list-pub')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sheets'
      },

      async () => {
        await loadSheets();
      }
    )
    .subscribe();
}

/**
 * Show collaboration indicator when sheet is updated
 * @param {string} sec - Section that was updated
 */
function showCollab(sec) {
  const bar = document.getElementById('collab-bar');
  const msg = document.getElementById('collab-msg');

  if (!bar || !msg) {
    return;
  }

  msg.textContent =
    'Live update: ' +
    sec.toUpperCase() +
    ' was just edited';

  bar.classList.add('show');

  clearTimeout(bar._t);

  bar._t = setTimeout(() => {
    bar.classList.remove('show');
  }, 3000);
}