import { getSupportedIngredientKeys } from './nutritionIngredients'

const MANUAL_ALIASES: Record<string, string> = {
  // Required multilingual aliases
  pollo: 'chicken',
  'pechuga de pollo': 'chicken breast',
  'muslo de pollo': 'chicken thigh',
  'pollo entero': 'whole chicken',
  pavo: 'turkey',
  res: 'beef',
  bistec: 'beef steak',
  'carne molida': 'ground beef',
  'costillas de cerdo': 'pork ribs',
  'lomo de cerdo': 'pork loin',
  'panceta de cerdo': 'pork belly',
  tocino: 'bacon',
  jamon: 'ham',
  jamón: 'ham',
  camaron: 'shrimp',
  camarones: 'shrimp',
  camarón: 'shrimp',
  salmon: 'salmon',
  salmón: 'salmon',
  atun: 'tuna',
  atún: 'tuna',
  bacalao: 'cod',
  tilapia: 'tilapia',
  huevo: 'egg',
  huevos: 'egg',
  tofu: 'tofu',
  tempeh: 'tempeh',
  'arroz blanco': 'white rice',
  'arroz integral': 'brown rice',
  'arroz jazmin': 'jasmine rice',
  'arroz jazmín': 'jasmine rice',
  'arroz basmati': 'basmati rice',
  quinoa: 'quinoa',
  quinua: 'quinoa',
  avena: 'oats',
  pasta: 'pasta',
  ramen: 'ramen noodles',
  'fideos ramen': 'ramen noodles',
  'fideos udon': 'udon noodles',
  'fideos soba': 'soba noodles',
  pan: 'bread',
  tortilla: 'tortilla',
  papa: 'potato',
  patata: 'potato',
  'papa dulce': 'sweet potato',
  'batata dulce': 'sweet potato',
  camote: 'sweet potato',
  yuca: 'cassava',
  mandioca: 'cassava',
  cebolla: 'onion',
  ajo: 'garlic',
  tomate: 'tomato',
  jitomate: 'tomato',
  zanahoria: 'carrot',
  apio: 'celery',
  espinaca: 'spinach',
  brocoli: 'broccoli',
  brócoli: 'broccoli',
  coliflor: 'cauliflower',
  repollo: 'cabbage',
  col: 'cabbage',
  'pak choi': 'bok choy',
  hongos: 'mushroom',
  champinones: 'mushroom',
  champiñones: 'mushroom',
  pimientos: 'bell pepper',
  pepino: 'cucumber',
  calabacin: 'zucchini',
  calabacín: 'zucchini',
  'frijoles negros': 'black beans',
  'frijoles pintos': 'pinto beans',
  'frijoles rojos': 'kidney beans',
  lentejas: 'lentils',
  garbanzos: 'chickpeas',
  gandules: 'pigeon peas',
  banana: 'banana',
  platano: 'banana',
  plátano: 'banana',
  'platano verde': 'green plantain',
  'plátano verde': 'green plantain',
  'platano maduro': 'ripe plantain',
  'plátano maduro': 'ripe plantain',
  aguacate: 'avocado',
  palta: 'avocado',
  mango: 'mango',
  pina: 'pineapple',
  piña: 'pineapple',
  manzana: 'apple',
  naranja: 'orange',
  bayas: 'berries',
  leche: 'milk',
  queso: 'cheese',
  mozzarella: 'mozzarella',
  parmesano: 'parmesan',
  cheddar: 'cheddar',
  yogur: 'yogurt',
  yogurt: 'yogurt',
  mantequilla: 'butter',
  crema: 'cream',
  'aceite de oliva': 'olive oil',
  'aceite de sesamo': 'sesame oil',
  'aceite de sésamo': 'sesame oil',
  'aceite vegetal': 'vegetable oil',
  'salsa de soja': 'soy sauce',
  'salsa de soya': 'soy sauce',
  'salsa de soja oscura': 'dark soy sauce',
  'salsa de pescado': 'fish sauce',
  'salsa de ostras': 'oyster sauce',
  'leche de coco': 'coconut milk',
  miso: 'miso',
  gochujang: 'gochujang',
  'pasta de curry': 'curry paste',
  mirin: 'mirin',

  // Legacy aliases retained
  pechuga: 'chicken breast',
  pechugas: 'chicken breast',
  'pechugas de pollo': 'chicken breast',
  'muslos de pollo': 'chicken thigh',
  'carne de res': 'beef',
  lomo: 'pork loin',
  entrana: 'skirt steak',
  entraña: 'skirt steak',
  arroz: 'rice',
  frijol: 'beans',
  frijoles: 'beans',
  poroto: 'beans',
  porotos: 'beans',
  lenteja: 'lentils',
  'queso fresco': 'fresh cheese',
  batata: 'sweet potato',
  harina: 'flour',
  fideo: 'pasta',
  fideos: 'pasta',
  azucar: 'sugar',
  azúcar: 'sugar',
  miel: 'honey',
  choclo: 'corn',
  maiz: 'corn',
  maíz: 'corn',
  arepa: 'arepa',
  'harina pan': 'precooked corn flour',
  'costilla de cerdo': 'pork ribs',
  cebollin: 'green onion',
  cebollines: 'green onion',
  'cebolla china': 'green onion',
  'fideos para ramen': 'ramen noodles',
  dumpling: 'dumplings',
  dumplings: 'dumplings',
  codfish: 'saltfish',
  scallion: 'green onion',
  scallions: 'green onion',
  'green onions': 'green onion',
}

