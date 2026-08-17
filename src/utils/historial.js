/**
 * historial.js — Utilidades para cálculo de historial de cocinado
 */

/**
 * Calcula cuántos días pasaron entre una fecha ISO (YYYY-MM-DD) y hoy.
 * @param {string} isoDate
 * @returns {number}
 */
function diasDesde(isoDate) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(isoDate + 'T00:00:00');
  const diff = hoy - fecha;
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/**
 * Genera el texto de historial para mostrar en la UI.
 * @param {object|null} entrada - historial[recipeId] o null
 * @returns {string}
 */
function textoHistorial(entrada) {
  if (!entrada) return '🍽️ Nunca la cocinaste antes';
  const dias = diasDesde(entrada.ultimaFecha);
  const veces = entrada.veces;
  let cuandoStr;
  if (dias === 0)      cuandoStr = 'hoy';
  else if (dias === 1) cuandoStr = 'hace 1 día';
  else                 cuandoStr = `hace ${dias} días`;

  return `🗓️ Cocinada ${veces} ${veces === 1 ? 'vez' : 'veces'} · última vez ${cuandoStr}`;
}

/**
 * Texto compacto para el historial en la lista de ajustes.
 * @param {object} entrada
 * @returns {string}
 */
function textoHistorialCorto(entrada) {
  const dias = diasDesde(entrada.ultimaFecha);
  const veces = entrada.veces;
  let cuandoStr;
  if (dias === 0)      cuandoStr = 'hoy';
  else if (dias === 1) cuandoStr = 'ayer';
  else                 cuandoStr = `${dias}d atrás`;
  return `${veces}x · ${cuandoStr}`;
}

window.Historial = { diasDesde, textoHistorial, textoHistorialCorto };
