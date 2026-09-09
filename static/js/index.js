'use strict';
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let corpusData = [];
function sortedCorpus(items, order) {
  return [...items].sort((a, b) => order === 'title-asc' ? a.title.localeCompare(b.title) : (order === 'year-asc' ? a.year - b.year : b.year - a.year) || a.title.localeCompare(b.title));
}
function updateCorpus() {
  const query = document.getElementById('corpus-search').value.trim().toLowerCase();
  const visible = sortedCorpus(corpusData.filter(item => `${item.title} ${item.year}`.toLowerCase().includes(query)), document.getElementById('corpus-sort').value);
  document.getElementById('corpus-status').textContent = `${visible.length} ${visible.length === 1 ? 'paper' : 'papers'} shown`;
  document.getElementById('corpus-table-body').innerHTML = visible.length ? visible.map(item => `<tr><td class="paper-title">${escapeHTML(item.title)}</td><td>${escapeHTML(item.year)}</td><td><a class="paper-link" href="${escapeHTML(item.url)}" target="_blank" rel="noopener" aria-label="Read ${escapeHTML(item.title)}">Paper ↗</a></td></tr>`).join('') : '<tr><td class="empty-state" colspan="3">No papers match your search.</td></tr>';
}
function schemaFieldsHTML(sections) {
  return sections.map((section, i) => `<details class="fold schema-layer" ${i === 0 ? 'open' : ''}><summary>${escapeHTML(section.title)}</summary><div class="fold-body">${(section.objects || []).map(obj => `<section class="schema-object"><h4>${escapeHTML(obj.title)}</h4><table><thead><tr><th scope="col">Field</th><th scope="col">Type</th><th scope="col">Meaning</th></tr></thead><tbody>${(obj.fields || []).map(field => `<tr><td><code>${escapeHTML(field.field)}</code></td><td><code>${escapeHTML(field.type)}</code></td><td>${escapeHTML(field.meaning)}</td></tr>`).join('')}</tbody></table></section>`).join('')}</div></details>`).join('');
}
document.addEventListener('DOMContentLoaded', () => {
  // Read the complete server-rendered table so search also works if JSON fetching is unavailable.
  corpusData = [...document.querySelectorAll('#corpus-table-body tr')].map(row => ({title:row.cells[0].textContent,year:Number(row.cells[1].textContent),url:row.cells[2].querySelector('a').getAttribute('href')}));
  document.getElementById('corpus-search').addEventListener('input', updateCorpus);
  document.getElementById('corpus-sort').addEventListener('change', updateCorpus);
  const dialog = document.getElementById('schema-dialog');
  let schemaLoaded = false;
  document.getElementById('open-schema').addEventListener('click', async () => {
    dialog.showModal();
    if (schemaLoaded) return;
    try {
      const response = await fetch('static/schema/schema-browser.json');
      if (!response.ok) throw new Error('Schema unavailable');
      const schema = await response.json();
      document.getElementById('schema-fields').innerHTML = schemaFieldsHTML(schema.fieldDictionary);
      schemaLoaded = true;
    } catch (_) {
      document.getElementById('schema-fields').innerHTML = '<p class="load-error">The field definitions could not be loaded. Close and reopen this panel to retry, or <a href="assets/2-schema/field-dictionary.md">read the field dictionary</a>.</p>';
    }
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {if(event.target === dialog) {const r = dialog.getBoundingClientRect();if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();}});
  const notice = document.getElementById('knowledge-base-dialog');
  document.getElementById('open-knowledge-base').addEventListener('click', () => notice.showModal());
  notice.querySelector('.dialog-close').addEventListener('click', () => notice.close());
  notice.addEventListener('click', event => {
    if (event.target !== notice) return;
    const bounds = notice.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) notice.close();
  });
  const navigation = document.getElementById('page-navigation');
  const navToggle = document.querySelector('.nav-toggle');
  const navBackdrop = document.querySelector('.nav-backdrop');
  const compactNavigation = window.matchMedia('(max-width:1100px)');
  const navLinks = [...navigation.querySelectorAll('a')];
  const sections = navLinks.map(link => document.querySelector(link.getAttribute('href')));
  function setNavigation(open, restoreFocus = false) {
    const expanded = compactNavigation.matches && open;
    document.body.classList.toggle('nav-open', expanded);
    navToggle.setAttribute('aria-expanded', String(expanded));
    navBackdrop.hidden = !expanded;
    navigation.inert = compactNavigation.matches && !expanded;
    document.body.style.overflow = expanded ? 'hidden' : '';
    if (restoreFocus) navToggle.focus();
  }
  navToggle.addEventListener('click', () => setNavigation(navToggle.getAttribute('aria-expanded') !== 'true'));
  navBackdrop.addEventListener('click', () => setNavigation(false, true));
  navLinks.forEach(link => link.addEventListener('click', () => {
    const compact = compactNavigation.matches;
    setNavigation(false);
    if (compact) {
      const target = document.querySelector(link.getAttribute('href'));
      target.setAttribute('tabindex', '-1');
      target.focus({preventScroll:true});
    }
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') setNavigation(false, true);
  });
  compactNavigation.addEventListener('change', () => setNavigation(false));
  setNavigation(false);
  const toTop = document.querySelector('.scroll-to-top');
  const checkScroll = () => {
    toTop.classList.toggle('visible', window.scrollY > 600);
    let current = 0;
    sections.forEach((section, index) => {if (section.getBoundingClientRect().top <= 160) current = index;});
    navLinks.forEach((link, index) => {if(index === current) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current');});
  };
  window.addEventListener('scroll', checkScroll, {passive:true});
  checkScroll();
  toTop.addEventListener('click', () => window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}));
});
