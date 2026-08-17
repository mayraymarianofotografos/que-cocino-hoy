/**
 * app.js — Router principal y punto de entrada de la aplicación.
 *
 * Arquitectura de "pantalla única":
 *   - Un solo #app div
 *   - Cada navigate() vacía el contenedor y renderiza la página pedida
 *   - No hay URLs ni History API (app offline/instalable)
 */

const App = (() => {

  const PAGES = {
    home:         HomePageModule,
    ingredientes: IngredientesPageModule,
    resultado:    ResultadoPageModule,
    ajustes:      AjustesPageModule,
  };

  let currentPage = null;

  function init() {
    // Quitar loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.remove();

    // Navegar a home al iniciar
    navigate('home');
  }

  function navigate(pageName) {
    const container = document.getElementById('app');
    if (!container) return;

    const module = PAGES[pageName];
    if (!module) {
      console.warn(`Página desconocida: ${pageName}`);
      return;
    }

    currentPage = pageName;
    container.innerHTML = '';
    module.render(container);

    // Scroll al tope
    window.scrollTo(0, 0);
  }

  function getCurrentPage() {
    return currentPage;
  }

  return { init, navigate, getCurrentPage };
})();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => App.init());

window.App = App;
