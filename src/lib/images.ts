import type { ImageMetadata } from 'astro';

export type ImageFolder = 'productos' | 'metodos' | 'iconos' | 'portada';

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/**/*.{png,jpg,jpeg,webp}', { eager: true });

export function resolveImage(folder: ImageFolder, file?: string): ImageMetadata | undefined {
  if (!file) return undefined;
  const found = files[`/src/assets/${folder}/${file}`];
  if (!found) console.warn(`[menu] imagen no encontrada: src/assets/${folder}/${file}`);
  return found?.default;
}
