// Temporary, explicitly assisted meeting trial. The ordinary studio returns after expiry.
(() => {
  if (Date.now() > Date.parse('2026-10-19T16:00:00Z')) return;
  const routes = new Set(['/ai-room-visualizer', '/ceramic-studio']);
  const target = '/assisted-studio.html';
  if (routes.has(location.pathname.replace(/\/$/, ''))) { location.replace(target); return; }
  document.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin && routes.has(url.pathname.replace(/\/$/, ''))) {
      event.preventDefault(); event.stopImmediatePropagation(); location.assign(target);
    }
  }, true);
})();
