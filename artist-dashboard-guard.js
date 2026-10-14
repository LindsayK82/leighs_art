/* ===== DASHBOARD SESSION CHECK ===== */
(async () => {
  const client = window.artistSupabase;
  const { data: { session }, error } = await client.auth.getSession();
  if (error || !session) {
    window.location.replace('artist-login.html');
    return;
  }
  /* ===== VERIFY SITE ADMIN MEMBERSHIP ===== */
  const { data: admin, error: adminError } = await client.from('site_admins').select('user_id').eq('user_id', session.user.id).maybeSingle();
  if (adminError || !admin) {
    document.getElementById('auth-loading').textContent = 'This account does not have studio administrator access.';
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
