/* ===== SUPABASE PUBLIC CLIENT CONFIGURATION ===== */
/* Publishable keys are safe for browser use. NEVER add secret/service-role keys here. */
window.artistSupabase = window.supabase.createClient('https://hqkcqvxppoboryqcwksi.supabase.co', 'sb_publishable_ePeAQ5b-9vFZkOVmOMHLzA_zhLGbaOB', {auth: {persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}});
