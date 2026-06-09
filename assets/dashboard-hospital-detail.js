(function(){
  var CFG = window.CMCSIX_SUPABASE_CONFIG || {};
  var HOSPITAL_TABLE = CFG.hospitalTable || 'sasis_hospitals';
  var sb = null;
  var hospitalsCache = null;
  var observer = null;

  function $(selector){ return document.querySelector(selector); }
  function esc(value){ return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; }); }
  function clean(value){ return String(value || '').trim(); }
  function splitHospitalCell(text){ return clean(text).split(' · ')[0].trim(); }

  function ensureClient(){
    if (sb) return sb;
    if (CFG.url && CFG.anon && window.supabase && window.supabase.createClient) {
      sb = window.supabase.createClient(CFG.url, CFG.anon);
    }
    return sb;
  }

  async function loadHospitals(){
    if (hospitalsCache) return hospitalsCache;
    var client = ensureClient();
    if (!client) return [];

    var result = await client.from(HOSPITAL_TABLE).select('*');
    if (result.error && HOSPITAL_TABLE !== 'sasis_hospitals') {
      result = await client.from('sasis_hospitals').select('*');
    }
    hospitalsCache = result.error ? [] : (result.data || []);
    return hospitalsCache;
  }

  function rowData(row){
    var cells = Array.from(row.children).filter(function(el){ return getComputedStyle(el).display !== 'none'; });
    return {
      validity: clean(cells[0] && cells[0].textContent),
      hospitalLabel: clean(cells[1] && cells[1].textContent),
      freeBeds: clean(cells[2] && cells[2].textContent),
      specialties: clean(cells[3] && cells[3].textContent),
      gender: clean(cells[4] && cells[4].textContent),
      features: clean(cells[5] && cells[5].textContent)
    };
  }

  function matchHospital(hospitals, data){
    var name = splitHospitalCell(data.hospitalLabel);
    var validity = data.validity;
    return hospitals.find(function(h){
      return clean(h.name) === name && clean(h.validity_area) === validity;
    }) || hospitals.find(function(h){
      return clean(h.name) === name;
    }) || null;
  }

  function detailItem(label, value, multiline){
    var content = multiline ? '<p>'+esc(value || '-')+'</p>' : '<strong>'+esc(value || '-')+'</strong>';
    return '<article class="detail-item"><span>'+esc(label)+'</span>'+content+'</article>';
  }

  function showDetail(data, hospital){
    var backdrop = $('#hospitalDetailBackdrop');
    if (!backdrop) return;

    var h = hospital || {};
    var address = [h.street, h.place].filter(Boolean).join(', ');
    var specialties = Array.isArray(h.specialties) ? h.specialties.join(' · ') : (h.specialties || '-');

    backdrop.innerHTML = '<section class="hospital-detail-card" role="dialog" aria-modal="true" aria-label="Spitaldetails">'
      + '<header class="hospital-detail-head"><div><p class="dash-kicker">Spitaldetails</p><h2>'+esc(h.name || splitHospitalCell(data.hospitalLabel) || '-')+'</h2><p>'+esc(data.validity || h.validity_area || '-')+'</p></div><button class="hospital-detail-close" type="button">Schliessen</button></header>'
      + '<div class="hospital-detail-body">'
      + '<section class="detail-section"><h3>Verfügbarkeit</h3><div class="detail-grid">'
      + '<article class="detail-item"><span>Freie Betten</span><strong class="detail-count">'+esc(data.freeBeds || '0')+'</strong></article>'
      + detailItem('Fachgebiete in Auswahl', data.specialties)
      + detailItem('Geschlecht', data.gender)
      + detailItem('Eigenschaften', data.features, true)
      + '</div></section>'
      + '<section class="detail-section"><h3>Spitaldaten</h3><div class="detail-grid">'
      + detailItem('Name', h.name || splitHospitalCell(data.hospitalLabel))
      + detailItem('Adresse / Ort', address || h.place || '-')
      + detailItem('Gültigkeitsgebiet', h.validity_area || data.validity)
      + detailItem('ZSR / K-Nr.', h.zsr || '-')
      + detailItem('Partnerart-Untergruppe', h.partner_subgroup || '-')
      + detailItem('SASIS-Fachgebiete', specialties, true)
      + '</div></section>'
      + '<section class="detail-section"><h3>Kontakt & Bemerkungen</h3><div class="detail-grid">'
      + detailItem('Kontakt-Telefon', h.contact_tel || '-')
      + detailItem('Bemerkungen', h.remarks || '-', true)
      + '</div></section>'
      + '</div></section>';

    backdrop.classList.add('open');
    var closeButton = backdrop.querySelector('.hospital-detail-close');
    if (closeButton) closeButton.onclick = closeDetail;
  }

  function closeDetail(){
    var backdrop = $('#hospitalDetailBackdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  async function openFromRow(row){
    var data = rowData(row);
    var hospitals = await loadHospitals();
    showDetail(data, matchHospital(hospitals, data));
  }

  function bindRows(){
    document.querySelectorAll('.aggregate-row').forEach(function(row){
      if (row.dataset.detailBound === '1') return;
      row.dataset.detailBound = '1';
      row.setAttribute('tabindex','0');
      row.setAttribute('role','button');
      row.setAttribute('aria-label','Spitaldetails anzeigen');
      row.addEventListener('click', function(){ openFromRow(row); });
      row.addEventListener('keydown', function(event){
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openFromRow(row);
        }
      });
    });
  }

  function install(){
    if (!$('#hospitalDetailBackdrop')) {
      var div = document.createElement('div');
      div.id = 'hospitalDetailBackdrop';
      div.className = 'hospital-detail-backdrop';
      div.addEventListener('click', function(event){ if (event.target === div) closeDetail(); });
      document.body.appendChild(div);
    }

    document.addEventListener('keydown', function(event){ if (event.key === 'Escape') closeDetail(); });
    bindRows();

    var beds = $('#beds');
    if (beds && !observer) {
      observer = new MutationObserver(function(){ setTimeout(bindRows, 0); });
      observer.observe(beds, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();
