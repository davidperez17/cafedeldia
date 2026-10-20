# Menú digital — Café del Día · Diseño

Fecha: 2026-10-20 · Estado: borrador para aprobación

Leyenda: **[decidido]** = lo definió el equipo · **[mi decisión]** = propuesta de Claude, revisable · sin marca = consecuencia directa de lo anterior.

---

## 1. Intención

Café del Día es una cafetería en Guatemala (precios en quetzales, cafés de Huehuetenango, Cobán y Acatenango). Se quiere un **menú digital de consulta**: el cliente abre un link (QR, Instagram, Google Maps), ve los productos a detalle (foto, descripción, tamaños, precios, origen del café, métodos de preparación) y decide **antes de llegar** a la cafetería. **[decidido]**

El éxito es que el cliente llegue sabiendo qué quiere y que el dueño pueda mantener precios y productos al día sin depender de un programador.

## 2. Metas, no-metas, anti-metas

**Metas**
- Mostrar todo el catálogo con la estética del sistema visual creado en Claude Design.
- Detalle por producto con precio según tamaño y tipo de leche.
- Sección educativa de métodos de preparación (V60, Chemex, etc.).
- Información para llegar: dirección, horario, contacto.
- El dueño edita contenido desde una Google Sheet y publica con un botón. **[decidido]**
- Carga rápida en celular con datos móviles.

**No-metas** **[decidido]**
- Carrito, pedidos, cantidades, pagos, checkout.
- Cuentas de usuario, perfil, login.
- Plantilla multi-negocio: es solo para Café del Día; nombre, colores y textos de marca pueden ir en el código.
- Panel de administración propio.

**Anti-metas** (cosas que harían fracasar el proyecto aunque "funcione")
- Que parezca tienda en línea: ningún botón "+", "Agregar", "Pedir" ni contador de carrito.
- Que una fila mal escrita en la Sheet tumbe el menú en línea.
- Que el menú tarde en abrir en un celular de gama media con 4G.
- Que se pierda el rasgo visual distintivo (tazas recortadas que sobresalen de la tarjeta).

## 3. Restricciones

- **Stack:** Astro, salida 100 % estática. **[decidido]**
- **Hosting:** Vercel, plan Hobby gratis, en subdominio `.vercel.app`. **[decidido]** La prueba es **interna** (equipo + dueño) hasta cerrar con el cliente final; no habrá QR impresos ni links públicos mientras tanto. Antes del lanzamiento público hay que migrar a un plan que permita uso comercial (Vercel Pro, Cloudflare Pages o Netlify) y poner un dominio propio **antes** de imprimir QR. Como el sitio es estático, la migración es trivial.
- **Datos:** Google Sheet leída **en tiempo de build**, no en el navegador. **[decidido]**
- **Publicación:** menú personalizado en la Sheet (Apps Script) con la opción "Publicar menú", que llama al Deploy Hook de Vercel. **[decidido]**
- **Fotos:** archivos en el repo; la Sheet guarda solo el nombre del archivo. **[decidido]** Subir una foto nueva requiere un commit (lo hace el equipo, no el dueño).
- **Idioma:** español (es-GT). Moneda: `Q24`, sin decimales cuando son cero, como en el diseño.

## 4. Referencia de diseño

- Original: `docs/design/Cafe del Dia - Sistema Visual.dc.html` (copia local). Proyecto en Claude Design: `886ba287-2d75-42cb-9c2e-5d965673699f`.
- `support.js` e `image-slot.js` del proyecto de Claude Design son el runtime del editor; **no** se usan en la app. Cada `<image-slot>` pasa a ser una imagen normal.
- Solo hay 3 imágenes reales en el diseño (Latte de Cardamomo, Caramel Latte en tarjeta y en detalle). Se pueden descargar del proyecto de Claude Design si sirven; el resto de las fotos hay que producirlas.
- El bloque de lógica del diseño contiene código de una versión anterior que el template ya no usa (`products`, `chips`, `badgeStyle`, `detail*`). Ignorarlo; la fuente de verdad visual es el template.

