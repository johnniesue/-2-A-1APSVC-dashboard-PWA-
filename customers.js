(() => {
  const grid = document.getElementById('grid');
  const msg = document.getElementById('msg');
  const q = document.getElementById('q');
  const countEl = document.getElementById('count');
  const shownEl = document.getElementById('shown');

  let customers = [];

  function escapeHtml(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function bestAddress(c) {
    const a = (c.addresses && c.addresses.length) ? c.addresses[0] : null;
    if (!a) return '';
    const parts = [a.street1, a.street2, a.city, a.state, a.postalCode].filter(Boolean);
    return parts.join(', ');
  }

  function searchText(c) {
    const addr = bestAddress(c);
    const tags = (c.tags || []).join(' ');
    return [
      c.name, c.displayName, c.firstName, c.lastName,
      c.company, c.email, c.phone, addr, tags,
      c.lastServiceDate, c.id
    ].filter(Boolean).join(' ').toLowerCase();
  }

  function render(list) {
    grid.innerHTML = list.map(c => {
      const addr = bestAddress(c);
      const tags = (c.tags || []).slice(0, 6);
      return `
        <section class="card">
          <p class="name">${escapeHtml(c.name || 'Unnamed Customer')}</p>
          ${c.company ? `<p class="line"><strong>Company:</strong> ${escapeHtml(c.company)}</p>` : ``}
          ${c.phone ? `<p class="line"><strong>Phone:</strong> ${escapeHtml(c.phone)}</p>` : ``}
          ${c.email ? `<p class="line"><strong>Email:</strong> ${escapeHtml(c.email)}</p>` : ``}
          ${addr ? `<p class="line"><strong>Address:</strong> ${escapeHtml(addr)}</p>` : `<p class="line"><strong>Address:</strong> <span class="muted">None on file</span></p>`}
          ${c.lastServiceDate ? `<p class="line"><strong>Last service:</strong> ${escapeHtml(c.lastServiceDate)}</p>` : ``}
          ${tags.length ? `<div class="tagrow">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ``}
        </section>
      `;
    }).join('');
    shownEl.textContent = String(list.length);
  }

  function applyFilter() {
    const term = (q.value || '').trim().toLowerCase();
    if (!term) return render(customers);
    const filtered = customers.filter(c => searchText(c).includes(term));
    render(filtered);
  }

  async function init() {
    try {
      // IMPORTANT: This path assumes you create /data/customers.json in the same repo
      const res = await fetch('./data/customers.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Could not load customers.json (HTTP ${res.status})`);
      customers = await res.json();
      countEl.textContent = String(customers.length);
      render(customers);
      q.addEventListener('input', applyFilter);
    } catch (e) {
      msg.style.display = 'block';
      msg.textContent = `Customer data not available. ${e?.message || e}`;
      console.error(e);
    }
  }

  init();
})();
