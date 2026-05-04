// ── Data ──────────────────────────────────────────────
const DRINKS = [
  { id: 1,  emoji: '🍺', name: 'Cerveza',       price: 3.50 },
  { id: 2,  emoji: '🍻', name: 'Copa de vino',  price: 4.00 },
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

// ── State ──────────────────────────────────────────────
let cart       = {};   // { drinkId: qty }
let totalSpent = 0;    // confirmed spend
let orderList  = [];   // confirmed orders with status

// ── DOM refs ──────────────────────────────────────────
const drinkGrid      = document.getElementById('drinkGrid');
const cartItemsEl    = document.getElementById('cartItems');
const cartCountEl    = document.getElementById('cartCount');
const cartTotalEl    = document.getElementById('cartTotal');
const totalDisplayEl = document.getElementById('totalDisplay');
const btnConfirm     = document.getElementById('btnConfirm');
const cartFooterEl   = document.getElementById('cartFooter');
const orderStatusEl  = document.getElementById('orderStatus');
const progressReq    = document.getElementById('progressRequest');
const progressDedi   = document.getElementById('progressDedi');
const labelReq       = document.getElementById('labelRequest');
const labelDedi      = document.getElementById('labelDedi');
const btnRequest     = document.getElementById('btnRequest');
const btnDedi        = document.getElementById('btnDedi');
const toast          = document.getElementById('toast');
const spentDisplayEl = document.getElementById('spentDisplay');

// ── Init ──────────────────────────────────────────────
function init() {
  renderDrinkGrid();
  setupTabs();
  setupModals();
  updateCart();
}

// ── Tabs ──────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });
}

// ── Drink grid ────────────────────────────────────────
function renderDrinkGrid() {
  drinkGrid.innerHTML = DRINKS.map(d => `
    <div class="drink-card">
      <div class="drink-emoji">${d.emoji}</div>
      <div class="drink-name">${d.name}</div>
      <div class="drink-price">${d.price.toFixed(2)} €</div>
      <button class="drink-add-btn" onclick="addToCart(${d.id})">+ Añadir</button>
    </div>
  `).join('');
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
  const entries = Object.entries(cart);
  const count = entries.reduce((s, [, q]) => s + q, 0);
  const subtotal = entries.reduce((s, [id, q]) => {
    const d = DRINKS.find(d => d.id === Number(id));
    return s + d.price * q;
  }, 0);

  cartCountEl.textContent    = count;
  cartTotalEl.textContent    = subtotal.toFixed(2);
  totalDisplayEl.textContent = subtotal.toFixed(2) + ' €';

  // Show footer only when cart has items
  if (count > 0) {
    cartFooterEl.classList.add('visible');
  } else {
    cartFooterEl.classList.remove('visible');
  }

  renderCartItems(entries);
}

