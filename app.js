const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

let cart = JSON.parse(localStorage.getItem('rolexCart') || '[]');
let currentFilter = { cat: 'all', maxPrice: 100000, search: '' };
let currentWatch = null;

document.addEventListener('DOMContentLoaded', () => { renderGrid(); updateCartCount(); });

// ── WATCH FACE HTML ──
function watchFace(w, size = 'small') {
  if (size === 'big') {
    return `<div class="detail-watch-big">
      <span class="detail-emoji">${w.emoji}</span>
      <div class="detail-crown"></div>
    </div>`;
  }
  return `<div class="card-face">
    <div class="watch-lug top-left"></div>
    <div class="watch-lug top-right"></div>
    <div class="watch-lug bot-left"></div>
    <div class="watch-lug bot-right"></div>
    <div class="watch-circle">
      <span class="watch-emoji">${w.emoji}</span>
      <div class="watch-crown"></div>
    </div>
    <div class="card-badge">${w.ref}</div>
  </div>`;
}

// ── RENDER GRID ──
function renderGrid() {
  const grid = document.getElementById('grid');
  const noResults = document.getElementById('noResults');
  const s = currentFilter.search.toLowerCase();
  const filtered = watches.filter(w => {
    const catOk = currentFilter.cat === 'all' || w.category === currentFilter.cat;
    const priceOk = w.price <= currentFilter.maxPrice;
    const searchOk = !s || w.name.toLowerCase().includes(s) || w.collection.toLowerCase().includes(s);
    return catOk && priceOk && searchOk;
  });
  document.getElementById('countLabel').textContent = filtered.length;
  if (!filtered.length) { grid.innerHTML = ''; noResults.style.display = 'block'; return; }
  noResults.style.display = 'none';
  grid.innerHTML = filtered.map((w, i) => `
    <div class="card" onclick="openDetail(${w.id})" style="animation-delay:${i*0.04}s">
      ${watchFace(w)}
      <div class="card-info">
        <div class="card-collection">${w.collection}</div>
        <div class="card-name">${w.name}</div>
        <div class="card-price">$${w.price.toLocaleString()} <span>USD</span></div>
      </div>
    </div>`).join('');
}

// ── FILTERS ──
function setFilter(type, val, btn) {
  currentFilter[type] = val;
  btn.closest('.filter-row').querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderGrid();
}

function applyFilters() {
  const val = parseInt(document.getElementById('priceSlider').value);
  currentFilter.maxPrice = val;
  currentFilter.search = document.getElementById('searchInput').value;
  document.getElementById('priceVal').textContent = val >= 100000 ? 'Barchasi' : '$' + val.toLocaleString();
  renderGrid();
}

// ── DETAIL ──
function openDetail(id) {
  const w = watches.find(x => x.id === id);
  if (!w) return;
  currentWatch = w;
  document.getElementById('dWatchFace').innerHTML = watchFace(w, 'big');
  document.getElementById('dColl').textContent = w.collection;
  document.getElementById('dName').textContent = w.name;
  document.getElementById('dDesc').textContent = w.desc;
  document.getElementById('dPrice').textContent = '$' + w.price.toLocaleString();
  const inCart = cart.find(c => c.id === w.id);
  document.getElementById('dCartBtn').textContent = inCart ? '✅ Savatda bor' : '🛒 Savatga qo\'shish';
  document.getElementById('dSpecs').innerHTML = `
    <div class="spec-row"><span class="spec-label">Referans raqam</span><span class="spec-val">${w.ref}</span></div>
    <div class="spec-row"><span class="spec-label">Diametr</span><span class="spec-val">${w.diameter} mm</span></div>
    <div class="spec-row"><span class="spec-label">Qobiq materiali</span><span class="spec-val">${w.material}</span></div>
    <div class="spec-row"><span class="spec-label">Siferblat rangi</span><span class="spec-val">${w.dial}</span></div>
    <div class="spec-row"><span class="spec-label">Suv o'tkazmasligi</span><span class="spec-val">${w.water} m</span></div>
    <div class="spec-row"><span class="spec-label">Kategoriya</span><span class="spec-val">${w.category === 'sport' ? '⚡ Sport' : w.category === 'classic' ? '🕐 Klassik' : '💎 Luksus'}</span></div>`;
  const p = document.getElementById('detailPage');
  p.style.display = 'block'; p.scrollTop = 0;
  p.className = 'detail-page slide-in';
}

