const CONFIG = window.CMCSIX_DASHBOARD_SUPABASE_CONFIG || {};
const BEDS_TABLE = CONFIG.bedsTable || 'beds';
const PROFILES_TABLE = CONFIG.profilesTable || 'hospital_profiles';
const REFRESH_MS = Number(CONFIG.refreshMs || 300000);
const LS_FILTERS = 'cmcsix.dashboard.filters.v1';
const LS_PROFILES = 'cmcsix.dashboard.profiles.v1';

const RAW_HOSPITALS = [
  ['luks-luzern','LUKS Spitalbetriebe AG','Kantonsspital 37','6004 Luzern','Luzern','Spitäler','Zentrumsversorgung, Niveau 2','X067503','7601002126694'],
  ['luks-sursee','LUKS Spitalbetriebe AG','Spitalstrasse 16A','6210 Sursee','Luzern','Spitäler','Zentrumsversorgung, Niveau 2','A626203','7601002003056'],
  ['luks-wolhusen','LUKS Spitalbetriebe AG','Spitalstrasse 50','6110 Wolhusen','Luzern','Spitäler','Zentrumsversorgung, Niveau 2','A623603','7601002003070'],
  ['luks-ks37','LUKS Spitalbetriebe AG','Kantonsspital 37','6004 Luzern','Luzern','Spitäler','Zentrumsversorgung, Niveau 2','A621003','7601009329302'],
  ['st-anna','Klinik St. Anna','St. Anna-Strasse 32','6006 Luzern','Luzern','Spitäler','Zentrumsversorgung, Niveau 2','O709403','7601002002967'],
  ['sonnmatt','Zurzach Care Rehaklinik Sonnmatt Luzern','Sonnmatt 1','6006 Luzern','Luzern','Spitäler','Rehabilitationskliniken','J167703','7601002521871'],
  ['ks-aarau','Kantonsspital Aarau AG','Tellstrasse','5001 Aarau','Aargau','Spitäler','Zentrumsversorgung, Niveau 2','M700419','7601002001137'],
  ['ks-obwalden','Kantonsspital Obwalden','Brünigstrasse 181','6060 Sarnen','Obwalden','Spitäler','Grundversorgung, Niveau 3','B708006','7601002000222'],
  ['lups-sarnen','Luzerner Psychiatrie AG','Brünigstrasse 183','6060 Sarnen','Obwalden','Spitäler','Psychiatrische Kliniken, Niveau 1','K012606','7601002523707'],
  ['spital-nidwalden','Spital Nidwalden','Ennetmooserstrasse 19','6370 Stans','Nidwalden','Spitäler','Grundversorgung, Niveau 4','G709007','7601002003179'],
  ['forensik','Forensische Psychiatrie','Seeblickstrasse 3','8596 Münsterlingen','Thurgau','Spitäler','Psychiatrische Kliniken, Niveau 1','I551820','7601002023153'],
  ['kjpd','Kinder- und Jugendpsychiatrischer Dienst - KJPD','Seeblickstrasse 3','8596 Münsterlingen','Thurgau','Spitäler','Psychiatrische Kliniken, Niveau 1','N777320','7601002023153'],
  ['ksk','Klinik St. Katharinental (KSK)','St. Katharinental 7','8253 Diessenhofen','Thurgau','Spitäler','Rehabilitationskliniken','A703720','7601002003667'],
  ['pk-muensterlingen','Psychiatrische Klinik Münsterlingen','Seeblickstrasse 3','8596 Münsterlingen','Thurgau','Spitäler','Psychiatrische Kliniken, Niveau 1','A714420','7601002023153'],
  ['stg-frauenfeld','Spital Thurgau AG','Pfaffenholzstrasse 4','8500 Frauenfeld','Thurgau','Spitäler','Zentrumsversorgung, Niveau 2','P706820','7601002000185'],
  ['stg-muensterlingen','Spital Thurgau AG','Spitalcampus 1','8596 Münsterlingen','Thurgau','Spitäler','Zentrumsversorgung, Niveau 2','X714320','7601002000543']
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const slug = (value) => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const hospitals = RAW_HOSPITALS.map((row) => ({
  id: row[0], name: row[1], street: row[2], place: row[3], region: row[4], partnerGroup: row[5], category: row[6], zsr: row[7], gln: String(row[8]), address: `${row[2]}, ${row[3]}`, specialties: specialtiesFor(row[6])
}));

let supabaseClient = null;
let beds = [];
let profiles = JSON.parse(localStorage.getItem(LS_PROFILES) || '{}');
let selectedProfileHospital = hospitals[0].id;
let usingRemoteBeds = false;
let usingRemoteProfiles = false;
let realtimeChannel = null;
let refreshTimer = null;
let filters = { region: 'all', hospital: 'all', specialty: 'all', telemetry: 'all', gender: 'all', search: '' };

const E = {
  syncBadge: $('#syncBadge'), lastUpdated: $('#lastUpdated'), hospitalCount: $('#hospitalCount'), tabs: $$('.tab'), overviewView: $('#overviewView'), adminView: $('#adminView'),
  region: $('#regionFilter'), hospital: $('#hospitalFilter'), specialty: $('#specialtyFilter'), telemetry: $('#telemetryFilter'), gender: $('#genderFilter'), search: $('#searchFilter'), resetFilters: $('#resetFilters'),
  kpis: $('#kpis'), results: $('#hospitalResults'), resultContext: $('#resultContext'), adminList: $('#adminHospitalList'), form: $('#profileForm'), readonly: $('#readonlySasis'), contact: $('#contactInfo'), remarks: $('#remarks'), clearProfile: $('#clearProfile'), profileSync: $('#profileSync'), toast: $('#toast')
};

function specialtiesFor(category) {
  if (category.includes('Psychiatr')) return ['Akutpsychiatrie','Alterspsychiatrie','Kinder-/Jugendpsychiatrie','Krisenintervention'];
  if (category.includes('Rehabil')) return ['Rehabilitation','Geriatrische Reha','Neurologische Reha','Orthopädische Reha'];
  if (category.includes('Grundversorgung')) return ['Innere Medizin','Chirurgie','Notfall','Geriatrie'];
  return ['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'];
}
function setSync(text, state = '') { E.syncBadge.className = `sync-badge ${state}`.trim(); E.syncBadge.querySelector('span').textContent = text; }
function setProfileSync(text, remote) { usingRemoteProfiles = !!remote; E.profileSync.textContent = text; }
function toast(text) { E.toast.textContent = text; E.toast.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => E.toast.classList.remove('show'), 2400); }
function formatTime(date = new Date()) { return new Intl.DateTimeFormat('de-CH', {dateStyle:'short', timeStyle:'medium'}).format(date); }
function hospitalById(id) { return hospitals.find((hospital) => hospital.id === id) || hospitals[0]; }
function normalizeGender(value) { const raw = String(value || '').toLowerCase(); if (['f','frau','female','weiblich'].includes(raw)) return 'female'; if (['m','mann','male','männlich','maennlich'].includes(raw)) return 'male'; return 'neutral'; }
function normalizeBed(bed) { return { id: String(bed.id || `${bed.hospital_id || bed.hospitalId}-${Math.random().toString(36).slice(2)}`), hospital_id: bed.hospital_id || bed.hospitalId || bed.hospital || hospitals[0].id, specialty: bed.specialty || bed.fachgebiet || 'Nicht zugeordnet', status: bed.status || 'free', room: bed.room || '', station: bed.station || '', type: bed.type || 'Standardbett', monitoring: Boolean(bed.monitoring || bed.telemetry || bed.telemetrie), oxygen: Boolean(bed.oxygen), isolation: Boolean(bed.isolation), accessible: Boolean(bed.accessible), gender: normalizeGender(bed.gender || bed.sex || bed.gender_requirement || 'neutral'), updated_at: bed.updated_at || bed.updatedAt || null }; }

