const bar = document.querySelector<HTMLElement>('[data-sticky]');
if (bar) {
  const sentinel = document.createElement('div');
  bar.before(sentinel);
  new IntersectionObserver(([entry]) => bar.classList.toggle('stuck', !entry.isIntersecting)).observe(sentinel);
}
