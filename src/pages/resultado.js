/**
 * resultado.js — Pantalla de resultado del sorteo
 *
 * Flujo:
 *  1. Al montar, parsea ingredientes de cada receta local
 *  2. Clasifica en completas / casi completas
 *  3. Elige una al azar
 *  4. Renderiza receta con ingredientes usados/faltantes y pasos
 */

const ResultadoPageModule = (() => {

  let _recetaActual = null;
  let _vistosEnSesion = [];
  let _sorteoRequestId = 0;

  function render(container) {
    container.innerHTML = `
      <div id="page-resultado" class="page active">
        <header class="page-header">
          <button class="btn-back" id="back-home-res" aria-label="Volver al inicio">‹</button>
          <span class="header-emoji">🎲</span>
          <h1>Tu receta de hoy</h1>
        </header>

        <div class="resultado-content" id="resultado-body">
        </div>
      </div>
    `;

    document.getElementById('back-home-res').addEventListener('click', () => {
      App.navigate('home');
    });

    iniciarSorteo();
  }

  function iniciarSorteo() {
    const body = document.getElementById('resultado-body');
    if (!body) return;

    const currentReqId = ++_sorteoRequestId;

    const recetas = Storage.getRecetas();
    const ingredientesDisp = Storage.getIngredientesDisponibles();

    if (recetas.length === 0) {
      if (currentReqId !== _sorteoRequestId) return;
      renderSinRecetas(body);
      return;
    }

    if (ingredientesDisp.length === 0) {
      if (currentReqId !== _sorteoRequestId) return;
      renderSinStock(body);
      return;
    }

    const analisis = analizarRecetas(recetas, ingredientesDisp);

    if (currentReqId !== _sorteoRequestId) return;

    const completas = analisis.filter(a => a.faltan === 0);
    const casiCompletas = analisis.filter(a => a.faltan >= 1 && a.faltan <= 2);

    if (completas.length === 0 && casiCompletas.length === 0) {
      renderSinResultados(body, ingredientesDisp);
      return;
    }

    // Ponderar: completas tienen 70% de peso, casi completas 30%
    const completasNoVistos = completas.filter(a => !_vistosEnSesion.includes(a.receta.id));
    const casiNoVistos = casiCompletas.filter(a => !_vistosEnSesion.includes(a.receta.id));

    let poolPonderado;
    if (completasNoVistos.length > 0 && casiNoVistos.length > 0) {
      poolPonderado = [
        ...completasNoVistos.map(a => ({ ...a, peso: 0.7 / completasNoVistos.length })),
        ...casiNoVistos.map(a => ({ ...a, peso: 0.3 / casiNoVistos.length })),
      ];
    } else if (completasNoVistos.length > 0) {
      poolPonderado = completasNoVistos.map(a => ({ ...a, peso: 1 / completasNoVistos.length }));
    } else {
      poolPonderado = casiNoVistos.map(a => ({ ...a, peso: 1 / casiNoVistos.length }));
    }

    // Si se vio todo, reiniciar
    if (poolPonderado.length === 0) {
      _vistosEnSesion = [];
      return iniciarSorteo();
    }

    // Seleccionar por peso
    const rand = Math.random();
    let acum = 0;
    let elegido = poolPonderado[0];
    for (const item of poolPonderado) {
      acum += item.peso;
      if (rand <= acum) { elegido = item; break; }
    }

    _vistosEnSesion.push(elegido.receta.id);
    _recetaActual = elegido;

    renderReceta(body, elegido);
  }

  /**
   * Analiza cada receta contra los ingredientes disponibles.
   */
  function analizarRecetas(recetas, ingredientesDisp) {
    return recetas.map(receta => {
      const nombres = IngredientMatch.parseIngredientesReceta(receta.ingredientes);
      const usados = [];
      const faltantes = [];

      nombres.forEach(nombre => {
        const match = IngredientMatch.matchIngredient(nombre, ingredientesDisp);
        if (match) {
          usados.push({ nombreReceta: nombre, ingredienteLocal: match });
        } else {
          faltantes.push({ nombreReceta: nombre });
        }
      });

      return { receta, usados, faltantes, faltan: faltantes.length };
    });
  }

  /* ---------- Render: receta encontrada ---------- */

  function renderReceta(body, analisis) {
    const { receta, usados, faltantes, faltan } = analisis;
    const historial = Storage.getHistorial();
    const entrada = historial[receta.id] || null;
    const textoHist = Historial.textoHistorial(entrada);

    const estaCompleta = faltan === 0;
    const selloClass = estaCompleta ? '' : 'falta-poco';
    const selloText = estaCompleta ? '✓ PARA HOY' : '⚠ FALTA POCO';

    const pasosArr = (receta.pasos || '')
      .split('\n')
      .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(l => l.length > 0);

    const pasosHTML = pasosArr
      .map(l => `<p>${Components.escapeHtml(l)}</p>`)
      .join('');

    const usedList = usados
      .map(u => `
        <div class="ing-list-item">
          <span class="ing-check ok">✓</span>
          <span>${Components.escapeHtml(u.nombreReceta)}</span>
        </div>`)
      .join('');

    const missedList = faltantes
      .map(f => `
        <div class="ing-list-item missing">
          <span class="ing-check miss">✗</span>
          <span>${Components.escapeHtml(f.nombreReceta)}</span>
        </div>`)
      .join('');

    const faltanteItems = faltantes
      .map(f => `<div class="falta-item">🛒 ${Components.escapeHtml(f.nombreReceta)}</div>`)
      .join('');

    const faltaSection = faltan > 0 ? `
      <div class="falta-section">
        <div class="falta-header" id="falta-toggle-btn" role="button" tabindex="0"
             aria-expanded="false">
          <span>🛒 Lo que falta (${faltan})</span>
          <span class="falta-toggle">▼</span>
        </div>
        <div class="falta-body" id="falta-body">
          ${faltanteItems}
        </div>
      </div>
    ` : '';

    const fotoEl = receta.imagenUrl
      ? `<img class="receta-foto" src="${Components.escapeHtml(receta.imagenUrl)}" alt="${Components.escapeHtml(receta.nombre)}"
             loading="lazy" onerror="this.parentNode.innerHTML='<div class=\\'receta-foto-placeholder\\'>🍽️</div>'" />`
      : `<div class="receta-foto-placeholder">🍽️</div>`;

    body.innerHTML = `
      <div class="receta-card">
        <div style="position:relative;">
          ${fotoEl}
          <div class="sello ${selloClass}">${selloText}</div>
        </div>
        <div class="receta-body">
          <h2 class="receta-nombre">${Components.escapeHtml(receta.nombre)}</h2>
          <p class="receta-historial">
            <span class="hist-icon"></span>
            ${textoHist}
          </p>

          <div class="receta-ingredientes">
            <h3>Ingredientes</h3>
            <div class="ing-list">
              ${usedList}
              ${missedList}
            </div>
          </div>

          <hr class="ticket-divider" />

          <div class="instrucciones-section">
            <h3>Preparación</h3>
            <div class="instrucciones-body">${pasosHTML}</div>
          </div>
        </div>
      </div>

      ${faltaSection}

      <div class="resultado-actions">
        <button class="btn-positive" id="btn-cocine">✓ Cociné esto</button>
        <button class="btn-secondary" id="btn-otra">🎲 Buscar otra</button>
      </div>
    `;

    const faltaBtn = document.getElementById('falta-toggle-btn');
    if (faltaBtn) {
      faltaBtn.addEventListener('click', () => {
        const bodyEl = document.getElementById('falta-body');
        const isOpen = bodyEl.classList.toggle('open');
        faltaBtn.classList.toggle('open', isOpen);
        faltaBtn.setAttribute('aria-expanded', isOpen);
      });
    }

    document.getElementById('btn-cocine').addEventListener('click', (e) => {
      e.target.disabled = true;
      registrarCocinado(analisis);
    });

    document.getElementById('btn-otra').addEventListener('click', () => {
      _recetaActual = null;
      iniciarSorteo();
    });
  }

  /* ---------- Acción: registrar cocinado ---------- */

  function registrarCocinado(analisis) {
    const { receta, usados } = analisis;

    usados.forEach(u => {
      const local = u.ingredienteLocal;
      if (!local) return;

      if (local.esContable) {
        const nuevaCantidad = Math.max(0, local.cantidad - 1);
        Storage.updateIngrediente(local.id, { cantidad: nuevaCantidad });
      } else {
        Storage.updateIngrediente(local.id, { disponible: false });
      }
    });

    Storage.registrarCocinado(String(receta.id), receta.nombre);
    Components.showToast('Stock actualizado ✓');
    setTimeout(() => App.navigate('home'), 1600);
  }

  /* ---------- Render: sin recetas ---------- */

  function renderSinRecetas(body) {
    body.innerHTML = `
      <div class="sin-resultados">
        <span class="sr-icon">📖</span>
        <h2>Sin recetas cargadas</h2>
        <p>Agregá recetas desde "Mis recetas" para poder sortear.</p>
        <button class="btn-secondary" id="btn-ir-recetas" style="margin-top:8px;width:auto;padding:12px 24px;">
          Ir a Mis recetas
        </button>
      </div>
    `;
    document.getElementById('btn-ir-recetas').addEventListener('click', () => {
      App.navigate('recetas');
    });
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

  /* ---------- Render: sin resultados ---------- */

  function renderSinResultados(body, ingredientesDisp) {
    const disponibles = ingredientesDisp.map(i => i.nombre).join(', ');
    body.innerHTML = `
      <div class="sin-resultados">
        <span class="sr-icon">🤷</span>
        <h2>No hay recetas disponibles</h2>
        <p>Ninguna de tus recetas es completa ni casi completa con los ingredientes que tenés: <strong>${Components.escapeHtml(disponibles)}</strong>.
           Probá agregar más ingredientes o cargar nuevas recetas.</p>
        <button class="btn-secondary" id="btn-volver-home" style="margin-top:8px;width:auto;padding:12px 24px;">
          Volver al inicio
        </button>
      </div>
    `;
    document.getElementById('btn-volver-home').addEventListener('click', () => {
      App.navigate('home');
    });
  }

  return { render };
})();

window.ResultadoPageModule = ResultadoPageModule;
