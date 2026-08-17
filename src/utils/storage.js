/**
 * storage.js — Capa de persistencia en localStorage
 * Expone funciones para leer y escribir los tres bloques de datos:
 *   - ingredientes (array)
 *   - historial (objeto)
 *   - config (objeto)
 */

const KEYS = {
  INGREDIENTES: 'qch_ingredientes',
  HISTORIAL:    'qch_historial',
  CONFIG:       'qch_config',
};

/* ---------- Utilidades ---------- */

/** Genera un UUID v4 simple */
function uid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/** Normaliza string: minúsculas, sin tildes, sin espacios extra */
function normalizeStr(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/* ---------- Seed inicial de ingredientes ----------
   Se aplica solo si localStorage está vacío.
   "Huevos" es el único con esContable: true al inicio,
   pero el modelo soporta más (campo genérico).
*/
function buildSeed() {
  return [
    { id: uid(), nombre: 'Huevos',            esContable: true,  disponible: true,  cantidad: 6 },
    { id: uid(), nombre: 'Harina',            esContable: false, disponible: true,  cantidad: 0 },
    { id: uid(), nombre: 'Aceite',            esContable: false, disponible: true,  cantidad: 0 },
    { id: uid(), nombre: 'Sal',               esContable: false, disponible: true,  cantidad: 0 },
    { id: uid(), nombre: 'Arroz',             esContable: false, disponible: true,  cantidad: 0 },
    { id: uid(), nombre: 'Fideos',            esContable: false, disponible: true,  cantidad: 0 },
    { id: uid(), nombre: 'Tomate triturado',  esContable: false, disponible: true,  cantidad: 0 },
    { id: uid(), nombre: 'Cebolla',           esContable: false, disponible: true,  cantidad: 0 },
    { id: uid(), nombre: 'Ajo',               esContable: false, disponible: true,  cantidad: 0 },
    { id: uid(), nombre: 'Papa',              esContable: false, disponible: true,  cantidad: 0 },
    { id: uid(), nombre: 'Zanahoria',         esContable: false, disponible: true,  cantidad: 0 },
    { id: uid(), nombre: 'Pollo',             esContable: false, disponible: false, cantidad: 0 },
    { id: uid(), nombre: 'Carne picada',      esContable: false, disponible: false, cantidad: 0 },
    { id: uid(), nombre: 'Queso rallado',     esContable: false, disponible: true,  cantidad: 0 },
    { id: uid(), nombre: 'Leche',             esContable: false, disponible: true,  cantidad: 0 },
    { id: uid(), nombre: 'Manteca',           esContable: false, disponible: false, cantidad: 0 },
    { id: uid(), nombre: 'Pan rallado',       esContable: false, disponible: false, cantidad: 0 },
    { id: uid(), nombre: 'Pimiento rojo',     esContable: false, disponible: false, cantidad: 0 },
    { id: uid(), nombre: 'Zapallo',           esContable: false, disponible: false, cantidad: 0 },
    { id: uid(), nombre: 'Lentejas',          esContable: false, disponible: false, cantidad: 0 },
    { id: uid(), nombre: 'Garbanzos',         esContable: false, disponible: false, cantidad: 0 },
    { id: uid(), nombre: 'Aceitunas',         esContable: false, disponible: false, cantidad: 0 },
    { id: uid(), nombre: 'Atún en lata',      esContable: false, disponible: false, cantidad: 0 },
    { id: uid(), nombre: 'Crema de leche',    esContable: false, disponible: false, cantidad: 0 },
    { id: uid(), nombre: 'Orégano',           esContable: false, disponible: true,  cantidad: 0 },
  ];
}

/* ---------- Ingredientes ---------- */

function getIngredientes() {
  const raw = localStorage.getItem(KEYS.INGREDIENTES);
  if (!raw) {
    // Primer uso: cargar seed
    const seed = buildSeed();
    setIngredientes(seed);
    return seed;
  }
  return JSON.parse(raw);
}

function setIngredientes(arr) {
  localStorage.setItem(KEYS.INGREDIENTES, JSON.stringify(arr));
}

function updateIngrediente(id, changes) {
  const arr = getIngredientes();
  const idx = arr.findIndex(i => i.id === id);
  if (idx === -1) return null;
  arr[idx] = { ...arr[idx], ...changes };
  setIngredientes(arr);
  return arr[idx];
}

function addIngrediente(nombre, esContable) {
  const arr = getIngredientes();
  // Verificar duplicados (case-insensitive, sin tildes)
  const normalizado = normalizeStr(nombre);
  const existe = arr.some(i => normalizeStr(i.nombre) === normalizado);
  if (existe) return { error: 'duplicado' };

  const nuevo = {
    id: uid(),
    nombre: nombre.trim(),
    esContable: !!esContable,
    disponible: true,
    cantidad: esContable ? 1 : 0,
  };
  arr.push(nuevo);
  setIngredientes(arr);
  return { ok: true, ingrediente: nuevo };
}

/** Lista de ingredientes actualmente disponibles para el sorteo */
function getIngredientesDisponibles() {
  return getIngredientes().filter(i =>
    i.esContable ? i.cantidad > 0 : i.disponible
  );
}

/* ---------- Historial ---------- */

function getHistorial() {
  const raw = localStorage.getItem(KEYS.HISTORIAL);
  return raw ? JSON.parse(raw) : {};
}

function setHistorial(obj) {
  localStorage.setItem(KEYS.HISTORIAL, JSON.stringify(obj));
}

function registrarCocinado(recipeId, nombre) {
  const h = getHistorial();
  const hoy = new Date().toISOString().slice(0, 10);
  if (h[recipeId]) {
    h[recipeId].veces += 1;
    h[recipeId].ultimaFecha = hoy;
  } else {
    h[recipeId] = { nombre, veces: 1, ultimaFecha: hoy };
  }
  setHistorial(h);
}

/* ---------- Config ---------- */

function getConfig() {
  const raw = localStorage.getItem(KEYS.CONFIG);
  return raw ? JSON.parse(raw) : { spoonacularApiKey: '63def8bd5b3a4e65ab55566c1aba46d0' };
}

function setConfig(obj) {
  localStorage.setItem(KEYS.CONFIG, JSON.stringify(obj));
}

function setApiKey(key) {
  const c = getConfig();
  c.spoonacularApiKey = (key || '').trim();
  setConfig(c);
}

function getApiKey() {
  return getConfig().spoonacularApiKey || '';
}

// Exponer globalmente
window.Storage = {
  getIngredientes,
  setIngredientes,
  updateIngrediente,
  addIngrediente,
  getIngredientesDisponibles,
  getHistorial,
  setHistorial,
  registrarCocinado,
  getConfig,
  setConfig,
  setApiKey,
  getApiKey,
  normalizeStr,
  uid,
};