### 4.1 Tokens (tal cual del diseño)

| Token | Valor | Uso |
|---|---|---|
| crema | `#FAF7F2` | fondo |
| terracota | `#D9623B` | acento, estado activo |
| terracota-oscuro | `#B84D2B` | texto terracota pequeño (ver §9) |
| niebla | `#E6ECF1` | tarjetas, chips inactivos |
| cafe | `#2B1D14` | texto principal, badge Especialidad |
| espresso | `#17110D` | barra de navegación, botones oscuros |
| gris-calido | `#75655A` | descripciones |
| durazno | `#F0A27F` | estrella del badge, acentos sobre oscuro |
| rosa-palo | `#F7E3DA` | círculo detrás del producto en el detalle |
| boton-claro | `#F4F6F8` | botones circulares neutros |
| linea | `#EDE4D8` / `#E2D8CB` | separadores |
| nav-inactivo | `#BFB3A8` | íconos inactivos de la nav |
| nav-activo-bg | `#2E231C` | fondo de la pestaña activa |

Tipografía: Poppins 400/500/600/700/800. Escala: título XL 32/36 800 −2 %; título 28/32 800; subtítulo 16/22 600; precio 18/22 700; descripción 12/18 400 gris cálido; etiqueta 13 600 mayúsculas +8 %. JetBrains Mono solo aparece en la lámina del sistema; en la app solo en los tiempos de los pasos de un método.

Íconos: Material Symbols Rounded (relleno, peso 500). Cargar solo los íconos usados (parámetro `icon_names` de Google Fonts) para no bajar la fuente completa. **[mi decisión]**

Radios: tarjetas 24; mini-fichas 18; chips, botones y nav en píldora.

### 4.2 Qué se elimina del diseño **[decidido: sin compra]**

- Botones "+" en todas las tarjetas.
- "Agregar al pedido · Q total", contador −/+, "Pagar", "Pedir con este método".
- Pestañas **Pedido** y **Perfil**, contador del carrito y avatar del header.
- Toggles de "Acompáñalo con".
- Barra de estado falsa (9:41, señal, batería) y marco redondeado de teléfono.
- Botón hamburguesa del header, botón "tune" (filtros) del buscador y botón de guardar (bookmark) en método. **[mi decisión]**: no hay menú lateral, los filtros ya son los chips y no hay cuentas donde guardar.

## 5. Estructura de la Google Sheet

Una hoja con estas pestañas. La primera fila son los encabezados (exactos, en minúsculas). Las celdas vacías se toman como "no aplica".

### `productos`
| columna | ejemplo | notas |
|---|---|---|
| slug | `caramel-latte` | único; se usa en la URL |
| nombre | Caramel Latte | |
| categoria | `cafe-caliente` | slug de la pestaña `categorias` |
| nota | Caramelo salado de la casa | línea corta para las tarjetas |
| descripcion | Espresso doble, leche vaporizada… | texto largo del detalle |
| precio | 34 | precio base (tamaño M si tiene tamaños) |
| precio_s | 30 | vacío = no se ofrece S |
| precio_l | 40 | vacío = no se ofrece L |
| leche | sí | "sí" = muestra el selector de leche |
| badge | especialidad / nuevo / agotado | vacío = sin badge |
| destacado | sí | aparece en "Especialidades de la casa" |
| recomendado | sí | aparece en "Recomendado para ti" |
| origen | Huehuetenango | ficha del detalle; opcional |
| tueste | Medio | opcional |
| notas | Caramelo, nuez | opcional |
| acompanar | `croissant, pan-banano` | slugs separados por coma; opcional |
| imagen | `caramel-latte.png` | archivo en `src/assets/productos/` |
| orden | 10 | orden dentro de su categoría |
| visible | sí | "no" = oculto sin borrarlo |

Tamaños: si `precio_s` o `precio_l` tienen valor, el detalle muestra el selector S/M/L, y M usa `precio`. Onzas fijas: S 8 oz, M 12 oz, L 16 oz. **[mi decisión, tomado del diseño]**

