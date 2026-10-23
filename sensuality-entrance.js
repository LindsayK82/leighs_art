/* ===== SENSUALITY AGE CONFIRMATION + TURNSTILE ===== */
(() => {
  'use strict';
  const SITE_KEY = '0x4AAAAAAFi6d9X-Mdiam-_u';
  const VERIFY_URL = 'https://hqkcqvxppoboryqcwksi.supabase.co/functions/v1/verify-sensuality-turnstile';
  const entrance = document.getElementById('age-entrance');
  const gallery = document.getElementById('main-content');
  const button = document.getElementById('age-confirm');
  const error = document.getElementById('age-error');
  if (!entrance || !gallery || !button || !error) return;
  let token = null;
  let widgetId = null;
  let busy = false;
  function showError(message) { error.textContent = message; error.hidden = !message; }
  function loadGallery() {
    entrance.hidden = true;
    gallery.hidden = false;
    document.body.classList.remove('sensuality-locked');
    const sdk = document.createElement('script');
    sdk.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    sdk.onload = () => {
      const script = document.createElement('script');
      script.src = 'gallery-artwork.js';
      document.body.appendChild(script);
    };
    document.body.appendChild(sdk);
  }
  function renderWidget() {
    if (!window.turnstile || widgetId !== null) return;
    widgetId = window.turnstile.render('#age-captcha', {
      sitekey: SITE_KEY,
      callback: (value) => { token = value; button.disabled = false; showError(''); },
      'expired-callback': () => { token = null; button.disabled = true; showError('Verification expired. Please try again.'); },
      'error-callback': () => { token = null; button.disabled = true; showError('Verification could not load. Please refresh the page.'); }
    });
  }
  const poll = window.setInterval(() => { renderWidget(); if (widgetId !== null) window.clearInterval(poll); }, 150);
  renderWidget();
  button.addEventListener('click', async () => {
    if (!token || busy) return;
    busy = true; button.disabled = true; showError('');
    try {
      const response = await fetch(VERIFY_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await response.json();
      if (!response.ok || data.success !== true) throw new Error('Verification failed');
      loadGallery();
    } catch (_) {
      token = null;
      showError('Verification was unsuccessful. Please complete the CAPTCHA again.');
      if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId);
    } finally { busy = false; }
  });
})();
