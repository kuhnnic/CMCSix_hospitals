window.CMCSIX_SUPABASE_CONFIG = window.CMCSIX_SUPABASE_CONFIG || {};
window.CMCSIX_SUPABASE_CONFIG.hospitalTable = 'sasis_hospitals_api';
const cmcsixScript = document.createElement('script');
cmcsixScript.src = 'assets/main-db.js?v=20260608-dbonly-api-view';
cmcsixScript.defer = true;
document.head.appendChild(cmcsixScript);
