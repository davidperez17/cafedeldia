# Menú digital Café del Día · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sitio Astro estático de solo consulta que muestra el menú de Café del Día a partir de una Google Sheet, publicado en Vercel con un botón dentro de la Sheet.

**Architecture:** En el build, Astro descarga las pestañas `pub_*` de la Sheet como CSV (gviz). Las valida con un módulo de reglas compartido (`shared/rules.js`) y genera HTML estático por página. El mismo módulo de reglas se empaqueta en el Apps Script de la Sheet, que valida, marca errores, congela el snapshot `pub_*` y dispara el Deploy Hook de Vercel. En el navegador solo corre JS mínimo: filtro y búsqueda, precio por tamaño y leche, "abierto ahora" y header fijo.

**Tech Stack:** Node 24, Astro 7.4, TypeScript estricto, Vitest 5, Playwright 1.64 (chromium), papaparse 5.7, Google Apps Script (V8), Vercel Hobby.

**Spec:** `docs/superpowers/specs/2026-10-20-menu-digital-design.md`. Léela antes de cada tarea; este plan cita sus secciones como §N.

## Global Constraints

- Solo consulta: ninguna página puede contener los textos "Agregar", "Pedir", "Pagar", "carrito" ni "pedido", ni botones "+" (§2 anti-metas, §4.2).
- Salida 100 % estática (`output: 'static'`), sin adapter de servidor (§3).
- El build lee **solo** pestañas `pub_*`. Pestañas fuente: `productos`, `categorias`, `leches`, `metodos`, `pasos`, `info`, `horario`, `excepciones` (§5).
- Moneda: `Q34`; decimales solo si no son cero: `Q34.50` (§3).
- Idioma `es-GT`; zona horaria del negocio `America/Guatemala` (UTC−6, sin horario de verano) (§7.1).
- Tokens de color exactos de §4.1. Texto terracota menor de 18 px usa `#B84D2B` (§9).
- Poppins 400/500/600/700/800; Material Symbols Rounded cargado con `icon_names` (§4.1).
- Columna de contenido máx. 480 px centrada; nav flotante de 68 px de alto a 24 px del borde, 3 pestañas: Menú · Métodos · Visítanos (§7).
- Onzas: S 8 oz, M 12 oz, L 16 oz. Hero del detalle: 190 / 236 / 280 px; sombra 110 / 140 / 170 px; transición `.35s cubic-bezier(.2,.8,.2,1)` (§5, §7.2).
- Primera carga de `/` < 300 KB sin contar imágenes lazy (§9).
- Variable de entorno `SHEET_ID`. Sin `SHEET_ID` el build usa `fixtures/`, salvo en Vercel (`process.env.VERCEL`), donde falla.

## Review Focus

1. **Celda con formato de moneda en la Sheet** ("Q34.00" en el CSV de gviz): el snapshot de Apps Script escribe los valores crudos como texto plano, y el parser rechaza "Q34" con el mensaje "el precio debe ser solo número, sin Q". Pruebas en Task 2 y Task 12.
2. **Coma decimal ("34,50")**: se acepta como 34.5. Prueba en Task 2.
3. **Pestaña vacía u opcional sin filas** (ninguna excepción, ningún recomendado): la sección no se muestra, no aparece un título huérfano. Pruebas en Task 3 y Task 8.
4. **Visitante con zona horaria distinta** (turista, o servidor de build en UTC): "abierto ahora" siempre se calcula en America/Guatemala. Prueba en Task 5.
5. **Texto con comas, comillas o saltos de línea** en `descripcion`: el CSV se parsea bien. Prueba en Task 3.

---

## Estructura de archivos

```
astro.config.mjs            · static, site URL, i18n off
package.json / tsconfig.json / vitest.config.ts / playwright.config.ts
shared/rules.js             · reglas de validación compartidas (JS plano + JSDoc, sin imports)
shared/rules.d.ts           · tipos de MenuData, Issue, etc.
src/lib/sheet.ts            · URLs gviz, descarga CSV, fixtures, loadMenu()
src/lib/price.ts            · formatQ, priceFor
src/lib/search.ts           · normalize, matches
src/lib/hours.ts            · openStatus (isomórfico: build + navegador)
src/lib/images.ts           · resolveImage
src/styles/global.css       · tokens, tipografía, reset
src/layouts/Base.astro      · <head>, fuentes, columna 480, slot nav, SEO
src/components/*.astro      · Badge, Chip, ProductCardV, ProductCardH, ProductImage,
                              BottomNav, Header, MethodCard, InfoTile, BottomBar
src/scripts/*.ts            · menu-filter, detail-price, open-status, sticky-header
src/pages/index.astro · p/[slug].astro · metodos/index.astro · metodos/[slug].astro
src/pages/visitanos.astro · 404.astro
src/assets/{productos,metodos,iconos,portada}/
fixtures/*.csv              · datos de ejemplo (una por pestaña, con nombres pub_*)
apps-script/src/main.js     · menú, validar, marcar, snapshot, publicar
apps-script/build.mjs       · genera apps-script/dist/Code.gs (rules.js + main.js)
tests/unit/*.test.ts · tests/e2e/*.spec.ts
docs/deploy.md · docs/sheet-dueno.md
```

