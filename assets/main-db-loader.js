window.CMCSIX_SUPABASE_CONFIG = window.CMCSIX_SUPABASE_CONFIG || {};
window.CMCSIX_SUPABASE_CONFIG.hospitalTable = 'sasis_hospitals_api';

const cmcsixScript = document.createElement('script');
cmcsixScript.src = 'assets/main-db.js?v=20260608-loader-direct-init';
cmcsixScript.async = false;
cmcsixScript.onload = () => {
  if (typeof window.init === 'function') {
    window.init();
  } else {
    const sync = document.querySelector('#sync span');
    if (sync) sync.textContent = 'App konnte nicht initialisiert werden';
    console.error('CMCSix init function not found after main-db.js load');
  }
};
cmcsixScript.onerror = () => {
  const sync = document.querySelector('#sync span');
  if (sync) sync.textContent = 'App-Datei konnte nicht geladen werden';
  console.error('CMCSix main-db.js could not be loaded');
};
document.head.appendChild(cmcsixScript);
