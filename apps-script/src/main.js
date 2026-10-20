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
