/**
 * ingredientMatch.js — Matching flexible ES/EN entre nombres de
 * ingredientes de Spoonacular y la lista local del usuario.
 *
 * Algoritmo:
 *   1. Normalizar ambos strings (minúsculas, sin tildes).
 *   2. Lookup en tabla de alias (inglés→español y variantes).
 *   3. Comparar normalizado contra nombre local normalizado.
 *   4. Si no hay match exacto, intento de substring (el nombre
 *      local está contenido en el nombre de Spoonacular o viceversa).
 */

const ALIAS_MAP = {
  // Huevos
  'egg':                'huevos',
  'eggs':               'huevos',
  'large egg':          'huevos',
  'large eggs':         'huevos',
  'whole egg':          'huevos',
  'whole eggs':         'huevos',

  // Harina
  'flour':              'harina',
  'all-purpose flour':  'harina',
  'all purpose flour':  'harina',
  'wheat flour':        'harina',

  // Aceite
  'oil':                'aceite',
  'olive oil':          'aceite',
  'vegetable oil':      'aceite',
  'cooking oil':        'aceite',

  // Sal
  'salt':               'sal',
  'sea salt':           'sal',

  // Arroz
  'rice':               'arroz',
  'white rice':         'arroz',
  'brown rice':         'arroz',

  // Fideos / Pasta
  'pasta':              'fideos',
  'noodles':            'fideos',
  'spaghetti':          'fideos',
  'penne':              'fideos',
  'macaroni':           'fideos',
  'fettuccine':         'fideos',

  // Tomate
  'tomato':             'tomate triturado',
  'tomatoes':           'tomate triturado',
  'crushed tomatoes':   'tomate triturado',
  'canned tomatoes':    'tomate triturado',
  'tomato sauce':       'tomate triturado',
  'tomato puree':       'tomate triturado',

  // Cebolla
  'onion':              'cebolla',
  'onions':             'cebolla',
  'yellow onion':       'cebolla',
  'white onion':        'cebolla',
  'red onion':          'cebolla',

  // Ajo
  'garlic':             'ajo',
  'garlic clove':       'ajo',
  'garlic cloves':      'ajo',

  // Papa
  'potato':             'papa',
  'potatoes':           'papa',

  // Zanahoria
  'carrot':             'zanahoria',
  'carrots':            'zanahoria',

  // Pollo
  'chicken':            'pollo',
  'chicken breast':     'pollo',
  'chicken thigh':      'pollo',
  'chicken thighs':     'pollo',
  'chicken legs':       'pollo',
  'whole chicken':      'pollo',

  // Carne picada
  'ground beef':        'carne picada',
  'ground meat':        'carne picada',
  'minced beef':        'carne picada',
  'minced meat':        'carne picada',
  'beef mince':         'carne picada',

  // Queso
  'cheese':             'queso rallado',
  'grated cheese':      'queso rallado',
  'parmesan':           'queso rallado',
  'parmesan cheese':    'queso rallado',
  'mozzarella':         'queso rallado',

  // Leche
  'milk':               'leche',
  'whole milk':         'leche',

  // Manteca / Mantequilla
  'butter':             'manteca',
  'unsalted butter':    'manteca',

  // Pan rallado
  'breadcrumbs':        'pan rallado',
  'bread crumbs':       'pan rallado',

  // Pimiento
  'bell pepper':        'pimiento rojo',
  'red bell pepper':    'pimiento rojo',
  'pepper':             'pimiento rojo',

  // Zapallo / Calabaza
  'pumpkin':            'zapallo',
  'squash':             'zapallo',
  'butternut squash':   'zapallo',

  // Lentejas
  'lentils':            'lentejas',
  'red lentils':        'lentejas',

  // Garbanzos
  'chickpeas':          'garbanzos',
  'garbanzo beans':     'garbanzos',

  // Aceitunas
  'olives':             'aceitunas',
  'black olives':       'aceitunas',

  // Atún
  'tuna':               'atun en lata',
  'canned tuna':        'atun en lata',

  // Crema
  'heavy cream':        'crema de leche',
  'whipping cream':     'crema de leche',
  'cream':              'crema de leche',

  // Orégano
  'oregano':            'oregano',
  'dried oregano':      'oregano',
};

/**
 * Busca un ingrediente local por el nombre que devuelve Spoonacular.
 * @param {string} spoonacularName  - Nombre en inglés (de la API)
 * @param {Array}  ingredientesLocales - Array de ingredientes del usuario
 * @returns {object|null} El ingrediente local encontrado o null
 */
function matchIngredient(spoonacularName, ingredientesLocales) {
  const norm = Storage.normalizeStr(spoonacularName);

  // 1. Lookup en alias map
  const alias = ALIAS_MAP[norm];
  const targets = alias ? [alias, norm] : [norm];

  for (const target of targets) {
    // 2. Match exacto normalizado
    const exact = ingredientesLocales.find(
      i => Storage.normalizeStr(i.nombre) === target
    );
    if (exact) return exact;

    // 3. Match por substring (local ⊂ spoonacular o viceversa)
    const sub = ingredientesLocales.find(i => {
      const localNorm = Storage.normalizeStr(i.nombre);
      return target.includes(localNorm) || localNorm.includes(target);
    });
    if (sub) return sub;
  }

  return null;
}

window.IngredientMatch = { matchIngredient };
