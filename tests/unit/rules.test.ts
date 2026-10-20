import { describe, expect, it } from 'vitest';
import {
  parseBool, parseDay, parseNumber, parseTime, validateWorkbook,
} from '../../shared/rules.js';
import type { Row, Tabs } from '../../shared/rules.js';

describe('field parsers', () => {
  it('parseBool accepts sí/si/x and rejects empty/no', () => {
    expect(parseBool('Sí')).toBe(true);
    expect(parseBool('si')).toBe(true);
    expect(parseBool('x')).toBe(true);
    expect(parseBool('')).toBe(false);
    expect(parseBool('no')).toBe(false);
  });

  it('parseNumber accepts dot and comma decimals', () => {
    expect(parseNumber('34')).toBe(34);
    expect(parseNumber('34.5')).toBe(34.5);
    expect(parseNumber('34,50')).toBe(34.5);
  });

  it('parseNumber rejects currency-formatted values', () => {
    expect(parseNumber('Q34')).toBeNull();
    expect(parseNumber('Q34.00')).toBeNull();
  });

  it('parseTime normalizes H:MM and allows 24:00', () => {
    expect(parseTime('7:00')).toBe('07:00');
    expect(parseTime('24:00')).toBe('24:00');
    expect(parseTime('25:00')).toBeNull();
  });

  it('parseDay maps spanish day names with or without accents', () => {
    expect(parseDay('Miércoles')).toBe(3);
    expect(parseDay('miercoles')).toBe(3);
    expect(parseDay('sabado')).toBe(6);
    expect(parseDay('domingo')).toBe(0);
  });
});

const prod = (over: Partial<Row> = {}): Row => ({
  slug: 'capuchino', nombre: 'Capuchino', categoria: 'cafe-caliente', nota: '', descripcion: '',
  precio: '24', precio_s: '', precio_l: '', leche: '', badge: '', destacado: '', recomendado: '',
  origen: '', tueste: '', notas: '', acompanar: '', imagen: '', orden: '', visible: 'sí', ...over,
});

function baseTabs(): Tabs {
  return {
    productos: [
      prod(),
      prod({ slug: 'croissant', nombre: 'Croissant', categoria: 'reposteria', precio: '18' }),
    ],
    categorias: [
      { slug: 'cafe-caliente', nombre: 'Café caliente', imagen: '', orden: '1' },
      { slug: 'reposteria', nombre: 'Repostería', imagen: '', orden: '2' },
    ],
    leches: [{ slug: 'entera', nombre: 'Entera', extra: '0', imagen: '' }],
    metodos: [{
      slug: 'v60', nombre: 'V60', tiempo: '3 min', cuerpo: '2', acidez: '4', tipo: 'Filtrado',
      descripcion: '', ratio: '1:15', molienda: 'Media-fina', temperatura: '92°C', grano: '',
      imagen: '', orden: '1', visible: 'sí',
    }],
    pasos: [
      { metodo: 'v60', n: '2', titulo: 'Moler', descripcion: '', tiempo: '', imagen: '' },
      { metodo: 'v60', n: '1', titulo: 'Pesar', descripcion: '', tiempo: '0:00', imagen: '' },
    ],
    info: [
      { clave: 'nombre', valor: 'Café del Día' },
      { clave: 'eslogan', valor: 'Tu café, del día' },
      { clave: 'maps_url', valor: 'https://maps.example' },
    ],
    horario: [{ dia: 'lunes', abre: '07:00', cierra: '19:00' }],
    excepciones: [],
  };
}

