/* ===== PASSWORD VISIBILITY ===== */
const passwordField = document.getElementById('login-password');
const passwordToggle = document.getElementById('toggle-password');
passwordToggle.addEventListener('click', () => {
  const visible = passwordField.type === 'password';
  passwordField.type = visible ? 'text' : 'password';
  passwordToggle.textContent = visible ? 'Hide password' : 'Show password';
  passwordToggle.setAttribute('aria-pressed', String(visible));
});
/* ===== LOGIN PREVIEW: NO AUTHENTICATION UNTIL SUPABASE ===== */
const loginMessage = document.getElementById('login-message');
document.getElementById('artist-login-form').addEventListener('submit', event => {
  event.preventDefault();
  loginMessage.textContent = 'Login is not active yet. We’ll connect secure sign-in with Supabase next.';
});
/* ===== PASSWORD RESET PREVIEW ===== */
document.getElementById('forgot-password').addEventListener('click', () => {
  loginMessage.textContent = 'Password recovery will be available once Supabase is connected.';
});