---

### Task 1: Proyecto base, tokens y layout

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `src/styles/global.css`, `src/layouts/Base.astro`, `src/pages/index.astro` (placeholder), `tests/unit/smoke.test.ts`

**Interfaces:**
- Produces: `Base.astro` props `{ title: string; description?: string; nav?: 'menu' | 'metodos' | 'visitanos' | null; ogImage?: string }`, con slots `default` y `bottom` (barra inferior fija opcional). Variables CSS `--crema --terracota --terracota-oscuro --niebla --cafe --espresso --gris-calido --durazno --rosa-palo --boton-claro --linea --linea-2 --nav-inactivo --nav-activo-bg` con los valores de §4.1 (`--linea: #EDE4D8`, `--linea-2: #E2D8CB`).
- Scripts npm: `dev`, `build`, `preview`, `test` (vitest run), `test:e2e` (playwright), `build:apps-script`.

- [ ] **Step 1:** `git init` en `/home/servicios-digitales/cafedeldia`; commit inicial con `docs/` tal como está.
- [ ] **Step 2:** Crear proyecto Astro 7.4 mínimo (TypeScript `strict`), instalar `vitest@5`, `papaparse@5.7` y `@types/papaparse`. En `.gitignore`: `node_modules`, `dist`, `.astro`, `test-results`, `playwright-report`, `.env`.
- [ ] **Step 3:** Escribir `tests/unit/smoke.test.ts`: lee `src/styles/global.css` y verifica que contiene `--terracota: #D9623B`, `--terracota-oscuro: #B84D2B`, `--crema: #FAF7F2`, `--espresso: #17110D`.
- [ ] **Step 4:** `npm test` → FAIL (falta el CSS).
- [ ] **Step 5:** Escribir `global.css` (tokens, `body` con fondo crema, color café, Poppins, `-webkit-font-smoothing`) y `Base.astro`: `<html lang="es-GT">`, meta viewport, `theme-color #FAF7F2`, preconnect a Google Fonts, Poppins 400–800 y Material Symbols Rounded (`opsz,wght,FILL,GRAD@24,500,1,0`) con `&icon_names=` en orden alfabético: `arrow_back,arrow_forward,call,chat,coffee_maker,directions,local_cafe,location_on,photo_camera,schedule,search,star,storefront,timer`. Clase `.ms` igual que en el diseño. `<main>` con `max-width: 480px; margin: 0 auto`.
- [ ] **Step 6:** `npm test` → PASS; `npm run build` → termina sin errores.
- [ ] **Step 7:** Commit `chore: scaffold Astro project with design tokens`.

---

### Task 2: Reglas de validación compartidas

**Files:**
- Create: `shared/rules.js`, `shared/rules.d.ts`
- Test: `tests/unit/rules.test.ts`

**Interfaces:**
- Produces (en `rules.d.ts`; mismos nombres de campo que las columnas de §5, con `precio_s`/`precio_l` → `precioS`/`precioL`, `maps_url` → `mapsUrl`, `imagen_portada` → `imagenPortada`):
  - `type Row = Record<string, string>`
  - `type Tabs = Record<'productos'|'categorias'|'leches'|'metodos'|'pasos'|'info'|'horario'|'excepciones', Row[]>`
  - `interface Issue { tab: string; row: number /* fila de la Sheet, encabezado = 1 */; column?: string; message: string /* en español */ }`
  - `interface Product { slug; nombre; categoria; nota; descripcion; precio: number; precioS?: number; precioL?: number; leche: boolean; badge?: 'especialidad'|'nuevo'|'agotado'; destacado: boolean; recomendado: boolean; origen?; tueste?; notas?; acompanar: string[]; imagen?: string; orden: number }`
  - `interface Category { slug; nombre; imagen?; orden: number }` · `interface Milk { slug; nombre; extra: number; imagen? }`
  - `interface Step { n: number; titulo; descripcion; tiempo?; imagen? }`
  - `interface Method { slug; nombre; tiempo; cuerpo: number; acidez: number; tipo; descripcion; ratio; molienda; temperatura; grano?: string; imagen?; orden: number; pasos: Step[] }`
  - `interface Info { nombre; eslogan; subtitulo; direccion?; mapsUrl?; whatsapp?; instagram?; telefono?; imagenPortada? }`
  - `interface DayHours { dia: 0|1|2|3|4|5|6 /* 0 = domingo */; abre?: string; cierra?: string }` · `interface Exception { fecha: string; abre?; cierra?; nota? }`
  - `interface MenuData { productos: Product[]; categorias: Category[]; leches: Milk[]; metodos: Method[]; info: Info; horario: DayHours[]; excepciones: Exception[] }`
  - `function validateWorkbook(tabs: Tabs): { data: MenuData; errors: Issue[]; warnings: Issue[]; fatal: Issue[] }`
  - Exportadas también: `parseBool(s): boolean`, `parseNumber(s): number | null`, `parseTime(s): string | null`, `parseDay(s): number | null`, `REQUIRED_COLUMNS: Record<string, string[]>`
