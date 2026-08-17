/**
 * ingredientes.js — Pantalla "Mis ingredientes"
 */

const IngredientesPageModule = (() => {

  function render(container) {
    container.innerHTML = `
      <div id="page-ingredientes" class="page active">

        <header class="page-header">
          <button class="btn-back" id="back-home" aria-label="Volver al inicio">‹</button>
          <span class="header-emoji">🥕</span>
          <h1>Mis ingredientes</h1>
        </header>

        <div class="ingredientes-content" id="ing-list-container">
          <!-- Rows inyectadas por JS -->
        </div>

        <nav class="bottom-nav" id="bottom-nav" aria-label="Navegación principal"></nav>
      </div>
    `;

    Components.renderBottomNav('ingredientes');

    document.getElementById('back-home').addEventListener('click', () => {
      App.navigate('home');
    });

    renderList();
  }

  function renderList() {
    const container = document.getElementById('ing-list-container');
    if (!container) return;

    const ingredientes = Storage.getIngredientes();
    container.innerHTML = '';

    // Separar disponibles y agotados
    const disponibles = ingredientes.filter(i => i.esContable ? i.cantidad > 0 : i.disponible);
    const agotados    = ingredientes.filter(i => i.esContable ? i.cantidad === 0 : !i.disponible);

    // -- Sección Disponibles --
    if (disponibles.length > 0) {
      const header = document.createElement('div');
      header.className = 'section-header';
      header.innerHTML = `
        <span class="section-title">✅ Disponibles</span>
        <span class="section-count">${disponibles.length}</span>
      `;
      container.appendChild(header);

      disponibles.forEach(ing => {
        container.appendChild(Components.createIngredienteRow(ing));
      });
    }

    // -- Sección Agotados --
    if (agotados.length > 0) {
      const header = document.createElement('div');
      header.className = 'section-header';
      header.style.marginTop = '16px';
      header.innerHTML = `
        <span class="section-title">⬜ Sin stock</span>
        <span class="section-count">${agotados.length}</span>
      `;
      container.appendChild(header);

      agotados.forEach(ing => {
        container.appendChild(Components.createIngredienteRow(ing));
      });
    }

    // -- Botón agregar --
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add-ingredient';
    addBtn.style.marginTop = '16px';
    addBtn.id = 'btn-add-ing';
    addBtn.innerHTML = `<span class="plus-icon">＋</span> Agregar ingrediente`;
    addBtn.addEventListener('click', () => {
      Components.openAddIngredientModal((nuevoIng) => {
        Components.showToast(`"${nuevoIng.nombre}" agregado ✓`);
        renderList(); // re-render la lista
        if (typeof HomePageModule !== 'undefined') HomePageModule.refreshCounter();
      });
    });
    container.appendChild(addBtn);
  }

  return { render, renderList };
})();

window.IngredientesPageModule = IngredientesPageModule;
