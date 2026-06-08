(function(){
  var CFG = window.CMCSIX_SUPABASE_CONFIG || {};
  var TABLE = CFG.table || 'beds';
  var HOSPITAL_TABLE = CFG.hospitalTable || 'sasis_hospitals_api';
  var STATION_TABLE = 'stations';
  var GENDER = [['unassigned','Nicht festgelegt'],['female','Weiblich'],['male','Männlich']];
  var FEATURE = { oxygen:'Sauerstoff', monitoring:'Monitoring', isolation:'Isolation', accessible:'Barrierefrei' };
  var sb = null, hospitals = [], stations = [], beds = [], rows = [];
  var sortKey = 'validity_area', sortDir = 'asc', loadError = '';
  var filters = { validity:'all', hospital:'all', specialty:'all', station:'all', gender:'all', feature:'all', room:'', search:'' };
  function $(s){ return document.querySelector(s); }
  var E = {};
  function initElements(){
    E.sync = $('#sync'); E.metrics = $('#metrics'); E.bars = $('#statusBars'); E.beds = $('#beds'); E.listInfo = $('#listInfo'); E.context = $('#contextLabel'); E.reset = $('#resetFilters');
    E.validity = $('#validity'); E.hospital = $('#hospital'); E.specialty = $('#specialty'); E.station = $('#station'); E.gender = $('#gender'); E.feature = $('#feature'); E.room = $('#room'); E.search = $('#search');
  }
  function esc(x){ return String(x == null ? '' : x).replace(/[&<>\"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]; }); }
  function sync(text, cls){
    if(!E.sync) return;
    E.sync.className = ('sync ' + (cls || '')).trim();
    var span = E.sync.querySelector('span');
    if(span) span.textContent = text;
  }
  function label(list,value){ for(var i=0;i<list.length;i++){ if(list[i][0]===value) return list[i][1]; } return value || ''; }
  function option(value,text,current){ return '<option value="'+esc(value)+'" '+(value===current?'selected':'')+'>'+esc(text)+'</option>'; }
  function uniq(arr){
    var seen = {}, out = [];
    for(var i=0;i<arr.length;i++){ var v = arr[i]; if(v && !seen[v]){ seen[v]=true; out.push(v); } }
    out.sort(function(a,b){ return String(a).localeCompare(String(b),'de',{numeric:true,sensitivity:'base'}); });
    return out;
  }
  function normBed(b){
    var g = (b.gender === 'female' || b.gender === 'male' || b.gender === 'unassigned') ? b.gender : 'unassigned';
    return Object.assign({}, b, { room:String(b.room || ''), bed:String(b.bed || ''), station_id:b.station_id || '', gender:g, status:'free' });
  }
  function buildRows(){
    var hMap = {}, sMap = {};
    hospitals.forEach(function(h){ hMap[h.id] = h; });
    stations.forEach(function(s){ sMap[s.id] = s; });
    rows = beds.map(function(b){
      var st = sMap[b.station_id] || {};
      var hp = hMap[b.hospital_id || st.hospital_id] || {};
      return Object.assign({}, b, {
        hospital_name: hp.name || '',
        validity_area: hp.validity_area || '',
        hospital_place: hp.place || '',
        station_name: st.name || b.station || '',
        station_code: st.code || '',
        station_floor: st.floor || '',
        specialty: st.specialty || b.specialty || ''
      });
    });
  }
  function featureText(r){
    var a = [];
    Object.keys(FEATURE).forEach(function(k){ if(r[k]) a.push(FEATURE[k]); });
    return a.join(' · ') || '-';
  }
  function featureChips(r){
    return Object.keys(FEATURE).map(function(k){ return '<span class="prop '+(r[k]?'yes':'')+'">'+FEATURE[k]+'</span>'; }).join('');
  }
  async function loadData(){
    if(!(CFG.url && CFG.anon && window.supabase && window.supabase.createClient)){
      loadError = 'Supabase Config fehlt oder Supabase Library wurde nicht geladen.';
      sync(loadError, 'err'); render(); return;
    }
    sb = window.supabase.createClient(CFG.url, CFG.anon);
    try{
      sync('Freie Betten werden aus Supabase geladen ...');
      var hPromise = sb.from(HOSPITAL_TABLE).select('*').order('sort_order',{ascending:true});
      var sPromise = sb.from(STATION_TABLE).select('*').order('hospital_id',{ascending:true}).order('sort_order',{ascending:true});
      var bPromise = sb.from(TABLE).select('*').eq('status','free').order('hospital_id',{ascending:true}).order('room',{ascending:true}).order('bed',{ascending:true});
      var result = await Promise.all([hPromise, sPromise, bPromise]);
      if(result[0].error) throw result[0].error;
      if(result[1].error) throw result[1].error;
      if(result[2].error) throw result[2].error;
      hospitals = result[0].data || [];
      stations = result[1].data || [];
      beds = (result[2].data || []).map(normBed);
      buildRows();
      loadError = '';
      sync('Supabase verbunden · Dashboard zeigt nur freie DB-Betten', 'ok');
      render();
    }catch(err){
      console.warn(err);
      loadError = err && err.message ? err.message : 'Freie Betten konnten nicht geladen werden.';
      hospitals = []; stations = []; beds = []; rows = [];
      sync('Freie Betten konnten nicht geladen werden', 'err');
      render();
    }
  }
  function filtered(){
    var r = rows.slice();
    if(filters.validity !== 'all') r = r.filter(function(x){ return x.validity_area === filters.validity; });
    if(filters.hospital !== 'all') r = r.filter(function(x){ return x.hospital_id === filters.hospital; });
    if(filters.specialty !== 'all') r = r.filter(function(x){ return x.specialty === filters.specialty; });
    if(filters.station !== 'all') r = r.filter(function(x){ return x.station_id === filters.station; });
    if(filters.gender !== 'all') r = r.filter(function(x){ return x.gender === filters.gender; });
    if(filters.feature !== 'all') r = r.filter(function(x){ return !!x[filters.feature]; });
    if(filters.room) r = r.filter(function(x){ return String(x.room).toLowerCase().indexOf(filters.room.toLowerCase()) >= 0; });
    if(filters.search){
      var q = filters.search.toLowerCase();
      r = r.filter(function(x){ return [x.validity_area,x.hospital_name,x.hospital_place,x.specialty,x.station_name,x.room,x.bed,x.type,x.notes,'Frei',label(GENDER,x.gender)].join(' ').toLowerCase().indexOf(q) >= 0; });
    }
    r.sort(compareRows);
    return r;
  }
  function valueForSort(row){
    if(sortKey === 'gender') return label(GENDER,row.gender);
    if(sortKey === 'features') return featureText(row);
    return row[sortKey] || '';
  }
  function compareRows(a,b){
    var cmp = String(valueForSort(a)).localeCompare(String(valueForSort(b)),'de',{numeric:true,sensitivity:'base'});
    if(cmp === 0) cmp = String(a.room).localeCompare(String(b.room),'de',{numeric:true});
    if(cmp === 0) cmp = String(a.bed).localeCompare(String(b.bed),'de',{numeric:true});
    return sortDir === 'asc' ? cmp : -cmp;
  }
  function sortButton(key,text){ var marker = sortKey===key ? (sortDir==='asc'?' ↑':' ↓') : ''; return '<button class="sort" type="button" data-sort="'+key+'">'+text+marker+'</button>'; }
  function updateOptions(){
    var baseValidity = filters.validity === 'all' ? rows : rows.filter(function(r){ return r.validity_area === filters.validity; });
    var baseHospital = filters.hospital === 'all' ? baseValidity : baseValidity.filter(function(r){ return r.hospital_id === filters.hospital; });
    var baseSpecialty = filters.specialty === 'all' ? baseHospital : baseHospital.filter(function(r){ return r.specialty === filters.specialty; });
    var validities = uniq(rows.map(function(r){ return r.validity_area; }));
    var hospitalIds = uniq(baseValidity.map(function(r){ return r.hospital_id; }));
    var specialties = uniq(baseHospital.map(function(r){ return r.specialty; }));
    var stationIds = uniq(baseSpecialty.map(function(r){ return r.station_id; }));
    if(filters.validity !== 'all' && validities.indexOf(filters.validity) < 0) filters.validity = 'all';
    if(filters.hospital !== 'all' && hospitalIds.indexOf(filters.hospital) < 0) filters.hospital = 'all';
    if(filters.specialty !== 'all' && specialties.indexOf(filters.specialty) < 0) filters.specialty = 'all';
    if(filters.station !== 'all' && stationIds.indexOf(filters.station) < 0) filters.station = 'all';
    if(E.validity) E.validity.innerHTML = option('all','Alle Gültigkeitsgebiete',filters.validity) + validities.map(function(v){ return option(v,v,filters.validity); }).join('');
    if(E.hospital) E.hospital.innerHTML = option('all','Alle Spitäler',filters.hospital) + hospitalIds.map(function(id){ var h = hospitals.find(function(x){ return x.id === id; }) || {}; return option(id,(h.validity_area || '') + ' · ' + (h.name || id),filters.hospital); }).join('');
    if(E.specialty) E.specialty.innerHTML = option('all','Alle Fachgebiete',filters.specialty) + specialties.map(function(v){ return option(v,v,filters.specialty); }).join('');
    if(E.station) E.station.innerHTML = option('all','Alle Stationen',filters.station) + stationIds.map(function(id){ var s = stations.find(function(x){ return x.id === id; }) || {}; return option(id,(s.name || id) + ' · ' + (s.specialty || ''),filters.station); }).join('');
    if(E.gender) E.gender.innerHTML = option('all','Alle Geschlechter',filters.gender) + GENDER.map(function(g){ return option(g[0],g[1],filters.gender); }).join('');
    if(E.feature) E.feature.value = filters.feature;
    if(E.room) E.room.value = filters.room;
    if(E.search) E.search.value = filters.search;
  }
  function renderMetrics(data){
    if(!E.metrics) return;
    var items = [
      ['Freie Betten',data.length,'aktuelle Auswahl'],
      ['Gültigkeitsgebiete',uniq(data.map(function(r){ return r.validity_area; })).length,'sichtbar'],
      ['Spitäler',uniq(data.map(function(r){ return r.hospital_id; })).length,'sichtbar'],
      ['Stationen',uniq(data.map(function(r){ return r.station_id; })).length,'sichtbar'],
      ['Fachgebiete',uniq(data.map(function(r){ return r.specialty; })).length,'sichtbar']
    ];
    E.metrics.innerHTML = items.map(function(m){ return '<article class="metric"><span>'+m[0]+'</span><strong>'+m[1]+'</strong><small>'+m[2]+'</small></article>'; }).join('');
  }
  function renderBars(data){
    if(!E.bars) return;
    var total = rows.length || 1;
    var pct = Math.round((data.length / total) * 100);
    E.bars.innerHTML = '<article class="status-tile"><span>Freie Betten<strong>'+data.length+'</strong></span><small>'+pct+'% der geladenen freien Betten</small><div class="bar free"><i style="width:'+pct+'%"></i></div></article><article class="status-tile"><span>Weitere Status<strong>nicht im Dashboard</strong></span><small>nur freie Betten werden geladen</small><div class="bar blocked"><i style="width:100%"></i></div></article>';
  }
  function renderContext(data){
    var parts = ['Nur freie Betten'];
    if(filters.validity !== 'all') parts.push('Gültigkeitsgebiet: ' + filters.validity);
    if(filters.hospital !== 'all'){ var h = hospitals.find(function(x){ return x.id === filters.hospital; }) || {}; parts.push('Spital: ' + (h.name || filters.hospital)); }
    if(filters.specialty !== 'all') parts.push('Fachgebiet: ' + filters.specialty);
    if(filters.station !== 'all'){ var s = stations.find(function(x){ return x.id === filters.station; }) || {}; parts.push('Station: ' + (s.name || filters.station)); }
    if(filters.gender !== 'all') parts.push('Geschlecht: ' + label(GENDER,filters.gender));
    if(filters.feature !== 'all') parts.push('Eigenschaft: ' + FEATURE[filters.feature]);
    if(filters.room) parts.push('Zimmer enthält: ' + filters.room);
    if(filters.search) parts.push('Suche: ' + filters.search);
    if(E.context) E.context.textContent = parts.join(' · ');
    if(E.listInfo) E.listInfo.textContent = data.length + ' von ' + rows.length + ' freien Betten';
  }
  function renderTable(data){
    if(!E.beds) return;
    if(loadError){ E.beds.innerHTML = '<section class="empty"><strong>Dashboard konnte nicht geladen werden</strong><p>'+esc(loadError)+'</p></section>'; return; }
    if(!data.length){ E.beds.innerHTML = '<section class="empty"><strong>Keine freien Betten gefunden</strong><p>Für diese Filterkombination gibt es keine freien DB-Betten.</p></section>'; return; }
    E.beds.innerHTML = '<div class="dash-head"><span>'+sortButton('validity_area','Gebiet')+'</span><span>'+sortButton('hospital_name','Spital')+'</span><span>'+sortButton('station_name','Station')+'</span><span>'+sortButton('specialty','Fachgebiet')+'</span><span>'+sortButton('room','Zimmer')+'</span><span>'+sortButton('bed','Bett')+'</span><span>Verfügbarkeit</span><span>'+sortButton('gender','Geschlecht')+'</span><span>'+sortButton('features','Eigenschaften')+'</span></div>' + data.map(function(r){ return '<div class="dash-row"><strong>'+esc(r.validity_area || '-')+'</strong><span>'+esc(r.hospital_name || '-')+'</span><span>'+esc(r.station_name || '-')+'</span><span>'+esc(r.specialty || '-')+'</span><span>Zimmer '+esc(r.room || '-')+'</span><span>Bett '+esc(r.bed || '-')+'</span><span><span class="badge free">Frei</span></span><span>'+esc(label(GENDER,r.gender))+'</span><span class="props">'+featureChips(r)+'</span></div>'; }).join('');
    E.beds.querySelectorAll('[data-sort]').forEach(function(btn){ btn.onclick = function(){ var key = btn.getAttribute('data-sort'); if(sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc'; else { sortKey = key; sortDir = 'asc'; } render(); }; });
  }
  function render(){
    updateOptions();
    var data = filtered();
    renderMetrics(data);
    renderBars(data);
    renderContext(data);
    renderTable(data);
  }
  function bind(){
    ['validity','hospital','specialty','station','gender','feature'].forEach(function(key){ if(E[key]) E[key].onchange = function(ev){ filters[key] = ev.target.value; render(); }; });
    if(E.room) E.room.oninput = function(ev){ filters.room = ev.target.value.trim(); render(); };
    if(E.search) E.search.oninput = function(ev){ filters.search = ev.target.value.trim(); render(); };
    if(E.reset) E.reset.onclick = function(){ filters = { validity:'all', hospital:'all', specialty:'all', station:'all', gender:'all', feature:'all', room:'', search:'' }; sortKey='validity_area'; sortDir='asc'; render(); };
  }
  document.addEventListener('DOMContentLoaded', function(){ initElements(); bind(); render(); loadData(); });
})();
