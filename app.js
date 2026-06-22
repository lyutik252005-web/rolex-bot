const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

// ⚙️ SOZLAMALAR — shu yerga o'z bot tokeningni va chat ID ni yoz
const BOT_TOKEN = '8690529348:AAH0qZ_TtqlFq6HOMNWXcv00ErT9HXIzVoA'; // @BotFather dan olgan token
const ADMIN_CHAT_ID = ' 1422621616';     // Quyida qanday olishni tushuntirdim

let cart = JSON.parse(localStorage.getItem('rolexCart') || '[]');
let currentFilter = { cat: 'all', maxPrice: 100000, search: '' };
let currentWatch = null;

document.addEventListener('DOMContentLoaded', () => { renderGrid(); updateCartCount(); });

// ── SOAT RASMI (foto bo'lsa rasm, bo'lmasa chiroyli emoji soat) ──
function watchFace(w, size = 'small') {
  const hasPhoto = w.image && w.image.length > 0;

  if (size === 'big') {
    if (hasPhoto) {
      return `<div class="detail-watch-wrap">
        <img src="${w.image}" alt="${w.name}" class="detail-photo"
          onerror="this.style.display='none'; document.getElementById('dFallback').style.display='flex'">
        <div id="dFallback" class="detail-watch-big" style="display:none">
          <span class="detail-emoji">${w.emoji}</span>
          <div class="detail-crown"></div>
        </div>
      </div>`;
    }
    return `<div class="detail-watch-wrap">
      <div class="detail-watch-big">
        <span class="detail-emoji">${w.emoji}</span>
        <div class="detail-crown"></div>
      </div>
    </div>`;
  }

  // Kichik karta uchun
  if (hasPhoto) {
    return `<div class="card-face">
      <img src="${w.image}" alt="${w.name}" class="card-photo"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
      <div class="card-face-fallback" style="display:none">
        <div class="watch-lug top-left"></div><div class="watch-lug top-right"></div>
        <div class="watch-lug bot-left"></div><div class="watch-lug bot-right"></div>
        <div class="watch-circle"><span class="watch-emoji">${w.emoji}</span><div class="watch-crown"></div></div>
      </div>
      <div class="card-badge">${w.ref}</div>
    </div>`;
  }

  return `<div class="card-face">
    <div class="watch-lug top-left"></div><div class="watch-lug top-right"></div>
    <div class="watch-lug bot-left"></div><div class="watch-lug bot-right"></div>
    <div class="watch-circle"><span class="watch-emoji">${w.emoji}</span><div class="watch-crown"></div></div>
    <div class="card-badge">${w.ref}</div>
  </div>`;
}

// ── GRID ──
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

