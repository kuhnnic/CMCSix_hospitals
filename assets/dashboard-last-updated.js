(function(){
  function injectStatusStyles(){
    if(document.getElementById('cmcsixStatusThemeStyle'))return;
    var style=document.createElement('style');
    style.id='cmcsixStatusThemeStyle';
    style.textContent='html[data-theme="light"] .sync{background:linear-gradient(145deg,rgba(255,255,255,.92),rgba(236,249,255,.88))!important;border-color:rgba(3,105,161,.18)!important;color:#0f2537!important;box-shadow:0 10px 26px rgba(3,105,161,.10)!important}html[data-theme="light"] .sync span{color:#0f2537!important;font-weight:850}html[data-theme="light"] .sync i{background:#0891b2!important;box-shadow:0 0 0 5px rgba(8,145,178,.12)!important}html[data-theme="light"] .sync.ok{background:linear-gradient(145deg,#f0fdf4,#ffffff)!important;border-color:rgba(22,163,74,.28)!important;color:#166534!important}html[data-theme="light"] .sync.ok span{color:#166534!important}html[data-theme="light"] .sync.ok i{background:#16a34a!important;box-shadow:0 0 0 5px rgba(22,163,74,.14)!important}html[data-theme="light"] .sync.err{background:linear-gradient(145deg,#fff7ed,#ffffff)!important;border-color:rgba(220,38,38,.24)!important;color:#991b1b!important}html[data-theme="light"] .sync.err span{color:#991b1b!important}html[data-theme="light"] .sync.err i{background:#dc2626!important;box-shadow:0 0 0 5px rgba(220,38,38,.12)!important}.dashboard-help-btn{width:42px;height:42px;display:inline-grid!important;place-items:center;border-radius:999px!important;font-size:1.15rem;font-weight:950!important;line-height:1;padding:.4rem!important}.dashboard-help-btn span{pointer-events:none}';
    document.head.appendChild(style);
  }
  function keepMapAfterReset(){
    var reset=document.getElementById('resetFilters');
    if(!reset||reset.dataset.keepMapBound==='1')return;
    reset.dataset.keepMapBound='1';
    reset.addEventListener('click',function(){
      var wasMap=document.body.classList.contains('map-mode')||(document.getElementById('mapToggle')||{}).classList&&document.getElementById('mapToggle').classList.contains('active');
      if(!wasMap)return;
      window.setTimeout(function(){var mapButton=document.getElementById('mapToggle');if(mapButton&&!mapButton.classList.contains('active'))mapButton.click();},80);
      window.setTimeout(function(){var mapButton=document.getElementById('mapToggle');if(mapButton&&!document.body.classList.contains('map-mode'))mapButton.click();},220);
    },true);
  }
  function helpDocument(){
    return '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CMCSix Dashboard Hilfe</title><style>body{margin:0;font-family:Inter,Arial,sans-serif;background:#07182a;color:#e8f7ff}header{position:sticky;top:0;background:linear-gradient(145deg,#082f49,#061627);padding:22px;border-bottom:1px solid rgba(103,232,249,.22);z-index:2}h1{margin:0 0 6px;font-size:1.55rem}p{color:#9ab4c9;line-height:1.55}.wrap{max-width:1040px;margin:auto;padding:18px}input{width:100%;box-sizing:border-box;margin-top:14px;padding:14px 16px;border-radius:16px;border:1px solid rgba(103,232,249,.24);background:#0f2537;color:#e8f7ff;font-size:1rem}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-top:18px}.card{padding:16px;border:1px solid rgba(103,232,249,.18);border-radius:18px;background:rgba(15,37,55,.78);box-shadow:0 16px 36px rgba(0,0,0,.22)}h2{margin:.1rem 0 .5rem;color:#67e8f9;font-size:1.02rem}.tag{display:inline-flex;margin:.2rem .2rem .2rem 0;padding:.25rem .5rem;border-radius:999px;background:rgba(34,197,94,.12);color:#bbf7d0;font-size:.78rem;font-weight:800}ul{padding-left:1.1rem;color:#d8edf7;line-height:1.55}.empty{display:none;margin-top:18px;padding:16px;border-radius:16px;background:#1f2937;color:#fca5a5}@media(prefers-color-scheme:light){body{background:#f4fbff;color:#0f2537}header{background:linear-gradient(145deg,#fff,#eaf8ff)}p{color:#557086}input,.card{background:#fff;color:#0f2537;border-color:rgba(3,105,161,.18)}h2{color:#0369a1}.tag{background:#dcfce7;color:#166534}}</style></head><body><header><div class="wrap"><h1>CMCSix Hospitals · Dashboard Hilfe</h1><p>Durchsuche die aktuelle Dokumentation zu Dashboard, Kartenansicht, Verwaltung, Filtern, Datenstand und typischen Use Cases.</p><input id="q" placeholder="Suchen, z. B. Bettentyp, Karte, freie Betten, Verwaltung, Datenstand ..." autofocus></div></header><main class="wrap"><div id="cards" class="grid">'+
    [
      ['Dashboard Übersicht','Zeigt nur Spitäler mit freien Betten. Die freien Betten werden aus Supabase geladen, pro Spital aggregiert und mit Fachgebiet, Geschlecht, Gültigkeitsgebiet und Bettentyp/Eigenschaften angezeigt.','dashboard freie betten übersicht aggregation fachgebiet gültigkeitsgebiet spital'],
      ['Filter','Oben stehen Filter für Gültigkeitsgebiet, Spital, Fachgebiet, Geschlecht, Bettentyp und Suche. Die Filter wirken auf Liste, Metriken und Kartenansicht. Zurücksetzen leert alle Filter.','filter gültigkeitsgebiet spital fachgebiet geschlecht bettentyp suche zurücksetzen'],
      ['Bettentyp','Der Bettentyp ist ein einfacher Dropdown-Filter. Er basiert auf Eigenschaften wie Sauerstoff, Monitoring, Isolation und Barrierefrei. In der Liste bleiben die Eigenschaften sichtbar.','bettentyp eigenschaften sauerstoff monitoring isolation barrierefrei dropdown'],
      ['Kartenansicht','Die Kartenansicht nutzt Leaflet und OpenStreetMap. Marker zeigen freie Betten pro Spital. Die rechte Spitalliste enthält nur Spitäler, die zu den aktuellen Filterkriterien passen. Klick auf ein Spital zeigt nur dieses Spital in der Karte.','kartenansicht leaflet openstreetmap marker rechte liste zoom spital filter'],
      ['Karte bedienen','Du kannst zoomen, verschieben und Marker anklicken. Im Marker-Popup gibt es die Möglichkeit, das gesamte Dashboard auf dieses Spital zu filtern. Über Alle gefilterten Spitäler anzeigen wird der lokale Kartenfilter zurückgesetzt.','karte zoom pan popup marker alle gefilterten spitäler anzeigen'],
      ['Datenstand & Supabase Status','Der Datenstand zeigt Datum und Uhrzeit der letzten Aktualisierung, soweit Zeitstempel in den freien Betten vorhanden sind. Der Supabase-Status zeigt Verbindung, Ladezustand oder Fehler.','datenstand datum uhrzeit supabase status verbindung aktualisierung'],
      ['Light / Dark Mode','Der Toggle im Header wechselt zwischen hellem Design und bestehendem dunklem Design. Die Auswahl wird lokal im Browser gespeichert.','light mode dark mode toggle design browser speichern'],
      ['Verwaltung','Die Verwaltungsansicht pflegt Stammdaten-Ergänzungen. SASIS-Daten werden nicht überschrieben; ergänzt werden Kontaktinformation und Bemerkungen.','verwaltung stammdaten sasis kontaktinformation bemerkungen'],
      ['Typische Use Cases','Freie Betten nach Region finden, Fachgebiet filtern, Spitalstandort auf Karte prüfen, verfügbare Bettentypen suchen, Kontaktinformationen in der Verwaltung ergänzen.','use cases region fachgebiet standort kontakt freie betten']
    ].map(function(c){return '<section class="card" data-search="'+c.join(' ').toLowerCase().replace(/"/g,'')+'"><h2>'+c[0]+'</h2><p>'+c[1]+'</p><span class="tag">Dokumentation</span></section>'}).join('')+
    '</div><div id="empty" class="empty">Keine Treffer gefunden.</div></main><script>var q=document.getElementById("q"),cards=[].slice.call(document.querySelectorAll(".card")),empty=document.getElementById("empty");q.addEventListener("input",function(){var s=q.value.toLowerCase().trim(),n=0;cards.forEach(function(c){var show=!s||c.dataset.search.indexOf(s)>-1;c.style.display=show?"block":"none";if(show)n++});empty.style.display=n?"none":"block"});</script></body></html>';
  }
  function openHelp(){
    var w=window.open('','cmcsixDashboardHelp','width=980,height=760,scrollbars=yes,resizable=yes');
    if(!w){alert('Bitte Pop-ups erlauben, um die Dashboard-Hilfe zu öffnen.');return;}
    w.document.open();w.document.write(helpDocument());w.document.close();
  }
  function installHelpButton(){
    var nav=document.querySelector('.dash-nav');
    if(!nav||document.getElementById('dashboardHelpButton'))return;
    var btn=document.createElement('button');
    btn.id='dashboardHelpButton';btn.className='dashboard-help-btn';btn.type='button';btn.title='Dashboard-Hilfe öffnen';btn.setAttribute('aria-label','Dashboard-Hilfe öffnen');btn.innerHTML='<span>?</span>';
    btn.onclick=openHelp;
    nav.insertBefore(btn,nav.firstChild);
  }
  function formatDate(date){try{return new Intl.DateTimeFormat('de-CH',{dateStyle:'medium',timeStyle:'short'}).format(date)}catch(e){return date.toLocaleString('de-CH')}}
  function parseDate(value){if(!value)return null;var date=new Date(value);return isNaN(date.getTime())?null:date;}
  function newestDate(rows){var fields=['updated_at','updatedAt','last_updated','lastUpdated','modified_at','created_at','createdAt'],best=null;(rows||[]).forEach(function(row){fields.forEach(function(field){var date=parseDate(row&&row[field]);if(date&&(!best||date>best))best=date;});});return best;}
  function ensureIndicator(){injectStatusStyles();keepMapAfterReset();installHelpButton();var existing=document.getElementById('dataLastUpdated');if(existing)return existing;var header=document.querySelector('.dash-hero');if(!header||!header.parentNode)return null;var box=document.createElement('section');box.id='dataLastUpdated';box.className='data-last-updated';box.innerHTML='<span>Datenstand</span><strong>Wird geladen …</strong><small>Datum und Uhrzeit der letzten Aktualisierung</small>';header.insertAdjacentElement('afterend',box);return box;}
  function setIndicator(date,source){var box=ensureIndicator();if(!box)return;var strong=box.querySelector('strong'),small=box.querySelector('small');if(strong)strong.textContent=formatDate(date);if(small)small.textContent=source||'Datum und Uhrzeit der letzten Aktualisierung';}
  async function loadTimestamp(){ensureIndicator();var cfg=window.CMCSIX_SUPABASE_CONFIG||{};if(!(cfg.url&&cfg.anon&&window.supabase&&window.supabase.createClient)){setIndicator(new Date(),'Ladezeitpunkt · Supabase nicht verfügbar');return;}try{var client=window.supabase.createClient(cfg.url,cfg.anon);var table=cfg.table||'beds';var result=await client.from(table).select('*').eq('status','free').limit(1000);if(result.error)throw result.error;var newest=newestDate(result.data||[]);setIndicator(newest||new Date(),newest?'Neuester Zeitstempel aus freien Betten':'Ladezeitpunkt · kein Daten-Zeitstempel gefunden');}catch(error){console.warn('Last updated indicator fallback:',error);setIndicator(new Date(),'Ladezeitpunkt · Datenstand konnte nicht ermittelt werden');}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadTimestamp);else loadTimestamp();
})();
