window.CMCSIX_SUPABASE_CONFIG = window.CMCSIX_SUPABASE_CONFIG || {};
window.CMCSIX_SUPABASE_CONFIG.hospitalTable = 'sasis_hospitals_api';

const cmcsixScript = document.createElement('script');
cmcsixScript.src = 'assets/main-db.js?v=20260608-multi-status-v1';
cmcsixScript.async = false;
cmcsixScript.onload = () => {
  if (typeof window.init === 'function') window.init();
};
document.head.appendChild(cmcsixScript);
