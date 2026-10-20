import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import Papa from 'papaparse';
import { validateWorkbook } from '../../shared/rules.js';
import type { Issue, MenuData, Row, TabName, Tabs } from '../../shared/rules.js';

const TABS: TabName[] = ['productos', 'categorias', 'leches', 'metodos', 'pasos', 'info', 'horario', 'excepciones'];

type Env = Record<string, string | undefined>;

interface LoadOptions {
  fetchImpl?: typeof fetch;
  env?: Env;
}

export function gvizUrl(sheetId: string, tab: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&headers=1&sheet=pub_${tab}`;
}

export function parseCsv(text: string): Row[] {
  const { data } = Papa.parse<Row>(text, { header: true, skipEmptyLines: 'greedy' });
  return data;
}

async function readTabs(env: Env, fetchImpl: typeof fetch): Promise<Tabs> {
  const sheetId = env.SHEET_ID?.trim();
  if (!sheetId && env.VERCEL) throw new Error('Falta SHEET_ID en Vercel');

  const read = async (tab: TabName): Promise<[TabName, Row[]]> => {
    if (!sheetId) {
      const text = await readFile(join(process.cwd(), 'fixtures', `pub_${tab}.csv`), 'utf8');
      return [tab, parseCsv(text)];
    }
    const res = await fetchImpl(gvizUrl(sheetId, tab));
    if (!res.ok) throw new Error(`No se pudo descargar la pestaña pub_${tab} (HTTP ${res.status})`);
    return [tab, parseCsv(await res.text())];
  };

  return Object.fromEntries(await Promise.all(TABS.map(read))) as Tabs;
}

function describeIssue(i: Issue): string {
  return `[menu] ${i.tab} fila ${i.row}${i.column ? ` · ${i.column}` : ''}: ${i.message}`;
}

async function load(env: Env, fetchImpl: typeof fetch): Promise<MenuData> {
  const result = validateWorkbook(await readTabs(env, fetchImpl));
  if (result.fatal.length) throw new Error(result.fatal.map(describeIssue).join('\n'));
  for (const issue of [...result.errors, ...result.warnings]) console.warn(describeIssue(issue));
  return result.data;
}

let cached: Promise<MenuData> | undefined;

/** Datos del menú. La llamada sin opciones (la de las páginas) se memoiza por proceso. */
export function loadMenu(opts?: LoadOptions): Promise<MenuData> {
  if (opts) return load(opts.env ?? process.env, opts.fetchImpl ?? fetch);
  cached ??= load(process.env, fetch);
  return cached;
}
