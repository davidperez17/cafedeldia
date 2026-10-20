import { formatQ } from '../lib/price';

const root = document.querySelector<HTMLElement>('[data-detail]');

if (root) {
  const prices: Record<string, number> = JSON.parse(root.dataset.prices ?? '{}');
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const shadow = document.querySelector<HTMLElement>('[data-hero-shadow]');
  const heroSizes: Record<string, number> = JSON.parse(hero?.dataset.heroSizes ?? '{}');
  const shadowSizes: Record<string, number> = JSON.parse(hero?.dataset.shadowSizes ?? '{}');

  const update = () => {
    const sizeInput = document.querySelector<HTMLInputElement>('input[name="size"]:checked');
    const milkInput = document.querySelector<HTMLInputElement>('input[name="milk"]:checked');
    const size = sizeInput?.value ?? 'M';
    const extra = Number(milkInput?.dataset.milkExtra ?? 0);
    const label = formatQ((prices[size] ?? 0) + extra);

    for (const el of document.querySelectorAll('[data-price]')) el.textContent = label;
    const summary = document.querySelector('[data-summary]');
    if (summary) summary.textContent = [sizeInput ? size : '', milkInput?.value ?? ''].filter(Boolean).join(' · ');
    const oz = document.querySelector('[data-oz]');
    if (oz && sizeInput) oz.textContent = sizeInput.dataset.ozLabel ?? '';
    if (hero && sizeInput && heroSizes[size]) {
      hero.style.width = hero.style.height = `${heroSizes[size]}px`;
      if (shadow) shadow.style.width = `${shadowSizes[size]}px`;
    }
  };

  root.addEventListener('change', update);
}

// Volver conservando el scroll del menú cuando venimos de él.
const back = document.querySelector<HTMLAnchorElement>('header a[href="/"]');
back?.addEventListener('click', (e) => {
  if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) {
    e.preventDefault();
    history.back();
  }
});
