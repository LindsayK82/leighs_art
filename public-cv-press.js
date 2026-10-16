/* ===== PUBLIC CV AND PRESS: SUPABASE ENTRIES ===== */
(async function () {
  /* ===== SUPABASE CONNECTION ===== */
  if (!window.supabase?.createClient) {
    console.error('CV/Press: Supabase library is not available.');
    return;
  }

  const client = window.supabase.createClient(
    'https://hqkcqvxppoboryqcwksi.supabase.co',
    'sb_publishable_ePeAQ5b-9vFZkOVmOMHLzA_zhLGbaOB'
  );

  /* ===== HELPERS: SAFE LINKS AND TEXT ===== */
  function safeUrl(value) {
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  }

  function addText(parent, tag, value, className) {
    if (value === null || value === undefined || value === '') return null;
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = String(value);
    parent.appendChild(node);
    return node;
  }

  function addLinkedTitle(parent, tag, title, urlValue) {
    const heading = document.createElement(tag);
    const url = safeUrl(urlValue);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = title || 'Untitled';
      heading.appendChild(link);
    } else {
      heading.textContent = title || 'Untitled';
    }
    parent.appendChild(heading);
    return heading;
  }

  /* ===== PUBLIC CV: PUBLISHED ENTRIES AND TITLE LINKS ===== */
  const cv = document.querySelector('#cv-content');
  if (!cv) {
    console.warn('CV/Press: #cv-content was not found on this page.');
  } else {
    try {
      const { data, error } = await client
        .from('cv_entries')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data?.length) {
        const section = document.createElement('section');
        section.className = 'cv-live-entries';
        addText(section, 'h3', 'Additional CV entries');
        for (const entry of data) {
          const article = document.createElement('article');
          article.className = 'cv-entry';
          addLinkedTitle(article, 'strong', entry.title, entry.entry_url);
          addText(article, 'p', [entry.organization, entry.entry_year].filter(Boolean).join(' · '));
          addText(article, 'p', entry.description);
          section.appendChild(article);
        }
        cv.appendChild(section);
      }
    } catch (error) {
      console.error('CV/Press: Failed to load published CV entries:', error);
    }
  }

  /* ===== PUBLIC PRESS: PUBLISHED ENTRIES AND TITLE LINKS ===== */
  const press = document.querySelector('#panel-press .press-content');
  if (!press) {
    console.warn('CV/Press: #panel-press .press-content was not found on this page.');
  } else {
    try {
      const { data, error } = await client
        .from('press_entries')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data?.length) {
        const section = document.createElement('section');
        section.className = 'press-section';
        addText(section, 'h2', 'Additional Press');
        for (const entry of data) {
          const article = document.createElement('article');
          article.className = 'press-entry';
          const details = document.createElement('div');
          addLinkedTitle(details, 'h3', entry.title, entry.article_url);
          addText(article, 'span', entry.published_date, 'press-date');
          addText(details, 'p', entry.publication);
          addText(details, 'p', entry.description);
          article.appendChild(details);
          section.appendChild(article);
        }
        press.appendChild(section);
      }
    } catch (error) {
      console.error('CV/Press: Failed to load published Press entries:', error);
    }
  }
})();
