import { normalize } from '../lib/search';

const input = document.querySelector<HTMLInputElement>('[data-search-input]');
const chips = [...document.querySelectorAll<HTMLButtonElement>('.chips [data-cat]')];
const featured = [...document.querySelectorAll<HTMLElement>('[data-section="destacados"], [data-section="recomendados"]')];
const groups = [...document.querySelectorAll<HTMLElement>('[data-cat-group]')];
const title = document.querySelector<HTMLElement>('[data-catalog-title]');
const empty = document.querySelector<HTMLElement>('[data-empty]');

let cat = 'todos';

function apply() {
  const raw = input?.value ?? '';
  const q = normalize(raw);
  const filtering = q !== '' || cat !== 'todos';
  for (const s of featured) s.hidden = filtering;

  let shown = 0;
  for (const g of groups) {
    let inGroup = 0;
    for (const card of g.querySelectorAll<HTMLElement>('[data-slug]')) {
      const ok = (cat === 'todos' || card.dataset.cat === cat) && (card.dataset.search ?? '').includes(q);
      card.hidden = !ok;
      if (ok) inGroup++;
    }
    g.hidden = inGroup === 0;
    shown += inGroup;
  }

  if (title) {
    const chip = chips.find((c) => c.dataset.cat === cat);
    title.textContent = q ? 'Resultados' : cat !== 'todos' ? chip?.textContent?.trim() ?? '' : 'Todo el menú';
  }
  if (empty) {
    empty.hidden = shown > 0;
    empty.textContent = shown > 0 ? '' : `No encontramos «${raw.trim()}»`;
  }
}

for (const chip of chips) {
  chip.addEventListener('click', () => {
    cat = chip.dataset.cat ?? 'todos';
    for (const c of chips) {
      const on = c === chip;
      c.classList.toggle('active', on);
      c.setAttribute('aria-pressed', String(on));
    }
    apply();
  });
}
input?.addEventListener('input', apply);