- `rules.js` no puede tener `import` ni APIs de Node o navegador: Task 12 lo concatena en Apps Script quitando `export`.

- [ ] **Step 1: Tests de los parsers de campo**

```ts
expect(parseBool('Sí')).toBe(true); expect(parseBool('si')).toBe(true); expect(parseBool('x')).toBe(true)
expect(parseBool('')).toBe(false); expect(parseBool('no')).toBe(false)
expect(parseNumber('34')).toBe(34); expect(parseNumber('34.5')).toBe(34.5)
expect(parseNumber('34,50')).toBe(34.5)          // Review Focus 2
expect(parseNumber('Q34')).toBeNull(); expect(parseNumber('Q34.00')).toBeNull() // Review Focus 1
expect(parseTime('7:00')).toBe('07:00'); expect(parseTime('24:00')).toBe('24:00'); expect(parseTime('25:00')).toBeNull()
expect(parseDay('Miércoles')).toBe(3); expect(parseDay('miercoles')).toBe(3); expect(parseDay('sabado')).toBe(6)
```

- [ ] **Step 2: Tests de `validateWorkbook`** con un `Tabs` mínimo válido construido en el test (helper `baseTabs()`):
  - `fatal` no vacío si falta la columna `precio` en `productos`; mensaje contiene `"productos"` y `"precio"`.
  - Precio `"Q34"` en la tercera fila de datos (fila 4 de la Sheet) → `errors[0]` = `{ tab: 'productos', row: 4, column: 'precio', message: 'El precio debe ser solo número, sin Q' }`; ese producto no está en `data.productos`.
  - Slug duplicado → error en la segunda aparición; la primera se conserva.
  - Slug con mayúsculas o espacios → error "El slug solo puede tener minúsculas, números y guiones".
  - `categoria` inexistente → error; `visible = no` → omitido sin error ni warning.
  - `acompanar: 'croissant, no-existe'` → `acompanar` queda `['croissant']` y se agrega un warning.
  - `metodos.grano` apunta a un slug inexistente → warning, y `grano` queda `undefined`.
  - `pasos` se agrupan por `metodo` y se ordenan por `n`; un paso con un método inexistente → error.
  - `horario` con `cierra < abre` (salvo `24:00`) → error. `excepciones.fecha` debe ser `YYYY-MM-DD`.
  - `cuerpo = 6` → error "Cuerpo debe ser un número del 1 al 5".
  - `productos` y `metodos` vienen ordenados por `orden` (y por nombre si empatan).
  - `info` se arma desde filas `clave`/`valor`; si falta `nombre` → fatal.
- [ ] **Step 3:** `npx vitest run tests/unit/rules.test.ts` → FAIL.
- [ ] **Step 4:** Implementar `rules.js`. Columnas obligatorias: `productos`: slug, nombre, categoria, precio; `categorias`: slug, nombre; `leches`: slug, nombre, extra; `metodos`: slug, nombre; `pasos`: metodo, n, titulo; `info`: clave, valor; `horario`: dia, abre, cierra; `excepciones`: fecha, abre, cierra. Los encabezados se comparan con trim y en minúsculas. Toda celda se recorta con trim.
- [ ] **Step 5:** Test → PASS.
- [ ] **Step 6:** Commit `feat: shared sheet validation rules`.

---

### Task 3: Carga de datos (Sheet y fixtures)

**Files:**
- Create: `src/lib/sheet.ts`, `fixtures/pub_productos.csv`, `fixtures/pub_categorias.csv`, `fixtures/pub_leches.csv`, `fixtures/pub_metodos.csv`, `fixtures/pub_pasos.csv`, `fixtures/pub_info.csv`, `fixtures/pub_horario.csv`, `fixtures/pub_excepciones.csv`
- Test: `tests/unit/sheet.test.ts`

**Interfaces:**
- Consumes: `validateWorkbook`, `Tabs`, `MenuData` (Task 2).
- Produces:
  - `gvizUrl(sheetId: string, tab: string): string` → `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&headers=1&sheet=pub_${tab}`
  - `parseCsv(text: string): Row[]` (papaparse, `header: true`, `skipEmptyLines: 'greedy'`)
  - `loadMenu(opts?: { fetchImpl?: typeof fetch; env?: Record<string,string|undefined> }): Promise<MenuData>`. Memoizado por proceso. Si hay `fatal`, lanza `Error` con todos los mensajes. `errors` y `warnings` se imprimen con `console.warn` en formato `[menu] productos fila 4 · precio: …`.
  - Fuente: `env.SHEET_ID` → gviz. Sin `SHEET_ID` y con `env.VERCEL` → lanza `"Falta SHEET_ID en Vercel"`. Sin `SHEET_ID` y sin `VERCEL` → lee `fixtures/pub_*.csv`.
