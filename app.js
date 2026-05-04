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
const RING_CIRC      = 113.1;

// ── State ──────────────────────────────────────────────
let cart       = {};
let totalSpent = 0;
let orderList  = [];
let unlockedTiers = { t1: false, t2: false, t3: false };

// ── Page meta ─────────────────────────────────────────
const PAGE_META = {
  menu:   { title: 'Carta',          subtitle: 'Elige tu bebida favorita' },
  pedido: { title: 'Mi Pedido',      subtitle: 'Revisa y confirma tu pedido' },
  estado: { title: 'Estado',         subtitle: 'Sigue el progreso de tu pedido' },
  dj:     { title: 'DJ & Rewards',   subtitle: 'Desbloquea recompensas exclusivas' },
};

// ── DOM refs ──────────────────────────────────────────
const drinkGrid          = document.getElementById('drinkGrid');
const cartItemsEl        = document.getElementById('cartItems');
const cartCountEl        = document.getElementById('cartCount');
const cartTotalEl        = document.getElementById('cartTotal');
const cartChipEl         = document.getElementById('cartChip');
const cartFooterEl       = document.getElementById('cartFooter');
const cartFooterCountEl  = document.getElementById('cartFooterCount');
const totalDisplayMobile = document.getElementById('totalDisplayMobile');
const btnConfirmMobile   = document.getElementById('btnConfirmMobile');
const orderStatusEl      = document.getElementById('orderStatus');
const spentDisplayEl     = document.getElementById('spentDisplay');
const spentDisplay2El    = document.getElementById('spentDisplay2');
const tierSpentEl        = document.getElementById('tierSpentNum');
const btnRequest         = document.getElementById('btnRequest');
const btnDedi            = document.getElementById('btnDedi');
const btnVip             = document.getElementById('btnVip');
const toast              = document.getElementById('toast');
const banner             = document.getElementById('banner');
const unlockFlash        = document.getElementById('unlockFlash');
const pageTitle          = document.getElementById('pageTitle');
const pageSubtitle       = document.getElementById('pageSubtitle');
const snavBadge          = document.getElementById('snavBadge');

// Sidebar cart
const sidebarCartEmpty  = document.getElementById('sidebarCartEmpty');
const sidebarCartItems  = document.getElementById('sidebarCartItems');
const sidebarCartFooter = document.getElementById('sidebarCartFooter');
const sidebarTotal      = document.getElementById('sidebarTotal');
const sidebarSpentEl    = document.getElementById('sidebarSpent');
const btnConfirmSide    = document.getElementById('btnConfirmSide');

// Mobile cart summary
const mobileCartSummary = document.getElementById('mobileCartSummary');
const totalDisplay      = document.getElementById('totalDisplay');

// Rewards
const ringFill1 = document.getElementById('ringFill1');
const ringFill2 = document.getElementById('ringFill2');
const ringFill3 = document.getElementById('ringFill3');
const ringLabel1= document.getElementById('ringLabel1');
const ringLabel2= document.getElementById('ringLabel2');
const ringLabel3= document.getElementById('ringLabel3');
const labelReq  = document.getElementById('labelRequest');
const labelDedi = document.getElementById('labelDedi');
const labelVip  = document.getElementById('labelVip');
const rstrip1   = document.getElementById('rstrip1');
const rstrip2   = document.getElementById('rstrip2');
const rstrip3   = document.getElementById('rstrip3');
const srewardFill1 = document.getElementById('srewardFill1');
const srewardFill2 = document.getElementById('srewardFill2');
const srewardFill3 = document.getElementById('srewardFill3');
const srewardVal1  = document.getElementById('srewardVal1');
const srewardVal2  = document.getElementById('srewardVal2');
const srewardVal3  = document.getElementById('srewardVal3');
const tierNode1    = document.getElementById('tierNode1');
const tierNode2    = document.getElementById('tierNode2');
const tierNode3    = document.getElementById('tierNode3');
const tierLineFill1= document.getElementById('tierLineFill1');
const tierLineFill2= document.getElementById('tierLineFill2');

