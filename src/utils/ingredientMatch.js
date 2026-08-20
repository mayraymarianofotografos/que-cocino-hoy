/**
 * ingredientMatch.js — Matching flexible en español entre nombres de
 * ingredientes de las recetas del usuario y su lista local de stock.
 *
 * Algoritmo:
 *   1. Normalizar ambos strings (minúsculas, sin tildes).
 *   2. Match exacto normalizado.
 *   3. Substring bidireccional con boundaries de palabra.
 */

/**
 * Busca un ingrediente local por el nombre de una receta.
 * @param {string} nombreReceta   - Nombre del ingrediente tal como aparece en la receta
 * @param {Array}  ingredientesLocales - Array de ingredientes del usuario
 * @returns {object|null} El ingrediente local encontrado o null
 */
function matchIngredient(nombreReceta, ingredientesLocales) {
  const norm = Storage.normalizeStr(nombreReceta);
  if (!norm) return null;

  // 1. Match exacto normalizado
  const exact = ingredientesLocales.find(
    i => Storage.normalizeStr(i.nombre) === norm
  );
  if (exact) return exact;

  // 2. Substring bidireccional con boundaries de palabra
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const sub = ingredientesLocales.find(i => {
    const localNorm = Storage.normalizeStr(i.nombre);
    const targetRegex = new RegExp(`\\b${escapeRegExp(norm)}\\b`, 'i');
    const localRegex = new RegExp(`\\b${escapeRegExp(localNorm)}\\b`, 'i');
    return targetRegex.test(localNorm) || localRegex.test(norm);
  });

  return sub || null;
}

/**
 * Parsea el texto de ingredientes de una receta (una línea por ingrediente).
 * @param {string} texto - Texto multilinea de ingredientes
 * @returns {string[]} Array de nombres de ingredientes limpios
 */
function parseIngredientesReceta(texto) {
  return (texto || '')
    .split('\n')
    .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(l => l.length > 0);
}

window.IngredientMatch = { matchIngredient, parseIngredientesReceta };