function demoBeds() {
  const statuses = ['free','free','available','occupied','reserved','cleaning','blocked','free'];
  const genders = ['neutral','female','male','neutral'];
  return hospitals.flatMap((hospital, hIndex) => hospital.specialties.flatMap((specialty, sIndex) => {
    const count = 5 + ((hIndex + sIndex) % 5);
    return Array.from({length: count}, (_, idx) => normalizeBed({ id: `${hospital.id}-${slug(specialty)}-${idx + 1}`, hospital_id: hospital.id, specialty, status: statuses[(idx + sIndex + hIndex) % statuses.length], type: idx % 4 === 0 ? 'Überwachungsbett' : 'Standardbett', monitoring: idx % 4 === 0, gender: genders[(idx + sIndex) % genders.length], updated_at: new Date().toISOString() }));
  }));
}
async function loadBeds() {
  if (!supabaseClient) { beds = demoBeds(); usingRemoteBeds = false; setSync('Demo-Daten · Supabase nicht konfiguriert', 'err'); markUpdated(); return; }
  setSync('Supabase wird synchronisiert …');
  try { const { data, error } = await supabaseClient.from(BEDS_TABLE).select('*'); if (error) throw error; beds = (data || []).map(normalizeBed); usingRemoteBeds = true; setSync('Supabase verbunden · beds ist Datenquelle', 'ok'); markUpdated(); }
  catch (error) { console.warn(error); beds = beds.length ? beds : demoBeds(); usingRemoteBeds = false; setSync('Supabase nicht lesbar · Demo-Fallback aktiv', 'err'); markUpdated(); }
}
async function loadProfiles() {
  if (!supabaseClient) { setProfileSync('Profile: lokaler Fallback', false); return; }
  try { const { data, error } = await supabaseClient.from(PROFILES_TABLE).select('*'); if (error) throw error; profiles = Object.fromEntries((data || []).map((row) => [row.hospital_id, { contact_info: row.contact_info || '', remarks: row.remarks || '', updated_at: row.updated_at || null }])); localStorage.setItem(LS_PROFILES, JSON.stringify(profiles)); setProfileSync('Profile: Supabase verbunden', true); }
  catch (error) { console.warn(error); setProfileSync('Profile: Tabelle fehlt/RLS · lokaler Fallback', false); }
}
function markUpdated() { E.lastUpdated.textContent = `Letzte Aktualisierung: ${formatTime()}`; }
function saveFilters() { localStorage.setItem(LS_FILTERS, JSON.stringify(filters)); }
function restoreFilters() { try { filters = {...filters, ...JSON.parse(localStorage.getItem(LS_FILTERS) || '{}')}; } catch { localStorage.removeItem(LS_FILTERS); } }
function option(value, label) { return `<option value="${esc(value)}">${esc(label)}</option>`; }
function unique(values) { return [...new Set(values)].filter(Boolean).sort((a, b) => String(a).localeCompare(String(b), 'de-CH')); }

