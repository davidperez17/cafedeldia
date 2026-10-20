import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ContactLinks from '../../src/components/ContactLinks.astro';
import { cafeJsonLd, instagramUrl, whatsappUrl } from '../../src/lib/seo';
import { loadMenu } from '../../src/lib/sheet';

describe('seo and contact', () => {
  it('builds CafeOrCoffeeShop JSON-LD with weekly hours from fixtures', async () => {
    const { info, horario, excepciones } = await loadMenu({ env: {} });
    const ld = cafeJsonLd(info, horario, excepciones, 'https://x.test/') as Record<string, any>;
    expect(ld['@type']).toBe('CafeOrCoffeeShop');
    expect(ld.name).toBe('Café del Día');
    expect(ld.openingHoursSpecification).toHaveLength(7);
    expect(ld.openingHoursSpecification[0]).toMatchObject({ dayOfWeek: 'https://schema.org/Monday', opens: '07:00', closes: '19:00' });
  });

  it('a closed exception becomes a 00:00-00:00 special opening', () => {
    const ld = cafeJsonLd({ nombre: 'X', eslogan: '', subtitulo: '' }, [], [{ fecha: '2026-12-25', nota: 'Navidad' }], 'https://x.test/') as Record<string, any>;
    expect(ld.specialOpeningHoursSpecification).toEqual([{
      '@type': 'OpeningHoursSpecification', validFrom: '2026-12-25', validThrough: '2026-12-25', opens: '00:00', closes: '00:00',
    }]);
  });

  it('normalizes whatsapp and instagram values', () => {
    expect(whatsappUrl('+502 5555-1234')).toBe('https://wa.me/50255551234');
    expect(instagramUrl('@cafedeldia')).toBe('https://www.instagram.com/cafedeldia');
    expect(instagramUrl('https://www.instagram.com/otro/')).toBe('https://www.instagram.com/otro/');
  });

  it('contact links only render the values that exist', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ContactLinks, {
      props: { info: { nombre: 'X', eslogan: '', subtitulo: '', whatsapp: '+502 5555-1234' } },
    });
    expect(html).toContain('https://wa.me/50255551234');
    expect(html).not.toContain('instagram.com');
    expect(html).not.toContain('tel:');
  });
});