- Fixtures con datos del diseño (§11):
  - Categorías: cafe-caliente, cafe-frio, te, reposteria, granos.
  - Productos:
    - capuchino (Q24, recomendado)
    - caramel-latte (Q34, S 30 / L 40, leche, especialidad, destacado, origen Huehuetenango / tueste Medio / notas "Caramelo, nuez", acompanar croissant, pan-banano)
    - latte-cardamomo (Q34, destacado)
    - affogato (Q30, destacado)
    - cold-brew (Q26, nuevo, recomendado)
    - flat-white (Q27, recomendado)
    - mocha (Q30, recomendado)
    - chemex-del-dia (Q35, agotado)
    - croissant (Q18)
    - pan-banano (Q16)
    - huehuetenango-lote-7 (Q95, granos)
  - Al menos una `descripcion` con coma, comillas dobles y salto de línea.
  - Leches: entera 0, avena 4, almendra 5, deslactosada 0.
  - 7 métodos del diseño con sus valores de cuerpo y acidez. V60 con sus 6 pasos y `grano = huehuetenango-lote-7`.
  - Horario: lunes a sábado 07:00–19:00, domingo 08:00–14:00.
  - `pub_excepciones.csv` con solo el encabezado.

- [ ] **Step 1: Tests**
  - `gvizUrl('abc','productos')` es exactamente la URL de arriba.
  - `parseCsv` con un campo `"Dulce, ""sedoso""\ny tostado"` devuelve el texto exacto (Review Focus 5).
  - `loadMenu({ env: {} })` con fixtures → 11 productos, V60 con 6 pasos, `excepciones` = `[]` (Review Focus 3).
  - `loadMenu({ env: { SHEET_ID: 'x' }, fetchImpl })`: el fetch falso recibe las 8 URLs gviz `pub_*`.
  - `loadMenu({ env: { VERCEL: '1' } })` → rechaza con "Falta SHEET_ID".
  - Un fetch que responde 404 → rechaza con un mensaje que incluye el nombre de la pestaña.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementar. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: load menu data from sheet or fixtures`.

---

### Task 4: Precio y búsqueda

**Files:**
- Create: `src/lib/price.ts`, `src/lib/search.ts`
- Test: `tests/unit/price.test.ts`, `tests/unit/search.test.ts`

**Interfaces:**
- Produces:
  - `type Size = 'S'|'M'|'L'`; `SIZE_OZ: Record<Size,string>` = `{S:'8 oz',M:'12 oz',L:'16 oz'}`; `HERO_PX = {S:190,M:236,L:280}`; `SHADOW_PX = {S:110,M:140,L:170}`
  - `formatQ(n: number): string`
  - `sizesOf(p: Product): Size[]`: incluye `'S'` si hay `precioS`, siempre `'M'`, `'L'` si hay `precioL`; devuelve `[]` si solo existe M.
  - `priceFor(p: Product, size: Size, milkExtra = 0): number`
  - `normalize(s: string): string` (NFD, sin diacríticos, minúsculas, trim)
  - `matches(p: Pick<Product,'nombre'|'nota'|'descripcion'>, query: string): boolean`

- [ ] **Step 1: Tests**: `formatQ(34)==='Q34'`, `formatQ(34.5)==='Q34.50'`; `priceFor(caramel,'L',4)===44`; `sizesOf(capuchino)` → `[]`; `sizesOf(caramel)` → `['S','M','L']`; `matches({nombre:'Café frío',…},'cafe frio')` → true; una query vacía coincide con todo.
- [ ] **Step 2:** FAIL → **Step 3:** implementar → **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: price and search helpers`.

---

### Task 5: Horario y "abierto ahora"

**Files:**
- Create: `src/lib/hours.ts`
- Test: `tests/unit/hours.test.ts`

**Interfaces:**
- Consumes: `DayHours`, `Exception`.
- Produces: `openStatus(now: Date, horario: DayHours[], excepciones: Exception[]): { open: boolean; label: string; todayIndex: number }`. Sin imports de Node (corre en el navegador). Calcula la fecha y hora local con `Intl.DateTimeFormat('es-GT',{timeZone:'America/Guatemala', …}).formatToParts`.
- Etiquetas exactas:
  - `"Abierto ahora · cierra 19:00"`
  - `"Cerrado · abre hoy 07:00"`
  - `"Cerrado · abre mañana 07:00"`
  - `"Cerrado · abre el lunes 07:00"`
  - `"Cerrado"` (sin aperturas en los próximos 7 días)
  - Con nota de excepción hoy: `"Cerrado hoy · Navidad"`.

