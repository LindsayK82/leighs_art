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
      [address.city, address.state || address.admin_area_1, address.zip || address.postal_code].filter(Boolean).join(', '),
      address.country || address.country_code].filter(Boolean).join(' · ') || 'No shipping address recorded';
  };

  /* ===== MAIN RENDERER ===== */
  window.renderLiveOrders = async function renderLiveOrders(target) {
    target.replaceChildren();
    const intro = node('p','View paid and pending orders, purchased artwork, and shipping information. Payment capture, label purchasing, and fulfillment changes are not enabled in this first version.','admin-muted');
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
    target.append(intro,controls,summary,list,detail);
    let orders=[], items=[], activeId=null, loadVersion=0;

    /* ===== DETAIL PANEL ===== */
    function showDetails(order) {
      activeId=order.id; detail.replaceChildren();
      const panel=node('section','','admin-panel');
      panel.append(node('h3','Order #'+order.id));
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
      panel.append(node('p','Shipping labels and fulfillment actions will be added after checkout and Shippo verification.','admin-muted'));
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
      summary.textContent=orders.length+' orders · '+orders.filter(o=>String(o.payment_status).toLowerCase()==='paid').length+' marked paid · '+filtered.length+' shown';
      if (!filtered.length) {
        list.append(node('p',orders.length?'No orders match these filters.':'No orders yet. Completed checkout purchases will appear here once order creation is connected.','admin-muted'));
        detail.replaceChildren();return;
      }
      for (const order of filtered) {
        const row=node('div','','admin-row');
        const info=node('div','','admin-content-summary');
        info.append(node('strong','Order #'+order.id+' · '+money(order.total_amount,order.currency)));
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
