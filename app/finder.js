// Black Friday Beacon — the finder: search, filters, sorting, list and detail.
// All state lives in `filters`; every control re-renders the grid from DEALS.
// Detail pages are hash routes (#/deal/<id>) so a deal can be linked to.

import { CHECKED_ON, DEALS } from './deals.js';

const VERDICT_LABEL = {
  'new-low': 'NEW LOW',
  strong: 'STRONG DEAL',
  routine: 'ROUTINE',
};

const CATEGORIES = [...new Set(DEALS.map((d) => d.cat))];
const STORES = [...new Set(DEALS.map((d) => d.store))];

const filters = {
  query: '',
  category: 'All',
  store: 'All',
  minDiscount: 0,
  sort: 'discount',
};

const grid = document.getElementById('grid');
const countLine = document.getElementById('count-line');
const listView = document.getElementById('list-view');
const detailView = document.getElementById('detail-view');
const searchInput = document.getElementById('search');
const storeSelect = document.getElementById('store-filter');
const discountSelect = document.getElementById('discount-filter');
const sortSelect = document.getElementById('sort');
const chipRow = document.getElementById('category-chips');

function money(n) {
  return '$' + n.toFixed(2).replace(/\.00$/, '');
}

function discountPct(deal) {
  return Math.round((1 - deal.sale / deal.usual) * 100);
}

function saved(deal) {
  return deal.usual - deal.sale;
}

function verdictClass(deal) {
  return 'verdict-' + deal.verdict;
}

function matchFilters(deal) {
  if (filters.category !== 'All' && deal.cat !== filters.category) return false;
  if (filters.store !== 'All' && deal.store !== filters.store) return false;
  if (discountPct(deal) < filters.minDiscount) return false;
  if (filters.query) {
    const hay = (deal.name + ' ' + deal.cat + ' ' + deal.store).toLowerCase();
    if (!hay.includes(filters.query.toLowerCase())) return false;
  }
  return true;
}

function sortDeals(list) {
  const copy = [...list];
  if (filters.sort === 'discount') copy.sort((a, b) => discountPct(b) - discountPct(a));
  if (filters.sort === 'saved') copy.sort((a, b) => saved(b) - saved(a));
  if (filters.sort === 'price-asc') copy.sort((a, b) => a.sale - b.sale);
  if (filters.sort === 'price-desc') copy.sort((a, b) => b.sale - a.sale);
  if (filters.sort === 'new-lows') {
    const rank = { 'new-low': 0, strong: 1, routine: 2 };
    copy.sort((a, b) => rank[a.verdict] - rank[b.verdict] || discountPct(b) - discountPct(a));
  }
  return copy;
}

function dealCard(deal) {
  const card = document.createElement('article');
  card.className = 'deal-card';
  card.innerHTML =
    '<div class="card-top"><span class="store-chip">' +
    deal.store +
    '</span><span class="cat-chip">' +
    deal.cat +
    '</span></div>' +
    '<h3 class="deal-name"><a href="#/deal/' +
    deal.id +
    '">' +
    deal.name +
    '</a></h3>' +
    '<div class="price-row"><span class="sale-price">' +
    money(deal.sale) +
    '</span><span class="usual-price">' +
    money(deal.usual) +
    '</span><span class="off-badge">-' +
    discountPct(deal) +
    '%</span></div>' +
    '<div class="save-line">You save ' +
    money(saved(deal)) +
    '</div>' +
    '<div class="verdict-line"><span class="verdict-badge ' +
    verdictClass(deal) +
    '">' +
    VERDICT_LABEL[deal.verdict] +
    '</span><span class="verdict-why">' +
    deal.why +
    '</span></div>' +
    '<div class="checked-line">Checked ' +
    CHECKED_ON +
    ' · via ' +
    deal.source +
    '</div>' +
    '<a class="store-link" href="' +
    deal.link +
    '" target="_blank" rel="noopener">View at ' +
    deal.store +
    ' &rarr;</a>';
  return card;
}

function renderStats() {
  const newLows = DEALS.filter((d) => d.verdict === 'new-low').length;
  const totalSaved = DEALS.reduce((sum, d) => sum + saved(d), 0);
  document.getElementById('stat-deals').textContent = String(DEALS.length);
  document.getElementById('stat-cats').textContent = String(CATEGORIES.length);
  document.getElementById('stat-lows').textContent = String(newLows);
  document.getElementById('stat-saved').textContent = money(totalSaved);
}