- [ ] **Step 1: Tests** (horario de los fixtures):
  - `2026-10-21T19:00:00Z` (miércoles 13:00 GT) → abierto, `"Abierto ahora · cierra 19:00"`.
  - `2026-10-21T12:30:00Z` (06:30 GT) → `"Cerrado · abre hoy 07:00"`.
  - `2026-10-22T02:00:00Z` (miércoles 20:00 GT) → `"Cerrado · abre mañana 07:00"`.
  - **Review Focus 4:** el mismo instante da el mismo resultado con `process.env.TZ` puesto en `'Asia/Tokyo'` y en `'UTC'`.
  - Excepción `{fecha:'2026-12-25', nota:'Navidad'}` sin horas, el 25 a las 10:00 GT → `"Cerrado hoy · Navidad"`.
  - Excepción con horario reducido 08:00–12:00 → a las 13:00 GT, cerrado.
  - `cierra: '24:00'` → a las 23:59, abierto.
- [ ] **Step 2:** FAIL → **Step 3:** implementar → **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: open-now status in Guatemala time`.

---

### Task 6: Imágenes, componentes base y nav

**Files:**
- Create: `src/lib/images.ts`, `src/components/ProductImage.astro`, `Badge.astro`, `Chip.astro`, `ProductCardV.astro`, `ProductCardH.astro`, `MethodCard.astro`, `InfoTile.astro`, `BottomNav.astro`, `Header.astro`, `BottomBar.astro`, carpetas `src/assets/{productos,metodos,iconos,portada}/` con `.gitkeep`
- Modify: `src/layouts/Base.astro` (renderiza `BottomNav` según la prop `nav`)
- Test: `tests/unit/components.test.ts` (Astro Container API, `experimental_AstroContainer` de `astro/container`)

**Interfaces:**
- Produces:
  - `resolveImage(folder: 'productos'|'metodos'|'iconos'|'portada', file?: string): ImageMetadata | undefined` vía `import.meta.glob('/src/assets/**/*.{png,jpg,jpeg,webp}', { eager: true })`. Si `file` existe pero no se encuentra → `console.warn('[menu] imagen no encontrada: …')`.
  - `ProductImage` props `{ folder; file?; alt: string; width: number; eager?: boolean }`: `<Image>` de `astro:assets` en WebP con `loading="lazy"` salvo `eager`. Sin imagen → marcador: círculo `--niebla` con el ícono `local_cafe` en `--gris-calido` y `aria-hidden`.
  - `Badge` `{ kind: 'especialidad'|'nuevo'|'agotado'; size?: 'sm'|'md' }`. Textos: "Especialidad de la casa" (md) / "Especialidad" (sm), "Nuevo", "Agotado". Estilos de §4 del diseño (líneas 81–83 del HTML original).
  - `Chip` `{ label; icon?: ImageMetadata; active?: boolean; as?: 'button'|'a'; href?; data?: Record<string,string> }`.
  - `ProductCardV` `{ product: Product }`: tarjeta de 176 px con la imagen de 150 px sobresaliendo 64 px; enlaza a `/p/${slug}`.
  - `ProductCardH` `{ product: Product }`: alto 104, imagen de 116 px en `left:-32px; top:-16px`. Agotado → `opacity:.6` + Badge agotado. Atributos `data-slug`, `data-cat` y `data-search` (= `normalize(nombre+' '+nota+' '+descripcion)`).
  - `MethodCard` `{ method: Method }`: barras de 5 segmentos, `#D9623B` activo / `#C9D3DB` inactivo.
  - `InfoTile` `{ label; value; icon?: ImageMetadata }`.
  - `BottomNav` `{ active: 'menu'|'metodos'|'visitanos' }`: íconos `local_cafe`, `coffee_maker` y `storefront`, que enlazan a `/`, `/metodos` y `/visitanos`. La pestaña activa lleva `aria-current="page"` y su etiqueta visible.
  - `Header` `{ variant: 'brand' | 'back'; backHref?; title?; priceLabel?: string }`.
  - `BottomBar` `{ summary?: string; price?: string; mapsUrl?: string }`: barra fija con degradado. Botón "Cómo llegar" (`directions`) solo si hay `mapsUrl`, con `target="_blank" rel="noopener"`.
- Ningún componente renderiza el ícono `add` ni textos de compra.

- [ ] **Step 1: Tests** (render a string): el `ProductCardH` de un producto agotado contiene `Agotado` y `opacity`. `BottomNav active="metodos"` tiene exactamente 3 enlaces y `aria-current` solo en `/metodos`. Sin `imagen`, `ProductImage` produce el marcador sin `<img>`. `BottomBar` sin `mapsUrl` no contiene "Cómo llegar". Ningún render contiene `>add<`.
- [ ] **Step 2:** FAIL → **Step 3:** implementar con los estilos del diseño (radios, sombras y medidas de `docs/design/…dc.html`) → **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: design system components`.

---

### Task 7: Configuración e2e

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/global.spec.ts`

