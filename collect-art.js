/* ===== SUPABASE PUBLIC STORE CONNECTION ===== */
(() => {
'use strict';
const grid = document.getElementById('collect-grid');
const status = document.getElementById('store-status');
const search = document.getElementById('art-search');
const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
const sizes = ['10 × 10','12 × 12','14 × 14','16 × 16','18 × 18','20 × 20'];
const CART_KEY='leigh-collect-cart-v2';
const MAX_PREVIEW_PER_SIZE=10;
let products=[], category='prints', cart=[], previousFocus=null,toastTimer;
const client=window.supabase?.createClient('https://hqkcqvxppoboryqcwksi.supabase.co','sb_publishable_ePeAQ5b-9vFZkOVmOMHLzA_zhLGbaOB',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});

/* ===== SAFE PUBLIC PRODUCT ELIGIBILITY ===== */
function availableOriginal(a){
  const availability=String(a.availability_label||'').trim().toLowerCase();
  return a.is_visible===true && a.is_sold===false && ['available','available for sale','for sale'].includes(availability) && Number.isFinite(Number(a.price)) && Number(a.price)>0;
}
/* ===== EXHIBITION STATUS — DISPLAY ONLY, NEVER A DIRECT SALE ===== */
function isExhibited(a){
  return a.is_visible===true && a.is_sold===false && ['on exhibit','on exhibition'].includes(String(a.availability_label||'').trim().toLowerCase());
}
function listedOriginal(a){return availableOriginal(a)||isExhibited(a);}
function safeGalleryUrl(value){
  try{const url=new URL(String(value||'').trim());return ['https:','http:'].includes(url.protocol)?url.href:null;}catch{return null;}
}
function printOptions(a){return (a.printOptions||[]).filter(p=>sizes.includes(p.size_inches)&&Number.isFinite(Number(p.price_usd))&&Number(p.price_usd)>0).sort((x,y)=>sizes.indexOf(x.size_inches)-sizes.indexOf(y.size_inches));}
function eligible(a,kind){return kind==='print' ? a.is_visible===true && printOptions(a).length>0 : listedOriginal(a);}
function productImage(a){return client.storage.from('artwork-images').getPublicUrl(a.image_path).data.publicUrl;}
function getOffer(item){
 const a=products.find(p=>p.id===item.id);
 if(!a || (item.kind==='original' ? !availableOriginal(a) : !eligible(a,item.kind)))return null;
 if(item.kind==='original')return {...item,title:a.title,price:Number(a.price),size:'Original canvas'};
 const option=printOptions(a).find(o=>o.size_inches===item.size);
 return option?{...item,title:a.title,price:Number(option.price_usd)}:null;
}
/* ===== CART VALIDATION AGAINST CURRENT CATALOG ===== */
function restoreCart(){
 let stored=[];try{stored=JSON.parse(localStorage.getItem(CART_KEY)||'[]');}catch{}
 if(!Array.isArray(stored))stored=[];
 const result=[];
 for(const entry of stored.slice(0,100)){
   if(!entry || typeof entry.id!=='string' || !['print','original'].includes(entry.kind))continue;
   const item=getOffer({id:entry.id,kind:entry.kind,size:entry.size});if(!item)continue;
   const count=result.filter(x=>x.id===item.id&&x.kind===item.kind&&x.size===item.size).length;
   if(item.kind==='original' && result.some(x=>x.id===item.id&&x.kind==='original'))continue;
   if(item.kind==='print' && count>=MAX_PREVIEW_PER_SIZE)continue;
   result.push(item);
 }
 cart=result;renderCart();
}
function notify(message){const toast=document.getElementById('cart-toast');toast.textContent=message;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,2600);}
function addCart(a,kind,size){
 const item=getOffer({id:a.id,kind,size});if(!item)return notify('This option is not available.');
 const count=cart.filter(x=>x.id===item.id&&x.kind===kind&&x.size===item.size).length;
 if(kind==='original'&&count)return notify('This original is already in your cart.');
 if(kind==='print'&&count>=MAX_PREVIEW_PER_SIZE)return notify('Preview limit reached for this print size.');
 cart.push(item);renderCart();notify(a.title+' added to cart');
}
/* ===== PRINTS AND ORIGINALS TABS ===== */
function renderProducts(){
 grid.replaceChildren();const q=search.value.trim().toLowerCase();
 const matches=products.filter(a=>eligible(a,category==='prints'?'print':'original') && a.title.toLowerCase().includes(q));
 status.textContent=matches.length?'':q?'No matching artwork found.':category==='prints'?'No prints are priced yet.':'No original canvases are currently listed.';
 for(const a of matches){
  const card=document.createElement('article');card.className='collect-product';
  const img=document.createElement('img');img.src=productImage(a);img.alt=a.alt_text||a.title+' by Leigh Witherell';img.loading='lazy';
  const title=document.createElement('h3');title.textContent=a.title;
  const desc=document.createElement('p');desc.textContent=category==='prints'?'Giclée print · edition availability to be confirmed':'Original canvas · '+(a.dimensions||'One-of-a-kind artwork');
  card.append(img,title,desc);
  if(category==='prints'){
   const label=document.createElement('label');label.textContent='Choose print size';
   const select=document.createElement('select');select.className='print-size';select.id='size-'+a.id;label.htmlFor=select.id;
   for(const option of printOptions(a)){const opt=document.createElement('option');opt.value=option.size_inches;opt.textContent=option.size_inches+' in — '+money(Number(option.price_usd));select.append(opt);}
   const button=document.createElement('button');button.type='button';button.className='collect-button';button.textContent='Add print to cart';button.addEventListener('click',()=>addCart(a,'print',select.value));
   card.append(label,select,button);
  }else if(isExhibited(a)){
   const exhibition=document.createElement('p');exhibition.className='exhibition-status';exhibition.textContent='On Exhibition';
   card.append(exhibition);
   const galleryName=String(a.exhibition_gallery_name||'').trim();
   const galleryUrl=safeGalleryUrl(a.exhibition_gallery_url);
   if(galleryName){
    if(galleryUrl){const link=document.createElement('a');link.className='exhibition-gallery-link';link.href=galleryUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent=galleryName;link.setAttribute('aria-label','Visit '+galleryName+' (opens in a new tab)');card.append(link);}
    else{const name=document.createElement('p');name.className='exhibition-gallery-name';name.textContent=galleryName;card.append(name);}
   }
  }else{
   const price=document.createElement('p');price.className='original-price';price.textContent=money(Number(a.price));
   const button=document.createElement('button');button.type='button';button.className='collect-button';button.textContent='Add original to cart';button.addEventListener('click',()=>addCart(a,'original','Original canvas'));
   card.append(price,button);
  }
  grid.append(card);
 }
}
function switchCategory(next){category=next;for(const kind of ['prints','originals']){const btn=document.getElementById('tab-'+kind);btn.classList.toggle('active',kind===next);btn.setAttribute('aria-pressed',String(kind===next));}document.getElementById('store-title').textContent=next==='prints'?'Fine Art Prints':'Original Canvases';document.getElementById('store-subtitle').textContent=next==='prints'?'Only sizes priced by the artist are available. Edition availability will be verified before checkout launches.':'Browse original canvases available for purchase or currently on exhibition.';renderProducts();}
/* ===== CART DISPLAY — PREVIEW ONLY, NO CHECKOUT ===== */
function renderCart(){
 invalidateShippingPreview('Cart changed. Request a new shipping quote.');
 const box=document.getElementById('cart-items');box.replaceChildren();
 cart.forEach((item,index)=>{const line=document.createElement('div');line.className='cart-line';const label=document.createElement('span');label.textContent=item.title+' · '+(item.kind==='original'?'Original canvas':item.size+' in print')+' · '+money(item.price);const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.setAttribute('aria-label','Remove '+item.title);remove.addEventListener('click',()=>{cart.splice(index,1);renderCart();notify('Item removed');});line.append(label,remove);box.append(line);});
 if(!cart.length)box.textContent='Your cart is empty.';
 document.getElementById('cart-count').textContent=cart.length;document.getElementById('floating-cart-count').textContent=cart.length;document.getElementById('floating-cart').setAttribute('aria-label','Open shopping cart, '+cart.length+' items');document.getElementById('cart-total').textContent=money(cart.reduce((sum,x)=>sum+x.price,0));
 try{localStorage.setItem(CART_KEY,JSON.stringify(cart.map(({id,kind,size})=>({id,kind,size}))));}catch{}
}
/* ===== ISOLATED SHIPPING PREVIEW — NEVER CREATES PAYMENT ===== */
const shippingPreviewForm=document.getElementById('shipping-preview-form');
const shippingPreviewResult=document.getElementById('shipping-preview-result');
let shippingPreviewRevision=0;
function invalidateShippingPreview(message='Address changed. Request new shipping rates for this destination.'){
 shippingPreviewRevision++;
 if(shippingPreviewResult){shippingPreviewResult.replaceChildren();shippingPreviewResult.textContent=message;}
}
shippingPreviewForm?.addEventListener('input',event=>{
 if(event.target?.matches('input, select, textarea'))invalidateShippingPreview();
});
shippingPreviewForm?.addEventListener('change',event=>{
 if(event.target?.matches('input, select, textarea'))invalidateShippingPreview();
});
shippingPreviewForm?.addEventListener('submit',async event=>{
 event.preventDefault();
 const revision=++shippingPreviewRevision;
 shippingPreviewResult.replaceChildren();
 if(cart.length!==1 || cart[0].kind!=='print'){
  shippingPreviewResult.textContent='Shipping preview currently supports exactly one print.';return;
 }
 const btn=shippingPreviewForm.querySelector('button[type="submit"]');btn.disabled=true;
 shippingPreviewResult.textContent='Requesting shipping rates…';
 try{
  const fields=new FormData(shippingPreviewForm);
  const address={street1:String(fields.get('street1')||'').trim(),city:String(fields.get('city')||'').trim(),zip:String(fields.get('zip')||'').trim(),country:'GB'};
  if(!/^[A-Z]{1,2}[0-9][A-Z0-9]?\s*[0-9][A-Z]{2}$/i.test(address.zip))throw Error('Enter a valid UK postcode.');
  const checkout=await client.functions.invoke('paypal-live-checkout',{body:{items:cart.map(x=>({id:x.id,kind:x.kind,size:x.size}))}});
  if(revision!==shippingPreviewRevision)return;
  if(checkout.error||!checkout.data?.checkout_id||!checkout.data?.checkout_token)throw Error('Unable to create a temporary checkout session.');
  const quote=await client.functions.invoke('checkout-shipping-rates',{body:{checkout_id:checkout.data.checkout_id,checkout_token:checkout.data.checkout_token,test_international_quote:true,test_destination:address}});
  if(revision!==shippingPreviewRevision)return;
  if(quote.error||!Array.isArray(quote.data?.rates))throw Error(quote.data?.error||'Unable to retrieve shipping rates.');
  shippingPreviewResult.replaceChildren();
  const heading=document.createElement('h4');heading.textContent='Choose a shipping service';shippingPreviewResult.append(heading);
  const choices=document.createElement('fieldset');choices.className='shipping-rate-choices';
  const legend=document.createElement('legend');legend.textContent='Available shipping options (estimates)';choices.append(legend);
  const summary=document.createElement('div');summary.className='shipping-preview-summary';
  const updateSummary=(rate)=>{
   const shipping=Number(rate.amount);const subtotal=Number(quote.data.subtotal);
   summary.replaceChildren();
   const addRow=(label,value,emphasis=false)=>{const row=document.createElement('div');row.className='shipping-summary-row'+(emphasis?' shipping-summary-total':'');const name=document.createElement('span');name.textContent=label;const amount=document.createElement('strong');amount.textContent=money(value);row.append(name,amount);summary.append(row);};
   addRow('Artwork',subtotal);addRow('Estimated shipping',shipping);addRow('Estimated total',subtotal+shipping,true);
  };
  const saveSelection=async(rate)=>{
   const inputs=[...choices.querySelectorAll('input')];inputs.forEach(input=>input.disabled=true);
   const oldText=note.textContent;note.textContent='Confirming selected rate…';
   try{
    const selection=await client.functions.invoke('checkout-shipping-rates',{body:{checkout_id:checkout.data.checkout_id,checkout_token:checkout.data.checkout_token,test_international_quote:true,test_destination:address,selected_service:rate.service}});
    if(revision!==shippingPreviewRevision)return;
    if(selection.error||!selection.data?.selection_saved_to_test_table)throw Error(selection.data?.error||'Could not confirm this rate. Please request a new quote.');
    updateSummary({amount:selection.data.selected_shipping_amount});
    note.textContent='Selected rate verified and saved for testing only. No payment or label created.';
   }catch(error){if(revision===shippingPreviewRevision){note.textContent=error.message||'Unable to verify rate.';inputs.forEach(input=>input.checked=false);}}
   finally{if(revision===shippingPreviewRevision)inputs.forEach(input=>input.disabled=false);}
  };
  quote.data.rates.forEach((rate,index)=>{
   const label=document.createElement('label');label.className='shipping-rate-option';
   const input=document.createElement('input');input.type='radio';input.name='shipping-rate';input.value=String(index);input.checked=index===0;
   const service=document.createElement('span');service.className='shipping-rate-name';service.textContent=rate.service||'Shipping service';
   const price=document.createElement('strong');price.textContent=money(Number(rate.amount));
   label.append(input,service,price);choices.append(label);
   input.addEventListener('change',()=>{if(input.checked)saveSelection(rate);});
  });
  shippingPreviewResult.append(choices,summary);
  if(quote.data.rates.length)updateSummary(quote.data.rates[0]);
  const note=document.createElement('p');note.className='shipping-preview-note';note.textContent='Estimates may change. No payment or label has been created.';shippingPreviewResult.append(note);
 }catch(error){if(revision===shippingPreviewRevision)shippingPreviewResult.textContent=error?.message||'Shipping preview unavailable.';}
 finally{btn.disabled=false;}
});
/* ===== CART DRAWER CONTROLS ===== */
function showCart(show){const panel=document.getElementById('cart-panel');if(show){previousFocus=document.activeElement;panel.hidden=false;document.getElementById('cart-close').focus();}else{panel.hidden=true;previousFocus?.focus?.();}document.getElementById('cart-toggle').setAttribute('aria-expanded',String(show));document.getElementById('floating-cart').setAttribute('aria-expanded',String(show));document.body.classList.toggle('cart-open',show);}
document.getElementById('cart-toggle').addEventListener('click',()=>showCart(true));document.getElementById('floating-cart').addEventListener('click',()=>showCart(true));document.getElementById('cart-close').addEventListener('click',()=>showCart(false));
document.addEventListener('keydown',e=>{const panel=document.getElementById('cart-panel');if(panel.hidden)return;if(e.key==='Escape'){showCart(false);return;}if(e.key==='Tab'){const focusable=[...panel.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')];if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
for(const kind of ['prints','originals'])document.getElementById('tab-'+kind).addEventListener('click',()=>switchCategory(kind));
search.addEventListener('input',renderProducts);
/* ===== FETCH LIVE ARTWORK AND PRINT PRICES ===== */
async function init(){
 if(!client){status.textContent='Store could not initialize. Please try again later.';return;}
 try{
  const [art,prices]=await Promise.all([client.from('artworks').select('id,title,image_path,alt_text,dimensions,price,is_sold,is_visible,availability_label,exhibition_gallery_name,exhibition_gallery_url').eq('is_visible',true),client.from('artwork_print_prices').select('artwork_id,size_inches,price_usd')]);
  if(art.error)throw art.error;if(prices.error)throw prices.error;
  const byArtwork=new Map();for(const row of prices.data||[]){if(!byArtwork.has(row.artwork_id))byArtwork.set(row.artwork_id,[]);byArtwork.get(row.artwork_id).push(row);}
  products=(art.data||[]).filter(a=>a.image_path).map(a=>({...a,printOptions:byArtwork.get(a.id)||[]}));
  restoreCart();renderProducts();
 }catch(err){status.textContent='Artwork is temporarily unavailable. Please try again later.';console.error('Collect Art load error:',err);}
}
init();
})();
