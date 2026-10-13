/* ===== PASSWORD VISIBILITY ===== */
const passwordField = document.getElementById('login-password');
const passwordToggle = document.getElementById('toggle-password');
passwordToggle.addEventListener('click', () => {
  const visible = passwordField.type === 'password';
  passwordField.type = visible ? 'text' : 'password';
  passwordToggle.textContent = visible ? 'Hide password' : 'Show password';
  passwordToggle.setAttribute('aria-pressed', String(visible));
});
/* ===== AUTHENTICATION STATUS ===== */
const loginMessage = document.getElementById('login-message');
const loginForm = document.getElementById('artist-login-form');
const submitButton = loginForm.querySelector('[type="submit"]');
/* ===== EMAIL + PASSWORD LOGIN ===== */
loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = passwordField.value;
  if (!email || !password) { loginMessage.textContent = 'Enter your email and password.'; return; }
  submitButton.disabled = true;
  loginMessage.textContent = 'Signing in…';
  try {
    const { error } = await window.artistSupabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    window.location.replace('artist-dashboard.html');
  } catch (error) {
    loginMessage.textContent = 'Could not sign in. Check your email, password, and email confirmation.';
    console.error('Sign-in error:', error.message);
    submitButton.disabled = false;
  }
});
/* ===== PASSWORD RECOVERY EMAIL ===== */
document.getElementById('forgot-password').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  if (!email) { loginMessage.textContent = 'Enter your email address above, then select Forgot your password.'; return; }
  loginMessage.textContent = 'Requesting a password reset…';
  const redirectTo = new URL('artist-reset-password.html', window.location.href).href;
  try {
    const { error } = await window.artistSupabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    loginMessage.textContent = 'If this email has an account, a password reset link will be sent. Check your inbox.';
  } catch (error) {
    loginMessage.textContent = 'Could not send the reset email. Please try again later.';
    console.error('Reset request error:', error.message);
  }
});
