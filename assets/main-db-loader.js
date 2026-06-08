window.CMCSIX_SUPABASE_CONFIG = window.CMCSIX_SUPABASE_CONFIG || {};
window.CMCSIX_SUPABASE_CONFIG.hospitalTable = 'sasis_hospitals_api';

const legacyLeftStatus = document.querySelector('aside #status');
if (legacyLeftStatus) {
  const legacyField = legacyLeftStatus.closest('.field');
  if (legacyField) legacyField.remove();
}

const cmcsixScript = document.createElement('script');
cmcsixScript.src = 'assets/main-db.js?v=20260608-overview-list-v1';
cmcsixScript.async = false;
cmcsixScript.onload = () => {
  if (typeof window.init === 'function') window.init();
};
document.head.appendChild(cmcsixScript);