// ── FILTRLAR ──
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
    <div class="spec-row"><span class="spec-label">Referans</span><span class="spec-val">${w.ref}</span></div>
    <div class="spec-row"><span class="spec-label">Diametr</span><span class="spec-val">${w.diameter} mm</span></div>
    <div class="spec-row"><span class="spec-label">Material</span><span class="spec-val">${w.material}</span></div>
    <div class="spec-row"><span class="spec-label">Siferblat</span><span class="spec-val">${w.dial}</span></div>
    <div class="spec-row"><span class="spec-label">Suv o'tkazmasligi</span><span class="spec-val">${w.water} m</span></div>
    <div class="spec-row"><span class="spec-label">Kategoriya</span><span class="spec-val">${w.category === 'sport' ? '⚡ Sport' : w.category === 'classic' ? '🕐 Klassik' : '💎 Lyuks'}</span></div>`;
  const p = document.getElementById('detailPage');
  p.style.display = 'block'; p.scrollTop = 0; p.className = 'detail-page slide-in';
}

function addFromDetail() {
  if (!currentWatch) return;
  if (cart.find(c => c.id === currentWatch.id)) { showToast('✅ Allaqachon savatda!'); return; }
  cart.push({...currentWatch});
  saveCart();
  document.getElementById('dCartBtn').textContent = '✅ Savatda bor';
  showToast('🛒 Savatga qo\'shildi!');
}

// ── SAVAT ──
function openCart() {
  renderCart();
  const p = document.getElementById('cartPage');
  p.style.display = 'block'; p.scrollTop = 0; p.className = 'cart-page slide-in';
}
function renderCart() {
  const body = document.getElementById('cartBody');
  if (!cart.length) {
    body.innerHTML = '<div class="empty-cart"><div>🛒</div><p>Savat bo\'sh</p><p style="font-size:12px;margin-top:8px;color:var(--text2)">Katalogdan soat tanlang</p></div>';
    return;
  }
  const total = cart.reduce((s, w) => s + w.price, 0);
  body.innerHTML = cart.map(w => `
    <div class="cart-item">
      <div class="cart-face">
        ${w.image ? `<img src="${w.image}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.style.display='none'">` : w.emoji}
      </div>
      <div class="cart-info">
        <div class="cart-item-name">${w.name}</div>
        <div class="cart-item-price">$${w.price.toLocaleString()}</div>
      </div>
      <button class="cart-remove" onclick="removeFromCart(${w.id})">✕</button>
    </div>`).join('') +
  `<div class="cart-total-block">
    <div class="cart-total-row"><span>Soatlar soni</span><span>${cart.length} ta</span></div>
    <div class="cart-total-row"><span>Yetkazib berish</span><span style="color:var(--gold)">Bepul</span></div>
    <div class="cart-total-row main"><span>JAMI</span><span>$${total.toLocaleString()}</span></div>
    <button class="btn-order" onclick="openOrderForm()">📋 Buyurtma berish</button>
  </div>`;
}
function removeFromCart(id) {
  cart = cart.filter(w => w.id !== id);
  saveCart(); renderCart(); showToast('🗑️ O\'chirildi');
}

// ── BUYURTMA FORMASI ──
function openOrderForm() {
  if (!cart.length) return;
  document.getElementById('orderModal').style.display = 'flex';
}
function closeOrderForm() {
  document.getElementById('orderModal').style.display = 'none';
}

async function submitOrder() {
  const name = document.getElementById('orderName').value.trim();
  const phone = document.getElementById('orderPhone').value.trim();
  const note = document.getElementById('orderNote').value.trim();

  if (!name) { showToast('❗ Ismingizni kiriting'); return; }
  if (!phone) { showToast('❗ Telefon raqamingizni kiriting'); return; }

  const btn = document.getElementById('orderSubmitBtn');
  btn.textContent = '⏳ Yuborilmoqda...';
  btn.disabled = true;

  const total = cart.reduce((s, w) => s + w.price, 0);
  const itemsList = cart.map((w, i) => `${i+1}. ${w.emoji} <b>${w.name}</b> — <b>$${w.price.toLocaleString()}</b>`).join('\n');

  const message = `
🆕 <b>YANGI BUYURTMA!</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Mijoz:</b> ${name}
📞 <b>Telefon:</b> ${phone}
${note ? `📝 <b>Izoh:</b> ${note}\n` : ''}
━━━━━━━━━━━━━━━━━━
⌚ <b>BUYURTMA:</b>
${itemsList}
━━━━━━━━━━━━━━━━━━
💰 <b>JAMI: $${total.toLocaleString()}</b>
🚚 Yetkazib berish: <b>BEPUL</b>
━━━━━━━━━━━━━━━━━━
🕐 ${new Date().toLocaleString('ru-RU')}
  `.trim();

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: message, parse_mode: 'HTML' })
    });
    const data = await res.json();
    if (data.ok) {
      closeOrderForm();
      cart = []; saveCart(); renderCart(); closePage('cartPage');
      showSuccessScreen(name, total);
    } else {
      throw new Error('Telegram API xatosi');
    }
  } catch (e) {
    // Agar token hali kiritilmagan bo'lsa — demo rejim
    closeOrderForm();
    cart = []; saveCart(); renderCart(); closePage('cartPage');
    showSuccessScreen(name, total);
  }
  btn.textContent = '📩 Buyurtmani yuborish'; btn.disabled = false;
}

function showSuccessScreen(name, total) {
  document.getElementById('successName').textContent = name;
  document.getElementById('successTotal').textContent = '$' + total.toLocaleString();
  document.getElementById('successModal').style.display = 'flex';
}
function closeSuccess() {
  document.getElementById('successModal').style.display = 'none';
}

// ── MANZIL ──
function openLocation() {
  const p = document.getElementById('locationPage');
  p.style.display = 'block'; p.scrollTop = 0; p.className = 'location-page slide-in';
}
function openMap() {
  const url = 'https://maps.google.com/?q=41.3111,69.2797';
  if (tg) tg.openLink(url); else window.open(url, '_blank');
}
function callStore() { window.location.href = 'tel:+998711234567'; }

// ── YORDAMCHI ──
function closePage(id) { document.getElementById(id).style.display = 'none'; }
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}
function saveCart() { localStorage.setItem('rolexCart', JSON.stringify(cart)); updateCartCount(); }
function updateCartCount() { document.getElementById('cartCount').textContent = cart.length; }
function switchTab(n) { [0,1,2].forEach(i => document.getElementById('bn'+i).classList.toggle('active', i===n)); }
