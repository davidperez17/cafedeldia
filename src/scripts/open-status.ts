import { openStatus } from '../lib/hours';

for (const el of document.querySelectorAll<HTMLElement>('[data-open-status]')) {
  try {
    const { horario, excepciones } = JSON.parse(el.dataset.hours ?? '{}');
    const status = openStatus(new Date(), horario ?? [], excepciones ?? []);
    const label = el.querySelector<HTMLElement>('[data-open-label]') ?? el;
    label.textContent = status.label;
    el.dataset.open = String(status.open);
    document.querySelector(`[data-day="${status.todayIndex}"]`)?.classList.add('today');
  } catch {
    // Sin datos válidos queda el texto neutro del build.
  }
}
