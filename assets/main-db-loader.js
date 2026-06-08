window.CMCSIX_SUPABASE_CONFIG = window.CMCSIX_SUPABASE_CONFIG || {};
window.CMCSIX_SUPABASE_CONFIG.hospitalTable = 'sasis_hospitals_api';

const cmcsixScript = document.createElement('script');
cmcsixScript.src = 'assets/main-db.js?v=20260608-dbonly-api-view-init';
cmcsixScript.async = false;
cmcsixScript.onload = () => {
  if (document.readyState !== 'loading') {
    document.dispatchEvent(new Event('DOMContentLoaded'));
  }
};
document.head.appendChild(cmcsixScript);
