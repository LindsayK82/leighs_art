/* ===== COLLECT ART PRODUCT CATALOG ===== */
const PRODUCTS = [{"id": 0, "title": "Blue Street in Afternoon Light", "image": "assets/images/slices_of_life/blue-street-in-afternoon-light.png"}, {"id": 1, "title": "The Secret Before Spring", "image": "assets/images/slices_of_life/the-secret-before-spring.jpg"}, {"id": 2, "title": "Margo in Conversation", "image": "assets/images/slices_of_life/margo-in-conversation.jpg"}, {"id": 3, "title": "Where Ivy Climbs and Love Resides", "image": "assets/images/slices_of_life/where-ivy-climbs-and-love-resides.webp"}, {"id": 4, "title": "Brother and Sister on a Blossomed Path", "image": "assets/images/slices_of_life/brother-and-sister-on-a-blossomed-path.jpg"}, {"id": 5, "title": "Modern Apollo Against a Village Coastline", "image": "assets/images/slices_of_life/modern-apollo-against-a-village-shoreline.webp"}, {"id": 6, "title": "Modern Venus Rising", "image": "assets/images/slices_of_life/modern-venus-rising.webp"}, {"id": 7, "title": "Venus in Repose", "image": "assets/images/slices_of_life/venus-in-repose.webp"}, {"id": 8, "title": "The Archivist", "image": "assets/images/slices_of_life/the-archivist.webp"}, {"id": 9, "title": "The Lover’s Kiss", "image": "assets/images/reviews/the-lovers-kiss.webp"}, {"id": 10, "title": "The Bath", "image": "assets/images/sensuality/the-bath.webp"}, {"id": 11, "title": "God Needs the Devil — Image 1", "image": "assets/images/sensuality/gntd-image-one.webp"}, {"id": 12, "title": "God Needs the Devil — Image 2", "image": "assets/images/sensuality/gntd-image-two.webp"}, {"id": 13, "title": "God Needs the Devil — Image 3", "image": "assets/images/sensuality/gntd-image-three.jpg"}, {"id": 14, "title": "Tell Me How — Image 1", "image": "assets/images/sensuality/tmh-image-one.webp"}, {"id": 15, "title": "Tell Me How — Image 2", "image": "assets/images/sensuality/tmh-image-two.webp"}, {"id": 16, "title": "Tell Me How — Image 3", "image": "assets/images/sensuality/tmh-image-three.webp"}, {"id": 17, "title": "Tell Me How — Image 4", "image": "assets/images/sensuality/tmh-image-four.webp"}, {"id": 18, "title": "Tell Me How — Image 5", "image": "assets/images/slices_of_life/tell-me-how-image-five.webp"}, {"id": 19, "title": "Tell Me How — Image 6", "image": "assets/images/sensuality/tmh-image-six.webp"}, {"id": 20, "title": "Tell Me How — Image 7", "image": "assets/images/sensuality/tmh-image-seven.webp"}, {"id": 21, "title": "Tell Me How — Image 8", "image": "assets/images/sensuality/tmh-image-eight.webp"}, {"id": 22, "title": "Tell Me How — Image 10", "image": "assets/images/sensuality/tmh-image-ten.webp"}, {"id": 23, "title": "Alli", "image": "assets/images/melancholy/alli.webp"}, {"id": 24, "title": "Hidden Wounds", "image": "assets/images/sensuality/hidden-wounds.webp"}, {"id": 25, "title": "The Artist’s Self-Reflection", "image": "assets/images/melancholy/the-artist.webp"}, {"id": 26, "title": "Jim", "image": "assets/images/melancholy/jim.webp"}, {"id": 27, "title": "Eric", "image": "assets/images/melancholy/eric.webp"}, {"id": 28, "title": "Freedom", "image": "assets/images/commissions/freedom.webp"}];
/* ===== PRINT PRICES — EDIT HERE ===== */
const SIZES = [{label:'10″ × 10″',price:250},{label:'12″ × 12″',price:300},{label:'14″ × 14″',price:350},{label:'16″ × 16″',price:400},{label:'18″ × 18″',price:450},{label:'20″ × 20″',price:500}];
/* ===== CART STORAGE AND EDITION RULES ===== */
// Each artwork/size combination is a separate edition of ten. These are
// browser-side limits only, NOT verified stock or assigned COA numbers.
const EDITION_SIZE = 10;
const STORAGE_KEY = 'leigh-collect-cart-v1';
function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    const result = [];
    for (const item of saved.slice(0, 300)) {
      const product = PRODUCTS.find(p => p.id === item.id);
      const size = SIZES.find(s => s.label === item.size);
      if (product && size && result.filter(i => i.id === product.id && i.size === size.label).length < EDITION_SIZE) {
        result.push({id:product.id,title:product.title,size:size.label,price:size.price});
      }
    }
    return result;
  } catch { return []; }
}
const CART = loadCart();
function saveCart() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(CART)); } catch {} }
const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
let toastTimer;
function notifyCart(message) {
  const toast = document.getElementById('cart-toast');
  toast.textContent = message; toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2600);
}
/* ===== PRINT GALLERY ===== */
function renderProducts(query='') {
  const grid = document.getElementById('collect-grid');
  grid.replaceChildren();
  PRODUCTS.filter(p => p.title.toLowerCase().includes(query.toLowerCase())).forEach(p => {
    const article = document.createElement('article'); article.className='collect-product';
    const img = document.createElement('img'); img.src=p.image; img.alt=p.title+' by Leigh Witherell'; img.loading='lazy';
    const title = document.createElement('h3'); title.textContent=p.title;
    const info = document.createElement('p'); info.textContent='Giclée print · Edition of 10 per size';
    const label = document.createElement('label'); label.textContent='Choose print size';
    const select = document.createElement('select'); select.className='print-size';
    const selectId='print-size-'+p.id; select.id=selectId; label.htmlFor=selectId;
    SIZES.forEach((s,i) => { const opt=document.createElement('option'); opt.value=i; opt.textContent=s.label+' — '+money(s.price); select.append(opt); });
    const btn = document.createElement('button'); btn.className='collect-button'; btn.textContent='Add to cart';
    btn.addEventListener('click', () => {
      const size=SIZES[Number(select.value)];
      const count=CART.filter(i=>i.id===p.id && i.size===size.label).length;
      if(count>=EDITION_SIZE){ notifyCart('Maximum of 10 for this artwork and size in the preview.'); return; }
      CART.push({id:p.id,title:p.title,size:size.label,price:size.price});
      renderCart(); notifyCart(p.title+' added to cart');
    });
    article.append(img,title,info,label,select,btn); grid.append(article);
  });
}
/* ===== CART DISPLAY ===== */
function renderCart() {
  const el=document.getElementById('cart-items'); el.replaceChildren();
  CART.forEach((item,i) => {
    const line=document.createElement('div'); line.className='cart-line';
    const info=document.createElement('span'); info.textContent=item.title+' · '+item.size+' · '+money(item.price);
    const remove=document.createElement('button'); remove.type='button'; remove.textContent='Remove';
    remove.setAttribute('aria-label','Remove '+item.title+' '+item.size);
    remove.addEventListener('click',()=>{CART.splice(i,1);renderCart();notifyCart('Item removed from cart');});
    line.append(info,remove);el.append(line);
  });
  if(!CART.length)el.textContent='Your cart is empty.';
  const count=CART.length;
  document.getElementById('cart-count').textContent=count;
  document.getElementById('floating-cart-count').textContent=count;
  document.getElementById('floating-cart').setAttribute('aria-label','Open shopping cart, '+count+' items');
  document.getElementById('cart-total').textContent=money(CART.reduce((sum,p)=>sum+p.price,0));
  saveCart();
}
/* ===== FLOATING CART AND DRAWER CONTROLS ===== */
let previousFocus=null;
function showCart(show) {
  const panel=document.getElementById('cart-panel');
  if(show){ previousFocus=document.activeElement; panel.hidden=false; document.getElementById('cart-close').focus(); }
  else {panel.hidden=true; if(previousFocus && typeof previousFocus.focus==='function') previousFocus.focus();}
  document.getElementById('cart-toggle').setAttribute('aria-expanded',String(show));
  document.getElementById('floating-cart').setAttribute('aria-expanded',String(show));
  document.body.classList.toggle('cart-open',show);
}
document.getElementById('cart-toggle').addEventListener('click',()=>showCart(true));
document.getElementById('floating-cart').addEventListener('click',()=>showCart(true));
document.getElementById('cart-close').addEventListener('click',()=>showCart(false));
document.addEventListener('keydown',e=>{
  const panel=document.getElementById('cart-panel');
  if(panel.hidden)return;
  if(e.key==='Escape'){showCart(false);return;}
  if(e.key==='Tab'){
    const focusable=[...panel.querySelectorAll('button:not([disabled]), a[href], input:not([disabled])')];
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
  }
});
document.getElementById('art-search').addEventListener('input',e=>renderProducts(e.target.value));
renderProducts(); renderCart();