const FRACTION_GLYPHS: Record<string, string> = {
  '¼': '1/4',
  '½': '1/2',
  '¾': '3/4',
  '⅐': '1/7',
  '⅑': '1/9',
  '⅒': '1/10',
  '⅓': '1/3',
  '⅔': '2/3',
  '⅕': '1/5',
  '⅖': '2/5',
  '⅗': '3/5',
  '⅘': '4/5',
  '⅙': '1/6',
  '⅚': '5/6',
  '⅛': '1/8',
  '⅜': '3/8',
  '⅝': '5/8',
  '⅞': '7/8',
}

function removeDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizeFractions(value: string): string {
  let normalized = value
  for (const [glyph, ascii] of Object.entries(FRACTION_GLYPHS)) {
    normalized = normalized.replace(new RegExp(glyph, 'g'), ` ${ascii} `)
    normalized = normalized.replace(
      new RegExp(`(\\d)\\s*${glyph}`, 'g'),
      `$1 ${ascii}`
    )
  }
  return normalized
}

export function normalizeIngredientLookupText(value: string): string {
  return normalizeFractions(removeDiacritics(value))
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^\p{L}\p{N}/\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const irregularSingulars: Record<string, string> = {
  eggs: 'egg',
  tomatoes: 'tomato',
  potatoes: 'potato',
  leaves: 'leaf',
  loaves: 'loaf',
  knives: 'knife',
  wives: 'wife',
  berries: 'berry',
  heroes: 'hero',
}

function singularizeWord(word: string): string {
  if (irregularSingulars[word]) {
    return irregularSingulars[word]
  }
  if (word.endsWith('ies') && word.length > 4) {
    return `${word.slice(0, -3)}y`
  }
  if (word.endsWith('ces') && word.length > 4) {
    return `${word.slice(0, -3)}z`
  }
  if (word.endsWith('es') && word.length > 4) {
    return word.slice(0, -2)
  }
  if (word.endsWith('s') && word.length > 3) {
    return word.slice(0, -1)
  }
  return word
}

export function toSingularPhrase(value: string): string {
  return value
    .split(' ')
    .map((word) => singularizeWord(word))
    .join(' ')
    .trim()
}

function englishPluralize(word: string): string {
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') || word.endsWith('ch') || word.endsWith('sh')) {
    return `${word}es`
  }
  if (word.endsWith('y') && !/[aeiou]y$/.test(word)) {
    return `${word.slice(0, -1)}ies`
  }
  return `${word}s`
}

function generateCanonicalAliases(): Record<string, string> {
  const aliases: Record<string, string> = {}
  for (const key of getSupportedIngredientKeys()) {
    aliases[key] = key
    const words = key.split(' ')
    if (words.length === 1) {
      aliases[englishPluralize(key)] = key
    } else {
      const pluralizedLastWord = `${words.slice(0, -1).join(' ')} ${englishPluralize(words[words.length - 1])}`
      aliases[pluralizedLastWord] = key
    }
  }
  return aliases
}

function containsWholePhrase(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(text)
}

const INGREDIENT_ALIASES: Record<string, string> = {
  ...generateCanonicalAliases(),
  ...MANUAL_ALIASES,
}

const NORMALIZED_ALIAS_ENTRIES = Object.entries(INGREDIENT_ALIASES)
  .map(([alias, canonical]) => [normalizeIngredientLookupText(alias), canonical] as const)
  .filter(([alias]) => alias.length > 0)
  .sort((a, b) => {
    const tokenDiff = b[0].split(' ').length - a[0].split(' ').length
    if (tokenDiff !== 0) return tokenDiff
    return b[0].length - a[0].length
  })

export function getIngredientAliasCount(): number {
  return NORMALIZED_ALIAS_ENTRIES.length
}

export function resolveIngredientAlias(
  ingredientName: string
): string | null {
  const normalized = normalizeIngredientLookupText(ingredientName)
  if (!normalized) return null

  const singular = toSingularPhrase(normalized)

  for (const [alias, canonical] of NORMALIZED_ALIAS_ENTRIES) {
    if (
      normalized === alias ||
      singular === alias ||
      containsWholePhrase(normalized, alias) ||
      containsWholePhrase(singular, alias)
    ) {
      return canonical
    }
  }

  return null
}
