/* ===== LEIGH'S ART: PUBLIC NEWSLETTER SIGNUP =====
   Enable only after Resend domain verification and Edge Function setup.
   Keep false until the complete confirmation + unsubscribe flow is tested.
*/
(() => {
  'use strict';
  const SIGNUP_READY = false; // Change to true only when ready for public launch.
  const PROJECT_URL = 'https://hqkcqvxppoboryqcwksi.supabase.co';
  const form = document.querySelector('.newsletter-signup__form');
  const email = document.getElementById('newsletter-email');
  const note = document.getElementById('newsletter-coming-soon');
  const button = form?.querySelector('button');

  /* ===== Newsletter Floating Notification ===== */
  const toast = document.createElement('div');
  toast.className = 'newsletter-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');
  toast.hidden = true;
  toast.innerHTML = '<div class="newsletter-toast__content"><strong class="newsletter-toast__title"></strong><p class="newsletter-toast__message"></p></div><button class="newsletter-toast__close" type="button" aria-label="Dismiss notification">×</button>';
  document.body.appendChild(toast);
  let hideTimer;
  const closeToast = () => { toast.hidden = true; clearTimeout(hideTimer); };
  toast.querySelector('.newsletter-toast__close').addEventListener('click', closeToast);
  function showToast(title, message, isError = false) {
    clearTimeout(hideTimer);
    toast.querySelector('.newsletter-toast__title').textContent = title;
    toast.querySelector('.newsletter-toast__message').textContent = message;
    toast.classList.toggle('newsletter-toast--error', isError);
    toast.hidden = false;
    hideTimer = setTimeout(closeToast, 9000);
  }

  /* ===== Local Preview (no email sent) ===== */
  // To preview locally, open index.html?newsletter_preview=success or ?newsletter_preview=error.
  // This is a UI preview only and does not enable signup or confirm any subscription.
  const preview = new URLSearchParams(window.location.search).get('newsletter_preview');
  if (preview === 'success') showToast('Check Your Email!', 'If your address is eligible, a confirmation email will arrive shortly.');
  if (preview === 'error') showToast('Unable to Subscribe', 'Please try again later.', true);
  if (!form || !email || !button || !note || !SIGNUP_READY) return;
  email.disabled = false;
  button.disabled = false;
  button.type = 'submit';
  form.setAttribute('aria-label', 'Newsletter signup');
  note.textContent = 'Occasional studio updates. Please confirm your email to subscribe.';
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!email.checkValidity()) { email.reportValidity(); return; }
    button.disabled = true;
    note.textContent = 'Submitting…';
    try {
      const response = await fetch(`${PROJECT_URL}/functions/v1/newsletter-signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value.trim(), website: '' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Please try again.');
      note.textContent = 'Please check your inbox for a confirmation link.';
      showToast('Check Your Email!', 'If your address is eligible, a confirmation email will arrive shortly.');
      form.reset();
    } catch (error) {
      note.textContent = 'Unable to subscribe right now.';
      showToast('Unable to Subscribe', 'Please try again later.', true);
    } finally { button.disabled = false; }
  });
})();
