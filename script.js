document.documentElement.classList.add('js');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link) return;
  closeMenu();
  if (matchMedia('(max-width: 760px)').matches) {
    const section = document.querySelector(link.hash);
    section?.setAttribute('tabindex', '-1');
    section?.focus({ preventScroll: true });
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
const links = [...navigation.querySelectorAll('a')];
const sections = links.map(link => document.querySelector(link.hash));
let scheduled = false;
function updateNavigation() {
  const current = sections.filter(section => section.getBoundingClientRect().top <= 180).at(-1);
  links.forEach(link => {
    if (current && link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scheduled = false;
}
window.addEventListener('scroll', () => {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateNavigation); }
}, { passive: true });
updateNavigation();
document.querySelector('#year').textContent = new Date().getFullYear();

// Start the silent loop when the figure first enters view. Native controls remain
// available, and a reader who pauses it is not forced back into playback.
const treeVideo = document.querySelector('#eukaryota-video');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
if (treeVideo) {
  treeVideo.muted = true;
  const videoObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      if (!reducedMotion.matches) treeVideo.play().catch(() => {});
      videoObserver.disconnect();
    }
  }, { threshold: 0.25 });
  videoObserver.observe(treeVideo);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) treeVideo.pause();
  });
}
