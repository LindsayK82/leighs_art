/* ===== PUBLIC HOMEPAGE PROMOTION ===== */
(() => {
  'use strict';
  const root=document.getElementById('homepage-promotion');if(!root||!window.supabase)return;
  const client=window.supabase.createClient('https://hqkcqvxppoboryqcwksi.supabase.co','sb_publishable_ePeAQ5b-9vFZkOVmOMHLzA_zhLGbaOB',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  function safeDestination(value){
    const pages=['collect-art.html','galleries.html','index.html','about.html','commissions.html','reviews.html','installations.html','invisibility-project.html'];
    if(pages.includes(value))return value;
    try{const url=new URL(value);if(url.protocol==='https:')return url.href;}catch{}return 'collect-art.html';
  }
  async function load(){
    const {data,error}=await client.from('homepage_promotions').select('headline,description,start_date,end_date,destination_url,button_label,image_url,status').eq('id',1).maybeSingle();
    if(error||!data||data.status!=='published')return;
    // Dates are evaluated in the artist's Eastern timezone, not the visitor's timezone.
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    if(today<data.start_date||today>data.end_date)return;
    const content=document.createElement('div');content.className='homepage-promotion-inner';
    const copy=document.createElement('div');copy.className='homepage-promotion-copy';
    const eyebrow=document.createElement('p');eyebrow.className='homepage-promotion-eyebrow';eyebrow.textContent='SPECIAL ANNOUNCEMENT';
    const heading=document.createElement('h2');heading.textContent=data.headline;
    const desc=document.createElement('p');desc.textContent=data.description||'';
    const link=document.createElement('a');link.className='homepage-promotion-link';link.href=safeDestination(data.destination_url);link.textContent=data.button_label||'Learn more';
    copy.append(eyebrow,heading,desc,link);content.append(copy);
    if(data.image_url){try{const url=new URL(data.image_url);if(url.protocol==='https:'){const img=document.createElement('img');img.src=url.href;img.alt='Promotion artwork';img.loading='lazy';content.append(img);}}catch{}}
    root.append(content);root.hidden=false;
  }
  load().catch(err=>console.error('Promotion could not load:',err));
})();
