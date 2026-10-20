import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

let src = '';
let api: Record<string, any> = {};

// Stub mínimo de Utilities.formatDate (en UTC) para evaluar Code.gs fuera de Apps Script.
const Utilities = {
  formatDate(d: Date, _tz: string, fmt: string) {
    const p = (n: number) => String(n).padStart(2, '0');
    if (fmt === 'HH:mm') return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
    return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
  },
};

beforeAll(() => {
  execFileSync('node', ['apps-script/build.mjs']);
  src = readFileSync('apps-script/dist/Code.gs', 'utf8');
  const module = { exports: {} as Record<string, any> };
  new Function('module', 'SpreadsheetApp', 'PropertiesService', 'UrlFetchApp', 'Utilities', src)(
    module, {}, {}, {}, Utilities,
  );
  api = module.exports;
});

describe('apps script build', () => {
  it('creates apps-script/dist when it does not exist (fresh clone)', () => {
    rmSync('apps-script/dist', { recursive: true, force: true });
    execFileSync('node', ['apps-script/build.mjs']);
    expect(existsSync('apps-script/dist/Code.gs')).toBe(true);
  });
});

describe('apps script bundle', () => {
  it('has no ES module syntax', () => {
    expect(src).not.toMatch(/^\s*(export|import)\b/m);
  });

  it('exposes the menu entry points', () => {
    expect(src).toMatch(/function onOpen\(/);
    expect(src).toMatch(/function publish\(/);
    expect(src).toMatch(/function review\(/);
  });

  it('snapshotValue_ writes raw values as plain text', () => {
    expect(api.snapshotValue_(34, 'UTC')).toBe('34');
    expect(api.snapshotValue_(34.5, 'UTC')).toBe('34.5');
    expect(api.snapshotValue_(true, 'UTC')).toBe('sí');
    expect(api.snapshotValue_(false, 'UTC')).toBe('no');
    expect(api.snapshotValue_('', 'UTC')).toBe('');
    expect(api.snapshotValue_(new Date('2026-12-25T12:00:00Z'), 'UTC')).toBe('2026-12-25');
  });

  it('snapshotValue_ turns time-only cells (Sheets epoch 1899) into HH:mm', () => {
    expect(api.snapshotValue_(new Date('1899-12-30T07:00:00Z'), 'UTC')).toBe('07:00');
  });

  it('a currency-formatted number is accepted but typed "Q34" text is not', () => {
    const header = ['slug', 'nombre', 'categoria', 'precio'];
    const toRows = (vals: unknown[][]) => api.rowsFromValues_(vals, 'UTC').rows;
    const ok = api.validateWorkbook({
      ...emptyTabs(),
      productos: toRows([header, ['capuchino', 'Capuchino', 'c', 34]]),
    });
    expect(ok.errors).toEqual([]);
    const bad = api.validateWorkbook({
      ...emptyTabs(),
      productos: toRows([header, ['capuchino', 'Capuchino', 'c', 'Q34']]),
    });
    expect(bad.errors[0].message).toBe('El precio debe ser solo número, sin Q');
  });

  it('cellFor_ maps an issue to a 1-based sheet cell, whole row without column', () => {
    const headers = ['slug', 'nombre', 'precio'];
    expect(api.cellFor_({ tab: 'productos', row: 4, column: 'precio', message: '' }, headers)).toEqual({ row: 4, col: 3 });
    expect(api.cellFor_({ tab: 'productos', row: 4, message: '' }, headers)).toEqual({ row: 4, col: 0 });
  });
});

function emptyTabs() {
  return {
    productos: [], leches: [], metodos: [], pasos: [], horario: [], excepciones: [],
    categorias: [{ slug: 'c', nombre: 'C' }],
    info: [{ clave: 'nombre', valor: 'X' }],
  };
}