**Interfaces:**
- Produces: config con `webServer: { command: 'npm run build && npm run preview -- --port 4321', url: 'http://localhost:4321', env: { SHEET_ID: '' } }` y proyecto `mobile` (viewport 390×844, chromium). Las tareas siguientes agregan specs a `tests/e2e/`.

- [ ] **Step 1:** `npm i -D @playwright/test@1.64` + `npx playwright install chromium` (en WSL puede requerir `npx playwright install-deps chromium`).
- [ ] **Step 2: Test** `global.spec.ts`: para cada ruta en `['/', '/p/caramel-latte', '/metodos', '/metodos/v60', '/visitanos']`, el texto visible no coincide con `/agregar|pedir|pagar|carrito|pedido/i` y `document.documentElement.scrollWidth <= 390`. Este test sirve como guardia de las anti-metas para el resto del plan.
- [ ] **Step 3:** `npm run test:e2e` → FAIL (las rutas todavía no existen).
- [ ] **Step 4:** Commit `test: e2e harness and no-purchase guard` (se deja en rojo hasta Task 11).

---

### Task 8: Página Menú `/`

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/components/MenuSection.astro`, `src/scripts/menu-filter.ts`, `src/scripts/open-status.ts`, `src/scripts/sticky-header.ts`
- Test: `tests/e2e/menu.spec.ts`, `tests/unit/components.test.ts` (agregar casos)

**Interfaces:**
- Consumes: `loadMenu`, componentes de Task 6, `openStatus`, `normalize`.
- Produces:
  - `MenuSection.astro` `{ title: string; key: 'destacados'|'recomendados'; products: Product[]; variant: 'v'|'h' }`. Con `products` vacío no renderiza nada.
  - `open-status.ts`: busca `[data-open-status]`, lee el JSON de `horario` y `excepciones` desde `data-hours` y escribe la etiqueta. Se reutiliza en Visítanos.
  - El HTML del catálogo usa los atributos `data-section="destacados|recomendados|catalogo"`, `data-cat-group="<slug>"` y, en las tarjetas, `data-slug/data-cat/data-search`.
- Estructura y textos según §7.1:
  - Hero con `imagenPortada` (eager), "Café del Día" en mono, eslogan y subtítulo, y `[data-open-status]`.
  - Header de marca que se vuelve fijo al salir el hero (`IntersectionObserver`).
  - "¿Qué se te antoja hoy?" / "Preparado al momento".
  - Input de búsqueda con `type="search"`, `aria-label="Buscar en el menú"` y placeholder "Busca tu bebida favorita".
  - Chips: "Todos" + categorías.
  - Secciones "Especialidades de la casa" (ProductCardV, scroll-snap), "Recomendado para ti" (ProductCardH) y "Todo el menú" agrupado por categoría (solo las que tienen productos).
  - Una sección sin productos no se renderiza (Review Focus 3).
  - Vacío de búsqueda: `No encontramos «${q}»`.
- `menu-filter.ts`:
  - Con búsqueda o chip distinto de Todos → oculta `destacados` y `recomendados`.
  - Filtra las tarjetas de `catalogo` y oculta los grupos vacíos.
  - Búsqueda y chip se combinan con AND.

- [ ] **Step 1: Tests e2e:**
  - Muestra "Especialidades de la casa" con 3 tarjetas.
  - Escribir `cafe` en el buscador muestra Café… e incluye coincidencias con tilde.
  - Escribir `zzz` muestra `No encontramos «zzz»`.
  - El chip "Repostería" deja solo croissant y pan de banano, y oculta los destacados.
  - Clic en Caramel Latte → URL `/p/caramel-latte`.
  - Unit (Container API): `MenuSection` con `products: []` produce un string vacío, sin el título (Review Focus 3).
- [ ] **Step 2:** FAIL → **Step 3:** implementar → **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: menu home page with search and category filter`.

---

### Task 9: Detalle de producto `/p/[slug]`

**Files:**
- Create: `src/pages/p/[slug].astro`, `src/scripts/detail-price.ts`
- Test: `tests/e2e/detalle.spec.ts`

**Interfaces:**
- Consumes: `loadMenu`, `sizesOf`, `priceFor`, `formatQ`, `SIZE_OZ`, `HERO_PX`, `SHADOW_PX`, componentes.
- Produces: `getStaticPaths` desde `data.productos`. El precio del header (`[data-price]`), el resumen (`[data-summary]`) y el hero (`[data-hero]`) se actualizan desde los radios de tamaño y leche (`<input type="radio">` accesibles, con apariencia de los círculos de 48 px y de chips). `detail-price.ts` lee de `data-prices='{"S":30,"M":34,"L":40}'` y `data-milk-extra` en cada radio de leche.
- Según §7.2:
  - Botón atrás a `/`.
  - Ficha solo con los campos presentes.
  - Tamaño por defecto M; leche por defecto la primera de `leches`.
  - "Acompáñalo con" con `ProductCardV` compacto, solo si `acompanar` no está vacío.
  - `BottomBar` con resumen "M · Avena" + precio y "Cómo llegar".
  - Agotado → "Hoy no disponible" bajo el nombre.
  - Sin tamaños ni leche → el resumen es solo el precio.