function renderCartItems(entries) {
  if (!entries.length) {
    cartItemsEl.innerHTML = '<p class="hint">Tu carrito está vacío. Ve a la Carta.</p>';
    return;
  }
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
          <button class="qty-btn" onclick="changeQty(${id}, -1)">−</button>
          <span class="qty-display">${qty}</span>
          <button class="qty-btn" onclick="changeQty(${id}, +1)">+</button>
        </div>
      </div>
    `;
  }).join('');
}

// ── Confirm order ─────────────────────────────────────
const READY_MS = 6 * 60 * 1000; // 6 minutos

btnConfirm.addEventListener('click', () => {
  const entries = Object.entries(cart);
  if (!entries.length) { showToast('Añade bebidas primero'); return; }

  const subtotal = entries.reduce((s, [id, q]) => {
    return s + DRINKS.find(d => d.id === Number(id)).price * q;
  }, 0);

  const readyAt = Date.now() + READY_MS;

  entries.forEach(([id, qty]) => {
    const d = DRINKS.find(d => d.id === Number(id));
    for (let i = 0; i < qty; i++) {
      const order = { id: Date.now() + Math.random(), drink: d, status: 'preparing', readyAt };
      orderList.push(order);
      setTimeout(() => {
        order.status = 'ready';
        renderOrderStatus();
        showToast(`🟢 ¡${d.name} lista para recoger en la barra!`);
      }, READY_MS);
    }
  });

  totalSpent += subtotal;
  spentDisplayEl.textContent = totalSpent.toFixed(2);
  cart = {};
  updateCart();
  updateDJZone();
  renderOrderStatus();
  showBanner('✅ Pedido confirmado · 🕐 Tus bebidas estarán listas en 6 minutos');

  // Switch to status tab
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-tab="estado"]').classList.add('active');
  document.getElementById('tab-estado').classList.add('active');
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
    orderStatusEl.innerHTML = '<p class="hint">Aún no has confirmado ningún pedido.</p>';
    return;
  }
  const now = Date.now();
  orderStatusEl.innerHTML = orderList.map(o => {
    const remaining = o.readyAt - now;
    const countdown = o.status === 'ready' ? '' :
      `<span class="countdown">${formatCountdown(remaining)}</span>`;
    return `
      <div class="status-card">
        <div class="status-icon">${o.drink.emoji}</div>
        <div class="status-info">
          <div class="status-drink-name">${o.drink.name}</div>
          ${o.status === 'ready'
            ? '<span class="status-badge badge-ready">✓ Lista para recoger en la barra</span>'
            : `<span class="status-badge badge-preparing">⏳ En preparación</span>${countdown}`
          }
        </div>
      </div>
    `;
  }).join('');
}

// Tick every second to update countdowns
setInterval(() => {
  const hasPreparing = orderList.some(o => o.status === 'preparing');
  if (hasPreparing) renderOrderStatus();
}, 1000);

// ── DJ Zone ──────────────────────────────────────────
function updateDJZone() {
  const pctReq  = Math.min(totalSpent / UNLOCK_REQUEST * 100, 100);
  const pctDedi = Math.min(totalSpent / UNLOCK_DEDI   * 100, 100);

  progressReq.style.width  = pctReq  + '%';
  progressDedi.style.width = pctDedi + '%';

  labelReq.textContent  = `${totalSpent.toFixed(2)} / ${UNLOCK_REQUEST} €`;
  labelDedi.textContent = `${totalSpent.toFixed(2)} / ${UNLOCK_DEDI} €`;

  if (totalSpent >= UNLOCK_REQUEST) {
    btnRequest.disabled = false;
    btnRequest.textContent = '🎵 Pedir canción';
    btnRequest.classList.remove('locked');
  }

  if (totalSpent >= UNLOCK_DEDI) {
    btnDedi.disabled = false;
    btnDedi.textContent = '💜 Dedicar canción';
    btnDedi.classList.remove('locked');
  }
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

  document.getElementById('btnSendRequest').addEventListener('click', () => {
    const song = document.getElementById('inputSong').value.trim();
    if (!song) { showToast('Escribe el nombre de la canción'); return; }
    showToast(`🎵 Petición enviada: "${song}"`);
    document.getElementById('inputSong').value = '';
    closeModal('modalRequest');
  });

  document.getElementById('btnSendDedi').addEventListener('click', () => {
    const song = document.getElementById('inputDediSong').value.trim();
    const from = document.getElementById('inputDediFrom').value.trim();
    const to   = document.getElementById('inputDediTo').value.trim();
    if (!song || !from || !to) { showToast('Rellena los campos obligatorios'); return; }
    showToast(`💜 Dedicatoria enviada al DJ`);
    ['inputDediSong','inputDediFrom','inputDediTo','inputDediMsg'].forEach(id => {
      document.getElementById(id).value = '';
    });
    closeModal('modalDedi');
  });

  // Close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
}

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── Toast ─────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Banner (aviso grande tras confirmar pedido) ────────
const banner = document.getElementById('banner');
let bannerTimer;
function showBanner(msg) {
  banner.textContent = msg;
  banner.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => banner.classList.remove('show'), 5000);
}

// ── Start ─────────────────────────────────────────────
init();
