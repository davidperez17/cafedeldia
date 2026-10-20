import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { gvizUrl, loadMenu, parseCsv } from '../../src/lib/sheet';

const TABS = ['productos', 'categorias', 'leches', 'metodos', 'pasos', 'info', 'horario', 'excepciones'];

function fixtureFetch(seen: string[]): typeof fetch {
  return (async (url: string | URL) => {
    const u = String(url);
    seen.push(u);
    const tab = new URL(u).searchParams.get('sheet')!;
    return new Response(readFileSync(`fixtures/${tab}.csv`, 'utf8'), { status: 200 });
  }) as typeof fetch;
}

describe('sheet loader', () => {

  it('builds the gviz csv url for the published snapshot tab', () => {
    expect(gvizUrl('abc', 'productos')).toBe(
      'https://docs.google.com/spreadsheets/d/abc/gviz/tq?tqx=out:csv&headers=1&sheet=pub_productos',
    );
  });

  it('parses quoted fields with commas, quotes and newlines', () => {
    const rows = parseCsv('slug,descripcion\nx,"Dulce, ""sedoso""\ny tostado"\n');
    expect(rows).toEqual([{ slug: 'x', descripcion: 'Dulce, "sedoso"\ny tostado' }]);
  });

  it('loads fixtures when there is no SHEET_ID outside Vercel', async () => {
    const data = await loadMenu({ env: {} });
    expect(data.productos).toHaveLength(12);
    expect(data.metodos.find((m) => m.slug === 'v60')?.pasos).toHaveLength(6);
    expect(data.excepciones).toEqual([]);
    expect(data.productos.find((p) => p.slug === 'caramel-latte')?.descripcion).toContain('"Dulce", sedoso\ny con');
  });

  it('treats an empty SHEET_ID as absent', async () => {
    const data = await loadMenu({ env: { SHEET_ID: '' } });
    expect(data.productos).toHaveLength(12);
  });

  it('fetches every pub_ tab from the sheet when SHEET_ID is set', async () => {
    const seen: string[] = [];
    const data = await loadMenu({ env: { SHEET_ID: 'x' }, fetchImpl: fixtureFetch(seen) });
    expect(seen.sort()).toEqual(TABS.map((t) => gvizUrl('x', t)).sort());
    expect(data.productos).toHaveLength(12);
  });

  it('fails on Vercel without SHEET_ID', async () => {
    await expect(loadMenu({ env: { VERCEL: '1' } })).rejects.toThrow('Falta SHEET_ID');
  });

  it('fails naming the tab when a download fails', async () => {
    const fetchImpl = (async (url: string | URL) =>
      String(url).includes('pub_leches') ? new Response('nope', { status: 404 }) : fixtureFetch([])(url)) as typeof fetch;
    await expect(loadMenu({ env: { SHEET_ID: 'x' }, fetchImpl })).rejects.toThrow(/leches/);
  });

  it('fails with all messages when the workbook has fatal issues', async () => {
    const fetchImpl = (async (url: string | URL) =>
      String(url).includes('pub_info')
        ? new Response('clave,valor\neslogan,Hola\n', { status: 200 })
        : fixtureFetch([])(url)) as typeof fetch;
    await expect(loadMenu({ env: { SHEET_ID: 'x' }, fetchImpl })).rejects.toThrow(/info.*nombre/);
  });
});
