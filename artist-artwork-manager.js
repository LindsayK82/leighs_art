/* ===== LIVE ARTWORK MANAGEMENT — SUPABASE ===== */
const artworkClient = window.artistSupabase;
const artworkBucket = 'artwork-images';
let artworkGalleries = [];
let artworkRows = [];
const artworkEscape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function artworkStatus(message) { const el = document.getElementById('artwork-manager-status'); if (el) el.textContent = message; }

/* ===== LOAD ARTWORK AND GALLERY DATA ===== */
async function renderLiveArtwork(target) {
  target.innerHTML = '<p class="admin-muted">Loading gallery artwork…</p>';
  const [galleriesResult, artworkResult] = await Promise.all([
    artworkClient.from('galleries').select('id,name').order('display_order'),
    artworkClient.from('artworks').select('*').order('display_order').order('created_at', {ascending:false})
  ]);
  if (galleriesResult.error || artworkResult.error) {
    target.textContent = 'Could not load artwork: ' + (galleriesResult.error || artworkResult.error).message;
    return;
  }
  artworkGalleries = galleriesResult.data;
  artworkRows = artworkResult.data;
  target.innerHTML = `
    <!-- ===== ADD OR EDIT ARTWORK FORM ===== -->
    <div class="admin-panel"><h3 id="artwork-form-heading">Add new artwork</h3>
    <form id="live-artwork-form" class="artwork-manager-form">
      <input type="hidden" name="artworkId">
      <label class="admin-field">Artwork title<input class="admin-control" name="title" required maxlength="200"></label>
      <label class="admin-field">Description<textarea class="admin-control" name="description" rows="3"></textarea></label>
      <label class="admin-field">Gallery<select class="admin-control" name="gallery_id" required><option value="">Choose a gallery</option>${artworkGalleries.map(g=>`<option value="${g.id}">${artworkEscape(g.name)}</option>`).join('')}</select></label>
      <label class="admin-field">Image (JPG, PNG, or WebP)<input class="admin-control" type="file" name="image" accept="image/jpeg,image/png,image/webp"></label>
      <label class="admin-field">Image description for accessibility<input class="admin-control" name="alt_text" maxlength="300"></label>
      <!-- ===== ARTWORK CATALOG DETAILS ===== -->
      <label class="admin-field">Medium / materials<input class="admin-control" name="medium" maxlength="500" placeholder="e.g., Acrylics on Cotton Canvas"></label>
      <label class="admin-field">Dimensions<input class="admin-control" name="dimensions" maxlength="200" placeholder="e.g., 20 x 20 inches"></label>
      <label class="admin-field">Year<input class="admin-control" name="artwork_year" maxlength="100" placeholder="e.g., 2023"></label>
      <label class="admin-field">Availability wording<input class="admin-control" name="availability_label" maxlength="300" placeholder="e.g., Available, Not for sale, Limited-edition prints"></label>
      <label class="admin-field">Price wording (as displayed)<input class="admin-control" name="price_label" maxlength="300" placeholder="e.g., $3,100 or SOLD"></label>
      <!-- ===== OPTIONAL STRUCTURED SALES DATA ===== -->
      <label class="admin-field">Price in USD (numeric, optional)<input class="admin-control" type="number" name="price" min="0" step="0.01"></label>
      <!-- ===== SHIPPING PACKAGE DETAILS ===== -->
      <fieldset class="admin-panel"><legend><strong>Shipping package details</strong></legend>
      <p class="admin-muted">Enter the size of the fully packed artwork, not the canvas alone. Leave measurements blank until the package is measured. Weight is in pounds; dimensions are in inches.</p>
      <label class="admin-field">Packaging type<select class="admin-control" name="packaging_type"><option value="stretched_canvas">Stretched canvas / boxed</option><option value="rigid_mailer">Print / rigid mailer</option><option value="custom">Custom / special arrangement</option></select></label>
      <div class="admin-inline">
        <label class="admin-field">Package length (in)<input class="admin-control" type="number" name="package_length" min="0.01" step="0.01" placeholder="34"></label>
        <label class="admin-field">Package width (in)<input class="admin-control" type="number" name="package_width" min="0.01" step="0.01" placeholder="34"></label>
        <label class="admin-field">Package height (in)<input class="admin-control" type="number" name="package_height" min="0.01" step="0.01" placeholder="5"></label>
        <label class="admin-field">Packed weight (lb)<input class="admin-control" type="number" name="package_weight" min="0.01" step="0.01" placeholder="10"></label>
      </div>
      <label class="admin-field">Special shipping notes<textarea class="admin-control" name="special_shipping_notes" rows="2" placeholder="e.g., rolled canvas available by arrangement"></textarea></label>
      </fieldset>
      <label class="artwork-manager-check"><input type="checkbox" name="is_featured"> Feature on Home Page</label>
      <label class="artwork-manager-check"><input type="checkbox" name="is_visible" checked> Visible on website</label>
      <label class="artwork-manager-check"><input type="checkbox" name="is_sold"> Mark as sold</label>
      <div class="admin-inline"><button class="admin-button" type="submit" id="save-live-artwork">Save artwork</button><button class="admin-button secondary" type="button" id="cancel-live-artwork" hidden>Cancel editing</button></div>
    </form></div>
    <!-- ===== LIVE ARTWORK SEARCH AND GALLERY FILTER ===== -->
    <div class="admin-panel"><div class="admin-inline">
      <label class="admin-field">Find a painting<input class="admin-control" id="live-artwork-search" type="search" placeholder="Search title, description, medium or year"></label>
      <label class="admin-field">Filter by gallery<select class="admin-control" id="live-artwork-gallery"><option value="">All galleries</option>${artworkGalleries.map(g=>`<option value="${artworkEscape(g.id)}">${artworkEscape(g.name)}</option>`).join('')}</select></label>
    </div><p class="admin-muted" id="live-artwork-count" role="status"></p></div>
    <!-- ===== EXISTING ARTWORK CONTROLS ===== -->
    <h3 class="admin-content-subtitle">Gallery artwork (${artworkRows.length})</h3>
    <p class="admin-muted">Unchecking Featured removes artwork from the homepage without deleting it from its gallery. The connected public homepage and galleries reflect visibility and featured changes on refresh.</p>
    <div class="admin-list" id="live-artwork-list">${artworkRows.map(a=>{const gallery=artworkGalleries.find(g=>g.id===a.gallery_id);const url=artworkClient.storage.from(artworkBucket).getPublicUrl(a.image_path).data.publicUrl;return `<article class="admin-row"><img class="artwork-manager-thumb" src="${artworkEscape(url)}" alt="${artworkEscape(a.alt_text || a.title)}"><div><h3>${artworkEscape(a.title)}</h3><p class="admin-muted">${artworkEscape(gallery?.name || 'Unassigned')} · ${a.is_visible?'Visible':'Hidden'} · ${a.is_featured?'Featured':'Not featured'}</p></div><div class="artwork-manager-actions"><button class="admin-button secondary" type="button" data-feature-art="${a.id}">${a.is_featured?'Remove from homepage':'Feature on homepage'}</button><button class="admin-button secondary" type="button" data-edit-art="${a.id}">Edit</button><button class="admin-button secondary" type="button" data-delete-art="${a.id}">Delete</button></div></article>`}).join('') || '<p class="admin-muted">No artwork uploaded yet.</p>'}</div>
    <p id="artwork-manager-status" class="admin-notice artwork-manager-status" role="status" aria-live="polite"></p>`;
  /* ===== FILTER SUPABASE ARTWORK LOCALLY ===== */
  const searchInput=target.querySelector('#live-artwork-search');
  const galleryInput=target.querySelector('#live-artwork-gallery');
  const artworkList=target.querySelector('#live-artwork-list');
  const allCards=[...artworkList.querySelectorAll('.admin-row')];
  const applyArtworkFilters=()=>{
    const query=searchInput.value.trim().toLocaleLowerCase();
    const galleryId=galleryInput.value;
    let visible=0;
    allCards.forEach((card,index)=>{
      const artwork=artworkRows[index];
      const haystack=[artwork.title,artwork.description,artwork.medium,artwork.artwork_year,artwork.availability_label].join(' ').toLocaleLowerCase();
      const matches=(!galleryId||artwork.gallery_id===galleryId)&&(!query||haystack.includes(query));
      card.hidden=!matches;
      if(matches)visible++;
    });
    target.querySelector('#live-artwork-count').textContent=`Showing ${visible} of ${artworkRows.length} paintings`;
  };
  searchInput.addEventListener('input',applyArtworkFilters);
  galleryInput.addEventListener('change',applyArtworkFilters);
  applyArtworkFilters();
  document.getElementById('live-artwork-form').addEventListener('submit', saveLiveArtwork);
  document.getElementById('cancel-live-artwork').addEventListener('click',()=>renderLiveArtwork(target));
  target.querySelectorAll('[data-edit-art]').forEach(b=>b.addEventListener('click',()=>editLiveArtwork(b.dataset.editArt)));
  target.querySelectorAll('[data-feature-art]').forEach(b=>b.addEventListener('click',()=>toggleLiveFeature(b.dataset.featureArt)));
  target.querySelectorAll('[data-delete-art]').forEach(b=>b.addEventListener('click',()=>deleteLiveArtwork(b.dataset.deleteArt)));
}

