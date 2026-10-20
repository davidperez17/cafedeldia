import type { Product } from '../../shared/rules.js';

export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

export function matches(p: Pick<Product, 'nombre' | 'nota' | 'descripcion'>, query: string): boolean {
  const q = normalize(query);
  return q === '' || normalize(`${p.nombre} ${p.nota} ${p.descripcion}`).includes(q);
}
