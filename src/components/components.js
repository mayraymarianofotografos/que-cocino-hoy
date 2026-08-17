/**
 * components.js — Componentes reutilizables de la UI
 * Helpers para crear elementos HTML dinámicos.
 */

/* ============================================================
   BOTTOM NAV
   ============================================================ */
function renderBottomNav(activePage) {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;

  nav.innerHTML = `
    <button class="nav-item ${activePage === 'home' ? 'active' : ''}"
            id="nav-home" aria-label="Inicio">
      <span class="nav-icon">🏠</span>
      <span>Inicio</span>
    </button>
    <button class="nav-item ${activePage === 'ingredientes' ? 'active' : ''}"
            id="nav-ingredientes" aria-label="Mis ingredientes">
      <span class="nav-icon">🥕</span>
      <span>Stock</span>
    </button>
    <button class="nav-item ${activePage === 'ajustes' ? 'active' : ''}"
            id="nav-ajustes" aria-label="Ajustes">
      <span class="nav-icon">⚙️</span>
      <span>Ajustes</span>
    </button>
  `;

  nav.querySelector('#nav-home').addEventListener('click', () => App.navigate('home'));
  nav.querySelector('#nav-ingredientes').addEventListener('click', () => App.navigate('ingredientes'));
  nav.querySelector('#nav-ajustes').addEventListener('click', () => App.navigate('ajustes'));
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg, duration = 2500) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), duration);
}

/* ============================================================
   MODAL — Agregar Ingrediente
   ============================================================ */
function openAddIngredientModal(onAdd) {
  // Crear overlay si no existe
  let overlay = document.getElementById('add-modal-overlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.id = 'add-modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet" role="dialog" aria-modal="true"
         aria-labelledby="modal-title">
      <div class="modal-handle"></div>
      <h2 class="modal-title" id="modal-title">Agregar ingrediente</h2>

      <div class="form-group">
        <label class="form-label" for="ing-nombre-input">Nombre</label>
        <input
          type="text"
          id="ing-nombre-input"
          class="form-input"
          placeholder="Ej: Zapallo, Panceta, Arroz..."
          maxlength="60"
          autocomplete="off"
          autocapitalize="words"
        />
        <p class="form-error" id="ing-error">Ya existe un ingrediente con ese nombre.</p>
      </div>

      <div class="form-group">
        <div class="checkbox-row">
          <input type="checkbox" id="ing-contable-check" />
          <label for="ing-contable-check">
            ¿Se cuenta por cantidad?
            <small>Activalo si querés llevar un número exacto (como Huevos).</small>
          </label>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:8px;">
        <button class="btn-secondary" id="modal-cancel" style="flex:1;">Cancelar</button>
        <button class="btn-primary" id="modal-confirm" style="flex:2;">Agregar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Animar entrada
  requestAnimationFrame(() => overlay.classList.add('open'));

  const input    = overlay.querySelector('#ing-nombre-input');
  const errEl    = overlay.querySelector('#ing-error');
  const checkEl  = overlay.querySelector('#ing-contable-check');
  const btnConf  = overlay.querySelector('#modal-confirm');
  const btnCan   = overlay.querySelector('#modal-cancel');

  function close() {
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 300);
  }

  // Cerrar al tocar el fondo
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  btnCan.addEventListener('click', close);

  input.focus();

  btnConf.addEventListener('click', () => {
    const nombre = input.value.trim();
    if (!nombre) { input.focus(); return; }

    const result = Storage.addIngrediente(nombre, checkEl.checked);
    if (result.error === 'duplicado') {
      errEl.classList.add('visible');
      input.select();
      return;
    }
    close();
    onAdd(result.ingrediente);
  });

  // Enter confirma
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') btnConf.click();
    errEl.classList.remove('visible');
  });
}

/* ============================================================
   INGREDIENTE ROW — fábrica de elementos
   ============================================================ */