"Agotado" se puede marcar el mismo día sin ocultar el producto.

### `categorias`
slug · nombre · imagen (ícono del chip) · orden. Ejemplos tomados del diseño: Café caliente, Café frío, Té, Repostería.

### `leches`
slug · nombre · extra (Q adicional, 0 si no cobra) · imagen. Ejemplos: Entera 0, Avena 4, Almendra 5, Deslactosada 0.

### `metodos`
slug · nombre · tiempo (`3 min`) · cuerpo (1–5) · acidez (1–5) · tipo (`Filtrado`) · descripcion · ratio (`1:15`) · molienda · temperatura (`92°C`) · grano (slug de un producto, opcional) · imagen · orden · visible.

### `pasos`
metodo (slug) · n · titulo · descripcion · tiempo (`0:30`, opcional) · imagen.

### `info` (clave / valor)
nombre, eslogan (`Tu café, del día`), subtitulo (`Granos frescos, métodos de autor`), direccion, maps_url, whatsapp, instagram, telefono, imagen_portada.

### `horario`
dia (lunes…domingo) · abre (`07:00`) · cierra (`19:00`) · vacío = cerrado.

### `excepciones` **[mi decisión]**
fecha (`2026-12-25`) · abre · cierra · nota (`Navidad`). Si abre y cierra están vacíos, ese día está cerrado. Tiene prioridad sobre `horario` para "Abierto ahora", la página Visítanos (que muestra las próximas excepciones) y el JSON-LD (`specialOpeningHoursSpecification`). Así se cubren Semana Santa, Navidad y horarios especiales.

**Nota:** el build ocurre al publicar, así que "abierto ahora" se calcula en el navegador con los datos del build. Una excepción tiene que estar publicada antes de su fecha.

### Pestañas `pub_*` (ocultas, no se editan a mano) **[mi decisión]**
Copia congelada de cada pestaña, generada por el botón Publicar (ver §6). El build lee **solo** estas.

## 6. Flujo de datos y publicación

1. El dueño edita la Sheet.
2. Menú de la Sheet → **Café del Día → Publicar menú**. Apps Script:
   a. **Valida** todas las pestañas con las mismas reglas del build (abajo). Si hay errores, marca las celdas con fondo rojo y una nota que explica el problema, muestra una lista ("Fila 12: el precio debe ser solo número, sin Q") y **no publica**. **[mi decisión]**: el dueño nunca ve los logs de Vercel, así que el aviso tiene que aparecer donde está trabajando.
   b. Sin errores: copia cada pestaña a su `pub_*` (snapshot congelado). **[mi decisión]**: así **solo el botón** pone contenido en línea. Un build disparado por un commit del equipo (por ejemplo, una foto nueva) lee el último snapshot publicado, no las ediciones a medias del dueño.
   c. Hace POST al Deploy Hook de Vercel (la URL se guarda en las Propiedades del script, no en una celda) y muestra "Publicando… listo en 1–2 minutos".
3. Vercel corre el build de Astro: descarga cada pestaña `pub_*` como CSV, valida otra vez (defensa), genera las páginas y optimiza las imágenes.
4. Si el build falla, Vercel deja en línea la versión anterior.

Opción "Revisar sin publicar" en el mismo menú: corre solo el paso 2a. **[mi decisión]**

Las reglas de validación se definen una sola vez en el código y se replican en Apps Script. Ambas copias deben mantenerse iguales; la Sheet de ejemplo sirve como prueba.

**Acceso a la Sheet:** lectura pública ("cualquiera con el enlace puede ver"); son precios públicos. Se lee por CSV sin API key. **[mi decisión]**

