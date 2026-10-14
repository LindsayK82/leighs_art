/* ===== DYNAMIC GALLERY ARTWORK — SUPABASE ===== */
/* Adds dashboard-uploaded work while preserving the existing HTML collection. */
(() => {
  'use strict';

  /* ===== GALLERY IDENTIFICATION ===== */
  const gallerySlug = document.body.dataset.gallerySlug;
  const isInstallations = gallerySlug === 'installations';
  const grid = document.querySelector(isInstallations ? '.installations-grid' : '.collection-grid');
  if (!gallerySlug || !grid || !window.supabase) return;

  /* ===== PUBLIC SUPABASE CLIENT ===== */
  const client = window.supabase.createClient(
    'https://hqkcqvxppoboryqcwksi.supabase.co',
    'sb_publishable_ePeAQ5b-9vFZkOVmOMHLzA_zhLGbaOB',
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );

  /* ===== SAFE ARTWORK ELEMENTS ===== */
  function makeArtwork(art) {
    const image = document.createElement('img');
    image.src = client.storage.from('artwork-images').getPublicUrl(art.image_path).data.publicUrl;
    image.alt = art.alt_text || `${art.title} by Leigh Witherell`;
    image.loading = 'lazy';
    image.decoding = 'async';

    if (isInstallations) {
      const figure = document.createElement('figure');
      figure.className = 'installation-photo';
      figure.appendChild(image);
      return figure;
    }

    const article = document.createElement('article');
    article.className = 'collection-artwork';
    const figure = document.createElement('figure');
    figure.className = 'collection-figure';
    const caption = document.createElement('figcaption');
    const title = document.createElement('h2');
    title.textContent = art.title;
    caption.appendChild(title);
    figure.append(image, caption);
    article.appendChild(figure);

    if (art.description || art.is_sold || art.price != null) {
      const details = document.createElement('div');
      details.className = 'artwork-details';
      if (art.description) {
        const description = document.createElement('p');
        description.className = 'artwork-description';
        description.textContent = art.description;
        details.appendChild(description);
      }
      if (art.is_sold || art.price != null) {
        const status = document.createElement('p');
        status.textContent = art.is_sold ? 'Sold' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(art.price);
        details.appendChild(status);
      }
      article.appendChild(details);
    }
    return article;
  }

  /* ===== LOAD DASHBOARD ARTWORK ===== */
  async function loadGalleryArtwork() {
    try {
      const { data, error } = await client.from('artworks')
        .select('id,title,description,image_path,alt_text,price,is_sold,display_order,created_at,galleries!inner(slug,is_visible)')
        .eq('is_visible', true)
        .eq('galleries.slug', gallerySlug)
        .eq('galleries.is_visible', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      /* ===== PRESERVE STATIC ARTWORK DURING MIGRATION ===== */
      grid.querySelectorAll('[data-supabase-artwork]').forEach(node => node.remove());
      for (const artwork of data || []) {
        const card = makeArtwork(artwork);
        card.dataset.supabaseArtwork = artwork.id;
        grid.appendChild(card);
      }
    } catch (error) {
      /* ===== FAIL SAFELY — KEEP EXISTING GALLERY ===== */
      console.error(`Could not load ${gallerySlug} artwork:`, error);
    }
  }
  loadGalleryArtwork();
})();
