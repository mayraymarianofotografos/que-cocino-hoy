/**
 * ajustes.js — Pantalla de Ajustes
 */

const AjustesPageModule = (() => {

  function render(container) {
    const historial = Storage.getHistorial();
    const ingredientes = Storage.getIngredientes();
    const recetas = Storage.getRecetas();

    const totalRecetas   = Object.keys(historial).length;
    const totalCocinados = Object.values(historial).reduce((s, h) => s + h.veces, 0);
    const totalIng       = ingredientes.length;
    const dispIng        = ingredientes.filter(i => i.esContable ? i.cantidad > 0 : i.disponible).length;

    const histReciente = Object.values(historial)
      .sort((a, b) => b.ultimaFecha.localeCompare(a.ultimaFecha))
      .slice(0, 5);

    const histListHTML = histReciente.length === 0
      ? `<p class="historial-empty">Todavía no cocinaste ninguna receta.</p>`
      : histReciente.map(h => `
          <div class="historial-item">
            <span class="hi-name">${Components.escapeHtml(h.nombre)}</span>
            <span class="hi-meta">
              ${Historial.textoHistorialCorto(h)}
            </span>
          </div>
        `).join('');

    container.innerHTML = `
      <div id="page-ajustes" class="page active">

        <header class="page-header">
          <button class="btn-back" id="back-home-aj" aria-label="Volver al inicio">‹</button>
          <span class="header-emoji">⚙️</span>
          <h1>Ajustes</h1>
        </header>

        <div class="ajustes-content">

          <!-- Resumen -->
          <div class="info-card">
            <h3>📊 Tu resumen</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-num">${recetas.length}</span>
                <span class="stat-label">recetas cargadas</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">${totalRecetas}</span>
                <span class="stat-label">recetas distintas cocinadas</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">${totalCocinados}</span>
                <span class="stat-label">veces que cocinaste</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">${dispIng}</span>
                <span class="stat-label">ingredientes disponibles</span>
              </div>
            </div>
          </div>

          <!-- Historial reciente -->
          <div class="info-card">
            <h3>🕐 Últimas recetas cocinadas</h3>
            <div class="historial-list">
              ${histListHTML}
            </div>
          </div>

          <!-- Cómo funciona -->
          <div class="info-card">
            <h3>ℹ️ Cómo funciona</h3>
            <ul class="info-list">
              <li>Cargá tus recetas en "Mis recetas" con nombre, ingredientes y pasos.</li>
              <li>Marcá los ingredientes que tenés disponibles en "Mis ingredientes".</li>
              <li>Tocá "Sortear receta" en el inicio para obtener una receta al azar.</li>
              <li>La app busca recetas completas primero; si no hay, las que faltan 1–2 ingredientes.</li>
              <li>Al tocar "Cociné esto", el stock se actualiza y se registra en el historial.</li>
            </ul>
          </div>

        </div>

        <nav class="bottom-nav" id="bottom-nav" aria-label="Navegación principal"></nav>
      </div>
    `;

    Components.renderBottomNav('ajustes');

    document.getElementById('back-home-aj').addEventListener('click', () => {
      App.navigate('home');
    });
  }

  return { render };
})();

window.AjustesPageModule = AjustesPageModule;
