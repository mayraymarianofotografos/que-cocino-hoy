/**
 * resultado.js — Pantalla de resultado del sorteo
 *
 * Flujo:
 *  1. Al montar, muestra loading skeleton
 *  2. Llama a Spoonacular.sortearReceta()
 *  3. Si hay resultado → muestra receta completa
 *  4. Si no hay resultado → muestra mensaje "sin stock"
 *  5. Si hay error → muestra panel de error
 */

const ResultadoPageModule = (() => {

  // Estado local de esta pantalla (se resetea en cada navigate)
  let _receta = null;
  let _info   = null;

  function render(container) {
    container.innerHTML = `
      <div id="page-resultado" class="page active">
        <header class="page-header">
          <button class="btn-back" id="back-home-res" aria-label="Volver al inicio">‹</button>
          <span class="header-emoji">🎲</span>
          <h1>Tu receta de hoy</h1>
        </header>

        <div class="resultado-content" id="resultado-body">
          <!-- contenido dinámico -->
        </div>
      </div>
    `;

    document.getElementById('back-home-res').addEventListener('click', () => {
      App.navigate('home');
    });

    iniciarSorteo();
  }

  async function iniciarSorteo() {
    const body = document.getElementById('resultado-body');
    if (!body) return;

    // Loading
    body.innerHTML = `
      <div class="loading-result">
        <div class="spinner"></div>
        <p>Buscando recetas...</p>
      </div>
    `;

    const apiKey = Storage.getApiKey();
    const ingredientesDisp = Storage.getIngredientesDisponibles();

    if (ingredientesDisp.length === 0) {
      renderSinStock(body);
      return;
    }

    const nombres = ingredientesDisp.map(i => i.nombre);

    try {
      const resultado = await Spoonacular.sortearReceta(nombres, apiKey);

      if (!resultado) {
        renderSinResultados(body);
        return;
      }

      _receta = resultado.receta;
      _info   = resultado.info;

      renderReceta(body, _receta, _info);

    } catch (err) {
      renderError(body, err.message);
    }
  }

  /* ---------- Render: receta encontrada ---------- */
  function renderReceta(body, receta, info) {
    const historial   = Storage.getHistorial();
    const entrada     = historial[receta.id] || null;
    const textoHist   = Historial.textoHistorial(entrada);

    const estaCompleta  = receta.missedIngredientCount === 0;
    const selloClass    = estaCompleta ? '' : 'falta-poco';
    const selloText     = estaCompleta ? '✓ PARA HOY' : '⚠ FALTA POCO';

    const instrucciones = Spoonacular.extractInstructions(info);
    const instrHTML     = instrucciones
      .split('\n')
      .filter(l => l.trim())
      .map(l => `<p>${Components.escapeHtml(l)}</p>`)
      .join('');

    const usedList = (receta.usedIngredients || [])
      .map(i => `
        <div class="ing-list-item">
          <span class="ing-check ok">✓</span>
          <span>${Components.escapeHtml(i.name)}</span>
        </div>`)
      .join('');

    const missedList = (receta.missedIngredients || [])
      .map(i => `
        <div class="ing-list-item missing">
          <span class="ing-check miss">✗</span>
          <span>${Components.escapeHtml(i.name)}</span>
        </div>`)
      .join('');

    // Sección "ir a comprar"
    const faltanteItems = (receta.missedIngredients || [])
      .map(i => `<div class="falta-item">🛒 ${Components.escapeHtml(i.name)}</div>`)
      .join('');

    const faltaSection = receta.missedIngredientCount > 0 ? `
      <div class="falta-section">
        <div class="falta-header" id="falta-toggle-btn" role="button" tabindex="0"
             aria-expanded="false">
          <span>🛒 Lo que falta (${receta.missedIngredientCount})</span>
          <span class="falta-toggle">▼</span>
        </div>
        <div class="falta-body" id="falta-body">
          ${faltanteItems}
        </div>
      </div>
    ` : '';

    const fotoEl = info.image
      ? `<img class="receta-foto" src="${info.image}" alt="${Components.escapeHtml(info.title)}"
             loading="lazy" onerror="this.parentNode.innerHTML='<div class=\\'receta-foto-placeholder\\'>🍽️</div>'" />`
      : `<div class="receta-foto-placeholder">🍽️</div>`;

    body.innerHTML = `
      <!-- Receta card -->
      <div class="receta-card">
        <div style="position:relative;">
          ${fotoEl}
          <div class="sello ${selloClass}">${selloText}</div>
        </div>
        <div class="receta-body">
          <h2 class="receta-nombre">${Components.escapeHtml(info.title || receta.title)}</h2>
          <p class="receta-historial">
            <span class="hist-icon"></span>
            ${textoHist}
          </p>

          <!-- Ingredientes -->
          <div class="receta-ingredientes">
            <h3>Ingredientes</h3>
            <div class="ing-list">
              ${usedList}
              ${missedList}
            </div>
          </div>

          <hr class="ticket-divider" />

          <!-- Instrucciones -->
          <div class="instrucciones-section">
            <h3>Preparación</h3>
            <div class="instrucciones-body">${instrHTML}</div>
          </div>
        </div>
      </div>

      <!-- Falta section -->
      ${faltaSection}

      <!-- Acciones -->
      <div class="resultado-actions">
        <button class="btn-positive" id="btn-cocine">✓ Cociné esto</button>
        <button class="btn-secondary" id="btn-otra">🎲 Buscar otra</button>
      </div>
    `;

    // Toggle "lo que falta"
    const faltaBtn = document.getElementById('falta-toggle-btn');
    if (faltaBtn) {
      faltaBtn.addEventListener('click', () => {
        const bodyEl   = document.getElementById('falta-body');
        const isOpen   = bodyEl.classList.toggle('open');
        faltaBtn.classList.toggle('open', isOpen);
        faltaBtn.setAttribute('aria-expanded', isOpen);
      });
    }

    // "Cociné esto"
    document.getElementById('btn-cocine').addEventListener('click', () => {
      registrarCocinado(receta, info);
    });

    // "Buscar otra"
    document.getElementById('btn-otra').addEventListener('click', () => {
      _receta = null;
      _info   = null;
      iniciarSorteo();
    });
  }

  /* ---------- Acción: registrar cocinado ---------- */
  function registrarCocinado(receta, info) {
    const usedIngredients = receta.usedIngredients || [];
    const ingredientesLocales = Storage.getIngredientes();

    const cambios = [];

    usedIngredients.forEach(spoonIng => {
      const local = IngredientMatch.matchIngredient(spoonIng.name, ingredientesLocales);
      if (!local) return; // sin match → no romper nada

      if (local.esContable) {
        // Restar cantidad (mínimo 0, redondeado arriba, al menos 1)
        const restar = Math.max(1, Math.ceil(spoonIng.amount || 1));
        const nuevaCantidad = Math.max(0, local.cantidad - restar);
        Storage.updateIngrediente(local.id, { cantidad: nuevaCantidad });
        cambios.push({ ...local, cantidad: nuevaCantidad });
      } else {
        // Marcar como no disponible
        Storage.updateIngrediente(local.id, { disponible: false });
        cambios.push({ ...local, disponible: false });
      }
    });

    // Registrar en historial
    const nombreReceta = info.title || receta.title;
    Storage.registrarCocinado(String(receta.id), nombreReceta);

    Components.showToast('Stock actualizado ✓');

    // Volver a home después de un momento
    setTimeout(() => App.navigate('home'), 1600);
  }

  /* ---------- Render: sin stock ---------- */
  function renderSinStock(body) {
    body.innerHTML = `
      <div class="sin-resultados">
        <span class="sr-icon">🫙</span>
        <h2>Alacena vacía</h2>
        <p>No tenés ingredientes disponibles en este momento.<br>
           Activá algunos en "Mis ingredientes" para poder sortear.</p>
        <button class="btn-secondary" id="btn-ir-ing" style="margin-top:8px;width:auto;padding:12px 24px;">
          Ir a Mis ingredientes
        </button>
      </div>
    `;
    document.getElementById('btn-ir-ing').addEventListener('click', () => {
      App.navigate('ingredientes');
    });
  }

  /* ---------- Render: sin resultados de API ---------- */
  function renderSinResultados(body) {
    body.innerHTML = `
      <div class="sin-resultados">
        <span class="sr-icon">🤷</span>
        <h2>No hay recetas disponibles</h2>
        <p>Spoonacular no encontró ninguna receta completa ni casi completa con tu stock actual.
           Probá agregar más ingredientes o activar los que tenés agotados.</p>
        <button class="btn-secondary" id="btn-volver-home" style="margin-top:8px;width:auto;padding:12px 24px;">
          Volver al inicio
        </button>
      </div>
    `;
    document.getElementById('btn-volver-home').addEventListener('click', () => {
      App.navigate('home');
    });
  }

  /* ---------- Render: error de API ---------- */
  function renderError(body, mensaje) {
    body.innerHTML = `
      <div class="error-panel">
        <span class="ep-icon">⚠️</span>
        <h3>Algo salió mal</h3>
        <p>${Components.escapeHtml(mensaje)}</p>
        <button class="btn-secondary" id="btn-volver-error" style="margin-top:4px;width:auto;padding:12px 24px;">
          Volver al inicio
        </button>
      </div>
    `;
    document.getElementById('btn-volver-error').addEventListener('click', () => {
      App.navigate('home');
    });
  }

  return { render };
})();

window.ResultadoPageModule = ResultadoPageModule;
