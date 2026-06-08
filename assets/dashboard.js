const CFG = window.CMCSIX_SUPABASE_CONFIG || {};
const TABLE = CFG.table || 'beds';
const HOSPITAL_TABLE = CFG.hospitalTable || 'sasis_hospitals_api';
const STATION_TABLE = 'stations';
const STATUS = [['free','Frei'],['reserved','Reserviert'],['occupied','Belegt'],['cleaning','Reinigung'],['blocked','Gesperrt']];
const GENDER = [['unassigned','Nicht festgelegt'],['female','Weiblich'],['male','Männlich']];
const FEATURE = { oxygen:'Sauerstoff', monitoring:'Monitoring', isolation:'Isolation', accessible:'Barrierefrei' };
let sb, hospitals = [], stations = [], beds = [], rows = [], sortKey = 'validity_area', sortDir = 'asc';
let filters = { validity:'all', hospital:'all', specialty:'all', station:'all', status:'all', gender:'all', feature:'all', room:'', search:'' };
const $ = s => document.querySelector(s);
const E = { sync:$('#sync'), metrics:$('#metrics'), bars:$('#statusBars'), beds:$('#beds'), listInfo:$('#listInfo'), context:$('#contextLabel'), reset:$('#resetFilters'), validity:$('#validity'), hospital:$('#hospital'), specialty:$('#specialty'), station:$('#station'), status:$('#status'), gender:$('#gender'), feature:$('#feature'), room:$('#room'), search:$('#search') };
function esc(x){return String(x ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function sync(t,c=''){E.sync.className = `sync ${c}`.trim(); E.sync.querySelector('span').textContent = t}
function label(list,v){return (list.find(x=>x[0]===v)||[v,v])[1]}
function opt(value,text,current){return `<option value="${esc(value)}" ${value===current?'selected':''}>${esc(text)}</option>`}
function uniq(arr){return [...new Set(arr.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'de',{numeric:true,sensitivity:'base'}))}
function normBed(b){return {...b, room:String(b.room||''), bed:String(b.bed||''), station_id:b.station_id||'', gender:['unassigned','female','male'].includes(b.gender)?b.gender:'unassigned', status:b.status||'free'}}
function buildRows(){
  const hMap = new Map(hospitals.map(h => [h.id, h]));
  const sMap = new Map(stations.map(s => [s.id, s]));
  rows = beds.map(b => {
    const station = sMap.get(b.station_id) || {};
    const hospital = hMap.get(b.hospital_id || station.hospital_id) || {};
    return {
      ...b,
      hospital_name: hospital.name || '',
      validity_area: hospital.validity_area || '',
      hospital_place: hospital.place || '',
      station_name: station.name || b.station || '',
      station_code: station.code || '',
      station_floor: station.floor || '',
      specialty: station.specialty || b.specialty || ''
    };
  });
}
async function loadData(){
  if (!(CFG.url && CFG.anon && window.supabase?.createClient)) { sync('Supabase Config fehlt · Dashboard zeigt keine lokalen Daten','err'); return; }
  sb = window.supabase.createClient(CFG.url, CFG.anon);
  try {
    sync('Live-Daten werden aus Supabase geladen ...');
    const [hRes, sRes, bRes] = await Promise.all([
      sb.from(HOSPITAL_TABLE).select('*').order('sort_order',{ascending:true}),
      sb.from(STATION_TABLE).select('*').order('hospital_id',{ascending:true}).order('sort_order',{ascending:true}),
      sb.from(TABLE).select('*').order('hospital_id',{ascending:true}).order('room',{ascending:true}).order('bed',{ascending:true})
    ]);
    if (hRes.error) throw hRes.error;
    if (sRes.error) throw sRes.error;
    if (bRes.error) throw bRes.error;
    hospitals = hRes.data || [];
    stations = sRes.data || [];
    beds = (bRes.data || []).map(normBed);
    buildRows();
    sync('Supabase verbunden · Dashboard nutzt nur DB-Daten','ok');
    render();
  } catch (err) {
    console.warn(err);
    hospitals = []; stations = []; beds = []; rows = [];
    sync('Dashboard-Daten konnten nicht geladen werden','err');
    render();
  }
}
function filtered(base = rows){
  let r = [...base];
  if(filters.validity !== 'all') r = r.filter(x => x.validity_area === filters.validity);
  if(filters.hospital !== 'all') r = r.filter(x => x.hospital_id === filters.hospital);
  if(filters.specialty !== 'all') r = r.filter(x => x.specialty === filters.specialty);
  if(filters.station !== 'all') r = r.filter(x => x.station_id === filters.station);
  if(filters.status !== 'all') r = r.filter(x => x.status === filters.status);
  if(filters.gender !== 'all') r = r.filter(x => x.gender === filters.gender);
  if(filters.feature !== 'all') r = r.filter(x => !!x[filters.feature]);
  if(filters.room) r = r.filter(x => String(x.room).toLowerCase().includes(filters.room.toLowerCase()));
  if(filters.search){
    const q = filters.search.toLowerCase();
    r = r.filter(x => [x.validity_area,x.hospital_name,x.hospital_place,x.specialty,x.station_name,x.room,x.bed,x.type,x.notes,label(STATUS,x.status),label(GENDER,x.gender)].join(' ').toLowerCase().includes(q));
  }
  return r.sort(compareRows);
}
function valueForSort(row){
  if(sortKey === 'status') return label(STATUS,row.status);
  if(sortKey === 'gender') return label(GENDER,row.gender);
  if(sortKey === 'features') return featureText(row);
  return row[sortKey] || '';
}
function compareRows(a,b){
  let cmp = String(valueForSort(a)).localeCompare(String(valueForSort(b)),'de',{numeric:true,sensitivity:'base'});
  if(cmp === 0) cmp = String(a.room).localeCompare(String(b.room),'de',{numeric:true});
  if(cmp === 0) cmp = String(a.bed).localeCompare(String(b.bed),'de',{numeric:true});
  return sortDir === 'asc' ? cmp : -cmp;
}
function sortButton(key,text){const marker = sortKey===key ? (sortDir==='asc'?' ↑':' ↓') : ''; return `<button class="sort" type="button" data-sort="${key}">${text}${marker}</button>`}
function featureText(r){return Object.entries(FEATURE).filter(([k])=>r[k]).map(([,v])=>v).join(' · ') || '-'}
function featureChips(r){return Object.entries(FEATURE).map(([k,v]) => `<span class="prop ${r[k]?'yes':''}">${v}</span>`).join('')}
function updateDependentOptions(){
  const baseValidity = filters.validity === 'all' ? rows : rows.filter(r => r.validity_area === filters.validity);
  const baseHospital = filters.hospital === 'all' ? baseValidity : baseValidity.filter(r => r.hospital_id === filters.hospital);
  const baseSpecialty = filters.specialty === 'all' ? baseHospital : baseHospital.filter(r => r.specialty === filters.specialty);
  const validities = uniq(rows.map(r => r.validity_area));
  const hospitalIds = uniq(baseValidity.map(r => r.hospital_id));
  const specialties = uniq(baseHospital.map(r => r.specialty));
  const stationIds = uniq(baseSpecialty.map(r => r.station_id));
  if(!validities.includes(filters.validity)) filters.validity='all';
  if(filters.hospital !== 'all' && !hospitalIds.includes(filters.hospital)) filters.hospital='all';
  if(filters.specialty !== 'all' && !specialties.includes(filters.specialty)) filters.specialty='all';
  if(filters.station !== 'all' && !stationIds.includes(filters.station)) filters.station='all';
  E.validity.innerHTML = opt('all','Alle Gültigkeitsgebiete',filters.validity) + validities.map(v=>opt(v,v,filters.validity)).join('');
  E.hospital.innerHTML = opt('all','Alle Spitäler',filters.hospital) + hospitalIds.map(id=>{const h=hospitals.find(x=>x.id===id)||{};return opt(id,`${h.validity_area||''} · ${h.name||id}`,filters.hospital)}).join('');
  E.specialty.innerHTML = opt('all','Alle Fachgebiete',filters.specialty) + specialties.map(v=>opt(v,v,filters.specialty)).join('');
  E.station.innerHTML = opt('all','Alle Stationen',filters.station) + stationIds.map(id=>{const s=stations.find(x=>x.id===id)||{};return opt(id,`${s.name||id} · ${s.specialty||''}`,filters.station)}).join('');
  E.status.innerHTML = opt('all','Alle Status',filters.status) + STATUS.map(([v,t])=>opt(v,t,filters.status)).join('');
  E.gender.innerHTML = opt('all','Alle Geschlechter',filters.gender) + GENDER.map(([v,t])=>opt(v,t,filters.gender)).join('');
  E.feature.value = filters.feature;
  E.room.value = filters.room;
  E.search.value = filters.search;
}
function renderMetrics(data){
  const total=data.length, free=data.filter(r=>r.status==='free').length, occupied=data.filter(r=>r.status==='occupied').length, reserved=data.filter(r=>r.status==='reserved').length;
  const usable=data.filter(r=>!['blocked','cleaning'].includes(r.status)).length;
  const util=usable?Math.round(occupied/usable*100):0;
  const hospitalsCount=uniq(data.map(r=>r.hospital_id)).length;
  E.metrics.innerHTML = [
    ['Betten',total,'aktuelle Auswahl'],
    ['Gültigkeitsgebiete',uniq(data.map(r=>r.validity_area)).length,'sichtbar'],
    ['Spitäler',hospitalsCount,'sichtbar'],
    ['Frei',free,'verfügbar'],
    ['Auslastung',util+'%','belegt / nutzbar']
  ].map(m=>`<article class="metric"><span>${m[0]}</span><strong>${m[1]}</strong><small>${m[2]}</small></article>`).join('');
}
function renderBars(data){
  const total = data.length || 1;
  E.bars.innerHTML = STATUS.map(([key,name]) => {
    const count = data.filter(r=>r.status===key).length;
    const pct = Math.round(count/total*100);
    return `<article class="status-tile"><span>${name}<strong>${count}</strong></span><small>${pct}% der Auswahl</small><div class="bar ${key}"><i style="width:${pct}%"></i></div></article>`;
  }).join('');
}
function renderContext(data){
  const parts=[];
  if(filters.validity!=='all') parts.push('Gültigkeitsgebiet: '+filters.validity);
  if(filters.hospital!=='all') parts.push('Spital: '+(hospitals.find(h=>h.id===filters.hospital)?.name||filters.hospital));
  if(filters.specialty!=='all') parts.push('Fachgebiet: '+filters.specialty);
  if(filters.station!=='all') parts.push('Station: '+(stations.find(s=>s.id===filters.station)?.name||filters.station));
  if(filters.status!=='all') parts.push('Status: '+label(STATUS,filters.status));
  if(filters.gender!=='all') parts.push('Geschlecht: '+label(GENDER,filters.gender));
  if(filters.feature!=='all') parts.push('Eigenschaft: '+FEATURE[filters.feature]);
  if(filters.room) parts.push('Zimmer enthält: '+filters.room);
  if(filters.search) parts.push('Suche: '+filters.search);
  E.context.textContent = parts.length ? parts.join(' · ') : 'Keine Filter aktiv';
  E.listInfo.textContent = `${data.length} von ${rows.length} Betten`;
}
function renderTable(data){
  if(!data.length){E.beds.innerHTML='<section class="empty"><strong>Keine Betten gefunden</strong><p>Für diese Filterkombination gibt es keine DB-Daten.</p></section>';return}
  E.beds.innerHTML = `<div class="dash-head"><span>${sortButton('validity_area','Gebiet')}</span><span>${sortButton('hospital_name','Spital')}</span><span>${sortButton('station_name','Station')}</span><span>${sortButton('specialty','Fachgebiet')}</span><span>${sortButton('room','Zimmer')}</span><span>${sortButton('bed','Bett')}</span><span>${sortButton('status','Status')}</span><span>${sortButton('gender','Geschlecht')}</span><span>${sortButton('features','Eigenschaften')}</span></div>` + data.map(r => `<div class="dash-row"><strong>${esc(r.validity_area||'-')}</strong><span>${esc(r.hospital_name||'-')}</span><span>${esc(r.station_name||'-')}</span><span>${esc(r.specialty||'-')}</span><span>Zimmer ${esc(r.room||'-')}</span><span>Bett ${esc(r.bed||'-')}</span><span><span class="badge ${esc(r.status)}">${esc(label(STATUS,r.status))}</span></span><span>${esc(label(GENDER,r.gender))}</span><span class="props">${featureChips(r)}</span></div>`).join('');
  E.beds.querySelectorAll('[data-sort]').forEach(btn => btn.onclick = () => { const key=btn.dataset.sort; if(sortKey===key) sortDir=sortDir==='asc'?'desc':'asc'; else {sortKey=key; sortDir='asc'} render(); });
}
function render(){
  updateDependentOptions();
  const data = filtered();
  renderMetrics(data);
  renderBars(data);
  renderContext(data);
  renderTable(data);
}
function bind(){
  ['validity','hospital','specialty','station','status','gender','feature'].forEach(key => E[key].onchange = e => { filters[key]=e.target.value; render(); });
  E.room.oninput = e => { filters.room = e.target.value.trim(); render(); };
  E.search.oninput = e => { filters.search = e.target.value.trim(); render(); };
  E.reset.onclick = () => { filters = { validity:'all', hospital:'all', specialty:'all', station:'all', status:'all', gender:'all', feature:'all', room:'', search:'' }; sortKey='validity_area'; sortDir='asc'; render(); };
}
document.addEventListener('DOMContentLoaded', () => { bind(); loadData(); });
