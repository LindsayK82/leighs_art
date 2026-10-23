/* ===== ARTIST DASHBOARD — LIVE FEATURE ROUTER ===== */
/* Demo-only orders, edition counts, settings, and browser storage removed. */
(() => {
  'use strict';
  const labels = {
    promotions: 'Homepage Promotions', artwork: 'Artwork',
    'artwork-manager': 'Manage Galleries', cv: 'CV', press: 'Press',
    reviews: 'Reviews', newsletter: 'Newsletter Studio', subscribers: 'Subscribers'
  };
  const renderers = {
    promotions: 'renderPromotions', artwork: 'renderPrintArtwork',
    'artwork-manager': 'renderLiveArtwork', cv: 'renderLiveCVPress',
    press: 'renderLiveCVPress', reviews: 'renderLiveReviews',
    newsletter: 'renderNewsletterStudio', subscribers: 'renderSubscribers'
  };
  const workspace = document.getElementById('admin-workspace');
  const title = document.getElementById('workspace-title');
  const content = document.getElementById('workspace-content');
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
