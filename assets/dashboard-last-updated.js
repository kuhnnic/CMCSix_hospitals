(function(){
  function injectStatusStyles(){
    if(document.getElementById('cmcsixStatusThemeStyle'))return;
    var style=document.createElement('style');
    style.id='cmcsixStatusThemeStyle';
    style.textContent='html[data-theme="light"] .sync{background:linear-gradient(145deg,rgba(255,255,255,.92),rgba(236,249,255,.88))!important;border-color:rgba(3,105,161,.18)!important;color:#0f2537!important;box-shadow:0 10px 26px rgba(3,105,161,.10)!important}html[data-theme="light"] .sync span{color:#0f2537!important;font-weight:850}html[data-theme="light"] .sync i{background:#0891b2!important;box-shadow:0 0 0 5px rgba(8,145,178,.12)!important}html[data-theme="light"] .sync.ok{background:linear-gradient(145deg,#f0fdf4,#ffffff)!important;border-color:rgba(22,163,74,.28)!important;color:#166534!important}html[data-theme="light"] .sync.ok span{color:#166534!important}html[data-theme="light"] .sync.ok i{background:#16a34a!important;box-shadow:0 0 0 5px rgba(22,163,74,.14)!important}html[data-theme="light"] .sync.err{background:linear-gradient(145deg,#fff7ed,#ffffff)!important;border-color:rgba(220,38,38,.24)!important;color:#991b1b!important}html[data-theme="light"] .sync.err span{color:#991b1b!important}html[data-theme="light"] .sync.err i{background:#dc2626!important;box-shadow:0 0 0 5px rgba(220,38,38,.12)!important}';
    document.head.appendChild(style);
  }
  function keepMapAfterReset(){
    var reset=document.getElementById('resetFilters');
    if(!reset||reset.dataset.keepMapBound==='1')return;
    reset.dataset.keepMapBound='1';
    reset.addEventListener('click',function(){
      var wasMap=document.body.classList.contains('map-mode')||(document.getElementById('mapToggle')||{}).classList&&document.getElementById('mapToggle').classList.contains('active');
      if(!wasMap)return;
      window.setTimeout(function(){
        var mapButton=document.getElementById('mapToggle');
        if(mapButton&&!mapButton.classList.contains('active'))mapButton.click();
      },80);
      window.setTimeout(function(){
        var mapButton=document.getElementById('mapToggle');
        if(mapButton&&!document.body.classList.contains('map-mode'))mapButton.click();
      },220);
    },true);
  }
  function formatDate(date){
    try{return new Intl.DateTimeFormat('de-CH',{dateStyle:'medium',timeStyle:'short'}).format(date)}
    catch(e){return date.toLocaleString('de-CH')}
  }
  function parseDate(value){
    if(!value)return null;
    var date=new Date(value);
    return isNaN(date.getTime())?null:date;
  }
  function newestDate(rows){
    var fields=['updated_at','updatedAt','last_updated','lastUpdated','modified_at','created_at','createdAt'];
    var best=null;
    (rows||[]).forEach(function(row){
      fields.forEach(function(field){
        var date=parseDate(row&&row[field]);
        if(date&&(!best||date>best))best=date;
      });
    });
    return best;
  }
  function ensureIndicator(){
    injectStatusStyles();
    keepMapAfterReset();
    var existing=document.getElementById('dataLastUpdated');
    if(existing)return existing;
    var header=document.querySelector('.dash-hero');
    if(!header||!header.parentNode)return null;
    var box=document.createElement('section');
    box.id='dataLastUpdated';
    box.className='data-last-updated';
    box.innerHTML='<span>Datenstand</span><strong>Wird geladen …</strong><small>Datum und Uhrzeit der letzten Aktualisierung</small>';
    header.insertAdjacentElement('afterend',box);
    if(!document.getElementById('dataLastUpdatedStyle')){
      var style=document.createElement('style');
      style.id='dataLastUpdatedStyle';
      style.textContent='.data-last-updated{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:14px 0 0;padding:12px 16px;border:1px solid rgba(15,118,110,.18);border-radius:20px;background:rgba(255,255,255,.76);box-shadow:0 14px 34px rgba(13,63,58,.10);backdrop-filter:blur(10px)}.data-last-updated span{color:var(--muted,#64748b);font-weight:900;text-transform:uppercase;letter-spacing:.08em;font-size:.74rem}.data-last-updated strong{color:var(--text,#0f172a);font-weight:950}.data-last-updated small{color:var(--muted,#64748b);font-weight:700}@media(prefers-color-scheme:dark){.data-last-updated{background:rgba(15,23,42,.72)}}';
      document.head.appendChild(style);
    }
    return box;
  }
  function setIndicator(date,source){
    var box=ensureIndicator();
    if(!box)return;
    var strong=box.querySelector('strong');
    var small=box.querySelector('small');
    if(strong)strong.textContent=formatDate(date);
    if(small)small.textContent=source||'Datum und Uhrzeit der letzten Aktualisierung';
  }
  async function loadTimestamp(){
    ensureIndicator();
    var cfg=window.CMCSIX_SUPABASE_CONFIG||{};
    if(!(cfg.url&&cfg.anon&&window.supabase&&window.supabase.createClient)){
      setIndicator(new Date(),'Ladezeitpunkt · Supabase nicht verfügbar');
      return;
    }
    try{
      var client=window.supabase.createClient(cfg.url,cfg.anon);
      var table=cfg.table||'beds';
      var query=client.from(table).select('*').eq('status','free').limit(1000);
      var result=await query;
      if(result.error)throw result.error;
      var newest=newestDate(result.data||[]);
      setIndicator(newest||new Date(),newest?'Neuester Zeitstempel aus freien Betten':'Ladezeitpunkt · kein Daten-Zeitstempel gefunden');
    }catch(error){
      console.warn('Last updated indicator fallback:',error);
      setIndicator(new Date(),'Ladezeitpunkt · Datenstand konnte nicht ermittelt werden');
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadTimestamp);else loadTimestamp();
})();
