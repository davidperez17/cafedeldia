import type { Product } from '../../shared/rules.js';

export type Size = 'S' | 'M' | 'L';

export const SIZE_OZ: Record<Size, string> = { S: '8 oz', M: '12 oz', L: '16 oz' };
export const HERO_PX: Record<Size, number> = { S: 190, M: 236, L: 280 };
export const SHADOW_PX: Record<Size, number> = { S: 110, M: 140, L: 170 };

export function formatQ(n: number): string {
  return Number.isInteger(n) ? `Q${n}` : `Q${n.toFixed(2)}`;
}

/** Tamaños a ofrecer; vacío si el producto solo tiene precio base. */
export function sizesOf(p: Product): Size[] {
  if (p.precioS === undefined && p.precioL === undefined) return [];
  const sizes: Size[] = [];
  if (p.precioS !== undefined) sizes.push('S');
  sizes.push('M');
  if (p.precioL !== undefined) sizes.push('L');
  return sizes;
}

export function priceFor(p: Product, size: Size, milkExtra = 0): number {
  const base = size === 'S' ? p.precioS ?? p.precio : size === 'L' ? p.precioL ?? p.precio : p.precio;
  return base + milkExtra;
}
