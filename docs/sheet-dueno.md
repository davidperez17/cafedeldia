# Cómo actualizar el menú de Café del Día

Todo el menú sale de esta hoja de Google. Cuando cambias algo, el sitio **no** se actualiza solo: hay que publicar.

## Los dos botones

Arriba, en el menú de la hoja, aparece **Café del Día** (si no aparece, recarga la página):

- **Revisar sin publicar**: revisa que todo esté bien escrito. No cambia el sitio.
- **Publicar menú**: revisa y, si todo está bien, publica. El sitio se actualiza en 1–2 minutos.

Si algo está mal, la celda se pinta de **rojo** y, al pasar el mouse, dice qué corregir (por ejemplo: "El precio debe ser solo número, sin Q"). Mientras haya celdas rojas, no se publica nada y el sitio sigue mostrando la última versión buena.

## Reglas rápidas

- **Precios**: solo el número: `34`, no `Q34`. Se aceptan decimales: `34.50` o `34,50`.
- **Sí / no**: escribe `sí` (o `x`) para activar. Vacío significa "no".
- **slug**: es el nombre corto que va en la dirección web. Solo minúsculas, números y guiones: `caramel-latte`. No lo cambies una vez publicado, porque los links compartidos dejarían de funcionar.
- **Horas**: `07:00`, `19:00`. Para cerrar a medianoche usa `24:00`.
- **Fechas**: `2026-12-25` (año-mes-día).
- **Ocultar sin borrar**: pon `no` en la columna `visible`.
- **Agotado hoy**: escribe `agotado` en la columna `badge`. El producto se sigue viendo, pero dice "Hoy no disponible".
- **No toques** las pestañas que empiezan con `pub_`: son la copia publicada y están ocultas.

## Qué va en cada pestaña

### productos
| columna | qué es | ejemplo |
|---|---|---|
| slug | nombre corto para la web | `caramel-latte` |
| nombre | nombre visible | Caramel Latte |
| categoria | slug de la categoría | `cafe-caliente` |
| nota | frase corta para las tarjetas | Caramelo salado de la casa |
| descripcion | texto largo del detalle | Espresso doble, leche… |
| precio | precio normal (tamaño M) | 34 |
| precio_s | precio pequeño, vacío si no hay | 30 |
| precio_l | precio grande, vacío si no hay | 40 |
| leche | `sí` si se puede elegir leche | sí |
| badge | `especialidad`, `nuevo` o `agotado` | especialidad |
| destacado | `sí` para "Especialidades de la casa" | sí |
| recomendado | `sí` para "Recomendado para ti" | |
| origen, tueste, notas | ficha del café (opcional) | Huehuetenango |
| acompanar | slugs separados por coma | `croissant, pan-banano` |
| imagen | nombre del archivo de foto | `caramel-latte.png` |
| orden | número para ordenar | 2 |
| visible | `no` para ocultar | sí |

### categorias
slug · nombre · imagen (ícono) · orden

### leches
slug · nombre · extra (cuánto cuesta de más; 0 si nada) · imagen

### metodos
slug · nombre · tiempo · cuerpo (1–5) · acidez (1–5) · tipo · descripcion · ratio · molienda · temperatura · grano (slug de un producto) · imagen · orden · visible

### pasos
metodo (slug) · n (número de paso) · titulo · descripcion · tiempo (`0:30`) · imagen

### info
Dos columnas: **clave** y **valor**. Claves: `nombre`, `eslogan`, `subtitulo`, `direccion`, `maps_url`, `whatsapp`, `instagram`, `telefono`, `imagen_portada`.

### horario
dia (lunes…domingo) · abre · cierra. Deja abre y cierra vacíos si ese día cierran.

### excepciones
fecha · abre · cierra · nota. Para feriados o días especiales. Vacío en abre y cierra = cerrado ese día (ej.: `2026-12-25`, vacío, vacío, `Navidad`). Publica antes de la fecha.

## Fotos

Las fotos las sube el equipo técnico. En la hoja solo escribes el nombre del archivo (ej.: `caramel-latte.png`). Si una foto no existe todavía, el sitio muestra un ícono de taza.