function setupFilters() {
  E.region.innerHTML = option('all', 'Alle Regionen') + unique(hospitals.map((hospital) => hospital.region)).map((region) => option(region, region)).join('');
  E.hospital.innerHTML = option('all', 'Alle Spitäler') + hospitals.map((hospital) => option(hospital.id, `${hospital.name} · ${hospital.place}`)).join('');
  E.specialty.innerHTML = option('all', 'Alle Fachrichtungen') + unique(hospitals.flatMap((hospital) => hospital.specialties)).map((specialty) => option(specialty, specialty)).join('');
  applyFilterValues();
  [['region', E.region], ['hospital', E.hospital], ['specialty', E.specialty], ['telemetry', E.telemetry], ['gender', E.gender]].forEach(([key, element]) => element.addEventListener('change', () => { filters[key] = element.value; saveFilters(); renderOverview(); }));
  E.search.addEventListener('input', () => { filters.search = E.search.value.trim().toLowerCase(); saveFilters(); renderOverview(); });
  E.resetFilters.addEventListener('click', () => { filters = {region:'all', hospital:'all', specialty:'all', telemetry:'all', gender:'all', search:''}; saveFilters(); applyFilterValues(); renderOverview(); });
}
function applyFilterValues() { E.region.value = filters.region || 'all'; E.hospital.value = filters.hospital || 'all'; E.specialty.value = filters.specialty || 'all'; E.telemetry.value = filters.telemetry || 'all'; E.gender.value = filters.gender || 'all'; E.search.value = filters.search || ''; }
function filteredBeds() {
  return beds.filter((bed) => {
    const hospital = hospitalById(bed.hospital_id);
    const haystack = [hospital.name, hospital.place, hospital.region, hospital.category, bed.specialty, bed.type, bed.station].join(' ').toLowerCase();
    return (filters.region === 'all' || hospital.region === filters.region) && (filters.hospital === 'all' || hospital.id === filters.hospital) && (filters.specialty === 'all' || bed.specialty === filters.specialty) && (filters.telemetry === 'all' || (filters.telemetry === 'yes' ? bed.monitoring : !bed.monitoring)) && (filters.gender === 'all' || bed.gender === filters.gender || bed.gender === 'neutral') && (!filters.search || haystack.includes(filters.search));
  });
}
function aggregateHospitals() {
  const relevant = filteredBeds();
  return hospitals.map((hospital) => {
    const hospitalBeds = relevant.filter((bed) => bed.hospital_id === hospital.id);
    const freeBeds = hospitalBeds.filter((bed) => ['free', 'available'].includes(bed.status));
    return { hospital, total: hospitalBeds.length, free: freeBeds.length, occupied: hospitalBeds.filter((bed) => bed.status === 'occupied').length, reserved: hospitalBeds.filter((bed) => bed.status === 'reserved').length, specialties: unique(freeBeds.map((bed) => bed.specialty)) };
  }).filter((item) => item.free > 0).sort((a, b) => b.free - a.free || a.hospital.name.localeCompare(b.hospital.name, 'de-CH'));
}
function renderOverview() {
  const relevant = filteredBeds();
  const free = relevant.filter((bed) => ['free','available'].includes(bed.status)).length;
  const occupied = relevant.filter((bed) => bed.status === 'occupied').length;
  const hospitalsWithFree = aggregateHospitals();
  E.kpis.innerHTML = [['Spitäler mit freien Betten', hospitalsWithFree.length, 'sichtbar nach Filter'], ['Freie / verfügbare Betten', free, 'aggregiert, keine Einzelbetten'], ['Belegte Betten', occupied, 'in Filtermenge'], ['Gefilterte Betten', relevant.length, usingRemoteBeds ? 'aus Supabase beds' : 'Demo-Fallback']].map(([label, value, hint]) => `<article class="kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(hint)}</small></article>`).join('');
  E.resultContext.textContent = `${hospitalsWithFree.length} Spitäler · ${free} freie/verfügbare Betten`;
  E.results.innerHTML = hospitalsWithFree.length ? hospitalsWithFree.map(card).join('') : '<section class="empty"><strong>Keine freien Betten gefunden</strong><p>Passe die Standardfilter an oder prüfe die Datenquelle.</p></section>';
}
function card(item) {
  const { hospital } = item;
  const total = Math.max(item.total, 1);
  const profile = profiles[hospital.id] || {};
  return `<article class="hospital-card"><header><div><p class="kicker">${esc(hospital.region)}</p><h3>${esc(hospital.name)}</h3><p class="muted compact">${esc(hospital.address)}</p></div><div class="free-count"><strong>${item.free}</strong><span>frei</span></div></header><div class="meta-grid"><div class="meta-item"><span>Gültigkeitsregion</span><strong>${esc(hospital.region)}</strong></div><div class="meta-item"><span>SASIS Kategorie</span><strong>${esc(hospital.category)}</strong></div><div class="meta-item"><span>ZSR-/K-Nr.</span><strong>${esc(hospital.zsr)}</strong></div><div class="meta-item"><span>GLN</span><strong>${esc(hospital.gln)}</strong></div></div><div><span class="muted">Fachgebiete mit freien Betten</span><div class="specialties">${item.specialties.map((specialty) => `<span class="chip">${esc(specialty)}</span>`).join('')}</div></div><div class="availability-bars" aria-label="Kapazität aggregiert">${bar('Frei', Math.round(item.free / total * 100), item.free)}${bar('Belegt', Math.round(item.occupied / total * 100), item.occupied)}${bar('Reserv.', Math.round(item.reserved / total * 100), item.reserved)}</div>${profile.contact_info ? `<p class="muted compact"><strong>Kontakt:</strong> ${esc(profile.contact_info)}</p>` : ''}</article>`;
}
function bar(label, pct, value) { return `<div class="bar-row"><span>${esc(label)}</span><span class="bar"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></span><strong>${esc(value)}</strong></div>`; }

