/* ============================================
   LEIGH'S ART: PRIVATE ORDERS DASHBOARD
   Read-only until payment and shipping workflows are verified.
   ============================================ */
(() => {
  'use strict';
  const client = window.artistSupabase;
  const money = (value, currency = 'USD') => {
    const amount = Number(value);
    return Number.isFinite(amount) ? new Intl.NumberFormat('en-US', {style:'currency',currency:currency || 'USD'}).format(amount) : '—';
  };
  const node = (tag, value, className = '') => {
    const el = document.createElement(tag);
    el.textContent = String(value ?? '');
    if (className) el.className = className;
    return el;
  };
  const date = value => value ? new Date(value).toLocaleString() : '—';
  const label = value => String(value || 'Not set').replace(/_/g,' ');
  const addressText = address => {
    if (!address || typeof address !== 'object') return 'No shipping address recorded';
    return [address.name, address.street1 || address.address_line_1, address.street2 || address.address_line_2,
      [address.city || address.admin_area_2, address.state || address.admin_area_1, address.zip || address.postal_code].filter(Boolean).join(', '),
      address.country || address.country_code].filter(Boolean).join(' · ') || 'No shipping address recorded';
  };

  /* ===== SHIPPING PACKAGE PREVIEW (NO POSTAGE PURCHASES) ===== */
  const parsePrintSize = value => {
    const match = String(value || '').match(/(\d+(?:\.\d+)?)\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)/i);
    if (!match) return null;
    const dimensions = [Number(match[1]), Number(match[2])];
    return dimensions.every(n => Number.isFinite(n) && n > 0) ? dimensions.sort((a,b)=>b-a) : null;
  };
  const shippingNumber = (value, name) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) throw new Error(name+' must be greater than zero.');
    return number;
  };
  const packagePreview = (order, purchased, demo = false) => {
    const section=node('section','','admin-panel');
    section.append(node('h3',demo ? 'TEST ONLY · Package calculator' : 'Prepare shipping package'));
    if (demo) section.append(node('p','Local calculation only. Not linked to any order, Shippo, or PayPal.','admin-muted'));
    if (order.is_sandbox && !demo) {
      section.append(node('p','Sandbox order: postage and shipping preparation are disabled.','admin-muted'));
      return section;
    }
    if (String(order.payment_status).toLowerCase() !== 'paid') {
      section.append(node('p','Shipping preparation is available after payment is confirmed.','admin-muted'));
      return section;
    }
    if (['shipped','delivered'].includes(String(order.fulfillment_status).toLowerCase())) {
      section.append(node('p','This order has already been marked shipped or delivered.','admin-muted'));
      return section;
    }
    if (!order.shipping_address || typeof order.shipping_address !== 'object') {
      section.append(node('p','A shipping address is required before preparing a package.','admin-muted'));
      return section;
    }
    if (!purchased.length) {
      section.append(node('p','No purchased items are recorded; package dimensions cannot be suggested.','admin-muted'));
      return section;
    }
    const prints=purchased.filter(item=>String(item.product_type).toLowerCase()==='print');
    const onlyPrints=prints.length===purchased.length;
    const dimensions=prints.map(item=>parsePrintSize(item.print_size));
    const allKnown=onlyPrints && dimensions.every(Boolean);
    const maxLength=allKnown ? Math.max(...dimensions.map(d=>d[0]))+4 : '';
    const maxWidth=allKnown ? Math.max(...dimensions.map(d=>d[1]))+4 : '';
    section.append(node('p',allKnown
      ? 'Suggested flat rigid mailer: largest print + 2 inches on every side, 1-inch depth. Confirm all prints fit together.'
      : 'Mixed order, canvas, or unknown print size: enter the actual packed measurements manually.','admin-muted'));
    const form=document.createElement('form');
    form.className='shipping-package-form';
    const fields=document.createElement('div');
    fields.className='shipping-package-fields';
    const inputs={};
    for (const [field,title,value] of [
      ['length','Length (inches)',maxLength],['width','Width (inches)',maxWidth],
      ['height','Depth (inches)',allKnown ? 1 : ''],['weight','Packed weight (ounces)','']
    ]) {
      const wrap=node('label',title,'admin-muted');
      const input=document.createElement('input');
      input.type='number';input.min='0.01';input.step='any';input.required=true;
      input.className='admin-control';input.value=String(value);
      input.setAttribute('aria-label',title);
      wrap.append(input);fields.append(wrap);inputs[field]=input;
    }
    const note=node('p',demo ? 'Enter a sample weight (for example, 6 oz). This is a calculator test, not a verified shipping weight.' : 'Weigh the complete sealed package before purchasing postage. Values entered here are only a preview and are not saved.','admin-muted');
    const confirm=document.createElement('label');
    const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.required=true;
    confirm.append(checkbox,document.createTextNode(demo ? ' I understand these are sample measurements only.' : ' I have checked the actual packed dimensions and weight.'));
    const button=node('button','Review package details','admin-button secondary');
    button.type='submit';
    const result=node('p','','admin-muted');result.setAttribute('role','status');
    form.append(fields,note,confirm,button,result);
    if (demo) {
      const rateButton=node('button','Get Shippo sample rates','admin-button secondary');
      rateButton.type='button';rateButton.disabled=true;
      const rateResults=node('div','','shipping-rate-results');
      rateResults.setAttribute('role','status');
      const disableRates=()=>{rateButton.disabled=true;rateResults.replaceChildren();};
      for (const input of Object.values(inputs)) input.addEventListener('input',disableRates);
      checkbox.addEventListener('change',disableRates);
      rateButton.addEventListener('click',async()=>{
        rateButton.disabled=true;rateResults.replaceChildren(node('p','Requesting sample rates from Shippo…','admin-muted'));
        try {
          if(!checkbox.checked)throw new Error('Confirm the sample measurements first.');
          const parcel={length:shippingNumber(inputs.length.value,'Length'),width:shippingNumber(inputs.width.value,'Width'),height:shippingNumber(inputs.height.value,'Depth'),weight_oz:shippingNumber(inputs.weight.value,'Packed weight')};
          const {data,error}=await client.functions.invoke('shippo-admin-rates-test',{body:{action:'test_rates',parcel}});
          if(error){
            let message=error.message||'Shipping request failed';
            if(error.context && typeof error.context.json==='function'){
              const details=await error.context.json().catch(()=>null);
              if(details?.error)message=details.error+(details.shippo_status?' (Shippo status '+details.shippo_status+')':'');
            }
            throw new Error(message);
          }
          if(!data?.success||!data.rate_only||!data.sample_addresses)throw new Error('Unexpected response from shipping test.');
          rateResults.replaceChildren(node('h4','Shippo sample shipping rates'));
          rateResults.append(node('p','Sample route: Philadelphia, PA → Hamilton, OH. These are quotes, not purchased labels.','admin-muted'));
          if(!Array.isArray(data.rates)||!data.rates.length){
            rateResults.append(node('p','Shippo returned no available rates for this sample package.','admin-muted'));
          } else {
            const rates=data.rates
              .filter(rate=>Number.isFinite(Number(rate.amount))&&Number(rate.amount)>=0)
              .sort((a,b)=>Number(a.amount)-Number(b.amount));
            if(!rates.length)rateResults.append(node('p','No valid priced rates were returned.','admin-muted'));
            for(const [index,rate] of rates.entries()){
              const row=node('div','','admin-panel');
              row.style.marginBottom='0.65rem';
              row.style.padding='0.85rem';
              const heading=node('div','','admin-inline');
              heading.style.justifyContent='space-between';
              heading.style.alignItems='center';
              heading.append(node('strong',(rate.provider||'Carrier')+' · '+(rate.service||'Service')));
              heading.append(node('strong',money(rate.amount,rate.currency||'USD')));
              row.append(heading);
              const details=rate.estimated_days!=null
                ? 'Estimated delivery: '+rate.estimated_days+' '+(Number(rate.estimated_days)===1?'day':'days')
                : 'Delivery estimate unavailable';
              row.append(node('p',details,'admin-muted'));
              if(index===0)row.append(node('p','Lowest available price','admin-muted'));
              rateResults.append(row);
            }
          }
          if(Array.isArray(data.messages)&&data.messages.length){
            const warnings=document.createElement('details');
            const summary=node('summary','Carrier notices ('+data.messages.length+')');
            warnings.append(summary);
            for(const message of data.messages)warnings.append(node('p',message,'admin-muted'));
            rateResults.append(warnings);
          }
        }catch(err){rateResults.replaceChildren(node('p','Could not get sample rates: '+err.message,'admin-muted'));}
        finally{rateButton.disabled=false;}
      });
      form.append(rateButton,rateResults);
      form._enableSampleRates=()=>{rateButton.disabled=false;rateResults.replaceChildren();};
    }
    form.addEventListener('submit',event=>{
      event.preventDefault();
      try {
        const length=shippingNumber(inputs.length.value,'Length');
        const width=shippingNumber(inputs.width.value,'Width');
        const height=shippingNumber(inputs.height.value,'Depth');
        const weight=shippingNumber(inputs.weight.value,'Packed weight');
        if (!checkbox.checked) throw new Error(demo ? 'Confirm that this is a sample calculation first.' : 'Confirm the actual packed measurements first.');
        result.textContent=`Package confirmed for review: ${length} × ${width} × ${height} inches; ${weight} oz. No shipping rate requested and no label purchased.`;
        if(demo && form._enableSampleRates)form._enableSampleRates();
      } catch (error) {result.textContent=error.message;}
    });
    section.append(form);
    return section;
  };

  /* ===== MAIN RENDERER ===== */
  window.renderLiveOrders = async function renderLiveOrders(target) {
    target.replaceChildren();
    const intro = node('p','View orders and prepare package measurements. Sample rate lookups are available in the temporary test calculator; label purchases and fulfillment updates remain disabled.','admin-muted');
    /* ===== TEMPORARY ADMIN CALCULATOR TEST ===== */
    const testToggle=node('button','Show test package calculator','admin-button secondary');
    testToggle.type='button';
    testToggle.setAttribute('aria-expanded','false');
    const testArea=node('div','','orders-calculator-test');
    testArea.hidden=true;
    testToggle.addEventListener('click',()=>{
      const opening=testArea.hidden;
      testArea.hidden=!opening;
      testToggle.textContent=opening ? 'Hide test package calculator' : 'Show test package calculator';
      testToggle.setAttribute('aria-expanded',String(opening));
      if(opening){
        testArea.replaceChildren(packagePreview(
          {is_sandbox:true,payment_status:'paid',fulfillment_status:'unfulfilled',shipping_address:{country:'US'}},
          [{product_type:'print',print_size:'10 × 10',quantity:1,artwork_title:'Bobsy'}],true
        ));
      }else testArea.replaceChildren();
    });
    const controls = node('div','','admin-inline');
    const search = document.createElement('input');
    search.type='search'; search.className='admin-control';
    search.placeholder='Search order, customer, or artwork';
    search.setAttribute('aria-label','Search orders');
    const status = document.createElement('select');
    status.className='admin-control'; status.setAttribute('aria-label','Filter fulfillment status');
    for (const [value,title] of [['','All fulfillment statuses'],['unfulfilled','Unfulfilled'],['processing','Processing'],['shipped','Shipped'],['delivered','Delivered']]) {
      const option=document.createElement('option'); option.value=value; option.textContent=title; status.append(option);
    }
    const refresh=node('button','Refresh orders','admin-button secondary'); refresh.type='button';
    controls.append(search,status,refresh);
    const summary=node('p','Loading orders…','admin-muted');
    summary.setAttribute('role','status');
    const list=node('div','','admin-list');
    const detail=node('div','','orders-detail');
    target.append(intro,testToggle,testArea,controls,summary,list,detail);
    let orders=[], items=[], activeId=null, loadVersion=0;

    /* ===== DETAIL PANEL ===== */
    function showDetails(order) {
      activeId=order.id; detail.replaceChildren();
      const panel=node('section','','admin-panel');
      panel.append(node('h3','Order #'+order.id+(order.is_sandbox ? ' · SANDBOX TEST' : '')));
      const rows=[
        ['Placed',date(order.created_at)],['Customer',order.customer_name || 'Not provided'],
        ['Email',order.customer_email || 'Not provided'],['Payment',label(order.payment_status)],
        ['Fulfillment',label(order.fulfillment_status)],['Artwork subtotal',money(order.artwork_price,order.currency)],
        ['Shipping',money(order.shipping_cost,order.currency)],['Order total',money(order.total_amount,order.currency)],
        ['PayPal order ID',order.paypal_order_id || '—'],['PayPal capture ID',order.paypal_capture_id || '—'],
        ['Shippo rate ID',order.shippo_rate_id || '—'],['Tracking number',order.tracking_number || '—'],
        ['Shipped',date(order.shipped_at)],['Ship to',addressText(order.shipping_address)]
      ];
      for (const [key,value] of rows) {
        const line=node('p','','orders-detail-line');
        line.append(node('strong',key+': '),node('span',value));
        panel.append(line);
      }
      if (order.tracking_url && /^https:\/\//i.test(order.tracking_url)) {
        const link=node('a','Track shipment');link.href=order.tracking_url;link.target='_blank';link.rel='noopener noreferrer';panel.append(link);
      }
      panel.append(node('h3','Purchased artwork'));
      const purchased=items.filter(item=>item.order_id===order.id);
      if (!purchased.length) panel.append(node('p','No order items recorded.','admin-muted'));
      for (const item of purchased) {
        const line=node('p',item.artwork_title+' · '+label(item.product_type)+(item.print_size?' · '+item.print_size:'')+
          ' · Qty '+item.quantity+' · '+money(item.line_total,order.currency),'admin-muted');
        panel.append(line);
      }
      panel.append(packagePreview(order,purchased));
      detail.append(panel);
    }

    /* ===== SEARCH AND FILTER ===== */
    function draw() {
      list.replaceChildren();
      const term=search.value.trim().toLowerCase();
      const filtered=orders.filter(order=>{
        const orderItems=items.filter(item=>item.order_id===order.id);
        const haystack=[order.id,order.customer_name,order.customer_email,order.paypal_order_id,...orderItems.map(i=>i.artwork_title)].join(' ').toLowerCase();
        return haystack.includes(term) && (!status.value || (order.fulfillment_status || 'unfulfilled').toLowerCase()===status.value);
      });
      summary.textContent=orders.length+' orders ('+orders.filter(o=>o.is_sandbox).length+' sandbox) · '+orders.filter(o=>String(o.payment_status).toLowerCase()==='paid').length+' marked paid · '+filtered.length+' shown';
      if (!filtered.length) {
        list.append(node('p',orders.length?'No orders match these filters.':'No orders yet. Completed checkout purchases will appear here once order creation is connected.','admin-muted'));
        detail.replaceChildren();return;
      }
      for (const order of filtered) {
        const row=node('div','','admin-row');
        const info=node('div','','admin-content-summary');
        info.append(node('strong','Order #'+order.id+(order.is_sandbox ? ' · SANDBOX TEST' : '')+' · '+money(order.total_amount,order.currency)));
        info.append(node('p',date(order.created_at)+' · '+(order.customer_name || order.customer_email || 'Customer not recorded'),'admin-muted'));
        info.append(node('p','Payment: '+label(order.payment_status)+' · Fulfillment: '+label(order.fulfillment_status),'admin-muted'));
        const view=node('button','View details','admin-button secondary');
        view.type='button';view.setAttribute('aria-label','View order '+order.id);
        view.addEventListener('click',()=>showDetails(order));
        row.append(info,view);list.append(row);
      }
      if (activeId !== null) {
        const selected=filtered.find(o=>o.id===activeId);
        if(selected)showDetails(selected);else detail.replaceChildren();
      }
    }

    /* ===== LOAD ADMIN-ONLY DATA THROUGH RLS ===== */
    async function load() {
      const current=++loadVersion;
      refresh.disabled=true;summary.textContent='Loading orders…';
      const [orderResult,itemResult]=await Promise.all([
        client.from('art_orders').select('*').order('created_at',{ascending:false}).limit(200),
        client.from('art_order_items').select('*').order('created_at',{ascending:false}).limit(1000)
      ]);
      if(current!==loadVersion)return;
      refresh.disabled=false;
      if(orderResult.error || itemResult.error) {
        summary.textContent='Orders could not be loaded. Administrator read permissions may need to be configured.';
        list.replaceChildren(node('p',orderResult.error?.message || itemResult.error?.message || 'Unknown error','admin-muted'));
        detail.replaceChildren();return;
      }
      orders=orderResult.data || [];items=itemResult.data || [];draw();
    }
    search.addEventListener('input',draw);status.addEventListener('change',draw);
    refresh.addEventListener('click',load);
    await load();
  };
})();
