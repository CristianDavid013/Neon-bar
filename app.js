// ── Data ──────────────────────────────────────────────
const DRINKS = [
  { id: 1,  emoji: '🍺', name: 'Cerveza',       price: 3.50 },
  { id: 2,  emoji: '🍷', name: 'Copa de vino',  price: 4.00 },
  { id: 3,  emoji: '🥃', name: 'Whisky',        price: 6.50 },
  { id: 4,  emoji: '🍹', name: 'Mojito',        price: 7.00 },
  { id: 5,  emoji: '🍸', name: 'Gin Tonic',     price: 7.50 },
  { id: 6,  emoji: '🥂', name: 'Champagne',     price: 9.00 },
  { id: 7,  emoji: '🧊', name: 'Vodka soda',    price: 6.00 },
  { id: 8,  emoji: '🍑', name: 'Aperol Spritz', price: 7.00 },
  { id: 9,  emoji: '🍋', name: 'Limonada',      price: 3.00 },
  { id: 10, emoji: '💧', name: 'Agua',           price: 1.50 },
];

const UNLOCK_REQUEST = 20;
const UNLOCK_DEDI    = 50;
const UNLOCK_VIP     = 100;
const READY_MS       = 6 * 60 * 1000;
const RING_CIRC      = 113.1; // 2π × 18

// ── State ──────────────────────────────────────────────
let cart       = {};
let totalSpent = 0;
let orderList  = [];
let unlockedTiers = { t1: false, t2: false, t3: false };

// ── DOM refs ──────────────────────────────────────────
const drinkGrid        = document.getElementById('drinkGrid');
const cartItemsEl      = document.getElementById('cartItems');
const cartCountEl      = document.getElementById('cartCount');
const cartTotalEl      = document.getElementById('cartTotal');
const totalDisplayEl   = document.getElementById('totalDisplay');
const cartFooterCountEl= document.getElementById('cartFooterCount');
const btnConfirm       = document.getElementById('btnConfirm');
const cartFooterEl     = document.getElementById('cartFooter');
const cartChipEl       = document.getElementById('cartChip');
const orderStatusEl    = document.getElementById('orderStatus');
const spentDisplayEl   = document.getElementById('spentDisplay');
const tierSpentEl      = document.getElementById('tierSpentNum');
const btnRequest       = document.getElementById('btnRequest');
const btnDedi          = document.getElementById('btnDedi');
const btnVip           = document.getElementById('btnVip');
const toast            = document.getElementById('toast');
const banner           = document.getElementById('banner');
const unlockFlash      = document.getElementById('unlockFlash');

// Rings
const ringFill1  = document.getElementById('ringFill1');
const ringFill2  = document.getElementById('ringFill2');
const ringFill3  = document.getElementById('ringFill3');
const ringLabel1 = document.getElementById('ringLabel1');
const ringLabel2 = document.getElementById('ringLabel2');
const ringLabel3 = document.getElementById('ringLabel3');

// Labels
const labelReq  = document.getElementById('labelRequest');
const labelDedi = document.getElementById('labelDedi');
const labelVip  = document.getElementById('labelVip');

// Rewards strip
const rstrip1 = document.getElementById('rstrip1');
const rstrip2 = document.getElementById('rstrip2');
const rstrip3 = document.getElementById('rstrip3');

// Tier track
const tierNode1     = document.getElementById('tierNode1');
const tierNode2     = document.getElementById('tierNode2');
const tierNode3     = document.getElementById('tierNode3');
const tierLineFill1 = document.getElementById('tierLineFill1');
const tierLineFill2 = document.getElementById('tierLineFill2');

// ── Init ──────────────────────────────────────────────
function init() {
  renderDrinkGrid();
  setupTabs();
  setupModals();
  updateCart();
  updateDJZone();
}

