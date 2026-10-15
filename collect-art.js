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
function printOptions(a){return (a.printOptions||[]).filter(p=>sizes.includes(p.size_inches)&&Number.isFinite(Number(p.price_usd))&&Number(p.price_usd)>0).sort((x,y)=>sizes.indexOf(x.size_inches)-sizes.indexOf(y.size_inches));}
function eligible(a,kind){return kind==='print' ? a.is_visible===true && printOptions(a).length>0 : availableOriginal(a);}
function productImage(a){return client.storage.from('artwork-images').getPublicUrl(a.image_path).data.publicUrl;}
function getOffer(item){
 const a=products.find(p=>p.id===item.id);
 if(!a || !eligible(a,item.kind))return null;
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
 status.textContent=matches.length?'':q?'No matching artwork found.':category==='prints'?'No prints are priced yet.':'No original canvases are currently listed for sale.';
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
  }else{
   const price=document.createElement('p');price.className='original-price';price.textContent=money(Number(a.price));
   const button=document.createElement('button');button.type='button';button.className='collect-button';button.textContent='Add original to cart';button.addEventListener('click',()=>addCart(a,'original','Original canvas'));
   card.append(price,button);
  }
  grid.append(card);
 }
}
function switchCategory(next){category=next;for(const kind of ['prints','originals']){const btn=document.getElementById('tab-'+kind);btn.classList.toggle('active',kind===next);btn.setAttribute('aria-pressed',String(kind===next));}document.getElementById('store-title').textContent=next==='prints'?'Fine Art Prints':'Original Canvases';document.getElementById('store-subtitle').textContent=next==='prints'?'Only sizes priced by the artist are available. Edition availability will be verified before checkout launches.':'Only original canvases marked available for sale are listed here.';renderProducts();}
/* ===== CART DISPLAY — PREVIEW ONLY, NO CHECKOUT ===== */
function renderCart(){
 const box=document.getElementById('cart-items');box.replaceChildren();
 cart.forEach((item,index)=>{const line=document.createElement('div');line.className='cart-line';const label=document.createElement('span');label.textContent=item.title+' · '+(item.kind==='original'?'Original canvas':item.size+' in print')+' · '+money(item.price);const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.setAttribute('aria-label','Remove '+item.title);remove.addEventListener('click',()=>{cart.splice(index,1);renderCart();notify('Item removed');});line.append(label,remove);box.append(line);});
 if(!cart.length)box.textContent='Your cart is empty.';
 document.getElementById('cart-count').textContent=cart.length;document.getElementById('floating-cart-count').textContent=cart.length;document.getElementById('floating-cart').setAttribute('aria-label','Open shopping cart, '+cart.length+' items');document.getElementById('cart-total').textContent=money(cart.reduce((sum,x)=>sum+x.price,0));
 try{localStorage.setItem(CART_KEY,JSON.stringify(cart.map(({id,kind,size})=>({id,kind,size}))));}catch{}
}
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
  const [art,prices]=await Promise.all([client.from('artworks').select('id,title,image_path,alt_text,dimensions,price,is_sold,is_visible,availability_label').eq('is_visible',true),client.from('artwork_print_prices').select('artwork_id,size_inches,price_usd')]);
  if(art.error)throw art.error;if(prices.error)throw prices.error;
  const byArtwork=new Map();for(const row of prices.data||[]){if(!byArtwork.has(row.artwork_id))byArtwork.set(row.artwork_id,[]);byArtwork.get(row.artwork_id).push(row);}
  products=(art.data||[]).filter(a=>a.image_path).map(a=>({...a,printOptions:byArtwork.get(a.id)||[]}));
  restoreCart();renderProducts();
 }catch(err){status.textContent='Artwork is temporarily unavailable. Please try again later.';console.error('Collect Art load error:',err);}
}
init();
})();
