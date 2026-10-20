import { afterEach, describe, expect, it } from 'vitest';
import { openStatus } from '../../src/lib/hours';
import type { DayHours, Exception } from '../../shared/rules.js';

const horario: DayHours[] = [
  { dia: 1, abre: '07:00', cierra: '19:00' },
  { dia: 2, abre: '07:00', cierra: '19:00' },
  { dia: 3, abre: '07:00', cierra: '19:00' },
  { dia: 4, abre: '07:00', cierra: '19:00' },
  { dia: 5, abre: '07:00', cierra: '19:00' },
  { dia: 6, abre: '07:00', cierra: '19:00' },
  { dia: 0, abre: '08:00', cierra: '14:00' },
];
const at = (iso: string) => new Date(iso);
const originalTz = process.env.TZ;

describe('openStatus (America/Guatemala, UTC-6)', () => {
  afterEach(() => { process.env.TZ = originalTz; });

  it('is open during business hours', () => {
    // miércoles 13:00 GT
    expect(openStatus(at('2026-10-21T19:00:00Z'), horario, [])).toEqual({
      open: true, label: 'Abierto ahora · cierra 19:00', todayIndex: 3,
    });
  });

  it('says it opens today before opening time', () => {
    expect(openStatus(at('2026-10-21T12:30:00Z'), horario, []).label).toBe('Cerrado · abre hoy 07:00');
  });

  it('says it opens tomorrow after closing time', () => {
    // miércoles 20:00 GT
    expect(openStatus(at('2026-10-22T02:00:00Z'), horario, []).label).toBe('Cerrado · abre mañana 07:00');
  });

  it('names the weekday when the next opening is further away', () => {
    const soloLunes: DayHours[] = [{ dia: 1, abre: '07:00', cierra: '19:00' }];
    // miércoles 13:00 GT → próximo lunes
    expect(openStatus(at('2026-10-21T19:00:00Z'), soloLunes, []).label).toBe('Cerrado · abre el lunes 07:00');
  });

  it('says only "Cerrado" when nothing opens in the next 7 days', () => {
    expect(openStatus(at('2026-10-21T19:00:00Z'), [], []).label).toBe('Cerrado');
  });

  it('gives the same answer regardless of the device time zone', () => {
    const instant = at('2026-10-21T19:00:00Z');
    process.env.TZ = 'Asia/Tokyo';
    const tokyo = openStatus(instant, horario, []);
    process.env.TZ = 'UTC';
    const utc = openStatus(instant, horario, []);
    expect(tokyo).toEqual(utc);
    expect(tokyo.open).toBe(true);
  });

  it('a closed exception with a note overrides the weekly schedule', () => {
    const exc: Exception[] = [{ fecha: '2026-12-25', nota: 'Navidad' }];
    // viernes 25 dic 10:00 GT
    expect(openStatus(at('2026-12-25T16:00:00Z'), horario, exc)).toMatchObject({
      open: false, label: 'Cerrado hoy · Navidad',
    });
  });

  it('a reduced-hours exception closes earlier', () => {
    const exc: Exception[] = [{ fecha: '2026-12-24', abre: '08:00', cierra: '12:00' }];
    // jueves 24 dic 13:00 GT
    const s = openStatus(at('2026-12-24T19:00:00Z'), horario, exc);
    expect(s.open).toBe(false);
    expect(s.label).toBe('Cerrado · abre mañana 07:00');
  });

  it('an exception tomorrow is used for the next opening', () => {
    const exc: Exception[] = [{ fecha: '2026-10-22', abre: '10:00', cierra: '12:00' }];
    expect(openStatus(at('2026-10-22T02:00:00Z'), horario, exc).label).toBe('Cerrado · abre mañana 10:00');
  });

  it('24:00 closing keeps it open until midnight', () => {
    const tarde: DayHours[] = [{ dia: 3, abre: '18:00', cierra: '24:00' }];
    // miércoles 23:59 GT
    expect(openStatus(at('2026-10-22T05:59:00Z'), tarde, []).label).toBe('Abierto ahora · cierra 24:00');
  });
});
