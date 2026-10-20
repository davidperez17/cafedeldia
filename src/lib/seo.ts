import type { DayHours, Exception, Info } from '../../shared/rules.js';

const SCHEMA_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function whatsappUrl(value: string): string {
  return `https://wa.me/${value.replace(/\D/g, '')}`;
}

export function instagramUrl(value: string): string {
  if (/^https?:\/\//.test(value)) return value;
  return `https://www.instagram.com/${value.replace(/^@/, '')}`;
}

export function telUrl(value: string): string {
  return `tel:${value.replace(/[^\d+]/g, '')}`;
}

export function cafeJsonLd(info: Info, horario: DayHours[], excepciones: Exception[], url: string): object {
  const order = (d: number) => (d + 6) % 7; // lunes primero
  return {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: info.nombre,
    url,
    ...(info.eslogan && { slogan: info.eslogan }),
    ...(info.direccion && { address: { '@type': 'PostalAddress', streetAddress: info.direccion, addressCountry: 'GT' } }),
    ...(info.telefono && { telephone: info.telefono }),
    ...(info.mapsUrl && { hasMap: info.mapsUrl }),
    ...(info.instagram && { sameAs: [instagramUrl(info.instagram)] }),
    currenciesAccepted: 'GTQ',
    servesCuisine: 'Café',
    openingHoursSpecification: [...horario]
      .filter((h) => h.abre && h.cierra)
      .sort((a, b) => order(a.dia) - order(b.dia))
      .map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${SCHEMA_DAYS[h.dia]}`,
        opens: h.abre,
        closes: h.cierra,
      })),
    specialOpeningHoursSpecification: excepciones.map((e) => ({
      '@type': 'OpeningHoursSpecification',
      validFrom: e.fecha,
      validThrough: e.fecha,
      opens: e.abre ?? '00:00',
      closes: e.cierra ?? '00:00',
    })),
  };
}
