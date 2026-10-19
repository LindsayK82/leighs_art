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
      note.textContent = 'If eligible, a confirmation email will arrive shortly. Please check your inbox.';
      form.reset();
    } catch (error) {
      note.textContent = error.message || 'Unable to subscribe right now.';
    } finally { button.disabled = false; }
  });
})();
