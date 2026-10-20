// GENERADO por apps-script/build.mjs — no editar a mano. Fuente: shared/rules.js + apps-script/src/main.js
// Reglas de validación de la Google Sheet del menú.
// Se usa en el build de Astro y se concatena en el Apps Script de la Sheet
// (apps-script/build.mjs quita los `export`). Por eso: sin imports y sin APIs
// de Node ni del navegador.

const REQUIRED_COLUMNS = {
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
const FORMULA_ERROR = /^#(ERROR!|REF!|N\/A|VALUE!|NAME\?|DIV\/0!|NUM!|NULL!)/;
const PHONE_KEYS = ['whatsapp', 'telefono'];
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

function parseBool(s) {
  const v = stripAccents(String(s || '').trim().toLowerCase());
  return v === 'si' || v === 'x' || v === 'true';
}

function parseNumber(s) {
  const v = String(s || '').trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(v)) return null;
  return Number(v);
}

function parseTime(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (min > 59 || h > 24 || (h === 24 && min !== 0)) return null;
  return String(h).padStart(2, '0') + ':' + m[2];
}

function parseDay(s) {
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

function validateWorkbook(tabs) {
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

  // Sheets convierte textos como "+502 5555-1234" en fórmulas rotas.
  for (const tab of Object.keys(REQUIRED_COLUMNS)) {
    rowsOf(tab).forEach((r, i) => {
      for (const col of Object.keys(r)) {
        if (FORMULA_ERROR.test(cell(r, col))) {
          err(tab, i, col, 'La celda tiene un error de fórmula; escríbela empezando con un apóstrofo (\')');
        }
      }
    });
  }

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
  rowsOf('info').forEach((r, i) => {
    const clave = cell(r, 'clave').toLowerCase();
    const key = INFO_KEYS[clave];
    const valor = cell(r, 'valor');
    if (!key || !valor || FORMULA_ERROR.test(valor)) return;
    if (PHONE_KEYS.includes(clave) && valor.replace(/\D/g, '').length < 8) {
      err('info', i, 'valor', 'El número debe tener al menos 8 dígitos');
      return;
    }
    info[key] = valor;
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

// Menú "Café del Día" dentro de la Google Sheet: Revisar y Publicar.
// Se concatena después de shared/rules.js (validateWorkbook, REQUIRED_COLUMNS).

var MENU_TITLE = 'Café del Día';
var MARK_COLOR = '#F8D7D3';
var MARKS_KEY = 'MARKED';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(MENU_TITLE)
    .addItem('Revisar sin publicar', 'review')
    .addItem('Publicar menú', 'publish')
    .addSeparator()
    .addItem('Preparar columnas de texto', 'prepareSheet')
    .addToUi();
}

/** Hora tal como la ve el dueño ("7:00:00", "7:30 p. m.", "24:00:00") → "H:MM". */
function displayTime_(display) {
  var m = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(?:([ap])\.?\s*m\.?)?$/i.exec(String(display).trim());
  if (!m) return String(display).trim();
  var h = Number(m[1]);
  var ampm = m[3] ? m[3].toLowerCase() : '';
  if (ampm === 'p' && h < 12) h += 12;
  if (ampm === 'a' && h === 12) h = 0;
  return h + ':' + m[2];
}

/**
 * Valor de una celda → texto plano, sin formato de moneda ni de fecha.
 * v: getValues(); display: getDisplayValues() (lo que ve el dueño).
 */
function snapshotValue_(v, display, tz) {
  if (v === null || v === undefined || v === '') return '';
  if (v instanceof Date) {
    // Sheets guarda "07:00", "1:15" (ratio) o "24:00" como fechas de 1899. El valor crudo
    // puede venir corrido por el huso horario histórico, así que se usa lo que se ve.
    if (v.getUTCFullYear() <= 1900) return displayTime_(display);
    return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  }
  if (typeof v === 'boolean') return v ? 'sí' : 'no';
  return String(v).trim();
}

/** getValues() + getDisplayValues() → encabezados normalizados, filas como objetos y la matriz en texto. */
function rowsFromValues_(values, displays, tz) {
  var text = values.map(function (row, r) {
    return row.map(function (v, c) { return snapshotValue_(v, displays[r][c], tz); });
  });
  var headers = (text[0] || []).map(function (h) { return h.toLowerCase(); });
  var rows = text.slice(1).map(function (row) {
    var o = {};
    headers.forEach(function (h, i) { if (h) o[h] = row[i]; });
    return o;
  });
  return { headers: headers, rows: rows, text: text };
}

function cellFor_(issue, headers) {
  var col = issue.column ? headers.indexOf(issue.column) + 1 : 0;
  return { row: issue.row, col: col };
}

function readWorkbook_(ss) {
  var tz = ss.getSpreadsheetTimeZone();
  var tabs = {};
  var sheets = {};
  Object.keys(REQUIRED_COLUMNS).forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) return;
    var range = sheet.getDataRange();
    var parsed = rowsFromValues_(range.getValues(), range.getDisplayValues(), tz);
    tabs[name] = parsed.rows;
    sheets[name] = { sheet: sheet, headers: parsed.headers, text: parsed.text };
  });
  return { tabs: tabs, sheets: sheets };
}

