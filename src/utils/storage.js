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
  RECETAS:      'qch_recetas',
};

/* ---------- Utilidades ---------- */

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function getLocalISODate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
  const parsed = safeParse(raw, null);
  if (!parsed || !Array.isArray(parsed)) {
    // Primer uso o data corrupta: cargar seed
    const seed = buildSeed();
    setIngredientes(seed);
    return seed;
  }
  return parsed;
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
  return safeParse(raw, {});
}

function setHistorial(obj) {
  localStorage.setItem(KEYS.HISTORIAL, JSON.stringify(obj));
}

function registrarCocinado(recipeId, nombre) {
  const h = getHistorial();
  const hoy = getLocalISODate();
  if (h[recipeId]) {
    h[recipeId].veces += 1;
    h[recipeId].ultimaFecha = hoy;
  } else {
    h[recipeId] = { nombre, veces: 1, ultimaFecha: hoy };
  }
  setHistorial(h);
}

/* ---------- Recetas ---------- */

function buildRecetasSeed() {
  return [
    {
      id: uid(),
      nombre: 'Tortilla de papas',
      ingredientes: '4 huevos\n2 papas medianas\nAceite\nSal',
      pasos: '1. Pelá y cortá las papas en rodajas finas.\n2. Fríelas en abundante aceite hasta que estén doradas. Retirá y escurrí.\n3. Batí los huevos con sal en un bowl grande.\n4. Agregá las papas frías y mezclá.\n5. En una sartén con aceite, volcá la mezcla y cociná a fuego bajo.\n6. Cuando esté cuajada de un lado, dale la vuelta con un plato.\n7. Cociná el otro lado y serví.',
      imagenUrl: '',
    },
    {
      id: uid(),
      nombre: 'Fideos con tuco',
      ingredientes: '250g fideos\n1 lata de tomate triturado\n1 cebolla\n2 dientes de ajo\nAceite\nSal\nOrégano',
      pasos: '1. Herví agua con sal y cociná los fideos al dente. Escurrí.\n2. Mientras tanto, picá la cebolla y el ajo bien chiquitos.\n3. Sofreí en aceite hasta que estén dorados.\n4. Agregá el tomate triturado, sal y orégano.\n5. Cociná 10 minutos a fuego bajo.\n6. Serví el tuco sobre los fideos.',
      imagenUrl: '',
    },
    {
      id: uid(),
      nombre: 'Ensalada mixta',
      ingredientes: '1 lechuga\n2 tomates\n1 cebolla\nAceitunas\nAceite\nSal\nOrégano',
      pasos: '1. LAVÁ y cortá la lechuga en trozos.\n2. Cortá los tomates en gajos.\n3. Cortá la cebolla en aros finos.\n4. Mezclá todo en un bowl.\n5. Agregá aceitunas, aceite, sal y orégano.\n6. Mezclá y serví.',
      imagenUrl: '',
    },
    {
      id: uid(),
      nombre: 'Pollo al horno',
      ingredientes: '4 muslos de pollo\nAceite\nSal\nPimentón\nAjo en polvo\nPapas (opcional)',
      pasos: '1. Precalentá el horno a 200°C.\n2. Engrasá una bandeja para horno.\n3. Secá los muslos con papel y sazoná con sal, pimentón y ajo en polvo.\n4. Pintalos con aceite.\n5. Si querés, agregá papas cortadas alrededor.\n6. Horneá 40-45 minutos hasta que estén dorados.\n7. Dejá reposar 5 minutos antes de servir.',
      imagenUrl: '',
    },
    {
      id: uid(),
      nombre: 'Huevos revueltos',
      ingredientes: '3 huevos\nManteca\nSal\nQueso rallado (opcional)',
      pasos: '1. Batí los huevos con una pizca de sal.\n2. Derretí manteca en una sartén a fuego medio.\n3. Verté los huevos y mové despacio con espátula.\n4. Cuando estén casi cuajados, retirá del fuego (el calor residual termina de cocinarlos).\n5. Si querés, agregá queso rallado por arriba.\n6. Serví de inmediato.',
      imagenUrl: '',
    },
    {
      id: uid(),
      nombre: 'Sopa de verduras',
      ingredientes: '1 zanahoria\n1 papa\n1 cebolla\n1 zapallo\nAceite\nSal\nAgua',
      pasos: '1. Picá todas las verduras en cubos chiquitos.\n2. En una olla, sofreí la cebolla en aceite.\n3. Agregá las demás verduras y mezclá.\n4. Cubrí con agua y agregá sal.\n5. Herví a fuego medio hasta que las verduras estén blandas (unos 20 minutos).\n6. Si querés, licuá para hacerla cremosa.\n7. Serví caliente.',
      imagenUrl: '',
    },
    {
      id: uid(),
      nombre: 'Tostadas con jamón y queso',
      ingredientes: '4 rebanadas de pan\nJamón\nQueso rallado\nManteca',
      pasos: '1. Untá las tostadas con manteca.\n2. Agregá una capa de jamón.\n3. Cubrí con queso rallado.\n4. Llevá al horno o a la tostadora hasta que el queso se derrita.\n5. Serví caliente.',
      imagenUrl: '',
    },
    {
      id: uid(),
      nombre: 'Panceta con papas',
      ingredientes: '300g de panceta\n4 papas\nAceite\nSal\nPimentón',
      pasos: '1. Cortá las papas en cubos y la panceta en tiras.\n2. En una sartén grande, dorá la panceta sin aceite hasta que suelte la grasa.\n3. Retirá la panceta y en la misma grasa, freí las papas.\n4. Cuando estén doradas, devolvé la panceta.\n5. Mezclá, sazoná con sal y pimentón.\n6. Serví bien caliente.',
      imagenUrl: '',
    },
  ];
}

function getRecetas() {
  const raw = localStorage.getItem(KEYS.RECETAS);
  const parsed = safeParse(raw, null);
  if (!parsed || !Array.isArray(parsed)) {
    const seed = buildRecetasSeed();
    setRecetas(seed);
    return seed;
  }
  return parsed;
}

function setRecetas(arr) {
  localStorage.setItem(KEYS.RECETAS, JSON.stringify(arr));
}

function addReceta(nombre, ingredientes, pasos, imagenUrl) {
  const arr = getRecetas();
  const nueva = {
    id: uid(),
    nombre: nombre.trim(),
    ingredientes: ingredientes.trim(),
    pasos: pasos.trim(),
    imagenUrl: (imagenUrl || '').trim(),
  };
  arr.push(nueva);
  setRecetas(arr);
  return nueva;
}

function updateReceta(id, changes) {
  const arr = getRecetas();
  const idx = arr.findIndex(r => r.id === id);
  if (idx === -1) return null;
  arr[idx] = { ...arr[idx], ...changes };
  setRecetas(arr);
  return arr[idx];
}

function deleteReceta(id) {
  const arr = getRecetas().filter(r => r.id !== id);
  setRecetas(arr);
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
  getRecetas,
  setRecetas,
  addReceta,
  updateReceta,
  deleteReceta,
  normalizeStr,
  uid,
};