**Validación** **[mi decisión]**
- Error de estructura (no se puede descargar la Sheet, falta una pestaña o una columna obligatoria): **el build falla** y queda en línea la versión anterior.
- Error en una fila (precio que no es número, categoría inexistente, slug duplicado): en Apps Script **bloquea la publicación** (paso 2a). En el build, si llega a pasar, esa fila **se omite** con una advertencia y el resto se publica.
- Imagen faltante: se muestra un marcador (silueta de taza sobre círculo niebla) y una advertencia en el build.
- Columnas obligatorias de `productos`: slug, nombre, categoria, precio.

## 7. Páginas

Todas mobile-first. En desktop la columna de contenido se centra con un ancho máximo de ~480 px sobre fondo crema, y la nav flotante queda dentro de esa columna. **[mi decisión]**: es un menú para celular; no vale la pena diseñar un layout de escritorio aparte.

Navegación inferior flotante (píldora espresso de 68 px de alto, a 24 px del borde) con 3 pestañas: **Menú · Métodos · Visítanos**. La activa muestra su etiqueta en terracota. **[mi decisión]**: Visítanos sustituye a Pedido y Perfil porque la meta es que el cliente llegue.

### 7.1 `/` Menú

1. **Hero** (sustituye la pantalla Bienvenida **[decidido]**): `imagen_portada` con degradado, "Café del Día" en mono, eslogan grande y subtítulo. Ocupa unos 60–70 % del alto de la pantalla. Abajo, un indicador de horario: "Abierto ahora · cierra 19:00" o "Cerrado · abre mañana 07:00" (calculado con la zona horaria America/Guatemala).
   - Los 3 círculos de la Bienvenida (Espresso, Cold brew, Pour over) se eliminan. **[mi decisión]**: los chips de categoría que vienen debajo cumplen la misma función.
2. **Header**: punto terracota + "Café del Día", centrado. Se vuelve fijo al pasar el hero. **[mi decisión]**
3. **Título**: "¿Qué se te antoja hoy?" / "Preparado al momento".
4. **Buscador**: filtra en vivo por nombre, nota y descripción, sin distinguir mayúsculas ni tildes. Mientras hay texto, oculta las secciones 6–7 y muestra los resultados como lista horizontal (§7.1.8). Sin resultados: "No encontramos «xyz»".
5. **Chips de categoría** con ícono: "Todos" + las categorías. Un chip seleccionado filtra el catálogo (sección 8) y oculta las secciones 6–7. **[mi decisión]**
6. **Especialidades de la casa**: carrusel horizontal con scroll-snap, tarjetas verticales de 176 px con la taza sobresaliendo 64 px. Muestra los productos con `destacado = sí`. El link "Ver todo" se elimina. **[mi decisión]**
7. **Recomendado para ti**: lista de tarjetas horizontales con la taza sobresaliendo a la izquierda. Muestra los productos con `recomendado = sí`.
8. **Todo el menú**: **[mi decisión]**: el diseño no incluía un catálogo completo, pero sin él los productos que no son destacados ni recomendados quedarían invisibles. Va agrupado por categoría (título de categoría y luego tarjetas horizontales con el mismo componente de §7.1.7).

Cada tarjeta enlaza a `/p/[slug]`. Si el producto está agotado, la tarjeta baja a 60 % de opacidad y lleva el badge "Agotado".

### 7.2 `/p/[slug]` Detalle de producto

- Header: botón atrás (al menú, conservando el scroll si se puede) y, a la derecha, "Precio" + precio actual grande en terracota.
- Hero: círculo rosa-palo, sombra y foto. Con tamaños, la foto crece según la talla (190 / 236 / 280 px) con la transición del diseño.
- Badge, nombre y descripción.
- Ficha de 3 mini-tarjetas (Origen / Tueste / Notas) solo con los campos que tengan valor.
- **Tamaño** S/M/L con las onzas: solo si el producto tiene tamaños.
- **Leche** en chips con su "+Q4": solo si `leche = sí`.
- El precio del header se actualiza con tamaño + leche. Es solo informativo.
- **Acompáñalo con**: tarjetas de los productos en `acompanar`, que enlazan a su detalle (sin botones).
- Barra inferior fija: resumen "M · Avena" + precio, y un botón espresso "Cómo llegar" (abre `maps_url`). **[mi decisión]**
- Agotado: debajo del nombre, "Hoy no disponible"; el resto del detalle se mantiene.

