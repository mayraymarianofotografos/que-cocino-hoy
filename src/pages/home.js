/**
 * home.js — Página principal / Home
 */

const HomePageModule = (() => {

  function getStockCounts() {
    const todos = Storage.getIngredientes();
    const disponibles = todos.filter(i =>
      i.esContable ? i.cantidad > 0 : i.disponible
    );
    return { total: todos.length, disponibles: disponibles.length };
  }

  function refreshCounter() {
    const numEl  = document.getElementById('stock-num');
    const totEl  = document.getElementById('stock-total');
    const lblEl  = document.getElementById('stock-label');
    if (!numEl || !totEl || !lblEl) return;
    const { total, disponibles } = getStockCounts();
    numEl.textContent  = disponibles;
    totEl.textContent  = total;
    const plural = disponibles === 1 ? 'ingrediente disponible' : 'ingredientes disponibles';
    lblEl.textContent  = `${plural} de ${total} en tu alacena`;
  }

  function render(container) {
    const { total, disponibles } = getStockCounts();
    const plural = disponibles === 1 ? 'ingrediente disponible' : 'ingredientes disponibles';
    const recetasCount = Storage.getRecetas().length;

    container.innerHTML = `
      <div id="page-home" class="page active">

        <div class="home-content">
          <!-- Branding -->
          <div class="home-brand">
            <span class="brand-emoji">🍳</span>
            <h1>¿Qué cocino hoy?</h1>
            <p class="brand-subtitle">Tu alacena · Tu receta · Ahora mismo</p>
          </div>

          <!-- Ticket principal -->
          <div class="home-ticket">
            <div class="ticket-top">
              <p class="ticket-title">Stock actual</p>
            </div>

            <!-- Contador -->
            <div class="stock-counter">
              <span class="stock-num" id="stock-num">${disponibles}</span>
              <span class="stock-sep">/</span>
              <span class="stock-total" id="stock-total">${total}</span>
            </div>
            <p class="stock-label" id="stock-label">${plural} de ${total} en tu alacena</p>

            <hr class="ticket-divider" />

            <!-- Botón sortear -->
            <button
              id="btn-sortear"
              class="btn-primary"
              ${recetasCount === 0 ? 'disabled' : ''}
              aria-label="Sortear receta con ingredientes disponibles"
            >
              🎲 SORTEAR RECETA
            </button>
            ${recetasCount === 0 ? `
              <p style="font-size:0.8rem;color:var(--text-secondary);margin-top:8px;text-align:center;">
                Agregá recetas desde "Mis recetas" para poder sortear.
              </p>
            ` : ''}
          </div>

          <!-- Quick links -->
          <div class="home-quick-links">
            <button class="quick-link-card" id="ql-ingredientes"
                    aria-label="Ir a Mis Ingredientes">
              <span class="ql-icon">🥕</span>
              <span class="ql-label">Stock</span>
              <span class="ql-title">Mis ingredientes</span>
            </button>
            <button class="quick-link-card" id="ql-recetas"
                    aria-label="Ir a Mis Recetas">
              <span class="ql-icon">📖</span>
              <span class="ql-label">${recetasCount} receta${recetasCount !== 1 ? 's' : ''}</span>
              <span class="ql-title">Mis recetas</span>
            </button>
            <button class="quick-link-card" id="ql-ajustes"
                    aria-label="Ir a Ajustes">
              <span class="ql-icon">⚙️</span>
              <span class="ql-label">Configuración</span>
              <span class="ql-title">Ajustes</span>
            </button>
          </div>
        </div>

        <!-- Bottom nav -->
        <nav class="bottom-nav" id="bottom-nav" aria-label="Navegación principal"></nav>
      </div>
    `;

    Components.renderBottomNav('home');

    document.getElementById('btn-sortear').addEventListener('click', () => {
      App.navigate('resultado');
    });

    document.getElementById('ql-ingredientes').addEventListener('click', () => {
      App.navigate('ingredientes');
    });
    document.getElementById('ql-recetas').addEventListener('click', () => {
      App.navigate('recetas');
    });
    document.getElementById('ql-ajustes').addEventListener('click', () => {
      App.navigate('ajustes');
    });
  }

  return { render, refreshCounter };
})();

window.HomePageModule = HomePageModule;