- [ ] **Step 1: Tests e2e** sobre `/p/caramel-latte`:
  - El precio inicial es `Q34`.
  - Elegir L → `Q40`; elegir Avena → `Q44`; el resumen muestra `L · Avena`.
  - El hero mide 280 px de ancho con L.
  - En `/p/capuchino` no hay grupo "Tamaño" ni "Leche".
  - `/p/chemex-del-dia` muestra "Hoy no disponible".
  - "Acompáñalo con" enlaza a `/p/croissant`.
- [ ] **Step 2:** FAIL → **Step 3:** implementar → **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: product detail with informative size and milk pricing`.

---

### Task 10: Métodos `/metodos` y `/metodos/[slug]`

**Files:**
- Create: `src/pages/metodos/index.astro`, `src/pages/metodos/[slug].astro`
- Test: `tests/e2e/metodos.spec.ts`

**Interfaces:**
- Consumes: `loadMenu`, `MethodCard`, `InfoTile`, `ProductCardH`, `BottomBar`.
- Según §7.3 y §7.4:
  - Título "Métodos de preparación" / "Elige cómo quieres tu café"; grilla de 2 columnas.
  - Detalle: header "Método · {tipo}", ficha Ratio / Molienda / Agua, "Paso a paso" con el tiempo total.
  - Tiempo total = `tiempo` del último paso que lo tenga; si ninguno lo tiene, `method.tiempo`.
  - Pasos con número en círculo y tiempo en JetBrains Mono (cargar solo el peso 500 en esta página).
  - "Granos recomendados" con `ProductCardH` del grano, solo si existe.
  - `BottomBar` con "Cómo llegar".

- [ ] **Step 1: Tests e2e:**
  - `/metodos` tiene 7 tarjetas.
  - `/metodos/v60` muestra `1:15`, `92°C`, 6 pasos y `3:00 min`.
  - La tarjeta del grano enlaza a `/p/huehuetenango-lote-7`.
  - La nav marca Métodos como activa.
- [ ] **Step 2:** FAIL → **Step 3:** implementar → **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: brewing methods pages`.

---

### Task 11: Visítanos, 404 y SEO

**Files:**
- Create: `src/pages/visitanos.astro`, `src/pages/404.astro`, `src/lib/seo.ts`, `src/components/ContactLinks.astro` (`{ info: Info }`; renderiza solo los contactos con valor)
- Modify: `src/layouts/Base.astro` (meta + OG + JSON-LD)
- Test: `tests/unit/seo.test.ts`, `tests/e2e/visitanos.spec.ts`, `tests/e2e/peso.spec.ts`

**Interfaces:**
- Produces: `cafeJsonLd(info: Info, horario: DayHours[], excepciones: Exception[], url: string): object` → `@type: 'CafeOrCoffeeShop'`, con `openingHoursSpecification` por día abierto y `specialOpeningHoursSpecification` por excepción.
- Visítanos según §7.5:
  - Estado grande con `[data-open-status]` (reutiliza `open-status.ts`).
  - Tabla de horario con el día actual resaltado (lo marca `open-status.ts` vía `todayIndex`).
  - "Próximos días especiales" (solo excepciones futuras y solo si existen).
  - Dirección + "Cómo llegar".
  - WhatsApp (`https://wa.me/<dígitos>`), Instagram y teléfono (`tel:`), cada uno solo si tiene valor.
- 404: "Esta página no está en el menú" + enlace "Ver el menú" a `/`.
- `Base.astro`: `<title>`, `description`, `og:title/description/image` (portada) e inyección del JSON-LD en todas las páginas.

- [ ] **Step 1: Tests:**
  - Unit: el JSON-LD con los fixtures tiene 7 entradas de horario y `@type` correcto; una excepción sin horas produce `opens`/`closes` = `"00:00"`.
  - Unit (Container API): `ContactLinks` con un `info` sin `instagram` no contiene `instagram.com`; con `whatsapp: '+502 5555-1234'` el enlace es `https://wa.me/50255551234`.
  - e2e: `/no-existe` responde con el texto "Ver el menú".
  - `peso.spec.ts`: suma los bytes de las respuestas no-imagen al cargar `/` y verifica que sea < 300 KB.
- [ ] **Step 2:** FAIL → **Step 3:** implementar → **Step 4:** PASS, incluido `global.spec.ts` de Task 7 (ahora en verde).
- [ ] **Step 5:** Commit `feat: visit page, 404 and structured data`.

---

### Task 12: Apps Script (Revisar y Publicar)

