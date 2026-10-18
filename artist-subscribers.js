/* ============================================
   LEIGH'S ART: PRIVATE SUBSCRIBER MANAGEMENT
   Read-only subscriber directory with admin-only unsubscribe.
   Public signup and email sending are NOT enabled here.
   ============================================ */
const subscriberClient = window.artistSupabase;
let subscriberRows = [];

/* ===== SAFE TEXT RENDERING ===== */
function subscriberNode(tag, text, className = '') {
  const element = document.createElement(tag);
  element.textContent = String(text ?? '');
  if (className) element.className = className;
  return element;
}

/* ===== SUBSCRIBER STATUS ===== */
function subscriberStatus(record) {
  if (record.unsubscribed_at) return 'Unsubscribed';
  if (record.confirmed_at) return 'Confirmed';
  return 'Awaiting confirmation';
}

/* ===== RENDER PRIVATE SUBSCRIBER DIRECTORY ===== */
async function renderSubscribers(target) {
  target.replaceChildren();
  target.append(subscriberNode('p', 'View newsletter subscribers and honor unsubscribe requests. Only confirmed, currently subscribed addresses will be eligible for future newsletter delivery.', 'admin-muted'));

  const panel = document.createElement('div');
  panel.className = 'admin-panel';
  const title = subscriberNode('h3', 'Mailing list');
  const summary = subscriberNode('p', 'Loading subscribers…', 'admin-muted');
  const search = document.createElement('input');
  search.className = 'admin-control';
  search.type = 'search';
  search.placeholder = 'Search email addresses';
  search.setAttribute('aria-label', 'Search subscribers');
  const list = document.createElement('div');
  list.className = 'admin-list';
  const message = subscriberNode('p', '', 'news-status');
  message.setAttribute('role', 'status');
  panel.append(title, summary, search, list, message);
  target.append(panel);

  /* ===== DISPLAY FILTERED RECORDS ===== */
  function draw() {
    list.replaceChildren();
    const term = search.value.trim().toLowerCase();
    const filtered = subscriberRows.filter(r => r.email.toLowerCase().includes(term));
    if (!filtered.length) {
      list.append(subscriberNode('p', term ? 'No matching subscribers.' : 'No subscribers yet.', 'admin-muted'));
      return;
    }
    for (const record of filtered) {
      const row = document.createElement('div');
      row.className = 'admin-row';
      const info = document.createElement('div');
      info.append(subscriberNode('strong', record.email));
      const status = subscriberStatus(record);
      info.append(subscriberNode('p', status + ' · Joined ' + new Date(record.created_at).toLocaleDateString(), 'admin-muted'));
      row.append(info);
      if (!record.unsubscribed_at) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'admin-button secondary';
        button.textContent = 'Unsubscribe';
        button.setAttribute('aria-label', 'Unsubscribe ' + record.email);
        button.addEventListener('click', async () => {
          if (!confirm('Unsubscribe ' + record.email + '? They will no longer be eligible to receive newsletters.')) return;
          button.disabled = true;
          const { error } = await subscriberClient.from('newsletter_subscribers')
            .update({ unsubscribed_at: new Date().toISOString() })
            .eq('id', record.id)
            .is('unsubscribed_at', null);
          if (error) {
            message.textContent = 'Could not unsubscribe: ' + error.message;
            button.disabled = false;
            return;
          }
          record.unsubscribed_at = new Date().toISOString();
          message.textContent = 'Unsubscribed ' + record.email + '.';
          updateSummary();
          draw();
        });
        row.append(button);
      }
      list.append(row);
    }
  }

  /* ===== COUNTS ===== */
  function updateSummary() {
    const confirmed = subscriberRows.filter(r => r.confirmed_at && !r.unsubscribed_at).length;
    const pending = subscriberRows.filter(r => !r.confirmed_at && !r.unsubscribed_at).length;
    const unsubscribed = subscriberRows.filter(r => r.unsubscribed_at).length;
    summary.textContent = `${confirmed} confirmed · ${pending} awaiting confirmation · ${unsubscribed} unsubscribed`;
  }

  /* ===== LOAD RECORDS (ADMIN RLS REQUIRED) ===== */
  const { data, error } = await subscriberClient.from('newsletter_subscribers')
    .select('id,email,created_at,confirmed_at,unsubscribed_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) {
    summary.textContent = 'Unable to load subscribers. Run NEWSLETTER_SUBSCRIBERS_SETUP.sql in Supabase SQL Editor.';
    message.textContent = error.message;
    return;
  }
  subscriberRows = data ?? [];
  updateSummary();
  draw();
  search.addEventListener('input', draw);
}