function createIngredienteRow(ing) {
  const row = document.createElement('div');
  row.className = `ingrediente-row${isAgotado(ing) ? ' agotado' : ''}`;
  row.dataset.id = ing.id;

  // Emoji según categoría aproximada
  const emoji = getIngredienteEmoji(ing.nombre);

  if (ing.esContable) {
    row.innerHTML = `
      <span class="ing-icon">${emoji}</span>
      <span class="ing-name">${escapeHtml(ing.nombre)}</span>
      <div class="stepper">
        <button class="stepper-btn" data-action="minus" aria-label="Restar uno"
                ${ing.cantidad <= 0 ? 'disabled' : ''}>−</button>
        <span class="stepper-count">${ing.cantidad}</span>
        <button class="stepper-btn" data-action="plus" aria-label="Sumar uno">+</button>
      </div>
    `;

    row.querySelector('[data-action="minus"]').addEventListener('click', e => {
      e.stopPropagation();
      const updated = Storage.updateIngrediente(ing.id, {
        cantidad: Math.max(0, ing.cantidad - 1)
      });
      ing.cantidad = updated.cantidad;
      refreshRow(row, ing);
    });

    row.querySelector('[data-action="plus"]').addEventListener('click', e => {
      e.stopPropagation();
      const updated = Storage.updateIngrediente(ing.id, {
        cantidad: ing.cantidad + 1
      });
      ing.cantidad = updated.cantidad;
      refreshRow(row, ing);
    });

  } else {
    row.innerHTML = `
      <span class="ing-icon">${emoji}</span>
      <span class="ing-name">${escapeHtml(ing.nombre)}</span>
      <span class="ing-status" aria-hidden="true">
        ${ing.disponible ? '✅' : '⬜'}
      </span>
    `;

    // Toggle al tocar
    row.addEventListener('click', () => {
      const updated = Storage.updateIngrediente(ing.id, {
        disponible: !ing.disponible
      });
      ing.disponible = updated.disponible;
      refreshRow(row, ing);
    });
    row.style.cursor = 'pointer';
    row.setAttribute('role', 'switch');
    row.setAttribute('aria-checked', ing.disponible ? 'true' : 'false');
  }

  return row;
}

function refreshRow(row, ing) {
  const agotado = isAgotado(ing);
  row.classList.toggle('agotado', agotado);

  if (ing.esContable) {
    row.querySelector('.stepper-count').textContent = ing.cantidad;
    row.querySelector('[data-action="minus"]').disabled = ing.cantidad <= 0;
  } else {
    row.querySelector('.ing-status').textContent = ing.disponible ? '✅' : '⬜';
    row.setAttribute('aria-checked', ing.disponible ? 'true' : 'false');
  }

  // Actualizar home counter si está activo
  if (typeof HomePageModule !== 'undefined') HomePageModule.refreshCounter();
}

function isAgotado(ing) {
  return ing.esContable ? ing.cantidad === 0 : !ing.disponible;
}

/* ---------- Emoji helper ---------- */
const EMOJI_MAP = {
  huevo: '🥚', harina: '🌾', aceite: '🫙', sal: '🧂', arroz: '🍚',
  fideo: '🍝', pasta: '🍝', tomate: '🍅', cebolla: '🧅', ajo: '🧄',
  papa: '🥔', zanahoria: '🥕', pollo: '🍗', carne: '🥩', queso: '🧀',
  leche: '🥛', manteca: '🧈', pan: '🍞', pimiento: '🫑', zapallo: '🎃',
  lenteja: '🫘', garbanzo: '🫘', aceituna: '🫒', atun: '🐟', crema: '🥛',
  oregano: '🌿', default: '🥄'
};

function getIngredienteEmoji(nombre) {
  const n = Storage.normalizeStr(nombre);
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (n.includes(key)) return emoji;
  }
  return EMOJI_MAP.default;
}

/* ---------- Escape HTML ---------- */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Exponer globalmente ---------- */
window.Components = {
  renderBottomNav,
  showToast,
  openAddIngredientModal,
  createIngredienteRow,
  getIngredienteEmoji,
  escapeHtml,
};
