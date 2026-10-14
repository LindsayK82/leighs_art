/* ===== HOMEPAGE FEATURED ARTWORK — SUPABASE ===== */
/* Public read-only display. Administrator credentials are never used here. */
(() => {
  'use strict';
  const grid = document.getElementById('featured-artwork-grid');
  if (!grid) return;

  /* ===== SUPABASE PUBLIC CLIENT ===== */
  const client = window.supabase.createClient(
    'https://hqkcqvxppoboryqcwksi.supabase.co',
    'sb_publishable_ePeAQ5b-9vFZkOVmOMHLzA_zhLGbaOB',
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );

  /* ===== SAFE ARTWORK CARD BUILDER ===== */
  function makeCard(artwork, index) {
    const figure = document.createElement('figure');
    figure.className = 'art-card' + (index === 0 ? ' art-card--wide' : '');
    const image = document.createElement('img');
    image.src = client.storage.from('artwork-images').getPublicUrl(artwork.image_path).data.publicUrl;
    image.alt = artwork.alt_text || `${artwork.title} by Leigh Witherell`;
    image.loading = index === 0 ? 'eager' : 'lazy';
    if (index === 0) image.fetchPriority = 'high';
    const caption = document.createElement('figcaption');
    const title = document.createElement('span');
    title.textContent = artwork.title;
    caption.appendChild(title);
    const detail = document.createElement('small');
    detail.textContent = artwork.is_sold ? 'Sold' : artwork.price != null
      ? new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'}).format(artwork.price)
      : '';
    caption.appendChild(detail);
    figure.append(image, caption);
    return figure;
  }

  /* ===== LOAD FEATURED ARTWORK ===== */
  async function loadFeaturedArtwork() {
    try {
      const {data, error} = await client.from('artworks')
        .select('title,alt_text,image_path,price,is_sold,featured_order,created_at')
        .eq('is_visible', true)
        .eq('is_featured', true)
        .order('featured_order', {ascending:true})
        .order('created_at', {ascending:false});
      if (error) throw error;
      grid.replaceChildren();
      if (!data.length) {
        const message = document.createElement('p');
        message.textContent = 'New featured artwork is coming soon.';
        grid.appendChild(message);
        return;
      }
      data.forEach((artwork, index) => grid.appendChild(makeCard(artwork, index)));
    } catch (error) {
      /* ===== FALLBACK FOR CONNECTION ERRORS ===== */
      /* Keep the original static gallery visible if Supabase cannot be reached. */
      console.error('Featured artwork could not load:', error);
    }
  }
  loadFeaturedArtwork();
})();
