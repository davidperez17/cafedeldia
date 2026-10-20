import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('design tokens', () => {
  const css = readFileSync('src/styles/global.css', 'utf8');

  it('defines the exact palette from the design system', () => {
    expect(css).toContain('--terracota: #D9623B');
    expect(css).toContain('--terracota-oscuro: #B84D2B');
    expect(css).toContain('--crema: #FAF7F2');
    expect(css).toContain('--espresso: #17110D');
  });
});