// ── Tabs ──────────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.bnav-btn').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tabName}"]`)?.classList.add('active');
  document.querySelector(`.bnav-btn[data-tab="${tabName}"]`)?.classList.add('active');
  document.getElementById('tab-' + tabName).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupTabs() {
  document.querySelectorAll('.tab, .bnav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

// ── Drink grid ────────────────────────────────────────
function renderDrinkGrid() {
  drinkGrid.innerHTML = DRINKS.map(d => `
    <div class="drink-card" id="dc-${d.id}">
      <span class="in-cart-badge" id="badge-${d.id}">×0</span>
      <span class="drink-emoji">${d.emoji}</span>
      <div class="drink-name">${d.name}</div>
      <div class="drink-price">${d.price.toFixed(2)} €</div>
      <button class="drink-add-btn" onclick="addToCart(${d.id})">+ Añadir</button>
    </div>
  `).join('');
}

function updateDrinkBadges() {
  DRINKS.forEach(d => {
    const card  = document.getElementById(`dc-${d.id}`);
    const badge = document.getElementById(`badge-${d.id}`);
    if (!card || !badge) return;
    const qty = cart[d.id] || 0;
    if (qty > 0) {
      badge.textContent = `×${qty}`;
      card.classList.add('in-cart');
    } else {
      card.classList.remove('in-cart');
    }
  });
}

// ── Cart logic ────────────────────────────────────────
function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  updateCart();
  const drink = DRINKS.find(d => d.id === id);
  showToast(`${drink.emoji} ${drink.name} añadido`);
}

function changeQty(id, delta) {
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  updateCart();
}

function updateCart() {
  const entries  = Object.entries(cart);
  const count    = entries.reduce((s, [, q]) => s + q, 0);
  const subtotal = entries.reduce((s, [id, q]) => {
    return s + DRINKS.find(d => d.id === Number(id)).price * q;
  }, 0);

  cartCountEl.textContent      = count;
  cartTotalEl.textContent      = subtotal.toFixed(2);
  totalDisplayEl.textContent   = subtotal.toFixed(2) + ' €';
  cartFooterCountEl.textContent= count;

  cartChipEl.classList.toggle('has-items', count > 0);
  cartFooterEl.classList.toggle('visible', count > 0);

  updateDrinkBadges();
  renderCartItems(entries);
}

function renderCartItems(entries) {
  if (!entries.length) {
    cartItemsEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <p class="empty-title">Carrito vacío</p>
        <p class="empty-sub">Ve a la Carta y añade bebidas</p>
        <button class="btn-ghost" onclick="switchTab('menu')">Ver carta</button>
      </div>`;
    return;
  }
  cartItemsEl.innerHTML = entries.map(([id, qty]) => {
    const d = DRINKS.find(d => d.id === Number(id));
    const sub = (d.price * qty).toFixed(2);
    return `
      <div class="cart-item">
        <div class="cart-item-left">
          <span class="cart-item-emoji">${d.emoji}</span>
          <div>
            <div class="cart-item-name">${d.name}</div>
            <div class="cart-item-price">${d.price.toFixed(2)} € / ud</div>
          </div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty(${id}, -1)">−</button>
          <span class="qty-display">${qty}</span>
          <button class="qty-btn" onclick="changeQty(${id}, +1)">+</button>
        </div>
        <span class="cart-item-subtotal">${sub} €</span>
      </div>`;
  }).join('');
}

// ── Confirm order ─────────────────────────────────────
btnConfirm.addEventListener('click', () => {
  const entries = Object.entries(cart);
  if (!entries.length) { showToast('Añade bebidas primero'); return; }

  const subtotal = entries.reduce((s, [id, q]) =>
    s + DRINKS.find(d => d.id === Number(id)).price * q, 0);

  const readyAt = Date.now() + READY_MS;

  entries.forEach(([id, qty]) => {
    const d = DRINKS.find(d => d.id === Number(id));
    for (let i = 0; i < qty; i++) {
      const order = { id: Date.now() + Math.random(), drink: d, status: 'preparing', readyAt };
      orderList.push(order);
      setTimeout(() => {
        order.status = 'ready';
        renderOrderStatus();
        showToast(`🟢 ¡${d.name} lista para recoger!`);
      }, READY_MS);
    }
  });

  totalSpent += subtotal;
  spentDisplayEl.textContent  = totalSpent.toFixed(2);
  tierSpentEl.textContent     = totalSpent.toFixed(2);
  cart = {};
  updateCart();
  updateDJZone();
  renderOrderStatus();
  showBanner('✅ Pedido confirmado · 🕐 Listas en 6 minutos en la barra');
  switchTab('estado');
});

// ── Order status ──────────────────────────────────────
function formatCountdown(ms) {
  if (ms <= 0) return '00:00';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function renderOrderStatus() {
  if (!orderList.length) {
    orderStatusEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🍹</div>
        <p class="empty-title">Sin pedidos activos</p>
        <p class="empty-sub">Ve a la Carta y confirma tu pedido</p>
        <button class="btn-ghost" onclick="switchTab('menu')">Ver carta</button>
      </div>`;
    return;
  }
  const now = Date.now();
  orderStatusEl.innerHTML = orderList.map(o => {
    const remaining = o.readyAt - now;
    const countdown = o.status === 'ready' ? '' :
      `<span class="countdown">${formatCountdown(remaining)}</span>`;
    return `
      <div class="status-card${o.status === 'ready' ? ' is-ready' : ''}">
        <div class="status-icon">${o.drink.emoji}</div>
        <div class="status-info">
          <div class="status-drink-name">${o.drink.name}</div>
          ${o.status === 'ready'
            ? '<span class="status-badge badge-ready">✓ Lista para recoger</span>'
            : `<span class="status-badge badge-preparing">⏳ En preparación</span>${countdown}`}
        </div>
      </div>`;
  }).join('');
}

setInterval(() => {
  if (orderList.some(o => o.status === 'preparing')) renderOrderStatus();
}, 1000);

// ── DJ Zone ──────────────────────────────────────────
function setRing(fillEl, labelEl, pct) {
  const offset = RING_CIRC * (1 - pct / 100);
  fillEl.style.strokeDashoffset = offset;
  labelEl.textContent = Math.round(pct) + '%';
}

function updateDJZone() {
  const pct1 = Math.min(totalSpent / UNLOCK_REQUEST * 100, 100);
  const pct2 = Math.min(totalSpent / UNLOCK_DEDI    * 100, 100);
  const pct3 = Math.min(totalSpent / UNLOCK_VIP     * 100, 100);

  // Rings
  setRing(ringFill1, ringLabel1, pct1);
  setRing(ringFill2, ringLabel2, pct2);
  setRing(ringFill3, ringLabel3, pct3);

  // Rewards strip
  rstrip1.style.width = pct1 + '%';
  rstrip2.style.width = pct2 + '%';
  rstrip3.style.width = pct3 + '%';

  // Tier track
  const p12 = Math.min((totalSpent - UNLOCK_REQUEST) / (UNLOCK_DEDI - UNLOCK_REQUEST) * 100, 100);
  const p23 = Math.min((totalSpent - UNLOCK_DEDI) / (UNLOCK_VIP - UNLOCK_DEDI) * 100, 100);
  tierLineFill1.style.width = Math.max(0, p12) + '%';
  tierLineFill2.style.width = Math.max(0, p23) + '%';

  // Labels
  labelReq.textContent  = `${totalSpent.toFixed(2)} / ${UNLOCK_REQUEST} €`;
  labelDedi.textContent = `${totalSpent.toFixed(2)} / ${UNLOCK_DEDI} €`;
  labelVip.textContent  = `${totalSpent.toFixed(2)} / ${UNLOCK_VIP} €`;

  // Tier nodes
  if (totalSpent >= UNLOCK_REQUEST) tierNode1.classList.add('active');
  if (totalSpent >= UNLOCK_DEDI)    tierNode2.classList.add('active');
  if (totalSpent >= UNLOCK_VIP)     tierNode3.classList.add('active');

  // Tier spent display
  if (tierSpentEl) tierSpentEl.textContent = totalSpent.toFixed(2);

  // Unlock tier 1
  if (totalSpent >= UNLOCK_REQUEST && !unlockedTiers.t1) {
    unlockedTiers.t1 = true;
    btnRequest.disabled = false;
    btnRequest.textContent = '🎵 Pedir canción';
    btnRequest.classList.remove('locked');
    document.getElementById('djRequestCard').classList.add('unlocked');
    triggerUnlockFlash(false);
    showBanner('🎵 Desbloqueado: ¡ya puedes pedir una canción al DJ!');
  }
  // Unlock tier 2
  if (totalSpent >= UNLOCK_DEDI && !unlockedTiers.t2) {
    unlockedTiers.t2 = true;
    btnDedi.disabled = false;
    btnDedi.textContent = '💜 Dedicar canción';
    btnDedi.classList.remove('locked');
    document.getElementById('djDediCard').classList.add('unlocked');
    triggerUnlockFlash(false);
    showBanner('💜 Desbloqueado: ¡ya puedes dedicar una canción!');
  }
  // Unlock tier 3
  if (totalSpent >= UNLOCK_VIP && !unlockedTiers.t3) {
    unlockedTiers.t3 = true;
    btnVip.disabled = false;
    btnVip.textContent = '👑 Reservar Mesa VIP';
    btnVip.classList.remove('locked');
    btnVip.classList.add('btn-gold');
    document.getElementById('djVipCard').classList.add('unlocked');
    triggerUnlockFlash(true);
    showBanner('👑 ¡DESBLOQUEADO! Mesa VIP + Botella gratis — ¡enhorabuena!');
  }
}

function triggerUnlockFlash(isGold) {
  unlockFlash.classList.toggle('gold-flash', isGold);
  unlockFlash.classList.add('show');
  setTimeout(() => unlockFlash.classList.remove('show'), 400);
}

// ── Modals ────────────────────────────────────────────
function setupModals() {
  btnRequest.addEventListener('click', () => {
    if (totalSpent < UNLOCK_REQUEST) return;
    openModal('modalRequest');
  });
  btnDedi.addEventListener('click', () => {
    if (totalSpent < UNLOCK_DEDI) return;
    openModal('modalDedi');
  });
  btnVip.addEventListener('click', () => {
    if (totalSpent < UNLOCK_VIP) return;
    openModal('modalVip');
  });

  document.getElementById('btnSendRequest').addEventListener('click', () => {
    const song = document.getElementById('inputSong').value.trim();
    if (!song) { showToast('Escribe el nombre de la canción'); return; }
    showBanner(`🎵 Petición enviada al DJ: "${song}"`);
    document.getElementById('inputSong').value = '';
    closeModal('modalRequest');
  });

  document.getElementById('btnSendDedi').addEventListener('click', () => {
    const song = document.getElementById('inputDediSong').value.trim();
    const from = document.getElementById('inputDediFrom').value.trim();
    const to   = document.getElementById('inputDediTo').value.trim();
    if (!song || !from || !to) { showToast('Rellena los campos obligatorios'); return; }
    showBanner(`💜 Dedicatoria enviada — "${song}" de ${from} para ${to}`);
    ['inputDediSong','inputDediFrom','inputDediTo','inputDediMsg'].forEach(id => {
      document.getElementById(id).value = '';
    });
    closeModal('modalDedi');
  });

  document.getElementById('btnSendVip').addEventListener('click', () => {
    const name   = document.getElementById('inputVipName').value.trim();
    const guests = document.getElementById('inputVipGuests').value.trim();
    const bottle = document.getElementById('inputVipBottle').value;
    if (!name || !guests || !bottle) { showToast('Rellena todos los campos'); return; }
    showBanner(`👑 Mesa VIP reservada para ${name} (${guests} personas)!`);
    ['inputVipName','inputVipGuests','inputVipNotes'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('inputVipBottle').selectedIndex = 0;
    closeModal('modalVip');
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
}

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── Toast & Banner ────────────────────────────────────
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

let bannerTimer;
function showBanner(msg) {
  banner.textContent = msg;
  banner.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => banner.classList.remove('show'), 5000);
}

// ── Start ─────────────────────────────────────────────
init();
