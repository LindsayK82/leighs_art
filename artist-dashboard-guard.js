/* ===== DASHBOARD SESSION CHECK ===== */
(async () => {
  const client = window.artistSupabase;
  const { data: { session }, error } = await client.auth.getSession();
  if (error || !session) {
    window.location.replace('artist-login.html');
    return;
  }
  /* ===== DISPLAY SIGNED-IN DASHBOARD ===== */
  document.getElementById('auth-loading').hidden = true;
  document.getElementById('protected-dashboard').hidden = false;
  /* ===== SIGN OUT ===== */
  document.getElementById('artist-signout').addEventListener('click', async () => {
    await client.auth.signOut();
    window.location.replace('artist-login.html');
  });
  /* ===== HANDLE EXPIRED / REMOVED SESSIONS ===== */
  client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') window.location.replace('artist-login.html');
  });
})();
