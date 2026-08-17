/**
 * spoonacular.js — Capa de comunicación con la API de Spoonacular.
 * Todas las llamadas pasan por aquí. Centraliza manejo de errores.
 *
 * Endpoints usados:
 *   GET /recipes/findByIngredients  → buscar recetas por ingredientes
 *   GET /recipes/{id}/information   → detalle + instrucciones de una receta
 */

const SPOONACULAR_BASE = 'https://api.spoonacular.com';

/**
 * Errores mapeados desde códigos HTTP.
 */
const ERROR_MESSAGES = {
  401: 'Tu API key de Spoonacular no es válida. Verificala en Ajustes.',
  402: 'Llegaste al límite diario gratuito de Spoonacular (150 requests). Probá mañana.',
};

/**
 * Wrapper fetch con manejo centralizado de errores.
 * @throws {Error} con .message ya formateado para mostrar al usuario
 */
async function apiFetch(url) {
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('No se pudo conectar con Spoonacular. Revisá tu conexión a internet.');
  }

  if (!res.ok) {
    const msg = ERROR_MESSAGES[res.status]
      || `No se pudo conectar con Spoonacular. Revisá tu conexión. (Error ${res.status})`;
    throw new Error(msg);
  }

  return res.json();
}

/**
 * Busca recetas por ingredientes disponibles.
 *
 * @param {string[]} ingredienteNames - Nombres de ingredientes disponibles
 * @param {string}   apiKey
 * @returns {Promise<Array>} Array de recetas con usedIngredients, missedIngredients, etc.
 */
async function findByIngredients(ingredienteNames, apiKey) {
  const joined = ingredienteNames.join(',');
  const url = `${SPOONACULAR_BASE}/recipes/findByIngredients` +
    `?ingredients=${encodeURIComponent(joined)}` +
    `&number=8` +
    `&ranking=2` +
    `&ignorePantry=true` +
    `&apiKey=${encodeURIComponent(apiKey)}`;
  return apiFetch(url);
}

/**
 * Obtiene el detalle completo de una receta (incluye instrucciones).
 *
 * @param {number|string} recipeId
 * @param {string}        apiKey
 * @returns {Promise<object>} Objeto de información de la receta
 */
async function getRecipeInfo(recipeId, apiKey) {
  const url = `${SPOONACULAR_BASE}/recipes/${recipeId}/information` +
    `?includeNutrition=false` +
    `&apiKey=${encodeURIComponent(apiKey)}`;
  return apiFetch(url);
}

/**
 * Extrae las instrucciones de cocción del objeto de información de receta.
 * Prioriza instructions (HTML limpio), luego analyzedInstructions.
 *
 * @param {object} info - Respuesta de getRecipeInfo
 * @returns {string} Instrucciones como texto/HTML limpio
 */
function extractInstructions(info) {
  // Opción 1: campo instructions (puede ser HTML)
  if (info.instructions && info.instructions.trim()) {
    // Limpiar tags HTML
    const div = document.createElement('div');
    div.innerHTML = info.instructions;
    // Preservar párrafos como saltos de línea
    div.querySelectorAll('li').forEach(el => {
      el.textContent = '• ' + el.textContent.trim() + '\n';
    });
    div.querySelectorAll('p, br').forEach(el => {
      el.after('\n');
    });
    return div.textContent.trim() || div.innerText.trim();
  }

  // Opción 2: analyzedInstructions
  if (info.analyzedInstructions && info.analyzedInstructions.length > 0) {
    const steps = info.analyzedInstructions[0].steps || [];
    return steps
      .map(s => `${s.number}. ${s.step.trim()}`)
      .join('\n\n');
  }

  return 'No hay instrucciones disponibles para esta receta.';
}

/**
 * Lógica completa de sorteo:
 *  1. Llama a findByIngredients
 *  2. Clasifica en completas / casi completas
 *  3. Elige una al azar
 *  4. Llama a getRecipeInfo para las instrucciones
 *
 * @param {string[]} ingredienteNames
 * @param {string}   apiKey
 * @returns {Promise<{receta: object, info: object}|null>}
 *          null si no hay resultados válidos
 * @throws {Error} errores de red/API
 */
async function sortearReceta(ingredienteNames, apiKey) {
  const resultados = await findByIngredients(ingredienteNames, apiKey);

  if (!resultados || resultados.length === 0) return null;

  // Clasificar
  const completas     = resultados.filter(r => r.missedIngredientCount === 0);
  const casiCompletas = resultados.filter(r =>
    r.missedIngredientCount >= 1 && r.missedIngredientCount <= 2
  );

  let pool;
  if (completas.length > 0) {
    pool = completas;
  } else if (casiCompletas.length > 0) {
    pool = casiCompletas;
  } else {
    return null;
  }

  // Elegir al azar
  const receta = pool[Math.floor(Math.random() * pool.length)];

  // Segunda llamada: instrucciones
  const info = await getRecipeInfo(receta.id, apiKey);

  return { receta, info };
}

window.Spoonacular = {
  findByIngredients,
  getRecipeInfo,
  extractInstructions,
  sortearReceta,
};
