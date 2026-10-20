# Deploy — Menú Café del Día

Fase actual: **prueba interna** en Vercel Hobby (gratis), subdominio `*.vercel.app`.

> **Antes de lanzar al público:** Vercel Hobby no permite uso comercial. Migra a Vercel Pro, Cloudflare Pages o Netlify y conecta un **dominio propio antes de imprimir QR**. Un QR que apunte a `*.vercel.app` dejaría de servir al migrar.

## 1. Crear la Google Sheet

1. Crea una hoja nueva con 8 pestañas: `productos`, `categorias`, `leches`, `metodos`, `pasos`, `info`, `horario`, `excepciones`.
2. Para empezar con datos de ejemplo, en cada pestaña usa **Archivo → Importar → Subir** con `fixtures/pub_<pestaña>.csv`, elige "Reemplazar la hoja actual" y **desmarca "Convertir texto en números, fechas y fórmulas"** (si no, `1:15` se vuelve hora y `+502 5555-1234` se vuelve fórmula). Los encabezados deben quedar exactamente como en esos archivos.
3. **Compartir → Cualquier persona con el enlace → Lector.** El sitio lee la hoja sin credenciales; son precios públicos.
4. Copia el **ID** de la hoja. Es la parte de la URL entre `/d/` y `/edit`.

## 2. Instalar el botón "Publicar"

1. En la hoja: **Extensiones → Apps Script**.
2. Reemplaza el contenido de `Código.gs` por el de `apps-script/dist/Code.gs` (está en el repo; si cambias `shared/rules.js` o `apps-script/src/main.js`, regenéralo con `npm run build:apps-script` y vuelve a pegarlo).
3. **Configuración del proyecto** (engranaje) → activa "Mostrar el archivo de manifiesto appsscript.json" y pega `apps-script/appsscript.json`.
4. Guarda. Recarga la hoja: aparece el menú **Café del Día**. La primera vez Google pide autorización.
5. Corre una vez **Café del Día → Preparar columnas de texto**. Pone en formato texto las columnas de horas, ratios, tiempos y la columna `valor` de `info`, para que Sheets no convierta lo que se escribe.

## 3. Proyecto en Vercel

1. **Add New → Project** e importa este repositorio. Vercel detecta Astro; no cambies el comando de build.
2. **Environment Variables:** `SHEET_ID` = el ID del paso 1.4 (Production y Preview).
3. **Settings → Git → Deploy Hooks:** crea un hook llamado `sheet` sobre la rama principal y copia la URL.
4. En Apps Script: **Configuración del proyecto → Propiedades del script → Agregar**: `DEPLOY_HOOK_URL` = la URL del hook.

## 4. Primera publicación

1. En la hoja: **Café del Día → Publicar menú**. Esto crea las pestañas ocultas `pub_*` y dispara el deploy.
2. El primer deploy de Vercel (al importar el repo) falla si las `pub_*` todavía no existían. Es normal: la publicación del paso 4.1 lo resuelve.

## Cómo funciona

- El sitio lee **solo** las pestañas `pub_*`, que únicamente cambian al pulsar "Publicar". Un commit del equipo (por ejemplo, una foto nueva) reconstruye el sitio con el último menú publicado, no con ediciones a medias.
- Si la Sheet tiene errores, el botón no publica y marca las celdas en rojo.
- Si el build falla, Vercel mantiene en línea la versión anterior.

## Fotos

Van en `src/assets/productos/`, `src/assets/metodos/`, `src/assets/iconos/` y `src/assets/portada/`, con el mismo nombre que la columna `imagen` de la hoja. Formato: PNG con fondo transparente para tazas y métodos, JPG para la portada. Astro las convierte a WebP. Commit + push → Vercel redeploy.

## Desarrollo local

```bash
npm install
npm run dev          # http://localhost:4321 con fixtures/ (sin SHEET_ID)
SHEET_ID=<id> npm run dev   # con la hoja real (lee las pub_*)
npm test             # unitarios
npm run test:e2e     # navegador (usa el puerto 4322)
```

## Prueba de aceptación (manual, con la hoja real)

- [ ] Publicar desde la hoja → el cambio aparece en `*.vercel.app` en menos de 3 minutos.
- [ ] Escribir `'Q34` (con apóstrofo, para que quede como texto) en un precio → "Revisar" marca la celda en rojo y "Publicar" no publica. Sin apóstrofo, con la hoja en configuración regional de Guatemala, Sheets puede guardarlo como el número 34 con formato de moneda: eso se acepta y es correcto.
- [ ] En `metodos`, el ratio `1:15` y en `pasos` el tiempo `0:30` se ven igual en el sitio; `24:00` en `horario` se acepta.
- [ ] Corregir y publicar → la celda vuelve a la normalidad y el sitio se actualiza.
- [ ] Hacer un commit sin pasar por la hoja → el sitio sigue mostrando el último menú publicado.
