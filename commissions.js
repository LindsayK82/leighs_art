/* ===== COMMISSION FORM CONFIGURATION ===== */
// BETA: Replace with Leigh's real address when available.
const COMMISSION_EMAIL = 'commissions@leighs.art';
// PRODUCTION: Set to a secure server-side endpoint when ready; never put mail credentials here.
const COMMISSION_ENDPOINT = '';

/* ===== COMMISSION FORM SUBMISSION ===== */
const commissionForm = document.getElementById('commission-form');
const commissionStatus = document.getElementById('commission-form-status');
commissionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!commissionForm.reportValidity()) return;
  const data = Object.fromEntries(new FormData(commissionForm));
  const button = commissionForm.querySelector('button[type="submit"]');
  if (COMMISSION_ENDPOINT) {
    button.disabled = true;
    commissionStatus.textContent = 'Sending your inquiry…';
    try {
      const response = await fetch(COMMISSION_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!response.ok) throw new Error('Delivery failed');
      commissionStatus.textContent = 'Thank you! Your inquiry has been sent.';
      commissionForm.reset();
    } catch (error) {
      commissionStatus.textContent = 'Your inquiry could not be sent. Please try again later.';
    } finally { button.disabled = false; }
    return;
  }
  /* ===== BETA EMAIL-APP FALLBACK (NOT AUTOMATIC DELIVERY) ===== */
  const body = `Name: ${data.name}\nEmail: ${data.email}\nArtwork type: ${data.artwork_type}\nApproximate size: ${data.size || 'Not specified'}\nBudget: ${data.budget || 'Not specified'}\n\nProject description:\n${data.message}`;
  const subject = 'Commission Inquiry — Leigh Witherell';
  window.location.href = `mailto:${COMMISSION_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  commissionStatus.textContent = 'Your email app should open with your inquiry. Please press Send there to deliver it.';
});