function renderChips() {
  chipRow.innerHTML = '';
  ['All', ...CATEGORIES].forEach((cat) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (filters.category === cat ? ' chip-active' : '');
    chip.textContent = cat;
    chip.addEventListener('click', () => {
      filters.category = cat;
      renderChips();
      renderGrid();
    });
    chipRow.appendChild(chip);
  });
}

function renderGrid() {
  const shown = sortDeals(DEALS.filter(matchFilters));
  grid.innerHTML = '';
  if (shown.length === 0) {
    grid.innerHTML =
      '<p class="empty">No deals match those filters. Try clearing the search or lowering the discount.</p>';
  } else {
    shown.forEach((deal) => grid.appendChild(dealCard(deal)));
  }
  countLine.textContent =
    'Showing ' +
    shown.length +
    ' of ' +
    DEALS.length +
    ' deals · sorted by ' +
    sortSelect.options[sortSelect.selectedIndex].text.toLowerCase();
}

function renderDetail(id) {
  const deal = DEALS.find((d) => d.id === id);
  if (!deal) {
    location.hash = '#/';
    return;
  }
  const related = DEALS.filter((d) => d.cat === deal.cat && d.id !== deal.id).slice(0, 3);
  detailView.innerHTML =
    '<a class="back-link" href="#/">&larr; All deals</a>' +
    '<div class="detail-card"><div class="card-top"><span class="store-chip">' +
    deal.store +
    '</span><span class="cat-chip">' +
    deal.cat +
    '</span></div>' +
    '<h2 class="detail-name">' +
    deal.name +
    '</h2>' +
    '<div class="detail-prices"><div><div class="detail-label">Sale price</div><div class="detail-sale">' +
    money(deal.sale) +
    '</div></div><div><div class="detail-label">Usual price</div><div class="detail-usual">' +
    money(deal.usual) +
    '</div></div><div><div class="detail-label">You save</div><div class="detail-save">' +
    money(saved(deal)) +
    ' (' +
    discountPct(deal) +
    '% off)</div></div></div>' +
    '<div class="detail-verdict"><span class="verdict-badge ' +
    verdictClass(deal) +
    '">' +
    VERDICT_LABEL[deal.verdict] +
    '</span><p>' +
    deal.why +
    '</p></div>' +
    '<p class="detail-checked">Price checked ' +
    CHECKED_ON +
    ' · source: ' +
    deal.source +
    '. Prices move during the sale — confirm the price on the store page before you buy.</p>' +
    '<a class="store-button" href="' +
    deal.link +
    '" target="_blank" rel="noopener">View at ' +
    deal.store +
    ' &rarr;</a></div>' +
    (related.length
      ? '<h3 class="related-title">More in ' +
        deal.cat +
        '</h3><div class="related-grid"></div>'
      : '');
  const relatedGrid = detailView.querySelector('.related-grid');
  if (relatedGrid) related.forEach((d) => relatedGrid.appendChild(dealCard(d)));
  listView.hidden = true;
  detailView.hidden = false;
  window.scrollTo(0, 0);
}

function route() {
  const hash = location.hash || '#/';
  const match = hash.match(/^#\/deal\/([\w-]+)$/);
  if (match) {
    renderDetail(match[1]);
  } else {
    detailView.hidden = true;
    detailView.innerHTML = '';
    listView.hidden = false;
  }
}

function fillSelects() {
  STORES.forEach((store) => {
    const option = document.createElement('option');
    option.value = store;
    option.textContent = store;
    storeSelect.appendChild(option);
  });
}

searchInput.addEventListener('input', () => {
  filters.query = searchInput.value.trim();
  renderGrid();
});
storeSelect.addEventListener('change', () => {
  filters.store = storeSelect.value;
  renderGrid();
});
discountSelect.addEventListener('change', () => {
  filters.minDiscount = Number(discountSelect.value);
  renderGrid();
});
sortSelect.addEventListener('change', () => {
  filters.sort = sortSelect.value;
  renderGrid();
});
window.addEventListener('hashchange', route);

fillSelects();
renderStats();
renderChips();
renderGrid();
route();
