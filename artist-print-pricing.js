/* ===== PRINT PRICING — LIVE SUPABASE ARTWORK CATALOG ===== */
const printClient = window.artistSupabase;
const printSizes = ['10 × 10','12 × 12','14 × 14','16 × 16','18 × 18','20 × 20'];
const printEscape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let printArtworks = [], printGalleries = [], printRows = [];

/* ===== ARTWORK TAB — SEARCH AND GALLERY FILTER ===== */
async function renderPrintArtwork(target) {
  target.innerHTML = '<p class="admin-muted">Loading paintings and print prices…</p>';
  const [arts, galleries, prices] = await Promise.all([
    printClient.from('artworks').select('id,title,image_path,gallery_id,description').order('title'),
    printClient.from('galleries').select('id,name'),
    printClient.from('artwork_print_prices').select('artwork_id,size_inches,price_usd')
  ]);
  if (arts.error || galleries.error || prices.error) {
    target.innerHTML = '<p class="admin-muted">Could not load print pricing. Please run the included print-pricing SQL in Supabase first, then refresh.</p>';
    return;
  }
  printArtworks=arts.data; printGalleries=galleries.data; printRows=prices.data;
  target.innerHTML = `<!-- ===== PRINT ARTWORK SEARCH ===== -->
    <div class="admin-panel"><h3>Artwork print pricing</h3><p class="admin-muted">Select a painting to configure its available print sizes and prices. Original canvas information is managed separately under Manage Galleries.</p>
    <div class="admin-inline"><label class="admin-field">Search paintings<input id="print-search" class="admin-control" type="search" placeholder="Search by title"></label>
    <label class="admin-field">Gallery<select id="print-gallery" class="admin-control"><option value="">All galleries</option>${printGalleries.map(g=>`<option value="${printEscape(g.id)}">${printEscape(g.name)}</option>`).join('')}</select></label></div>
    <p class="admin-muted" id="print-count" role="status"></p></div><div class="admin-list" id="print-artwork-list"></div><div id="print-editor"></div>`;
  const search=target.querySelector('#print-search'), gallery=target.querySelector('#print-gallery'), list=target.querySelector('#print-artwork-list');
  function draw() {
    const matches=printArtworks.filter(a=>(!gallery.value||a.gallery_id===gallery.value)&&a.title.toLowerCase().includes(search.value.trim().toLowerCase()));
    target.querySelector('#print-count').textContent=`Showing ${matches.length} of ${printArtworks.length} paintings`;
    list.innerHTML=matches.map(a=>{
      const image=a.image_path?printClient.storage.from('artwork-images').getPublicUrl(a.image_path).data.publicUrl:'';
      const count=printRows.filter(p=>p.artwork_id===a.id).length;
      return `<article class="admin-row">${image?`<img class="artwork-manager-thumb" src="${printEscape(image)}" alt="">`:''}<div><h3>${printEscape(a.title)}</h3><p class="admin-muted">${count} print sizes configured</p></div><button class="admin-button secondary" type="button" data-print-id="${printEscape(a.id)}">Edit print prices</button></article>`;
    }).join('')||'<p class="admin-muted">No matching paintings.</p>';
    list.querySelectorAll('[data-print-id]').forEach(button=>button.addEventListener('click',()=>openPrintEditor(button.dataset.printId,target)));
  }
  search.addEventListener('input',draw);gallery.addEventListener('change',draw);draw();
}

/* ===== PRINT EDITOR — SIX SIZES WITH OPTIONAL PRICES ===== */
function openPrintEditor(id,target) {
  const artwork=printArtworks.find(a=>a.id===id);if(!artwork)return;
  const editor=target.querySelector('#print-editor');
  const existing=new Map(printRows.filter(p=>p.artwork_id===id).map(p=>[p.size_inches,p.price_usd]));
  editor.innerHTML=`<div class="admin-panel"><h3>Print prices: ${printEscape(artwork.title)}</h3><p class="admin-muted">Check a size to offer it for sale. Unchecked sizes will not be offered. Prices are in US dollars.</p>
  <form id="print-price-form" class="admin-form-grid">${printSizes.map((size,i)=>`<div class="admin-inline"><label class="admin-field"><input type="checkbox" name="enabled${i}" ${existing.has(size)?'checked':''}> ${size} inches</label><label class="admin-field">Price ($)<input class="admin-control" type="number" name="price${i}" min="0.01" max="100000" step="0.01" placeholder="Enter price" value="${existing.has(size)?printEscape(existing.get(size)):''}"></label></div>`).join('')}
  <div class="admin-inline"><button class="admin-button" type="submit">Save print prices</button><button class="admin-button secondary" id="print-cancel" type="button">Cancel</button></div><p id="print-status" class="admin-notice" role="status"></p></form></div>`;
  editor.querySelector('#print-cancel').addEventListener('click',()=>editor.replaceChildren());
  editor.querySelector('form').addEventListener('submit',async event=>{
    event.preventDefault();const form=event.currentTarget,status=editor.querySelector('#print-status'),button=form.querySelector('[type=submit]');
    const rows=[];
    for(let i=0;i<printSizes.length;i++){
      if(!form.elements['enabled'+i].checked)continue;
      const price=Number(form.elements['price'+i].value);
      if(!form.elements['price'+i].value||!Number.isFinite(price)||price<=0||price>100000){status.textContent='Enter a valid positive price for every checked size.';return;}
      rows.push({artwork_id:id,size_inches:printSizes[i],price_usd:price});
    }
    button.disabled=true;status.textContent='Saving…';
    /* ===== REPLACE THIS PAINTING'S PRINT PRICES ATOMICALLY ===== */
    const {error}=await printClient.rpc('replace_artwork_print_prices',{p_artwork_id:id,p_prices:rows.map(({size_inches,price_usd})=>({size_inches,price_usd}))});
    button.disabled=false;
    if(error){status.textContent='Could not save: '+error.message;return;}
    printRows=printRows.filter(p=>p.artwork_id!==id).concat(rows);
    status.textContent='Print prices saved successfully.';
    const query=target.querySelector('#print-search').value,selectedGallery=target.querySelector('#print-gallery').value;
    await renderPrintArtwork(target);
    target.querySelector('#print-search').value=query;target.querySelector('#print-gallery').value=selectedGallery;
    target.querySelector('#print-search').dispatchEvent(new Event('input'));
    openPrintEditor(id,target);
    target.querySelector('#print-status').textContent='Print prices saved successfully.';
  });
  editor.scrollIntoView({behavior:'smooth',block:'start'});
}
