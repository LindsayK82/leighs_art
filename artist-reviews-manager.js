/* ===== LIVE REVIEWS MANAGEMENT — SUPABASE ===== */
const reviewsClient = window.artistSupabase;
const reviewsBucket = 'artwork-images';
let reviewsRows = [];

/* ===== REVIEW IMAGE URL AND SAFE DISPLAY ===== */
function reviewImageUrl(path) {
  if (!path) return '';
  if (/^https:\/\//i.test(path)) return path;
  return reviewsClient.storage.from(reviewsBucket).getPublicUrl(path).data.publicUrl;
}

/* ===== LOAD REVIEWS FROM SUPABASE ===== */
async function renderLiveReviews(target) {
  target.innerHTML = '<p class="admin-muted">Loading reviews…</p>';
  if (!reviewsClient) { target.textContent = 'Supabase is not connected. Please sign in again.'; return; }
  const {data, error} = await reviewsClient.from('reviews').select('*').order('sort_order', {ascending:true}).order('created_at', {ascending:false});
  if (error) { target.textContent = 'Could not load reviews: ' + error.message; return; }
  reviewsRows = data || [];
  target.innerHTML = `
    <!-- ===== ADD OR EDIT REVIEW FORM ===== -->
    <div class="admin-panel"><h3 id="review-form-title">Add review</h3>
      <form id="live-review-form" class="admin-content-form">
        <input type="hidden" name="reviewId">
        <div class="admin-form-grid">
          <label class="admin-field">Review text<textarea class="admin-control" name="review_text" rows="5" required></textarea></label>
          <label class="admin-field">Reviewer name<input class="admin-control" name="reviewer_name" required></label>
          <label class="admin-field">Publication / source (optional)<input class="admin-control" name="publication"></label>
          <label class="admin-field">Review date (optional)<input class="admin-control" name="review_date" type="date"></label>
          <label class="admin-field">Source URL (optional)<input class="admin-control" name="source_url" type="url" placeholder="https://..."></label>
          <label class="admin-field">Review image (optional: JPG, PNG, WebP)<input class="admin-control" name="image" type="file" accept="image/jpeg,image/png,image/webp"></label>
          <label class="admin-field">Display order<input class="admin-control" name="sort_order" type="number" step="1" value="0"></label>
        </div>
        <label class="admin-field"><input name="published" type="checkbox" checked> Published on website</label>
        <label class="admin-field" id="review-remove-image-wrap" hidden><input name="remove_image" type="checkbox"> Remove existing review image</label>
        <div class="admin-inline"><button class="admin-button" id="review-save" type="submit">Save review</button><button class="admin-button secondary" id="review-cancel" type="button" hidden>Cancel editing</button></div>
      </form></div>
    <!-- ===== EXISTING REVIEW ENTRIES ===== -->
    <h3 class="admin-content-subtitle">Supabase reviews (${reviewsRows.length})</h3>
    <p class="admin-muted">Reviews already written directly into reviews.html are not imported here yet. They will remain unchanged.</p>
    <div class="admin-list" id="live-review-list">${reviewsRows.map(r => `<article class="admin-row">${r.image_url ? `<img class="artwork-manager-thumb" src="${safe(reviewImageUrl(r.image_url))}" alt="Review illustration">` : ''}<div class="admin-content-summary"><h3>${safe(r.reviewer_name || 'Untitled review')}</h3><p>${safe((r.review_text || '').slice(0,220))}</p><p class="admin-muted">${safe(r.publication || '')} · ${r.published ? 'Published' : 'Draft'}</p></div><div class="admin-inline"><button class="admin-button secondary" type="button" data-review-edit="${safe(r.id)}">Edit</button><button class="admin-button secondary" type="button" data-review-delete="${safe(r.id)}">Delete</button></div></article>`).join('') || '<p class="admin-muted">No reviews in Supabase yet.</p>'}</div>
    <p id="review-status" class="admin-notice" role="status" aria-live="polite"></p>`;
  const form = document.getElementById('live-review-form');
  const status = message => { const el = document.getElementById('review-status'); if (el) el.textContent = message; };
  document.getElementById('review-cancel').addEventListener('click', () => renderLiveReviews(target));

  /* ===== EDIT REVIEW ===== */
  target.querySelectorAll('[data-review-edit]').forEach(button => button.addEventListener('click', () => {
    const row = reviewsRows.find(r => r.id === button.dataset.reviewEdit);
    if (!row) return;
    for (const key of ['review_text','reviewer_name','publication','review_date','source_url','sort_order']) form.elements[key].value = row[key] ?? '';
    form.elements.reviewId.value = row.id;
    form.elements.published.checked = Boolean(row.published);
    document.getElementById('review-remove-image-wrap').hidden = !row.image_url;
    document.getElementById('review-form-title').textContent = 'Edit review';
    document.getElementById('review-cancel').hidden = false;
    form.scrollIntoView({behavior:'smooth', block:'start'});
  }));

  /* ===== SAVE REVIEW AND OPTIONAL IMAGE ===== */
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = document.getElementById('review-save');
    button.disabled = true;
    status('Saving review…');
    const id = form.elements.reviewId.value;
    const existing = reviewsRows.find(r => r.id === id);
    const file = form.elements.image.files[0];
    let imagePath = existing?.image_url || null;
    let uploadedPath = null;
    try {
      if (file) {
        if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Please choose a JPG, PNG, or WebP image.');
        if (file.size > 10 * 1024 * 1024) throw new Error('Please choose an image smaller than 10 MB.');
        const extension = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
        uploadedPath = `reviews/${crypto.randomUUID()}.${extension}`;
        const upload = await reviewsClient.storage.from(reviewsBucket).upload(uploadedPath, file, {contentType:file.type, upsert:false});
        if (upload.error) throw upload.error;
        imagePath = uploadedPath;
      } else if (form.elements.remove_image.checked) imagePath = null;
      const payload = {
        review_text: form.elements.review_text.value.trim(),
        reviewer_name: form.elements.reviewer_name.value.trim(),
        publication: form.elements.publication.value.trim() || null,
        review_date: form.elements.review_date.value || null,
        source_url: form.elements.source_url.value.trim() || null,
        sort_order: Number(form.elements.sort_order.value) || 0,
        published: form.elements.published.checked,
        image_url: imagePath
      };
      const result = id ? await reviewsClient.from('reviews').update(payload).eq('id', id).select('id') : await reviewsClient.from('reviews').insert(payload).select('id');
      if (result.error) throw result.error;
      await renderLiveReviews(target);
      const savedStatus = document.getElementById('review-status');
      if (savedStatus) savedStatus.textContent = 'Review saved in Supabase.';
    } catch (error) {
      if (uploadedPath) await reviewsClient.storage.from(reviewsBucket).remove([uploadedPath]);
      status('Could not save review: ' + error.message);
    } finally { button.disabled = false; }
  });

  /* ===== DELETE REVIEW WITH CONFIRMATION ===== */
  target.querySelectorAll('[data-review-delete]').forEach(button => button.addEventListener('click', async () => {
    const row = reviewsRows.find(r => r.id === button.dataset.reviewDelete);
    if (!row || !confirm(`Permanently delete the review by ${row.reviewer_name}?`)) return;
    button.disabled = true;
    const {error} = await reviewsClient.from('reviews').delete().eq('id', row.id);
    if (error) { status('Could not delete review: ' + error.message); button.disabled = false; return; }
    // Keep image files for now to avoid deleting assets that might be reused elsewhere.
    await renderLiveReviews(target);
  }));
}
