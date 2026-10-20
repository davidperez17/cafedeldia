import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import BottomBar from '../../src/components/BottomBar.astro';
import BottomNav from '../../src/components/BottomNav.astro';
import MenuSection from '../../src/components/MenuSection.astro';
import MethodCard from '../../src/components/MethodCard.astro';
import ProductCardH from '../../src/components/ProductCardH.astro';
import ProductCardV from '../../src/components/ProductCardV.astro';
import ProductImage from '../../src/components/ProductImage.astro';
import type { Method, Product } from '../../shared/rules.js';

const product: Product = {
  slug: 'chemex-del-dia', nombre: 'Chemex del día', categoria: 'cafe-caliente', nota: 'Origen del día',
  descripcion: 'Taza limpia', precio: 35, leche: false, badge: 'agotado', destacado: false,
  recomendado: false, acompanar: [], orden: 1,
};

const method: Method = {
  slug: 'v60', nombre: 'V60', tiempo: '3 min', cuerpo: 2, acidez: 4, tipo: 'Filtrado', descripcion: '',
  ratio: '1:15', molienda: 'Media-fina', temperatura: '92°C', orden: 1, pasos: [],
};

let container: AstroContainer;
beforeAll(async () => { container = await AstroContainer.create(); });

describe('components', () => {
  it('horizontal card of a sold-out product shows the badge and is dimmed', async () => {
    const html = await container.renderToString(ProductCardH, { props: { product } });
    expect(html).toContain('Agotado');
    expect(html).toContain('opacity');
    expect(html).toContain('href="/p/chemex-del-dia"');
    expect(html).toContain('data-search="chemex del dia origen del dia taza limpia"');
    expect(html).toContain('data-cat="cafe-caliente"');
  });

  it('vertical card links to the product and shows its price', async () => {
    const html = await container.renderToString(ProductCardV, {
      props: { product: { ...product, badge: 'especialidad', precio: 34 } },
    });
    expect(html).toContain('href="/p/chemex-del-dia"');
    expect(html).toContain('Q34');
    expect(html).toContain('Especialidad');
  });

  it('bottom nav has exactly three links and marks only the active one', async () => {
    const html = await container.renderToString(BottomNav, { props: { active: 'metodos' } });
    expect(html.match(/<a /g)).toHaveLength(3);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(/<a[^>]*href="\/metodos"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/metodos"/);
    expect(html).toContain('Métodos');
  });

  it('product image without a file renders a placeholder and no img', async () => {
    const html = await container.renderToString(ProductImage, {
      props: { folder: 'productos', alt: 'Capuchino', width: 150 },
    });
    expect(html).not.toContain('<img');
    expect(html).toContain('local_cafe');
  });

  it('bottom bar without maps url has no directions button', async () => {
    const html = await container.renderToString(BottomBar, { props: { summary: 'M', price: 'Q34' } });
    expect(html).not.toContain('Cómo llegar');
    const withMaps = await container.renderToString(BottomBar, {
      props: { price: 'Q34', mapsUrl: 'https://maps.example' },
    });
    expect(withMaps).toContain('Cómo llegar');
    expect(withMaps).toContain('target="_blank"');
  });

  it('method card renders five segments per scale', async () => {
    const html = await container.renderToString(MethodCard, { props: { method } });
    expect(html.match(/class="seg on"/g)).toHaveLength(6); // 2 cuerpo + 4 acidez
    expect(html.match(/class="seg"/g)).toHaveLength(4);
    expect(html).toContain('href="/metodos/v60"');
  });

  it('no component renders a purchase "+" icon', async () => {
    const renders = await Promise.all([
      container.renderToString(ProductCardH, { props: { product } }),
      container.renderToString(ProductCardV, { props: { product } }),
      container.renderToString(BottomNav, { props: { active: 'menu' } }),
      container.renderToString(MethodCard, { props: { method } }),
    ]);
    for (const html of renders) expect(html).not.toMatch(/>\s*add\s*</);
  });

  it('menu section with no products renders nothing, not even its title', async () => {
    const html = await container.renderToString(MenuSection, {
      props: { title: 'Recomendado para ti', key: 'recomendados', products: [], variant: 'h' },
    });
    expect(html.trim()).toBe('');
  });

  it('menu section renders its title and cards', async () => {
    const html = await container.renderToString(MenuSection, {
      props: { title: 'Recomendado para ti', key: 'recomendados', products: [product], variant: 'h' },
    });
    expect(html).toContain('Recomendado para ti');
    expect(html).toContain('data-section="recomendados"');
    expect(html).toContain('href="/p/chemex-del-dia"');
  });
});
