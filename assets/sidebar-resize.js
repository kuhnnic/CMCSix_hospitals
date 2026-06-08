function cmcsixInstallSidebarResize() {
  const layout = document.querySelector('.layout');
  const aside = layout?.querySelector('aside');
  if (!layout || !aside || layout.dataset.resizeInstalled === 'true') return;

  layout.dataset.resizeInstalled = 'true';
  layout.classList.add('has-resizer');

  const saved = localStorage.getItem('cmcsix-sidebar-width');
  if (saved) layout.style.setProperty('--sidebar-width', saved + 'px');

  const handle = document.createElement('div');
  handle.className = 'sidebar-resizer';
  handle.title = 'Linke Spalte breiter oder schmaler ziehen';
  handle.setAttribute('role', 'separator');
  handle.setAttribute('aria-orientation', 'vertical');
  handle.setAttribute('tabindex', '0');
  aside.insertAdjacentElement('afterend', handle);

  function setWidth(clientX) {
    const rect = layout.getBoundingClientRect();
    const max = Math.min(620, Math.max(360, rect.width * 0.55));
    const width = Math.max(260, Math.min(max, Math.round(clientX - rect.left)));
    layout.style.setProperty('--sidebar-width', width + 'px');
    localStorage.setItem('cmcsix-sidebar-width', String(width));
  }

  handle.addEventListener('pointerdown', event => {
    event.preventDefault();
    handle.classList.add('dragging');
    document.body.classList.add('resizing-sidebar');
    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener('pointermove', event => {
    if (!handle.classList.contains('dragging')) return;
    setWidth(event.clientX);
  });

  function stopDrag() {
    handle.classList.remove('dragging');
    document.body.classList.remove('resizing-sidebar');
  }

  handle.addEventListener('pointerup', stopDrag);
  handle.addEventListener('pointercancel', stopDrag);

  handle.addEventListener('keydown', event => {
    const current = parseInt(getComputedStyle(layout).getPropertyValue('--sidebar-width')) || aside.getBoundingClientRect().width || 350;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const next = Math.max(260, current - 24);
      layout.style.setProperty('--sidebar-width', next + 'px');
      localStorage.setItem('cmcsix-sidebar-width', String(next));
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const next = Math.min(620, current + 24);
      layout.style.setProperty('--sidebar-width', next + 'px');
      localStorage.setItem('cmcsix-sidebar-width', String(next));
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', cmcsixInstallSidebarResize);
} else {
  cmcsixInstallSidebarResize();
}
