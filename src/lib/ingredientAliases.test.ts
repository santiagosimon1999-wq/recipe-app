import { describe, expect, it } from 'vitest'
import {
  getIngredientAliasCount,
  normalizeIngredientLookupText,
  resolveIngredientAlias,
  toSingularPhrase,
} from './ingredientAliases'
import { getSupportedIngredientKeys } from './nutritionIngredients'

describe('normalizeIngredientLookupText', () => {
  it('normalizes accents and punctuation', () => {
    const normalized = normalizeIngredientLookupText('Aceite de sésamo, (opcional)')
    expect(normalized).toBe('aceite de sesamo')
  })

  it('normalizes unicode fractions and mixed numbers', () => {
    const normalized = normalizeIngredientLookupText('1½ taza de arroz y ⅜ cucharadita sal')
    expect(normalized).toBe('1 1/2 taza de arroz y 3/8 cucharadita sal')
  })
})

describe('toSingularPhrase', () => {
  it('converts english and spanish plural forms', () => {
    expect(toSingularPhrase('berries and tomatoes')).toBe('berry and tomato')
    expect(toSingularPhrase('huevos y camarones')).toBe('huevo y camaron')
  })
})

describe('resolveIngredientAlias', () => {
  it('supports required spanish aliases', () => {
    expect(resolveIngredientAlias('pollo')).toBe('chicken')
    expect(resolveIngredientAlias('pechuga de pollo')).toBe('chicken breast')
    expect(resolveIngredientAlias('costillas de cerdo')).toBe('pork ribs')
    expect(resolveIngredientAlias('carne molida')).toBe('ground beef')
    expect(resolveIngredientAlias('arroz blanco')).toBe('white rice')
    expect(resolveIngredientAlias('frijoles negros')).toBe('black beans')
    expect(resolveIngredientAlias('huevos')).toBe('egg')
    expect(resolveIngredientAlias('aguacate')).toBe('avocado')
    expect(resolveIngredientAlias('palta')).toBe('avocado')
    expect(resolveIngredientAlias('aceite de sésamo')).toBe('sesame oil')
  })

  it('uses longest alias match first', () => {
    expect(resolveIngredientAlias('1 taza de arroz blanco')).toBe('white rice')
    expect(resolveIngredientAlias('2 pechugas de pollo')).toBe('chicken breast')
  })

  it('keeps all alias outputs mapped to supported canonical keys', () => {
    const supported = new Set(getSupportedIngredientKeys())
    const samples = [
      'pollo',
      'pechuga de pollo',
      'costillas de cerdo',
      'carne molida',
      'arroz blanco',
      'frijoles negros',
      'huevo',
      'huevos',
      'aguacate',
      'aceite de sesamo',
      'dark soy sauce',
      'fish sauce',
      'oyster sauce',
      'gochujang',
      'mirin',
    ]

    for (const sample of samples) {
      const resolved = resolveIngredientAlias(sample)
      expect(resolved).not.toBeNull()
      if (resolved) {
        expect(supported.has(resolved)).toBe(true)
      }
    }
  })
})

describe('alias metadata', () => {
  it('exposes expanded alias count', () => {
    expect(getIngredientAliasCount()).toBeGreaterThan(500)
  })
})