describe('validateWorkbook', () => {
  it('builds MenuData from a valid workbook', () => {
    const r = validateWorkbook(baseTabs());
    expect(r.fatal).toEqual([]);
    expect(r.errors).toEqual([]);
    expect(r.data.productos.map((p) => p.slug)).toEqual(['capuchino', 'croissant']);
    expect(r.data.productos[0].precio).toBe(24);
    expect(r.data.info.nombre).toBe('Café del Día');
    expect(r.data.info.mapsUrl).toBe('https://maps.example');
    expect(r.data.horario).toEqual([{ dia: 1, abre: '07:00', cierra: '19:00' }]);
  });

  it('is fatal when a required column is missing', () => {
    const tabs = baseTabs();
    tabs.productos = tabs.productos.map(({ precio, ...rest }) => rest);
    const r = validateWorkbook(tabs);
    expect(r.fatal.length).toBeGreaterThan(0);
    expect(r.fatal[0].message).toContain('productos');
    expect(r.fatal[0].message).toContain('precio');
  });

  it('rejects a currency price with the sheet row and drops the product', () => {
    const tabs = baseTabs();
    tabs.productos.push(prod({ slug: 'mocha', nombre: 'Mocha', precio: 'Q34' }));
    const r = validateWorkbook(tabs);
    expect(r.errors[0]).toEqual({
      tab: 'productos', row: 4, column: 'precio', message: 'El precio debe ser solo número, sin Q',
    });
    expect(r.data.productos.find((p) => p.slug === 'mocha')).toBeUndefined();
  });

  it('flags duplicated slug on the second occurrence and keeps the first', () => {
    const tabs = baseTabs();
    tabs.productos.push(prod({ nombre: 'Otro capuchino', precio: '99' }));
    const r = validateWorkbook(tabs);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatchObject({ tab: 'productos', row: 4, column: 'slug' });
    expect(r.data.productos.filter((p) => p.slug === 'capuchino')).toHaveLength(1);
    expect(r.data.productos[0].precio).toBe(24);
  });

  it('rejects slugs with uppercase or spaces', () => {
    const tabs = baseTabs();
    tabs.productos.push(prod({ slug: 'Flat White', nombre: 'Flat White' }));
    const r = validateWorkbook(tabs);
    expect(r.errors[0].message).toBe('El slug solo puede tener minúsculas, números y guiones');
  });

  it('rejects unknown category and silently skips hidden rows', () => {
    const tabs = baseTabs();
    tabs.productos.push(prod({ slug: 'te-verde', nombre: 'Té verde', categoria: 'te' }));
    tabs.productos.push(prod({ slug: 'oculto', nombre: 'Oculto', categoria: 'nada', visible: 'no' }));
    const r = validateWorkbook(tabs);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatchObject({ row: 4, column: 'categoria' });
    expect(r.warnings).toEqual([]);
    expect(r.data.productos.map((p) => p.slug)).toEqual(['capuchino', 'croissant']);
  });

  it('drops unknown pairing references with a warning', () => {
    const tabs = baseTabs();
    tabs.productos[0].acompanar = 'croissant, no-existe';
    const r = validateWorkbook(tabs);
    expect(r.data.productos[0].acompanar).toEqual(['croissant']);
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toMatchObject({ tab: 'productos', row: 2, column: 'acompanar' });
  });

  it('drops an unknown recommended bean on a method with a warning', () => {
    const tabs = baseTabs();
    tabs.metodos[0].grano = 'no-existe';
    const r = validateWorkbook(tabs);
    expect(r.data.metodos[0].grano).toBeUndefined();
    expect(r.warnings[0]).toMatchObject({ tab: 'metodos', column: 'grano' });
  });

  it('groups steps by method sorted by n and rejects steps of unknown methods', () => {
    const tabs = baseTabs();
    tabs.pasos.push({ metodo: 'sifon', n: '1', titulo: 'X', descripcion: '', tiempo: '', imagen: '' });
    const r = validateWorkbook(tabs);
    expect(r.data.metodos[0].pasos.map((s) => s.titulo)).toEqual(['Pesar', 'Moler']);
    expect(r.errors[0]).toMatchObject({ tab: 'pasos', row: 4, column: 'metodo' });
  });

  it('rejects hours that close before they open, except 24:00', () => {
    const tabs = baseTabs();
    tabs.horario.push({ dia: 'martes', abre: '19:00', cierra: '07:00' });
    tabs.horario.push({ dia: 'viernes', abre: '18:00', cierra: '24:00' });
    const r = validateWorkbook(tabs);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatchObject({ tab: 'horario', row: 3 });
    expect(r.data.horario.find((h) => h.dia === 5)?.cierra).toBe('24:00');
  });

  it('requires YYYY-MM-DD exception dates', () => {
    const tabs = baseTabs();
    tabs.excepciones.push({ fecha: '25/12/2026', abre: '', cierra: '', nota: 'Navidad' });
    tabs.excepciones.push({ fecha: '2026-12-31', abre: '08:00', cierra: '12:00', nota: '' });
    const r = validateWorkbook(tabs);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatchObject({ tab: 'excepciones', row: 2, column: 'fecha' });
    expect(r.data.excepciones).toEqual([{ fecha: '2026-12-31', abre: '08:00', cierra: '12:00' }]);
  });

  it('requires body and acidity between 1 and 5', () => {
    const tabs = baseTabs();
    tabs.metodos[0].cuerpo = '6';
    const r = validateWorkbook(tabs);
    expect(r.errors[0].message).toBe('Cuerpo debe ser un número del 1 al 5');
  });

  it('sorts products and methods by orden then name', () => {
    const tabs = baseTabs();
    tabs.productos = [
      prod({ slug: 'b', nombre: 'Beta', orden: '2' }),
      prod({ slug: 'z', nombre: 'Zeta', orden: '1' }),
      prod({ slug: 'a', nombre: 'Alfa', orden: '2' }),
    ];
    const r = validateWorkbook(tabs);
    expect(r.data.productos.map((p) => p.slug)).toEqual(['z', 'a', 'b']);
  });

  it('is fatal when info has no nombre', () => {
    const tabs = baseTabs();
    tabs.info = tabs.info.filter((r) => r.clave !== 'nombre');
    const r = validateWorkbook(tabs);
    expect(r.fatal[0].message).toContain('nombre');
  });

  it('parses product sizes, milk flag, badge and pairings', () => {
    const tabs = baseTabs();
    tabs.productos[0] = prod({
      precio_s: '30', precio_l: '40', leche: 'sí', badge: 'Especialidad', destacado: 'x',
      origen: 'Huehuetenango', acompanar: 'croissant', imagen: 'capuchino.png',
    });
    const p = validateWorkbook(tabs).data.productos[0];
    expect(p).toMatchObject({
      precioS: 30, precioL: 40, leche: true, badge: 'especialidad', destacado: true,
      recomendado: false, origen: 'Huehuetenango', acompanar: ['croissant'], imagen: 'capuchino.png',
    });
    expect(p.tueste).toBeUndefined();
  });

  it('rejects an unknown badge', () => {
    const tabs = baseTabs();
    tabs.productos[0].badge = 'promo';
    const r = validateWorkbook(tabs);
    expect(r.errors[0]).toMatchObject({ column: 'badge' });
  });

  it('flags spreadsheet formula errors in any cell', () => {
    const tabs = baseTabs();
    tabs.productos[0].nota = '#ERROR!';
    const r = validateWorkbook(tabs);
    expect(r.errors[0]).toMatchObject({ tab: 'productos', row: 2, column: 'nota' });
    expect(r.errors[0].message).toContain('error de fórmula');
  });

  it('requires at least 8 digits in whatsapp and telefono', () => {
    const tabs = baseTabs();
    tabs.info.push({ clave: 'whatsapp', valor: '5555' });
    tabs.info.push({ clave: 'telefono', valor: '+502 5555-1234' });
    const r = validateWorkbook(tabs);
    expect(r.errors).toEqual([{
      tab: 'info', row: 5, column: 'valor', message: 'El número debe tener al menos 8 dígitos',
    }]);
  });
});

