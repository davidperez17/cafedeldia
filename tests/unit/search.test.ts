import { describe, expect, it } from 'vitest';
import { matches, normalize } from '../../src/lib/search';

const p = { nombre: 'Café frío', nota: 'Con hielo', descripcion: 'Acatenango' };

describe('search', () => {
  it('normalizes accents, case and spaces', () => {
    expect(normalize('  Café FRÍO ')).toBe('cafe frio');
  });

  it('matches ignoring accents across name, note and description', () => {
    expect(matches(p, 'cafe frio')).toBe(true);
    expect(matches(p, 'HIELO')).toBe(true);
    expect(matches(p, 'acaténango')).toBe(true);
    expect(matches(p, 'mocha')).toBe(false);
  });

  it('an empty query matches everything', () => {
    expect(matches(p, '')).toBe(true);
    expect(matches(p, '   ')).toBe(true);
  });
});
