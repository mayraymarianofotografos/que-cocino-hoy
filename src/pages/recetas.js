/**
 * recetas.js — Pantalla de gestión de recetas
 *
 * Lista todas las recetas cargadas, permite agregar, editar y eliminar.
 */

const RecetasPageModule = (() => {

  function render(container) {
    const recetas = Storage.getRecetas();

    container.innerHTML = `
      <div id="page-recetas" class="page active">
        <header class="page-header">
          <button class="btn-back" id="back-home-rec" aria-label="Volver al inicio">‹</button>
          <span class="header-emoji">📖</span>
          <h1>Mis recetas</h1>
        </header>

        <div class="recetas-content">
          <div class="recetas-summary">
            <span>${recetas.length} receta${recetas.length !== 1 ? 's' : ''} cargada${recetas.length !== 1 ? 's' : ''}</span>
          </div>

          <div id="recetas-list" class="recetas-list">
            ${renderRecetasList(recetas)}
          </div>

          <button class="btn-primary" id="btn-add-receta" style="margin:16px 0;width:100%;">
            + Agregar receta
          </button>
        </div>

        <nav class="bottom-nav" id="bottom-nav" aria-label="Navegación principal"></nav>
      </div>
    `;

    Components.renderBottomNav('');

    document.getElementById('back-home-rec').addEventListener('click', () => {
      App.navigate('home');
    });

    document.getElementById('btn-add-receta').addEventListener('click', () => {
      openRecetaForm();
    });

    attachListEvents();
  }

  function renderRecetasList(recetas) {
    if (recetas.length === 0) {
      return `
        <div class="sin-resultados" style="padding:32px 0;">
          <span class="sr-icon">📖</span>
          <h2>Sin recetas</h2>
          <p>Agregá tu primera receta para poder sortear.</p>
        </div>
      `;
    }

    return recetas.map(r => {
      const ingredientesArr = IngredientMatch.parseIngredientesReceta(r.ingredientes);
      const preview = ingredientesArr.slice(0, 3).join(', ');
      const extra = ingredientesArr.length > 3 ? ` +${ingredientesArr.length - 3} más` : '';

      return `
        <div class="receta-item" data-id="${r.id}">
          <div class="receta-item-body">
            <div class="receta-item-info">
              <h3 class="receta-item-nombre">${Components.escapeHtml(r.nombre)}</h3>
              <p class="receta-item-preview">${Components.escapeHtml(preview)}${extra}</p>
            </div>
            <div class="receta-item-actions">
              <button class="receta-action-btn edit-btn" data-id="${r.id}" aria-label="Editar receta">✏️</button>
              <button class="receta-action-btn delete-btn" data-id="${r.id}" aria-label="Eliminar receta">🗑️</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function attachListEvents() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const receta = Storage.getRecetas().find(r => r.id === id);
        if (receta) openRecetaForm(receta);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        confirmDelete(id);
      });
    });
  }

  function refreshList() {
    const listEl = document.getElementById('recetas-list');
    if (!listEl) return;
    const recetas = Storage.getRecetas();
    listEl.innerHTML = renderRecetasList(recetas);
    attachListEvents();

    const summaryEl = document.querySelector('.recetas-summary span');
    if (summaryEl) {
      summaryEl.textContent = `${recetas.length} receta${recetas.length !== 1 ? 's' : ''} cargada${recetas.length !== 1 ? 's' : ''}`;
    }
  }

  /* ---------- Formulario agregar/editar ---------- */

  function openRecetaForm(recetaExistente) {
    const esEdicion = !!recetaExistente;
    const titulo = esEdicion ? 'Editar receta' : 'Nueva receta';

    let overlay = document.getElementById('receta-form-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'receta-form-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-sheet modal-sheet-lg" role="dialog" aria-modal="true"
           aria-labelledby="rf-title">
        <div class="modal-handle"></div>
        <h2 class="modal-title" id="rf-title">${titulo}</h2>

        <div class="form-group">
          <label class="form-label" for="rf-nombre">Nombre de la receta</label>
          <input type="text" id="rf-nombre" class="form-input"
                 placeholder="Ej: Tortilla de papas"
                 value="${esEdicion ? Components.escapeHtml(recetaExistente.nombre) : ''}"
                 maxlength="80" autocomplete="off" autocapitalize="words" />
        </div>

        <div class="form-group">
          <label class="form-label" for="rf-ingredientes">Ingredientes <small>(uno por línea)</small></label>
          <textarea id="rf-ingredientes" class="form-textarea" rows="5"
                    placeholder="4 huevos\n2 papas medianas\nAceite\nSal"
          >${esEdicion ? Components.escapeHtml(recetaExistente.ingredientes) : ''}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="rf-pasos">Preparación <small>(uno por línea)</small></label>
          <textarea id="rf-pasos" class="form-textarea" rows="6"
                    placeholder="1. Pelar las papas...\n2. Cortar en rodajas..."
          >${esEdicion ? Components.escapeHtml(recetaExistente.pasos) : ''}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="rf-imagen">URL de imagen <small>(opcional)</small></label>
          <input type="url" id="rf-imagen" class="form-input"
                 placeholder="https://..."
                 value="${esEdicion ? Components.escapeHtml(recetaExistente.imagenUrl || '') : ''}"
                 autocomplete="off" />
        </div>

        <p class="form-error" id="rf-error">Completá nombre, ingredientes y preparación.</p>

        <div style="display:flex;gap:10px;margin-top:12px;">
          <button class="btn-secondary" id="rf-cancel" style="flex:1;">Cancelar</button>
          <button class="btn-primary" id="rf-save" style="flex:2;">${esEdicion ? 'Guardar' : 'Agregar'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    const errEl = overlay.querySelector('#rf-error');

    function close() {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
    }

    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('#rf-cancel').addEventListener('click', close);

    overlay.querySelector('#rf-save').addEventListener('click', () => {
      const nombre = overlay.querySelector('#rf-nombre').value.trim();
      const ingredientes = overlay.querySelector('#rf-ingredientes').value.trim();
      const pasos = overlay.querySelector('#rf-pasos').value.trim();
      const imagenUrl = overlay.querySelector('#rf-imagen').value.trim();

      if (!nombre || !ingredientes || !pasos) {
        errEl.classList.add('visible');
        return;
      }

      if (esEdicion) {
        Storage.updateReceta(recetaExistente.id, { nombre, ingredientes, pasos, imagenUrl });
        Components.showToast('Receta actualizada ✓');
      } else {
        Storage.addReceta(nombre, ingredientes, pasos, imagenUrl);
        Components.showToast('Receta agregada ✓');
      }

      close();
      refreshList();
    });
  }

  /* ---------- Confirmar eliminación ---------- */

  function confirmDelete(id) {
    const receta = Storage.getRecetas().find(r => r.id === id);
    if (!receta) return;

    let overlay = document.getElementById('receta-delete-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'receta-delete-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-sheet" role="dialog" aria-modal="true">
        <div class="modal-handle"></div>
        <h2 class="modal-title">Eliminar receta</h2>
        <p style="margin:12px 0;color:var(--text-secondary);">
          ¿Seguro que querés eliminar <strong>${Components.escapeHtml(receta.nombre)}</strong>?
        </p>
        <div style="display:flex;gap:10px;margin-top:12px;">
          <button class="btn-secondary" id="del-cancel" style="flex:1;">Cancelar</button>
          <button class="btn-danger" id="del-confirm" style="flex:1;">Eliminar</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    function close() {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
    }

    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('#del-cancel').addEventListener('click', close);
    overlay.querySelector('#del-confirm').addEventListener('click', () => {
      Storage.deleteReceta(id);
      Components.showToast('Receta eliminada');
      close();
      refreshList();
    });
  }

  return { render };
})();

window.RecetasPageModule = RecetasPageModule;
