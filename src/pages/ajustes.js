/**
 * ajustes.js — Pantalla de Ajustes
 */

const AjustesPageModule = (() => {

  function render(container) {
    const apiKey = Storage.getApiKey();
    const historial = Storage.getHistorial();
    const ingredientes = Storage.getIngredientes();

    // Estadísticas
    const totalRecetas   = Object.keys(historial).length;
    const totalCocinados = Object.values(historial).reduce((s, h) => s + h.veces, 0);
    const totalIng       = ingredientes.length;
    const dispIng        = ingredientes.filter(i => i.esContable ? i.cantidad > 0 : i.disponible).length;

    // Historial reciente (últimas 5 por fecha)
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

          <!-- API Key -->
          <div class="settings-card">
            <h2>API key de Spoonacular</h2>
            <p class="settings-desc">
              Necesitás una API key gratuita de
              <a href="https://spoonacular.com/food-api" target="_blank" rel="noopener">
                spoonacular.com/food-api
              </a>.
              El plan gratuito incluye 150 requests por día.
            </p>

            <div class="api-key-row">
              <input
                type="password"
                id="api-key-input"
                class="form-input"
                placeholder="Pegá tu API key aquí"
                value="${Components.escapeHtml(apiKey)}"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
              />
              <button class="btn-save-key" id="btn-save-key">Guardar</button>
            </div>

            <div class="api-key-status ${apiKey ? 'ok' : 'missing'}" id="key-status">
              <span class="status-dot"></span>
              <span id="key-status-text">
                ${apiKey
                  ? `API key configurada (${maskKey(apiKey)})`
                  : 'Sin API key — las recetas no están disponibles'}
              </span>
            </div>
          </div>

          <!-- Estadísticas -->
          <div class="info-card">
            <h3>📊 Tu historial</h3>
            <div class="stats-grid">
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
              <div class="stat-item">
                <span class="stat-num">${totalIng}</span>
                <span class="stat-label">ingredientes en la lista</span>
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
              <li>Marcá los ingredientes que tenés disponibles en "Mis ingredientes".</li>
              <li>Tocá "Sortear receta" en el inicio para obtener una receta al azar.</li>
              <li>Spoonacular busca recetas completas primero; si no hay, las que faltan 1–2 ingredientes.</li>
              <li>Al tocar "Cociné esto", el stock se actualiza y se registra en el historial.</li>
              <li>Los ingredientes nunca se eliminan; solo se reactivan desde la lista.</li>
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

    // Guardar API key
    document.getElementById('btn-save-key').addEventListener('click', () => {
      const val = document.getElementById('api-key-input').value.trim();
      Storage.setApiKey(val);
      updateKeyStatus(val);
      Components.showToast(val ? 'API key guardada ✓' : 'API key eliminada');
    });

    // Enter en el input guarda
    document.getElementById('api-key-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-save-key').click();
    });
  }

  function updateKeyStatus(key) {
    const statusEl   = document.getElementById('key-status');
    const statusText = document.getElementById('key-status-text');
    if (!statusEl) return;
    if (key) {
      statusEl.className = 'api-key-status ok';
      statusText.textContent = `API key configurada (${maskKey(key)})`;
    } else {
      statusEl.className = 'api-key-status missing';
      statusText.textContent = 'Sin API key — las recetas no están disponibles';
    }
  }

  /** Enmascara la key mostrando solo los últimos 4 chars */
  function maskKey(key) {
    if (key.length <= 4) return '****';
    return '•'.repeat(Math.min(key.length - 4, 8)) + key.slice(-4);
  }

  return { render };
})();

window.AjustesPageModule = AjustesPageModule;
