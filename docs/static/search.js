/**
 * search.js — Client-side fuzzy search for CP Club VJTI Blog
 * Uses prebuilt /blogs/index.json manifest
 */

(function () {
  let blogIndex = [];
  let loaded = false;

  async function loadIndex() {
    if (loaded) return;
    try {
      // Figure out base path for GitHub Pages (handles subdirectory hosting)
      const base = document.querySelector('meta[name="site-base"]')?.content || '.';
      const res = await fetch(base + '/blogs/index.json');
      blogIndex = await res.json();
      loaded = true;
    } catch (e) {
      console.warn('[Search] Could not load blog index:', e);
    }
  }

  function normalize(str) {
    return str.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  }

  function score(item, query) {
    const q = normalize(query).trim();
    if (!q) return 0;
    const terms = q.split(/\s+/);
    let total = 0;
    const titleN = normalize(item.title || '');
    const excerptN = normalize(item.excerpt || '');
    const tagsN = normalize((item.tags || []).join(' '));
    for (const t of terms) {
      if (titleN.includes(t)) total += 10;
      if (tagsN.includes(t)) total += 6;
      if (excerptN.includes(t)) total += 3;
    }
    return total;
  }

  function highlight(text, query) {
    const terms = query.trim().split(/\s+/);
    let result = text;
    for (const t of terms) {
      if (!t) continue;
      const re = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      result = result.replace(re, '<mark>$1</mark>');
    }
    return result;
  }

  function buildResultHTML(item, query) {
    const titleHL = highlight(item.title, query);
    const excerpt = item.excerpt
      ? highlight(item.excerpt.substring(0, 100) + (item.excerpt.length > 100 ? '…' : ''), query)
      : '';
    const tagsHTML = (item.tags || []).map(t =>
      `<span class="tag" style="font-size:0.65rem;padding:2px 8px;">${highlight(t, query)}</span>`
    ).join('');
    const base = document.querySelector('meta[name="site-base"]')?.content || '.';
    const href = /^(?:[a-z]+:|\/)/i.test(item.url) ? item.url : `${base}/${item.url}`;

    return `
      <a href="${href}" class="search-result-item" id="search-result-${item.slug}">
        <div class="result-title">${titleHL}</div>
        ${excerpt ? `<div class="result-excerpt">${excerpt}</div>` : ''}
        ${tagsHTML ? `<div class="result-tags">${tagsHTML}</div>` : ''}
      </a>`;
  }

  function doSearch(query, container) {
    if (!query.trim()) {
      container.innerHTML = '';
      container.classList.remove('active');
      return;
    }

    const results = blogIndex
      .map(item => ({ item, sc: score(item, query) }))
      .filter(r => r.sc > 0)
      .sort((a, b) => b.sc - a.sc)
      .slice(0, 8);

    if (results.length === 0) {
      container.innerHTML = `<div class="search-no-results">No results for "<strong>${query}</strong>"</div>`;
    } else {
      container.innerHTML = results.map(r => buildResultHTML(r.item, query)).join('');
    }
    container.classList.add('active');
  }

  let debounceTimer;

  function initSearch(inputId, resultsId) {
    const input = document.getElementById(inputId);
    const results = document.getElementById(resultsId);
    if (!input || !results) return;

    input.addEventListener('focus', loadIndex);

    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => doSearch(this.value, results), 200);
    });

    // Keyboard navigation
    input.addEventListener('keydown', function (e) {
      const items = results.querySelectorAll('.search-result-item');
      const active = results.querySelector('.search-result-item:focus');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        (active ? active.nextElementSibling || items[0] : items[0])?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        (active ? active.previousElementSibling || items[items.length - 1] : items[items.length - 1])?.focus();
      } else if (e.key === 'Escape') {
        results.classList.remove('active');
        input.blur();
      }
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!input.contains(e.target) && !results.contains(e.target)) {
        results.classList.remove('active');
      }
    });
  }

  // ── Tag filtering (home page) ────────────────────────────────
  window.initTagFilter = function () {
    const tags = document.querySelectorAll('.tag-filter');
    const cards = document.querySelectorAll('.blog-card[data-tags]');
    if (!tags.length || !cards.length) return;

    let activeTag = null;

    tags.forEach(tag => {
      tag.addEventListener('click', function () {
        const selected = this.dataset.tag;
        if (activeTag === selected) {
          // deselect
          activeTag = null;
          tags.forEach(t => t.classList.remove('active'));
          cards.forEach(c => { c.style.display = ''; });
        } else {
          activeTag = selected;
          tags.forEach(t => t.classList.toggle('active', t.dataset.tag === selected));
          cards.forEach(c => {
            const cardTags = (c.dataset.tags || '').split(',').map(s => s.trim());
            c.style.display = cardTags.includes(selected) ? '' : 'none';
          });
        }
      });
    });
  };

  // ── Reading Progress Bar ─────────────────────────────────────
  function initProgressBar() {
    const bar = document.getElementById('reading-progress');
    if (!bar) return;
    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = docHeight > 0 ? (scrollTop / docHeight * 100) + '%' : '0%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ── Sidebar hamburger ────────────────────────────────────────
  function initHamburger() {
    const btn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar');
    if (!btn || !sidebar) return;
    btn.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!sidebar.contains(e.target) && !btn.contains(e.target))
        sidebar.classList.remove('open');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSearch('search-input', 'search-results');
    initProgressBar();
    initHamburger();
    window.initTagFilter?.();
  });
})();
