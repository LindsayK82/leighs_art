/* ===== PASSWORD RESET SESSION AND SUBMISSION ===== */
const resetForm = document.getElementById('reset-form');
const resetMessage = document.getElementById('reset-message');
resetForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = document.getElementById('new-password').value;
  if (password.length < 8) { resetMessage.textContent = 'Use at least 8 characters.'; return; }
  const button = resetForm.querySelector('button[type="submit"]');
  button.disabled = true;
  resetMessage.textContent = 'Updating password…';
  const { error } = await window.artistSupabase.auth.updateUser({ password });
  if (error) {
    resetMessage.textContent = 'Could not update your password. Your reset link may have expired; request a new one from the login page.';
    button.disabled = false;
  } else {
    await window.artistSupabase.auth.signOut();
    resetMessage.textContent = 'Password updated. Return to sign in with your new password.';
    button.textContent = 'Password updated';
  }
});
