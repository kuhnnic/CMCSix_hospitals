(function(){
  var CFG=window.CMCSIX_SUPABASE_CONFIG||{};
  var API_TABLE=CFG.hospitalTable||'sasis_hospitals_api';
  var WRITE_TABLE='sasis_hospitals';
  var sb=null,hospitals=[],filters={validity:'all',search:''},sortKey='sort_order',sortDir='asc',loadError='';
  var E={};
  function $(s){return document.querySelector(s)}
  function initElements(){E.sync=$('#sync');E.metrics=$('#metrics');E.listInfo=$('#listInfo');E.validity=$('#validity');E.search=$('#search');E.reset=$('#resetFilters');E.hospitals=$('#hospitals')}
  function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
  function sync(t,c){if(!E.sync)return;E.sync.className=('sync '+(c||'')).trim();var span=E.sync.querySelector('span');if(span)span.textContent=t}
  function errorText(e){if(!e)return'Unbekannter Fehler';return [e.code,e.message,e.details,e.hint].filter(Boolean).join(' · ')||String(e)}
  function uniq(a){var m={},o=[];a.forEach(function(v){if(v&&!m[v]){m[v]=1;o.push(v)}});return o.sort(function(a,b){return String(a).localeCompare(String(b),'de',{numeric:true,sensitivity:'base'})})}
  function opt(v,t,c){return '<option value="'+esc(v)+'" '+(v===c?'selected':'')+'>'+esc(t)+'</option>'}
  function normalize(h){return Object.assign({},h,{contact_tel:h.contact_tel||'',remarks:h.remarks||''})}
  async function load(){
    if(!(CFG.url&&CFG.anon&&window.supabase&&window.supabase.createClient)){loadError='Supabase Config fehlt oder Supabase Library wurde nicht geladen.';sync(loadError,'err');render();return}
    sb=window.supabase.createClient(CFG.url,CFG.anon);
    try{
      sync('SASIS-Kontaktfelder werden geladen ...');
      var res=await sb.from(API_TABLE).select('*').order('sort_order',{ascending:true});
      if(res.error)throw res.error;
      hospitals=(res.data||[]).map(normalize);
      loadError='';
      sync('Supabase verbunden · Kontaktfelder editierbar','ok');
      render();
    }catch(e){
      console.warn(e);loadError=errorText(e);hospitals=[];sync('SASIS-Kontakte konnten nicht geladen werden','err');render();
    }
  }
  function filtered(){var data=hospitals.slice();if(filters.validity!=='all')data=data.filter(function(h){return h.validity_area===filters.validity});if(filters.search){var q=filters.search.toLowerCase();data=data.filter(function(h){return [h.name,h.place,h.street,h.zsr,h.validity_area,h.partner_subgroup,h.contact_tel,h.remarks].join(' ').toLowerCase().indexOf(q)>=0})}data.sort(compare);return data}
  function val(h){if(sortKey==='contact_tel'||sortKey==='remarks'||sortKey==='name'||sortKey==='place'||sortKey==='validity_area')return h[sortKey]||'';return h.sort_order||0}
  function compare(a,b){var av=val(a),bv=val(b),c;if(typeof av==='number'||typeof bv==='number')c=(Number(av)||0)-(Number(bv)||0);else c=String(av).localeCompare(String(bv),'de',{numeric:true,sensitivity:'base'});return sortDir==='asc'?c:-c}
  function sortButton(k,t){var m=sortKey===k?(sortDir==='asc'?' ↑':' ↓'):'';return '<button class="sort" type="button" data-sort="'+k+'">'+t+m+'</button>'}
  function renderOptions(){var validities=uniq(hospitals.map(function(h){return h.validity_area}));if(filters.validity!=='all'&&validities.indexOf(filters.validity)<0)filters.validity='all';E.validity.innerHTML=opt('all','Alle Gültigkeitsgebiete',filters.validity)+validities.map(function(v){return opt(v,v,filters.validity)}).join('');E.search.value=filters.search}
  function renderMetrics(data){var withTel=data.filter(function(h){return !!h.contact_tel}).length,withRemarks=data.filter(function(h){return !!h.remarks}).length;E.metrics.innerHTML=[['Spitäler',data.length,'aktuelle Auswahl'],['Gültigkeitsgebiete',uniq(data.map(function(h){return h.validity_area})).length,'sichtbar'],['Kontakt-Tel.',withTel,'gepflegt'],['Bemerkungen',withRemarks,'gepflegt'],['Schreibtabelle',WRITE_TABLE,'Dashboard-only']].map(function(m){return '<article class="metric"><span>'+m[0]+'</span><strong>'+m[1]+'</strong><small>'+m[2]+'</small></article>'}).join('')}
  function renderTable(data){
    if(loadError){E.hospitals.innerHTML='<section class="empty"><strong>Kontakte konnten nicht geladen werden</strong><p>'+esc(loadError)+'</p></section>';return}
    if(!data.length){E.hospitals.innerHTML='<section class="empty"><strong>Keine Spitäler gefunden</strong><p>Für diese Filterkombination gibt es keine SASIS-Daten.</p></section>';return}
    E.hospitals.innerHTML='<div class="contact-head"><span>'+sortButton('validity_area','Gebiet')+'</span><span>'+sortButton('name','Spital')+'</span><span>'+sortButton('place','Ort')+'</span><span>'+sortButton('contact_tel','Kontakt-Tel.')+'</span><span>'+sortButton('remarks','Bemerkungen')+'</span><span>Aktion</span></div>'+data.map(row).join('');
    E.hospitals.querySelectorAll('[data-sort]').forEach(function(btn){btn.onclick=function(){var k=btn.getAttribute('data-sort');if(sortKey===k)sortDir=sortDir==='asc'?'desc':'asc';else{sortKey=k;sortDir='asc'}render()}});
    E.hospitals.querySelectorAll('.contact-row').forEach(function(rowEl){bindRow(rowEl)});
  }
  function row(h){return '<div class="contact-row" data-id="'+esc(h.id)+'"><strong>'+esc(h.validity_area||'-')+'</strong><span>'+esc(h.name||'-')+'<small class="save-state">ZSR/K-Nr. '+esc(h.zsr||'-')+'</small></span><span>'+esc(h.place||'-')+'</span><span><input data-field="contact_tel" value="'+esc(h.contact_tel)+'" placeholder="z.B. +41 ..."></span><span><textarea data-field="remarks" placeholder="Bemerkungen">'+esc(h.remarks)+'</textarea></span><span><button type="button" data-save disabled>Speichern</button><small class="save-state" data-state>unverändert</small></span></div>'}
  function bindRow(rowEl){var id=rowEl.getAttribute('data-id'),btn=rowEl.querySelector('[data-save]'),state=rowEl.querySelector('[data-state]'),inputs=rowEl.querySelectorAll('[data-field]');inputs.forEach(function(i){i.oninput=function(){rowEl.classList.add('dirty');btn.disabled=false;state.textContent='ungespeichert'}});btn.onclick=function(){saveRow(id,rowEl)}}
  async function saveRow(id,rowEl){
    var btn=rowEl.querySelector('[data-save]'),state=rowEl.querySelector('[data-state]'),payload={};
    rowEl.querySelectorAll('[data-field]').forEach(function(i){payload[i.getAttribute('data-field')]=i.value.trim()});
    btn.disabled=true;state.textContent='speichert ...';
    try{
      var res=await sb.from(WRITE_TABLE).update(payload).eq('id',id).select('id, contact_tel, remarks');
      if(res.error)throw res.error;
      if(!res.data||!res.data.length)throw {code:'NO_ROWS',message:'Kein Datensatz aktualisiert. Prüfe, ob die ID in public.sasis_hospitals existiert und UPDATE erlaubt ist.'};
      var h=hospitals.find(function(x){return x.id===id});if(h)Object.assign(h,payload);
      rowEl.classList.remove('dirty');state.textContent='gespeichert';sync('Kontaktfelder gespeichert','ok');
    }catch(e){
      console.warn(e);btn.disabled=false;state.textContent='Fehler: '+errorText(e);sync('Kontaktfelder konnten nicht gespeichert werden','err');
    }
  }
  function render(){renderOptions();var data=filtered();renderMetrics(data);if(E.listInfo)E.listInfo.textContent=data.length+' von '+hospitals.length+' Spitälern';renderTable(data)}
  function bind(){E.validity.onchange=function(e){filters.validity=e.target.value;render()};E.search.oninput=function(e){filters.search=e.target.value.trim();render()};E.reset.onclick=function(){filters={validity:'all',search:''};sortKey='sort_order';sortDir='asc';render()}}
  document.addEventListener('DOMContentLoaded',function(){initElements();bind();render();load()})
})();
