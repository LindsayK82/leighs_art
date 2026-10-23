/* ===== LIVE HOMEPAGE PROMOTION EDITOR ===== */
async function renderPromotions(target) {
  const client = window.artistSupabase;
  target.replaceChildren();
  const panel = document.createElement('div'); panel.className='admin-panel';
  panel.innerHTML = `<h3>Homepage announcement</h3><p class="admin-muted">One promotion at a time. Drafts stay hidden. Published promotions appear only within the selected dates. Sale prices must be changed separately in Print Pricing.</p>
  <form id="promotion-form" class="admin-list">
  <label class="admin-field">Headline<input class="admin-control" name="headline" maxlength="100" required></label>
  <label class="admin-field">Description<textarea class="admin-control" name="description" maxlength="350" rows="3"></textarea></label>
  <div class="admin-form-grid"><label class="admin-field">Start date<input class="admin-control" name="start_date" type="date" required></label><label class="admin-field">End date (inclusive)<input class="admin-control" name="end_date" type="date" required></label></div>
  <label class="admin-field">Destination page<select class="admin-control" name="destination"><option value="collect-art.html">Collect Art</option><option value="galleries.html">Galleries</option><option value="index.html">Home</option><option value="about.html">About</option><option value="commissions.html">Commissions</option><option value="reviews.html">Reviews</option><option value="installations.html">Installations</option><option value="invisibility-project.html">Invisibility Project</option><option value="custom">Custom URL</option></select></label>
  <label class="admin-field" id="promotion-custom-wrap" hidden>Custom destination (https:// only)<input class="admin-control" name="custom_url" type="url" placeholder="https://example.com/event"></label>
  <label class="admin-field">Button label<input class="admin-control" name="button_label" maxlength="45" value="Explore the Collection" required></label>
  <label class="admin-field">Optional image URL (https:// only)<input class="admin-control" name="image_url" type="url" placeholder="https://..."></label>
  <div class="admin-inline"><button type="submit" class="admin-button" data-status="draft">Save Draft</button><button type="submit" class="admin-button" data-status="published">Publish / Schedule</button><button type="button" class="admin-button secondary" id="promotion-deactivate">Deactivate</button></div>
  </form><p class="admin-notice" id="promotion-status" role="status"></p><div id="promotion-preview" class="promotion-preview"></div>`;
  target.append(panel);
  const form=panel.querySelector('form'), status=panel.querySelector('#promotion-status');
  const field=n=>form.elements.namedItem(n);
  const {data,error}=await client.from('homepage_promotions').select('*').eq('id',1).maybeSingle();
  if(error){status.textContent='Could not load promotion: '+error.message+' (Have you run the supplied SQL setup?)';return;}
  if(data){for(const key of ['headline','description','start_date','end_date','button_label','image_url'])field(key).value=data[key]||''; const choices=[...field('destination').options].map(o=>o.value);field('destination').value=choices.includes(data.destination_url)?data.destination_url:'custom';if(field('destination').value==='custom')field('custom_url').value=data.destination_url||'';status.textContent='Current status: '+data.status;}
  const toggle=()=>panel.querySelector('#promotion-custom-wrap').hidden=field('destination').value!=='custom';
  field('destination').addEventListener('change',()=>{toggle();preview();});toggle();
  function preview(){const el=panel.querySelector('#promotion-preview');el.replaceChildren();const h=document.createElement('h3');h.textContent=field('headline').value||'Your sale headline';const d=document.createElement('p');d.textContent=field('description').value;const a=document.createElement('span');a.textContent=field('button_label').value||'Explore';a.className='promotion-cta';el.append(h,d,a);}
  form.addEventListener('input',preview);preview();
  form.addEventListener('submit',async e=>{e.preventDefault();const button=e.submitter;const desired=button?.dataset.status||'draft';const start=field('start_date').value,end=field('end_date').value;if(end<start){status.textContent='End date must be on or after start date.';return;}
    const destination=field('destination').value==='custom'?field('custom_url').value.trim():field('destination').value;
    const image=field('image_url').value.trim();
    if((field('destination').value==='custom'&&!validHttps(destination))||(image&&!validHttps(image))){status.textContent='Custom links and image URLs must begin with https://';return;}
    const payload={id:1,headline:field('headline').value.trim(),description:field('description').value.trim(),start_date:start,end_date:end,destination_url:destination,button_label:field('button_label').value.trim(),image_url:image||null,status:desired};
    status.textContent='Saving…';const {error}=await client.from('homepage_promotions').upsert(payload,{onConflict:'id'});status.textContent=error?'Save failed: '+error.message:desired==='draft'?'Draft saved. The banner is hidden.':'Promotion published. It will display during the selected dates.';
  });
  panel.querySelector('#promotion-deactivate').addEventListener('click',async()=>{if(!confirm('Deactivate the homepage promotion?'))return;const {error}=await client.from('homepage_promotions').update({status:'draft'}).eq('id',1);status.textContent=error?'Could not deactivate: '+error.message:'Promotion deactivated. It is now a draft.';});
}
function validHttps(value){try{const url=new URL(value);return url.protocol==='https:';}catch{return false;}}
