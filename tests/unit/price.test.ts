import { describe, expect, it } from 'vitest';
import { formatQ, priceFor, sizesOf } from '../../src/lib/price';
import type { Product } from '../../shared/rules.js';

const base: Product = {
  slug: 'capuchino', nombre: 'Capuchino', categoria: 'cafe-caliente', nota: '', descripcion: '',
  precio: 24, leche: false, destacado: false, recomendado: false, acompanar: [], orden: 1,
};
const caramel: Product = { ...base, slug: 'caramel-latte', precio: 34, precioS: 30, precioL: 40, leche: true };

describe('price', () => {
  it('formats quetzales without zero decimals', () => {
    expect(formatQ(34)).toBe('Q34');
    expect(formatQ(34.5)).toBe('Q34.50');
  });

  it('lists sizes only when a product has more than M', () => {
    expect(sizesOf(base)).toEqual([]);
    expect(sizesOf(caramel)).toEqual(['S', 'M', 'L']);
    expect(sizesOf({ ...base, precioL: 32 })).toEqual(['M', 'L']);
  });

  it('adds size price and milk extra', () => {
    expect(priceFor(caramel, 'L', 4)).toBe(44);
    expect(priceFor(caramel, 'S')).toBe(30);
    expect(priceFor(caramel, 'M', 5)).toBe(39);
  });
});