function clearMarks_() {
  var props = PropertiesService.getDocumentProperties();
  var marks = JSON.parse(props.getProperty(MARKS_KEY) || '[]');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  marks.forEach(function (m) {
    var sheet = ss.getSheetByName(m[0]);
    if (!sheet) return;
    var range = m[2] ? sheet.getRange(m[1], m[2]) : sheet.getRange(m[1], 1, 1, sheet.getLastColumn());
    range.setBackground(null).clearNote();
  });
  props.deleteProperty(MARKS_KEY);
}

function markIssues_(issues, sheets) {
  var marks = [];
  issues.forEach(function (issue) {
    var info = sheets[issue.tab];
    if (!info) return;
    var c = cellFor_(issue, info.headers);
    var range = c.col ? info.sheet.getRange(c.row, c.col) : info.sheet.getRange(c.row, 1, 1, info.sheet.getLastColumn());
    range.setBackground(MARK_COLOR).setNote(issue.message);
    marks.push([issue.tab, c.row, c.col]);
  });
  PropertiesService.getDocumentProperties().setProperty(MARKS_KEY, JSON.stringify(marks));
}

function describeIssue_(i) {
  return i.tab + ' · fila ' + i.row + (i.column ? ' · ' + i.column : '') + ': ' + i.message;
}

/** Valida y marca. Devuelve null si hay errores (ya avisados), o el libro leído. */
function check_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var wb = readWorkbook_(ss);
  var result = validateWorkbook(wb.tabs);
  var blocking = result.fatal.concat(result.errors);
  clearMarks_();
  if (blocking.length) {
    markIssues_(blocking, wb.sheets);
    var lines = blocking.slice(0, 10).map(describeIssue_);
    if (blocking.length > 10) lines.push('… y ' + (blocking.length - 10) + ' más (celdas en rojo).');
    SpreadsheetApp.getUi().alert('Hay que corregir antes de publicar', lines.join('\n'), SpreadsheetApp.getUi().ButtonSet.OK);
    return null;
  }
  return { ss: ss, wb: wb, warnings: result.warnings };
}

function review() {
  var ok = check_();
  if (!ok) return;
  var extra = ok.warnings.length ? ' (' + ok.warnings.length + ' avisos: ' + ok.warnings.map(describeIssue_).join(' | ') + ')' : '';
  ok.ss.toast('Todo bien, listo para publicar' + extra, MENU_TITLE, 8);
}

function snapshot_(ss, sheets) {
  Object.keys(sheets).forEach(function (name) {
    var text = sheets[name].text;
    var pubName = 'pub_' + name;
    var pub = ss.getSheetByName(pubName) || ss.insertSheet(pubName);
    pub.clear();
    if (text.length && text[0].length) {
      var range = pub.getRange(1, 1, text.length, text[0].length);
      range.setNumberFormat('@');
      range.setValues(text);
    }
    pub.hideSheet();
  });
}

// Columnas donde Sheets suele convertir lo escrito (horas, ratios, teléfonos).
var TEXT_COLUMNS_ = {
  metodos: ['ratio', 'tiempo', 'temperatura'],
  pasos: ['tiempo'],
  horario: ['abre', 'cierra'],
  excepciones: ['fecha', 'abre', 'cierra'],
  info: ['valor'],
};

/** Pone esas columnas en formato de texto, conservando lo que se ve hoy. */
function prepareSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var wb = readWorkbook_(ss);
  Object.keys(TEXT_COLUMNS_).forEach(function (name) {
    var info = wb.sheets[name];
    if (!info) return;
    var rows = Math.max(info.sheet.getMaxRows() - 1, 1);
    TEXT_COLUMNS_[name].forEach(function (col) {
      var c = info.headers.indexOf(col) + 1;
      if (!c) return;
      var range = info.sheet.getRange(2, c, rows, 1);
      var current = info.text.slice(1).map(function (row) { return [row[c - 1] || '']; });
      range.setNumberFormat('@');
      if (current.length) info.sheet.getRange(2, c, current.length, 1).setValues(current);
    });
  });
  ss.toast('Listo: horas, ratios y teléfonos ahora se guardan tal como los escribes', MENU_TITLE, 8);
}

function publish() {
  var hook = PropertiesService.getScriptProperties().getProperty('DEPLOY_HOOK_URL');
  var ui = SpreadsheetApp.getUi();
  if (!hook) {
    ui.alert('Falta configurar DEPLOY_HOOK_URL en las propiedades del script.');
    return;
  }
  var ok = check_();
  if (!ok) return;
  snapshot_(ok.ss, ok.wb.sheets);
  var res = UrlFetchApp.fetch(hook, { method: 'post', muteHttpExceptions: true });
  var code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    ui.alert('No se pudo publicar (código ' + code + '). Intenta de nuevo en unos minutos.');
    return;
  }
  ok.ss.toast('Publicando… listo en 1–2 minutos', MENU_TITLE, 10);
}

// Solo para pruebas fuera de Apps Script.
if (typeof module !== 'undefined') module.exports = { snapshotValue_, rowsFromValues_, cellFor_, validateWorkbook };
