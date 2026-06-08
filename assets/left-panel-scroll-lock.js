function cmcsixInstallLeftPanelScrollLock() {
  var aside = document.querySelector('aside');
  if (!aside || aside.dataset.scrollLockInstalled === 'true') return;
  aside.dataset.scrollLockInstalled = 'true';

  aside.addEventListener('wheel', function(event) {
    var canScroll = aside.scrollHeight > aside.clientHeight;
    if (!canScroll) return;
    event.preventDefault();
    aside.scrollTop += event.deltaY;
  }, { passive: false });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', cmcsixInstallLeftPanelScrollLock);
} else {
  cmcsixInstallLeftPanelScrollLock();
}