/* ===== UPLOAD IMAGE AND SAVE ARTWORK ===== */
async function saveLiveArtwork(event) {
  event.preventDefault();
  const form=event.currentTarget, button=document.getElementById('save-live-artwork');
  const id=form.elements.artworkId.value;
  const previous=artworkRows.find(a=>a.id===id);
  const file=form.elements.image.files[0];
  if (!previous && !file) return artworkStatus('Please choose an image.');
  if (file && (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10*1024*1024)) return artworkStatus('Use a JPG, PNG, or WebP under 10 MB.');
  button.disabled=true; artworkStatus('Saving artwork…');
  let newPath=null;
  try {
    if (file) {
      const ext=({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[file.type];
      newPath=`${crypto.randomUUID()}.${ext}`;
      const uploaded=await artworkClient.storage.from(artworkBucket).upload(newPath,file,{contentType:file.type,upsert:false});
      if (uploaded.error) throw uploaded.error;
    }
    const priceValue=form.elements.price.value.trim();
    /* ===== VALIDATE AND SAVE SHIPPING PACKAGE DETAILS ===== */
    const packageNumber = name => {
      const value = form.elements[name].value.trim();
      return value === '' ? null : Number(value);
    };
    const packageFields = ['package_length','package_width','package_height','package_weight'];
    const packageValues = Object.fromEntries(packageFields.map(name => [name, packageNumber(name)]));
    if (Object.values(packageValues).some(value => value !== null && (!Number.isFinite(value) || value <= 0))) {
      throw new Error('Package measurements must be positive numbers.');
    }
    const record={title:form.elements.title.value.trim(),description:form.elements.description.value.trim()||null,gallery_id:form.elements.gallery_id.value,image_path:newPath||previous?.image_path,alt_text:form.elements.alt_text.value.trim()||null,price:priceValue===''?null:Number(priceValue),medium:form.elements.medium.value.trim()||null,dimensions:form.elements.dimensions.value.trim()||null,artwork_year:form.elements.artwork_year.value.trim()||null,availability_label:form.elements.availability_label.value.trim()||null,price_label:form.elements.price_label.value.trim()||null,is_featured:form.elements.is_featured.checked,is_visible:form.elements.is_visible.checked,is_sold:form.elements.is_sold.checked,packaging_type:form.elements.packaging_type.value,...packageValues,special_shipping_notes:form.elements.special_shipping_notes.value.trim()||null,updated_at:new Date().toISOString()};
    const result=previous?await artworkClient.from('artworks').update(record).eq('id',id).select('id'):await artworkClient.from('artworks').insert(record).select('id');
    if(result.error) throw result.error;
    if(previous && newPath) {const removed=await artworkClient.storage.from(artworkBucket).remove([previous.image_path]);if(removed.error) console.warn('Old image cleanup failed:',removed.error);}
    await renderLiveArtwork(document.getElementById('workspace-content'));
    artworkStatus('Artwork saved successfully.');
  } catch(error) {
    if(newPath) { const cleanup=await artworkClient.storage.from(artworkBucket).remove([newPath]); if(cleanup.error) console.warn('Upload cleanup failed:',cleanup.error); }
    artworkStatus('Save failed: '+error.message);
  } finally {button.disabled=false;}
}

/* ===== EDIT EXISTING ARTWORK ===== */
function editLiveArtwork(id) {
  const a=artworkRows.find(row=>row.id===id);if(!a)return;
  const f=document.getElementById('live-artwork-form');
  for(const key of ['title','description','gallery_id','alt_text','price','medium','dimensions','artwork_year','availability_label','price_label'])f.elements[key].value=a[key]??'';
  /* ===== RESTORE SHIPPING PACKAGE DETAILS WHEN EDITING ===== */
  for(const key of ['packaging_type','package_length','package_width','package_height','package_weight','special_shipping_notes'])f.elements[key].value=a[key]??(key==='packaging_type'?'stretched_canvas':'');
  for(const key of ['is_featured','is_visible','is_sold'])f.elements[key].checked=!!a[key];
  f.elements.artworkId.value=a.id;
  document.getElementById('artwork-form-heading').textContent='Edit artwork';
  document.getElementById('cancel-live-artwork').hidden=false;
  f.scrollIntoView({behavior:'smooth',block:'start'});
}

/* ===== HOMEPAGE FEATURE TOGGLE ===== */
async function toggleLiveFeature(id) {
  const a=artworkRows.find(row=>row.id===id);if(!a)return;
  const result=await artworkClient.from('artworks').update({is_featured:!a.is_featured,updated_at:new Date().toISOString()}).eq('id',id).select('id');
  if(result.error)return artworkStatus('Could not update feature: '+result.error.message);
  await renderLiveArtwork(document.getElementById('workspace-content'));
  artworkStatus('Homepage feature setting saved.');
}

/* ===== DELETE ARTWORK WITH CONFIRMATION ===== */
async function deleteLiveArtwork(id) {
  const a=artworkRows.find(row=>row.id===id);if(!a||!confirm(`Permanently delete "${a.title}" from the artwork database? This cannot be undone.`))return;
  const deleted=await artworkClient.from('artworks').delete().eq('id',id).select('id');
  if(deleted.error)return artworkStatus('Delete failed: '+deleted.error.message);
  const imageRemoved=await artworkClient.storage.from(artworkBucket).remove([a.image_path]);
  await renderLiveArtwork(document.getElementById('workspace-content'));
  artworkStatus(imageRemoved.error?'Artwork record deleted, but its stored image could not be removed: '+imageRemoved.error.message:'Artwork and image deleted.');
}
