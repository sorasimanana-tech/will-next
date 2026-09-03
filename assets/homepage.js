/* Keep homepage-specific behavior separate from shared service-page scripts. */
(() => {
  const header = document.getElementById('site-header');
  const menu = document.getElementById('mobile-menu');
  const button = document.getElementById('mobile-menu-button');
  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 32);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
  const desktop = window.matchMedia('(min-width: 801px)');
  desktop.addEventListener('change', () => {
    if (desktop.matches && menu && button) {
      menu.classList.add('hidden');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', 'メニューを開く');
    }
  });
})();
