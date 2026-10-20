// Reglas de validación de la Google Sheet del menú.
// Se usa en el build de Astro y se concatena en el Apps Script de la Sheet
// (apps-script/build.mjs quita los `export`). Por eso: sin imports y sin APIs
// de Node ni del navegador.

export const REQUIRED_COLUMNS = {
  productos: ['slug', 'nombre', 'categoria', 'precio'],
  categorias: ['slug', 'nombre'],
  leches: ['slug', 'nombre', 'extra'],
  metodos: ['slug', 'nombre'],
  pasos: ['metodo', 'n', 'titulo'],
  info: ['clave', 'valor'],
  horario: ['dia', 'abre', 'cierra'],
  excepciones: ['fecha', 'abre', 'cierra'],
};

const BADGES = ['especialidad', 'nuevo', 'agotado'];
const DAYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const INFO_KEYS = {
  nombre: 'nombre', eslogan: 'eslogan', subtitulo: 'subtitulo', direccion: 'direccion',
  maps_url: 'mapsUrl', whatsapp: 'whatsapp', instagram: 'instagram', telefono: 'telefono',
  imagen_portada: 'imagenPortada',
};

function stripAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function cell(row, key) {
  const v = row[key];
  return v == null ? '' : String(v).trim();
}

function opt(v) {
  return v === '' ? undefined : v;
}

function compact(obj) {
  const out = {};
  for (const k of Object.keys(obj)) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

export function parseBool(s) {
  const v = stripAccents(String(s || '').trim().toLowerCase());
  return v === 'si' || v === 'x' || v === 'true';
}

export function parseNumber(s) {
  const v = String(s || '').trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(v)) return null;
  return Number(v);
}

export function parseTime(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (min > 59 || h > 24 || (h === 24 && min !== 0)) return null;
  return String(h).padStart(2, '0') + ':' + m[2];
}

export function parseDay(s) {
  const i = DAYS.indexOf(stripAccents(String(s || '').trim().toLowerCase()));
  return i === -1 ? null : i;
}

function parseInteger(s) {
  const v = String(s || '').trim();
  return /^\d+$/.test(v) ? Number(v) : null;
}

function byOrdenNombre(a, b) {
  return a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es');
}