### 7.3 `/metodos` Métodos de preparación

Cuadrícula de 2 columnas con la imagen sobresaliendo: nombre, tiempo y barras de 5 segmentos para cuerpo y acidez. Cada tarjeta enlaza a su detalle. Se quita el anillo de "seleccionado" del diseño.

### 7.4 `/metodos/[slug]` Detalle de método

Header (atrás + "Método · {tipo}"), hero, nombre, descripción, ficha Ratio / Molienda / Agua, "Paso a paso" con el tiempo total (suma o tiempo del último paso), lista de pasos (número en círculo, imagen, título, descripción, tiempo en mono) y "Granos recomendados" (tarjeta del producto `grano`, que enlaza a su detalle). La barra inferior queda igual que en el detalle de producto: botón "Cómo llegar". **[mi decisión]**

### 7.5 `/visitanos`

No estaba en el diseño; se construye con los mismos componentes. **[mi decisión]**
- Estado "Abierto ahora / Cerrado" grande.
- Horario de la semana con el día actual resaltado.
- Dirección + botón "Cómo llegar" (Google Maps). Link, no mapa embebido, para no cargar peso.
- Botones de WhatsApp, Instagram y teléfono, solo los que tengan valor.

### 7.6 404

Mensaje corto con el estilo del sistema + botón "Ver el menú".

## 8. Comportamiento en el navegador

JavaScript mínimo, solo para: búsqueda y filtro por chips, selector de tamaño y leche, cálculo de "abierto ahora" y header fijo. Todo lo demás es HTML generado en el build. **[mi decisión]**: islas pequeñas o JS sin framework; el builder elige.

## 9. Calidad

- **Contraste:** terracota `#D9623B` sobre crema da ~3.6:1, insuficiente para texto pequeño. Usar `#B84D2B` para texto terracota menor de 18 px; el terracota original queda para fondos, íconos y texto grande. **[mi decisión]**
- Áreas táctiles de al menos 44 px; los chips de tamaño de 48 px ya cumplen.
- Imágenes: Astro las convierte a WebP/AVIF con `srcset`; `loading="lazy"` en todas salvo la del hero.
- Meta tags + imagen Open Graph (para compartir el link por WhatsApp e Instagram) y JSON-LD `CafeOrCoffeeShop` con dirección y horario. **[mi decisión]**
- Objetivo de peso: la primera carga del menú por debajo de ~300 KB sin contar las fotos lazy. **[mi decisión]**

## 10. Fotos

- Productos y métodos: PNG con fondo transparente, recorte limpio y encuadre consistente (taza centrada, ligera vista a 3/4). Guardar en `src/assets/productos/` y `src/assets/metodos/`, con el nombre de archivo igual al slug. **[mi decisión]**
- Íconos de chips y leches: PNG pequeños en `src/assets/iconos/`.
- Portada: foto cenital de latte art sobre madera oscura (descripción del diseño).
- Mientras no existan las fotos: marcador elegante (§6).

## 11. Lo que queda a criterio del builder

- Biblioteca de parseo de CSV, estructura de carpetas, componentes de Astro vs islas.
- Cómo se resuelve la URL CSV de cada pestaña (gviz o "publicar en la web").
- Animaciones y transiciones finas, respetando las del diseño (tamaño 0.35 s `cubic-bezier(.2,.8,.2,1)`, presión `scale(.92–.98)`).
- Datos de ejemplo en la Sheet para desarrollar (usar los del diseño: Capuchino, Caramel Latte, Cold Brew, Mocha, V60…).

## 12. Pendiente del equipo (no bloquea el desarrollo)

- Crear la Google Sheet real con productos, precios, dirección y horario.
- Producir las fotos.
- Crear el proyecto en Vercel y el Deploy Hook.
- Dominio (en la prueba basta el subdominio `.vercel.app`).