**Files:**
- Create: `apps-script/src/main.js`, `apps-script/build.mjs`, `apps-script/appsscript.json`, `docs/sheet-dueno.md`
- Generated (commit): `apps-script/dist/Code.gs`
- Test: `tests/unit/apps-script.test.ts`

**Interfaces:**
- Consumes: `shared/rules.js` (`validateWorkbook`, `REQUIRED_COLUMNS`).
- Produces en `main.js`:
  - `onOpen()`: menú "Café del Día" con "Revisar sin publicar" y "Publicar menú".
  - `readTabs_(): Tabs`: usa `getDisplayValues()` en las pestañas fuente.
  - `markIssues_(issues: Issue[])`:
    - Limpia las marcas anteriores, cuya lista guarda en `DocumentProperties` (clave `MARKED`).
    - Pinta cada celda con fondo `#F8D7D3` y `setNote(message)`. Si el issue no tiene `column`, pinta la fila entera.
  - `snapshotValue_(v: unknown): string`: número → `String(v)`, sin formato de moneda; `Date` → `yyyy-MM-dd`; booleano → `'sí'|'no'`. Es pura y se testea.
  - `snapshot_()`: por cada pestaña, crea u obtiene `pub_<tab>`, la limpia, escribe `getValues()` pasado por `snapshotValue_`, aplica `setNumberFormat('@')` a todo el rango y la oculta (Review Focus 1).
  - `publish()`: corre `validateWorkbook`. Si hay `fatal` o `errors`, marca las celdas y muestra un diálogo con hasta 10 líneas `Pestaña · fila N · columna: mensaje`, y no publica. Si no hay errores, hace `snapshot_()`, `UrlFetchApp.fetch(hook, { method: 'post', muteHttpExceptions: true })` con `hook = PropertiesService.getScriptProperties().getProperty('DEPLOY_HOOK_URL')` y muestra el toast "Publicando… listo en 1–2 minutos". Sin hook → alerta "Falta configurar DEPLOY_HOOK_URL". Si la respuesta no es 2xx → alerta con el código.
  - `review()`: valida y marca sin publicar. Si no hay errores, toast "Todo bien, listo para publicar".
- `build.mjs`: concatena `rules.js` (sin la palabra clave `export`) + `main.js` en `dist/Code.gs`. Exporta las funciones puras para el test vía un bloque `if (typeof module !== 'undefined') module.exports = { snapshotValue_ }` que en Apps Script no hace nada.

- [ ] **Step 1: Tests:**
  - `dist/Code.gs` no contiene `/^\s*(export|import)\b/m`.
  - Se evalúa sin error con `new Function(src)` después de definir stubs vacíos de `SpreadsheetApp`, `PropertiesService`, `UrlFetchApp` y `Utilities`.
  - `snapshotValue_(34) === '34'`, `snapshotValue_(true) === 'sí'`, `snapshotValue_(new Date('2026-12-25T12:00:00Z')) === '2026-12-25'`.
- [ ] **Step 2:** FAIL → **Step 3:** implementar + `npm run build:apps-script` → **Step 4:** PASS.
- [ ] **Step 5:** Escribir `docs/sheet-dueno.md` en lenguaje simple:
  - Qué es cada pestaña y sus columnas (tabla de §5).
  - "No toques las pestañas pub_*".
  - Cómo usar "Revisar" y "Publicar", y qué significa una celda roja.
- [ ] **Step 6:** Commit `feat: Apps Script review and publish menu`.

---

### Task 13: Deploy en Vercel y verificación final

**Files:**
- Create: `docs/deploy.md`

- [ ] **Step 1:** Escribir `docs/deploy.md` con los pasos exactos:
  1. Crear la Sheet con las 8 pestañas (encabezados de §5), compartida como "Cualquiera con el enlace: lector".
  2. Extensiones → Apps Script → pegar `apps-script/dist/Code.gs` y `appsscript.json`.
  3. Crear el proyecto en Vercel desde el repo (preset Astro), variable `SHEET_ID`.
  4. Settings → Git → Deploy Hooks → crear el hook "sheet" y copiarlo en Propiedades del script → `DEPLOY_HOOK_URL`.
  5. Correr "Publicar menú" una vez para crear las `pub_*`.
  6. Recordatorio de §3: plan Hobby = prueba interna; antes de imprimir QR, migrar de plan y poner dominio propio.
- [ ] **Step 2:** `npm test && npm run test:e2e` → todo PASS. Pegar el resumen de la salida en el PR o commit.
- [ ] **Step 3 (manual, con el equipo):**
  - Publicar desde la Sheet real.
  - Escribir `Q34` en un precio → "Revisar" marca la celda en rojo y "Publicar" se niega.
  - Corregir y publicar → en menos de 3 minutos el cambio aparece en `*.vercel.app`.
  - Hacer un commit sin pasar por la Sheet → el sitio sigue mostrando el último snapshot publicado.
- [ ] **Step 4:** Commit `docs: deployment guide`.