export function validateWorkbook(tabs) {
  const fatal = [];
  const errors = [];
  const warnings = [];
  const err = (tab, i, column, message) => errors.push(compact({ tab, row: i + 2, column, message }));
  const warn = (tab, i, column, message) => warnings.push(compact({ tab, row: i + 2, column, message }));

  for (const tab of Object.keys(REQUIRED_COLUMNS)) {
    const rows = tabs[tab];
    if (!Array.isArray(rows)) {
      fatal.push({ tab, row: 1, message: 'Falta la pestaña ' + tab });
      continue;
    }
    if (rows.length === 0) continue;
    const headers = Object.keys(rows[0]).map((h) => h.trim().toLowerCase());
    for (const col of REQUIRED_COLUMNS[tab]) {
      if (!headers.includes(col)) {
        fatal.push({ tab, row: 1, column: col, message: 'En la pestaña ' + tab + ' falta la columna ' + col });
      }
    }
  }
  if (!fatal.length && tabs.productos.length === 0) {
    fatal.push({ tab: 'productos', row: 1, message: 'La pestaña productos no tiene productos' });
  }
  const empty = {
    productos: [], categorias: [], leches: [], metodos: [],
    info: { nombre: '', eslogan: '', subtitulo: '' }, horario: [], excepciones: [],
  };
  if (fatal.length) return { data: empty, errors, warnings, fatal };

  const rowsOf = (tab) => tabs[tab].map((r) => {
    const o = {};
    for (const k of Object.keys(r)) o[k.trim().toLowerCase()] = r[k];
    return o;
  });

  const checkSlug = (tab, i, slug, seen) => {
    if (!slug) { err(tab, i, 'slug', 'Falta el slug'); return false; }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      err(tab, i, 'slug', 'El slug solo puede tener minúsculas, números y guiones');
      return false;
    }
    if (seen.has(slug)) { err(tab, i, 'slug', 'El slug ' + slug + ' está repetido'); return false; }
    seen.add(slug);
    return true;
  };

  // categorias
  const categorias = [];
  const catSeen = new Set();
  rowsOf('categorias').forEach((r, i) => {
    const slug = cell(r, 'slug');
    const nombre = cell(r, 'nombre');
    if (!slug && !nombre) return;
    let ok = checkSlug('categorias', i, slug, catSeen);
    if (!nombre) { err('categorias', i, 'nombre', 'Falta el nombre'); ok = false; }
    if (ok) {
      categorias.push(compact({
        slug, nombre, imagen: opt(cell(r, 'imagen')), orden: parseInteger(cell(r, 'orden')) ?? 999,
      }));
    }
  });
  categorias.sort(byOrdenNombre);

  // leches
  const leches = [];
  const lecheSeen = new Set();
  rowsOf('leches').forEach((r, i) => {
    const slug = cell(r, 'slug');
    const nombre = cell(r, 'nombre');
    if (!slug && !nombre) return;
    let ok = checkSlug('leches', i, slug, lecheSeen);
    if (!nombre) { err('leches', i, 'nombre', 'Falta el nombre'); ok = false; }
    const extraRaw = cell(r, 'extra');
    const extra = extraRaw === '' ? 0 : parseNumber(extraRaw);
    if (extra === null) { err('leches', i, 'extra', 'El extra debe ser solo número, sin Q'); ok = false; }
    if (ok) leches.push(compact({ slug, nombre, extra, imagen: opt(cell(r, 'imagen')) }));
  });

  // productos
  const productos = [];
  const productRow = new Map();
  const prodSeen = new Set();
  rowsOf('productos').forEach((r, i) => {
    const slug = cell(r, 'slug');
    const nombre = cell(r, 'nombre');
    if (!slug && !nombre) return;
    const visible = cell(r, 'visible');
    if (visible !== '' && !parseBool(visible)) return;
    let ok = checkSlug('productos', i, slug, prodSeen);
    if (!nombre) { err('productos', i, 'nombre', 'Falta el nombre'); ok = false; }
    const categoria = cell(r, 'categoria');
    if (!catSeen.has(categoria)) {
      err('productos', i, 'categoria', 'La categoría "' + categoria + '" no existe en la pestaña categorias');
      ok = false;
    }
    const precio = parseNumber(cell(r, 'precio'));
    if (precio === null) { err('productos', i, 'precio', 'El precio debe ser solo número, sin Q'); ok = false; }
    const sizePrice = (col) => {
      const raw = cell(r, col);
      if (raw === '') return undefined;
      const n = parseNumber(raw);
      if (n === null) { err('productos', i, col, 'El precio debe ser solo número, sin Q'); ok = false; }
      return n ?? undefined;
    };
    const precioS = sizePrice('precio_s');
    const precioL = sizePrice('precio_l');
    const badgeRaw = stripAccents(cell(r, 'badge').toLowerCase());
    if (badgeRaw && !BADGES.includes(badgeRaw)) {
      err('productos', i, 'badge', 'El badge debe ser especialidad, nuevo o agotado');
      ok = false;
    }
    if (!ok) return;
    productRow.set(slug, i);
    productos.push(compact({
      slug, nombre, categoria,
      nota: cell(r, 'nota'),
      descripcion: cell(r, 'descripcion'),
      precio, precioS, precioL,
      leche: parseBool(cell(r, 'leche')),
      badge: opt(badgeRaw),
      destacado: parseBool(cell(r, 'destacado')),
      recomendado: parseBool(cell(r, 'recomendado')),
      origen: opt(cell(r, 'origen')),
      tueste: opt(cell(r, 'tueste')),
      notas: opt(cell(r, 'notas')),
      acompanar: cell(r, 'acompanar').split(',').map((s) => s.trim()).filter(Boolean),
      imagen: opt(cell(r, 'imagen')),
      orden: parseInteger(cell(r, 'orden')) ?? 999,
    }));
  });
  const validSlugs = new Set(productos.map((p) => p.slug));
  for (const p of productos) {
    const missing = p.acompanar.filter((s) => !validSlugs.has(s));
    if (missing.length) {
      warn('productos', productRow.get(p.slug), 'acompanar',
        'No existe el producto ' + missing.join(', ') + '; se omite de "Acompáñalo con"');
      p.acompanar = p.acompanar.filter((s) => validSlugs.has(s));
    }
  }
  productos.sort(byOrdenNombre);

  // metodos
  const metodos = [];
  const metodoSeen = new Set();
  const hiddenMetodos = new Set();
  rowsOf('metodos').forEach((r, i) => {
    const slug = cell(r, 'slug');
    const nombre = cell(r, 'nombre');
    if (!slug && !nombre) return;
    const visible = cell(r, 'visible');
    if (visible !== '' && !parseBool(visible)) { hiddenMetodos.add(slug); return; }
    let ok = checkSlug('metodos', i, slug, metodoSeen);
    if (!nombre) { err('metodos', i, 'nombre', 'Falta el nombre'); ok = false; }
    const scale = (col, label) => {
      const raw = cell(r, col);
      if (raw === '') return 0;
      const n = parseInteger(raw);
      if (n === null || n < 1 || n > 5) {
        err('metodos', i, col, label + ' debe ser un número del 1 al 5');
        ok = false;
        return 0;
      }
      return n;
    };
    const cuerpo = scale('cuerpo', 'Cuerpo');
    const acidez = scale('acidez', 'Acidez');
    let grano = opt(cell(r, 'grano'));
    if (grano && !validSlugs.has(grano)) {
      warn('metodos', i, 'grano', 'No existe el producto ' + grano + '; se omite "Granos recomendados"');
      grano = undefined;
    }
    if (!ok) return;
    metodos.push(compact({
      slug, nombre,
      tiempo: cell(r, 'tiempo'),
      cuerpo, acidez,
      tipo: cell(r, 'tipo'),
      descripcion: cell(r, 'descripcion'),
      ratio: cell(r, 'ratio'),
      molienda: cell(r, 'molienda'),
      temperatura: cell(r, 'temperatura'),
      grano,
      imagen: opt(cell(r, 'imagen')),
      orden: parseInteger(cell(r, 'orden')) ?? 999,
      pasos: [],
    }));
  });
  metodos.sort(byOrdenNombre);

  // pasos
  const metodoBySlug = new Map(metodos.map((m) => [m.slug, m]));
  rowsOf('pasos').forEach((r, i) => {
    const metodo = cell(r, 'metodo');
    const titulo = cell(r, 'titulo');
    if (!metodo && !titulo) return;
    if (hiddenMetodos.has(metodo)) return;
    const m = metodoBySlug.get(metodo);
    if (!m) { err('pasos', i, 'metodo', 'El método "' + metodo + '" no existe en la pestaña metodos'); return; }
    const n = parseInteger(cell(r, 'n'));
    if (n === null) { err('pasos', i, 'n', 'El número de paso debe ser un número entero'); return; }
    if (!titulo) { err('pasos', i, 'titulo', 'Falta el título'); return; }
    m.pasos.push(compact({
      n, titulo, descripcion: cell(r, 'descripcion'),
      tiempo: opt(cell(r, 'tiempo')), imagen: opt(cell(r, 'imagen')),
    }));
  });
  for (const m of metodos) m.pasos.sort((a, b) => a.n - b.n);

  // info
  const info = { nombre: '', eslogan: '', subtitulo: '' };
  rowsOf('info').forEach((r) => {
    const key = INFO_KEYS[cell(r, 'clave').toLowerCase()];
    const valor = cell(r, 'valor');
    if (key && valor) info[key] = valor;
  });
  if (!info.nombre) {
    fatal.push({ tab: 'info', row: 1, column: 'nombre', message: 'En la pestaña info falta la clave nombre' });
  }

  // horario
  const checkHours = (tab, i, abreRaw, cierraRaw) => {
    if (abreRaw === '' && cierraRaw === '') return {};
    const abre = parseTime(abreRaw);
    const cierra = parseTime(cierraRaw);
    if (!abre) { err(tab, i, 'abre', 'La hora debe tener formato 07:00'); return null; }
    if (!cierra) { err(tab, i, 'cierra', 'La hora debe tener formato 19:00'); return null; }
    if (cierra <= abre) { err(tab, i, 'cierra', 'La hora de cierre debe ser después de la de apertura'); return null; }
    return { abre, cierra };
  };
  const horario = [];
  rowsOf('horario').forEach((r, i) => {
    const diaRaw = cell(r, 'dia');
    if (!diaRaw) return;
    const dia = parseDay(diaRaw);
    if (dia === null) { err('horario', i, 'dia', 'El día debe ser lunes, martes, …, domingo'); return; }
    const h = checkHours('horario', i, cell(r, 'abre'), cell(r, 'cierra'));
    if (h) horario.push({ dia, ...h });
  });

  // excepciones
  const excepciones = [];
  rowsOf('excepciones').forEach((r, i) => {
    const fecha = cell(r, 'fecha');
    if (!fecha) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      err('excepciones', i, 'fecha', 'La fecha debe tener formato 2026-12-25');
      return;
    }
    const h = checkHours('excepciones', i, cell(r, 'abre'), cell(r, 'cierra'));
    if (h) excepciones.push(compact({ fecha, ...h, nota: opt(cell(r, 'nota')) }));
  });
  excepciones.sort((a, b) => (a.fecha < b.fecha ? -1 : 1));

  return {
    data: { productos, categorias, leches, metodos, info, horario, excepciones },
    errors, warnings, fatal,
  };
}