// ── Init ──────────────────────────────────────────────
function init() {
  renderDrinkGrid();
  setupTabs();
  setupModals();
  setupConfirmButtons();
  updateCart();
  updateDJZone();
}

// ── Tabs ──────────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.tab, .bnav-btn, .snav-item').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  document.querySelector(`.tab[data-tab="${tabName}"]`)?.classList.add('active');
  document.querySelector(`.bnav-btn[data-tab="${tabName}"]`)?.classList.add('active');
  document.querySelector(`.snav-item[data-tab="${tabName}"]`)?.classList.add('active');
  document.getElementById('tab-' + tabName)?.classList.add('active');

  // Update desktop page header
  const meta = PAGE_META[tabName] || {};
  if (pageTitle)    pageTitle.textContent    = meta.title    || '';
  if (pageSubtitle) pageSubtitle.textContent = meta.subtitle || '';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupTabs() {
  document.querySelectorAll('.tab, .bnav-btn, .snav-item').forEach(btn => {
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
    badge.textContent = `×${qty}`;
    card.classList.toggle('in-cart', qty > 0);
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
  const subtotal = entries.reduce((s, [id, q]) =>
    s + DRINKS.find(d => d.id === Number(id)).price * q, 0);

  // Mobile header
  if (cartCountEl) cartCountEl.textContent = count;
  if (cartTotalEl) cartTotalEl.textContent = subtotal.toFixed(2);
  if (cartChipEl)  cartChipEl.classList.toggle('has-items', count > 0);

  // Mobile footer
  if (cartFooterCountEl)  cartFooterCountEl.textContent  = count;
  if (totalDisplayMobile) totalDisplayMobile.textContent = subtotal.toFixed(2) + ' €';
  if (cartFooterEl)       cartFooterEl.classList.toggle('visible', count > 0);

  // Mobile tab summary
  if (totalDisplay) totalDisplay.textContent = subtotal.toFixed(2) + ' €';
  if (mobileCartSummary) mobileCartSummary.style.display = count > 0 ? 'flex' : 'none';

  // Sidebar nav badge
  if (snavBadge) {
    snavBadge.textContent = count;
    snavBadge.style.display = count > 0 ? '' : 'none';
  }

  updateDrinkBadges();
  renderCartItems(entries, subtotal);
}

function renderCartItems(entries, subtotal) {
  const empty = `
    <div class="empty-state">
      <div class="empty-icon">🛒</div>
      <p class="empty-title">Carrito vacío</p>
      <p class="empty-sub">Añade bebidas desde la Carta</p>
      <button class="btn-ghost" onclick="switchTab('menu')">Ver carta</button>
    </div>`;

  // Mobile tab-pedido
  if (cartItemsEl) {
    if (!entries.length) {
      cartItemsEl.innerHTML = empty;
    } else {
      cartItemsEl.innerHTML = entries.map(([id, qty]) => {
        const d = DRINKS.find(d => d.id === Number(id));
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
              <button class="qty-btn" onclick="changeQty(${id},-1)">−</button>
              <span class="qty-display">${qty}</span>
              <button class="qty-btn" onclick="changeQty(${id},+1)">+</button>
            </div>
            <span class="cart-item-subtotal">${(d.price*qty).toFixed(2)} €</span>
          </div>`;
      }).join('');
    }
  }

  // Desktop sidebar cart
  if (!sidebarCartItems) return;
  if (!entries.length) {
    sidebarCartEmpty.style.display  = '';
    sidebarCartItems.innerHTML      = '';
    sidebarCartFooter.style.display = 'none';
  } else {
    sidebarCartEmpty.style.display  = 'none';
    sidebarCartFooter.style.display = '';
    if (sidebarTotal) sidebarTotal.textContent = subtotal.toFixed(2) + ' €';
    sidebarCartItems.innerHTML = entries.map(([id, qty]) => {
      const d = DRINKS.find(d => d.id === Number(id));
      return `
        <div class="sc-item">
          <span class="sc-emoji">${d.emoji}</span>
          <span class="sc-name">${d.name}</span>
          <span class="sc-qty">×${qty}</span>
          <span class="sc-price">${(d.price*qty).toFixed(2)}€</span>
        </div>`;
    }).join('');
  }
}

// ── Confirm order ─────────────────────────────────────
function confirmOrder() {
  const entries = Object.entries(cart);
  if (!entries.length) { showToast('Añade bebidas primero'); return; }

  const subtotal = entries.reduce((s, [id, q]) =>
    s + DRINKS.find(d => d.id === Number(id)).price * q, 0);

  const readyAt = Date.now() + READY_MS;

  entries.forEach(([id, qty]) => {
    const d = DRINKS.find(d => d.id === Number(id));
    for (let i = 0; i < qty; i++) {
      const order = { drink: d, status: 'preparing', readyAt };
      orderList.push(order);
      setTimeout(() => {
        order.status = 'ready';
        renderOrderStatus();
        showToast(`🟢 ¡${d.name} lista para recoger!`);
      }, READY_MS);
    }
  });

  totalSpent += subtotal;
  updateSpentDisplay();
  cart = {};
  updateCart();
  updateDJZone();
  renderOrderStatus();
  showBanner('✅ Pedido confirmado · 🕐 Listas en 6 minutos en la barra');
  switchTab('estado');
}

function setupConfirmButtons() {
  if (btnConfirmMobile) btnConfirmMobile.addEventListener('click', confirmOrder);
  if (btnConfirmSide)   btnConfirmSide.addEventListener('click', confirmOrder);
  // Legacy mobile tab button
  const btnConfirm = document.getElementById('btnConfirm');
  if (btnConfirm) btnConfirm.addEventListener('click', confirmOrder);
}

function updateSpentDisplay() {
  const val = totalSpent.toFixed(2);
  if (spentDisplayEl)  spentDisplayEl.textContent  = val;
  if (spentDisplay2El) spentDisplay2El.textContent = val;
  if (tierSpentEl)     tierSpentEl.textContent     = val;
  if (sidebarSpentEl)  sidebarSpentEl.textContent  = val;
}

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
    const rem = o.readyAt - now;
    const cd  = o.status === 'ready' ? '' : `<span class="countdown">${formatCountdown(rem)}</span>`;
    return `
      <div class="status-card${o.status==='ready'?' is-ready':''}">
        <div class="status-icon">${o.drink.emoji}</div>
        <div class="status-info">
          <div class="status-drink-name">${o.drink.name}</div>
          ${o.status==='ready'
            ? '<span class="status-badge badge-ready">✓ Lista para recoger</span>'
            : `<span class="status-badge badge-preparing">⏳ En preparación</span>${cd}`}
        </div>
      </div>`;
  }).join('');
}

setInterval(() => {
  if (orderList.some(o => o.status === 'preparing')) renderOrderStatus();
}, 1000);

// ── DJ Zone ──────────────────────────────────────────
function setRing(fillEl, labelEl, pct) {
  fillEl.style.strokeDashoffset = RING_CIRC * (1 - pct / 100);
  labelEl.textContent = Math.round(pct) + '%';
}

function updateDJZone() {
  const p1 = Math.min(totalSpent / UNLOCK_REQUEST * 100, 100);
  const p2 = Math.min(totalSpent / UNLOCK_DEDI    * 100, 100);
  const p3 = Math.min(totalSpent / UNLOCK_VIP     * 100, 100);

  setRing(ringFill1, ringLabel1, p1);
  setRing(ringFill2, ringLabel2, p2);
  setRing(ringFill3, ringLabel3, p3);

  // Mobile strip
  if (rstrip1) rstrip1.style.width = p1 + '%';
  if (rstrip2) rstrip2.style.width = p2 + '%';
  if (rstrip3) rstrip3.style.width = p3 + '%';

  // Sidebar strip
  if (srewardFill1) srewardFill1.style.width = p1 + '%';
  if (srewardFill2) srewardFill2.style.width = p2 + '%';
  if (srewardFill3) srewardFill3.style.width = p3 + '%';
  if (srewardVal1)  srewardVal1.textContent  = `${totalSpent.toFixed(2)} / ${UNLOCK_REQUEST} €`;
  if (srewardVal2)  srewardVal2.textContent  = `${totalSpent.toFixed(2)} / ${UNLOCK_DEDI} €`;
  if (srewardVal3)  srewardVal3.textContent  = `${totalSpent.toFixed(2)} / ${UNLOCK_VIP} €`;

  // Labels
  if (labelReq)  labelReq.textContent  = `${totalSpent.toFixed(2)} / ${UNLOCK_REQUEST} €`;
  if (labelDedi) labelDedi.textContent = `${totalSpent.toFixed(2)} / ${UNLOCK_DEDI} €`;
  if (labelVip)  labelVip.textContent  = `${totalSpent.toFixed(2)} / ${UNLOCK_VIP} €`;

  // Tier track lines
  const p12 = Math.max(0, Math.min((totalSpent - UNLOCK_REQUEST) / (UNLOCK_DEDI - UNLOCK_REQUEST) * 100, 100));
  const p23 = Math.max(0, Math.min((totalSpent - UNLOCK_DEDI)    / (UNLOCK_VIP  - UNLOCK_DEDI)    * 100, 100));
  if (tierLineFill1) tierLineFill1.style.width = p12 + '%';
  if (tierLineFill2) tierLineFill2.style.width = p23 + '%';

  if (totalSpent >= UNLOCK_REQUEST) tierNode1?.classList.add('active');
  if (totalSpent >= UNLOCK_DEDI)    tierNode2?.classList.add('active');
  if (totalSpent >= UNLOCK_VIP)     tierNode3?.classList.add('active');

  // Unlock tiers
  if (totalSpent >= UNLOCK_REQUEST && !unlockedTiers.t1) {
    unlockedTiers.t1 = true;
    btnRequest.disabled = false; btnRequest.textContent = '🎵 Pedir canción'; btnRequest.classList.remove('locked');
    document.getElementById('djRequestCard')?.classList.add('unlocked');
    triggerFlash(false);
    showBanner('🎵 Desbloqueado: ¡ya puedes pedir una canción al DJ!');
  }
  if (totalSpent >= UNLOCK_DEDI && !unlockedTiers.t2) {
    unlockedTiers.t2 = true;
    btnDedi.disabled = false; btnDedi.textContent = '💜 Dedicar canción'; btnDedi.classList.remove('locked');
    document.getElementById('djDediCard')?.classList.add('unlocked');
    triggerFlash(false);
    showBanner('💜 Desbloqueado: ¡ya puedes dedicar una canción!');
  }
  if (totalSpent >= UNLOCK_VIP && !unlockedTiers.t3) {
    unlockedTiers.t3 = true;
    btnVip.disabled = false; btnVip.textContent = '👑 Reservar Mesa VIP'; btnVip.classList.remove('locked'); btnVip.classList.add('btn-gold');
    document.getElementById('djVipCard')?.classList.add('unlocked');
    triggerFlash(true);
    showBanner('👑 ¡DESBLOQUEADO! Mesa VIP + Botella gratis — ¡enhorabuena!');
  }
}

function triggerFlash(gold) {
  unlockFlash.classList.toggle('gold-flash', gold);
  unlockFlash.classList.add('show');
  setTimeout(() => unlockFlash.classList.remove('show'), 380);
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
    ['inputVipName','inputVipGuests','inputVipNotes'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('inputVipBottle').selectedIndex = 0;
    closeModal('modalVip');
  });

  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) closeModal(o.id); });
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
