/* ===== PUBLIC REVIEWS — SUPABASE READ ONLY ===== */
(() => {
  'use strict';
  const pressGrid = document.getElementById('live-press-reviews');
  const collectorGrid = document.getElementById('live-collector-reviews');
  if (!pressGrid || !collectorGrid) return;

  /* ===== PUBLIC SUPABASE CLIENT — NO ADMIN SESSION ===== */
  const client = window.supabase?.createClient(
    'https://hqkcqvxppoboryqcwksi.supabase.co',
    'sb_publishable_ePeAQ5b-9vFZkOVmOMHLzA_zhLGbaOB',
    {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}
  );

  /* ===== SAFE TEXT AND OPTIONAL SOURCE LINKS ===== */
  function text(tag, value, className) {
    const node = document.createElement(tag);
    node.textContent = value || '';
    if (className) node.className = className;
    return node;
  }
  function sourceLink(label, url) {
    if (!url) return document.createTextNode(label);
    try {
      const parsed = new URL(url, location.href);
      if (!['https:', 'http:'].includes(parsed.protocol)) return document.createTextNode(label);
      const link = text('a', label);
      link.href = parsed.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      return link;
    } catch { return document.createTextNode(label); }
  }
  function imageUrl(value) {
    if (!value) return '';
    if (/^https?:\/\//i.test(value) || value.startsWith('assets/')) return value;
    return client.storage.from('artwork-images').getPublicUrl(value).data.publicUrl;
  }

  /* ===== PRESS REVIEW CARDS ===== */
  function makePress(review) {
    const block = document.createElement('blockquote');
    block.className = 'press-quote';
    block.append(text('p', `“${review.review_text}”`));
    const footer = document.createElement('footer');
    footer.append(sourceLink('— ' + (review.publication || review.reviewer_name || 'Press'), review.source_url));
    block.append(footer);
    return block;
  }

  /* ===== COLLECTOR REVIEWS — OPTIONAL SIDE-BY-SIDE IMAGE ===== */
  function makeCollector(review) {
    const hasImage = Boolean(review.image_url);
    const article = document.createElement('article');
    article.className = hasImage ? 'collector-review' : 'collector-general';
    if (hasImage) {
      const figure = document.createElement('figure');
      figure.className = 'review-artwork';
      const img = document.createElement('img');
      img.src = imageUrl(review.image_url);
      img.alt = `Artwork accompanying a review by ${review.reviewer_name || 'a collector'}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      figure.append(img);
      article.append(figure);
    }
    const copy = document.createElement('div');
    if (hasImage) copy.className = 'review-copy';
    const quote = document.createElement('blockquote');
    quote.append(text('p', review.review_text));
    const footer = document.createElement('footer');
    footer.append(sourceLink('— ' + (review.reviewer_name || 'Collector'), review.source_url));
    quote.append(footer);
    copy.append(quote);
    article.append(copy);
    return article;
  }

  /* ===== LOAD ONLY PUBLISHED REVIEWS ===== */
  async function load() {
    if (!client) return;
    try {
      const {data, error} = await client.from('reviews')
        .select('reviewer_name,publication,review_text,source_url,image_url,sort_order,published,created_at')
        .eq('published', true)
        .order('sort_order', {ascending:true})
        .order('created_at', {ascending:true});
      if (error) throw error;
      const press = (data || []).filter(r => r.publication);
      const collectors = (data || []).filter(r => !r.publication);
      pressGrid.replaceChildren(...press.map(makePress));
      collectorGrid.replaceChildren(...collectors.map(makeCollector));
      if (!press.length) pressGrid.append(text('p', 'More press coverage coming soon.'));
      if (!collectors.length) collectorGrid.append(text('p', 'Collector reflections coming soon.'));
    } catch (error) {
      console.error('Could not load public reviews:', error);
      pressGrid.replaceChildren(text('p', 'Reviews are temporarily unavailable. Please try again later.'));
      collectorGrid.replaceChildren();
    }
  }
  load();
})();
