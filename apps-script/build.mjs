// Genera apps-script/dist/Code.gs = shared/rules.js (sin `export`) + apps-script/src/main.js.
import { readFileSync, writeFileSync } from 'node:fs';

const rules = readFileSync('shared/rules.js', 'utf8').replace(/^export /gm, '');
const main = readFileSync('apps-script/src/main.js', 'utf8');
const out = [
  '// GENERADO por apps-script/build.mjs — no editar a mano. Fuente: shared/rules.js + apps-script/src/main.js',
  rules,
  main,
  '// Solo para pruebas fuera de Apps Script.',
  "if (typeof module !== 'undefined') module.exports = { snapshotValue_, rowsFromValues_, cellFor_, validateWorkbook };",
  '',
].join('\n');
writeFileSync('apps-script/dist/Code.gs', out);