function renderAdminList() {
  E.adminList.innerHTML = hospitals.map((hospital) => `<button type="button" data-id="${esc(hospital.id)}" class="${hospital.id === selectedProfileHospital ? 'active' : ''}"><strong>${esc(hospital.name)}</strong><small>${esc(hospital.region)} · ${esc(hospital.place)} · ${esc(hospital.zsr)}</small></button>`).join('');
  E.adminList.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => { selectedProfileHospital = button.dataset.id; renderAdminList(); renderProfileForm(); }));
}
function renderProfileForm() {
  const hospital = hospitalById(selectedProfileHospital);
  const profile = profiles[hospital.id] || {contact_info:'', remarks:''};
  E.readonly.innerHTML = [['Name', hospital.name], ['Adresse', hospital.address], ['Gültigkeitsregion', hospital.region], ['Partnerart', hospital.partnerGroup], ['Untergruppe', hospital.category], ['ZSR-/K-Nr.', hospital.zsr], ['GLN', hospital.gln]].map(([label, value]) => `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
  E.contact.value = profile.contact_info || '';
  E.remarks.value = profile.remarks || '';
}
async function saveProfile(event) {
  event.preventDefault();
  const hospital = hospitalById(selectedProfileHospital);
  const profile = { hospital_id: hospital.id, zsr: hospital.zsr, gln: hospital.gln, contact_info: E.contact.value.trim(), remarks: E.remarks.value.trim(), updated_at: new Date().toISOString() };
  profiles[hospital.id] = profile;
  localStorage.setItem(LS_PROFILES, JSON.stringify(profiles));
  if (supabaseClient && usingRemoteProfiles) {
    try { const { error } = await supabaseClient.from(PROFILES_TABLE).upsert(profile, { onConflict: 'hospital_id' }); if (error) throw error; toast('Stammdaten-Ergänzungen gespeichert'); }
    catch (error) { console.warn(error); setProfileSync('Profile: Schreibfehler · lokaler Fallback', false); toast('Lokal gespeichert · Supabase Profil-Tabelle nicht beschreibbar'); }
  } else toast('Lokal gespeichert · SASIS-Daten bleiben unverändert');
  renderOverview();
}
function clearProfile() { E.contact.value = ''; E.remarks.value = ''; E.form.requestSubmit(); }
function setupTabs() { E.tabs.forEach((tab) => tab.addEventListener('click', () => { E.tabs.forEach((item) => item.classList.toggle('active', item === tab)); const overview = tab.dataset.view === 'overview'; E.overviewView.classList.toggle('active', overview); E.adminView.classList.toggle('active', !overview); })); }
function setupRealtime() { if (!supabaseClient || !supabaseClient.channel) return; try { realtimeChannel = supabaseClient.channel('cmcsix-dashboard-beds').on('postgres_changes', { event: '*', schema: 'public', table: BEDS_TABLE }, async () => { await loadBeds(); renderOverview(); }).subscribe(); } catch (error) { console.warn(error); } }
async function init() {
  E.hospitalCount.textContent = hospitals.length;
  restoreFilters(); setupTabs(); setupFilters(); renderAdminList(); renderProfileForm();
  E.form.addEventListener('submit', saveProfile); E.clearProfile.addEventListener('click', clearProfile);
  if (CONFIG.url && CONFIG.anon && window.supabase?.createClient) supabaseClient = window.supabase.createClient(CONFIG.url, CONFIG.anon);
  await loadProfiles(); await loadBeds(); renderOverview(); setupRealtime();
  refreshTimer = setInterval(async () => { await loadBeds(); await loadProfiles(); renderOverview(); renderProfileForm(); }, REFRESH_MS);
}
window.addEventListener('beforeunload', () => { if (refreshTimer) clearInterval(refreshTimer); if (realtimeChannel && supabaseClient) supabaseClient.removeChannel(realtimeChannel); });
document.addEventListener('DOMContentLoaded', init);
