import type { Method } from '../../shared/rules.js';

/** Tiempo total del "Paso a paso": la marca del último paso que la tenga, o el tiempo del método. */
export function methodTotal(m: Method): string {
  const last = [...m.pasos].reverse().find((s) => s.tiempo)?.tiempo;
  if (last) return /^\d+:\d{2}$/.test(last) ? `${last} min` : last;
  return m.tiempo;
}
