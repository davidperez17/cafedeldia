import { describe, expect, it } from 'vitest';
import { methodTotal } from '../../src/lib/method';
import type { Method } from '../../shared/rules.js';

const base: Method = {
  slug: 'm', nombre: 'M', tiempo: '4 min', cuerpo: 2, acidez: 4, tipo: '', descripcion: '',
  ratio: '', molienda: '', temperatura: '', orden: 1, pasos: [],
};
const step = (n: number, tiempo?: string) => ({ n, titulo: `p${n}`, descripcion: '', tiempo });

describe('methodTotal', () => {
  it('uses the last timestamped step and appends min', () => {
    expect(methodTotal({ ...base, pasos: [step(1, '0:00'), step(2), step(3, '3:00')] })).toBe('3:00 min');
  });

  it('falls back to the method time without doubling the unit', () => {
    expect(methodTotal({ ...base, pasos: [step(1), step(2)] })).toBe('4 min');
    expect(methodTotal({ ...base, tiempo: '18 h', pasos: [step(1)] })).toBe('18 h');
  });

  it('returns empty when there is no time at all', () => {
    expect(methodTotal({ ...base, tiempo: '', pasos: [step(1)] })).toBe('');
  });
});
