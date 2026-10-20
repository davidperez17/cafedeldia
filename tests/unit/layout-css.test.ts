import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('hero height', () => {
  it('declares a vh fallback before the dvh height (browsers without dvh would collapse the hero)', () => {
    const src = readFileSync('src/pages/index.astro', 'utf8');
    const vh = src.indexOf('height: clamp(520px, 72vh, 680px)');
    const dvh = src.indexOf('height: clamp(520px, 72dvh, 680px)');
    expect(vh).toBeGreaterThan(-1);
    expect(dvh).toBeGreaterThan(vh);
  });
});
