/* ===== ARTIST DASHBOARD — LIVE FEATURE ROUTER ===== */
/* Demo-only edition counts, settings, and browser storage removed. Orders preview is nonfunctional. */
(() => {
  'use strict';
  const labels = {
    promotions: 'Homepage Promotions', artwork: 'Artwork',
    'artwork-manager': 'Manage Galleries', cv: 'CV', press: 'Press',
    reviews: 'Reviews', newsletter: 'Newsletter Studio', subscribers: 'Subscribers', orders: 'Orders'
  };
  const renderers = {
    promotions: 'renderPromotions', artwork: 'renderPrintArtwork',
    'artwork-manager': 'renderLiveArtwork', cv: 'renderLiveCVPress',
    press: 'renderLiveCVPress', reviews: 'renderLiveReviews',
    newsletter: 'renderNewsletterStudio', subscribers: 'renderSubscribers', orders: 'renderOrdersPreview'
  };
  const workspace = document.getElementById('admin-workspace');
  const title = document.getElementById('workspace-title');
  const content = document.getElementById('workspace-content');
  /* ===== ORDERS: PRESENTATION-ONLY PREVIEW ===== */
  function renderOrdersPreview(target) {
    target.innerHTML = `<div class="admin-panel">
      <p class="admin-tag">Coming soon · Setup in progress</p>
      <h3>Order Management</h3>
      <p class="admin-muted">This section will display customer purchases, fulfillment status, and shipment details once the order tools are connected.</p>
      <p class="admin-muted">Shippo label purchasing and live order actions are not enabled yet.</p>
    </div>`;
  }
  window.renderOrdersPreview = renderOrdersPreview;
  function openTab(tab) {
    if (!Object.hasOwn(labels, tab)) return;
    workspace.hidden = false;
    title.textContent = labels[tab];
    content.innerHTML = '<p class="admin-muted">Loading…</p>';
    const fn = window[renderers[tab]];
    if (typeof fn !== 'function') {
      content.innerHTML = '<p class="admin-muted" role="alert">This feature could not load. Please refresh the page.</p>';
      console.error('Missing dashboard renderer:', renderers[tab]);
      return;
    }
    try {
      const result = (tab === 'cv' || tab === 'press') ? fn(content, tab) : fn(content);
      if (result && typeof result.catch === 'function') result.catch(error => {
        console.error('Dashboard feature error:', error);
        content.innerHTML = '<p class="admin-muted" role="alert">Unable to load this section. Please try again.</p>';
      });
    } catch (error) {
      console.error('Dashboard feature error:', error);
      content.innerHTML = '<p class="admin-muted" role="alert">Unable to load this section. Please try again.</p>';
    }
    workspace.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  document.querySelectorAll('.admin-nav-card[data-tab]').forEach(button => {
    button.addEventListener('click', () => openTab(button.dataset.tab));
  });
  document.getElementById('back-dashboard')?.addEventListener('click', () => {
    workspace.hidden = true;
    document.querySelector('.admin-intro')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
})();