function addFromDetail() {
  if (!currentWatch) return;
  if (cart.find(c => c.id === currentWatch.id)) { showToast('✅ Allaqachon savatda!'); return; }
  cart.push({...currentWatch});
  saveCart();
  document.getElementById('dCartBtn').textContent = '✅ Savatda bor';
  showToast('🛒 Savatga qo\'shildi!');
}

// ── CART ──
function openCart() {
  renderCart();
  const p = document.getElementById('cartPage');
  p.style.display = 'block'; p.scrollTop = 0;
  p.className = 'cart-page slide-in';
}

function renderCart() {
  const body = document.getElementById('cartBody');
  if (!cart.length) {
    body.innerHTML = '<div class="empty-cart"><div>🛒</div><p>Savat bo\'sh</p><p style="font-size:12px;margin-top:8px">Katalogdan soat tanlang</p></div>';
    return;
  }
  const total = cart.reduce((s, w) => s + w.price, 0);
  body.innerHTML = cart.map(w => `
    <div class="cart-item">
      <div class="cart-face">${w.emoji}</div>
      <div class="cart-info">
        <div class="cart-item-name">${w.name}</div>
        <div class="cart-item-price">$${w.price.toLocaleString()}</div>
      </div>
      <button class="cart-remove" onclick="removeFromCart(${w.id})">✕</button>
    </div>`).join('') +
  `<div class="cart-total-block">
    <div class="cart-total-row"><span>Soatlar soni</span><span>${cart.length} ta</span></div>
    <div class="cart-total-row"><span>Yetkazib berish</span><span>Bepul</span></div>
    <div class="cart-total-row main"><span>JAMI</span><span>$${total.toLocaleString()}</span></div>
    <button class="btn-order" onclick="sendOrder()">📩 Buyurtma berish</button>
  </div>`;
}

function removeFromCart(id) {
  cart = cart.filter(w => w.id !== id);
  saveCart(); renderCart(); showToast('🗑️ O\'chirildi');
}

function sendOrder() {
  if (!cart.length) return;
  const total = cart.reduce((s, w) => s + w.price, 0);
  if (tg) {
    tg.sendData(JSON.stringify({ order: cart.map(w => ({id: w.id, name: w.name, price: w.price})), total }));
    tg.showAlert('✅ Buyurtmangiz qabul qilindi!\n\nTez orada siz bilan bog\'lanamiz 🙏');
  } else {
    alert(`✅ Buyurtma qabul qilindi!\nJami: $${total.toLocaleString()}`);
  }
  cart = []; saveCart(); renderCart(); closePage('cartPage');
}

// ── LOCATION ──
function openLocation() {
  const p = document.getElementById('locationPage');
  p.style.display = 'block'; p.scrollTop = 0;
  p.className = 'location-page slide-in';
}
function openMap() {
  const url = 'https://maps.google.com/?q=41.3111,69.2797';
  if (tg) tg.openLink(url); else window.open(url, '_blank');
}
function callStore() { window.location.href = 'tel:+998711234567'; }

// ── HELPERS ──
function closePage(id) { document.getElementById(id).style.display = 'none'; }
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}
function saveCart() { localStorage.setItem('rolexCart', JSON.stringify(cart)); updateCartCount(); }
function updateCartCount() { document.getElementById('cartCount').textContent = cart.length; }
