(function(){
  var map=null,layer=null;
  var COORDS={
    'luzern':[47.0502,8.3093],'sursee':[47.1712,8.1084],'wolhusen':[47.0598,8.0731],'sarnen':[46.8961,8.2453],'stans':[46.9581,8.3661],'aarau':[47.3904,8.0457],'frauenfeld':[47.5578,8.8989],'münsterlingen':[47.6315,9.2324],'muensterlingen':[47.6315,9.2324],'diessenhofen':[47.6884,8.7495],'st. gallen':[47.4245,9.3767],'zürich':[47.3769,8.5417],'zurich':[47.3769,8.5417],'zug':[47.1662,8.5155],'schwyz':[47.0207,8.6541],'altdorf':[46.8804,8.6444],'hochdorf':[47.1683,8.2917]
  };
  var HOSPITAL_COORDS={
    'luks spitalbetriebe ag luzern':[47.0573,8.2984],
    'luks spitalbetriebe ag sursee':[47.1743,8.1117],
    'luks spitalbetriebe ag wolhusen':[47.0595,8.0738],
    'klinik st. anna luzern':[47.0605,8.3376],
    'zurzach care rehaklinik sonnmatt luzern':[47.0611,8.3428],
    'kantonsspital aarau ag aarau':[47.3907,8.0470],
    'kantonsspital obwalden sarnen':[46.8981,8.2484],
    'luzerner psychiatrie ag sarnen':[46.8980,8.2490],
    'spital nidwalden stans':[46.9584,8.3693],
    'forensische psychiatrie münsterlingen':[47.6315,9.2324],
    'forensische psychiatrie muensterlingen':[47.6315,9.2324],
    'kinder- und jugendpsychiatrischer dienst - kjpd münsterlingen':[47.6315,9.2324],
    'kinder- und jugendpsychiatrischer dienst - kjpd muensterlingen':[47.6315,9.2324],
    'klinik st. katharinental (ksk) diessenhofen':[47.6900,8.7560],
    'psychiatrische klinik münsterlingen':[47.6315,9.2324],
    'psychiatrische klinik muensterlingen':[47.6315,9.2324],
    'spital thurgau ag frauenfeld':[47.5575,8.8992],
    'spital thurgau ag münsterlingen':[47.6315,9.2324],
    'spital thurgau ag muensterlingen':[47.6315,9.2324]
  };
  function esc(value){return String(value||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
  function clean(value){return String(value||'').trim()}
  function key(value){return clean(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function num(value){var n=Number(value);return isFinite(n)?n:null}
  function parseItem(item){
    var name=clean((item.querySelector('strong')||{}).textContent);
    var area=clean((item.querySelector('small')||{}).textContent);
    var countText=clean((item.querySelector('em')||{}).textContent);
    var count=Number((countText.match(/\d+/)||['0'])[0]);
    var id=item.getAttribute('data-map-hospital')||item.getAttribute('data-hospital-id')||'';
    var parts=area.split('·').map(clean).filter(Boolean);
    var place=parts.length?parts[parts.length-1]:'';
    var lat=num(item.getAttribute('data-lat'));
    var lng=num(item.getAttribute('data-lng'));
    return {id:id,name:name,area:area,place:place,count:isFinite(count)?count:0,lat:lat,lng:lng};
  }
  function coordsFor(h,i){
    if(h.lat!=null&&h.lng!=null)return [h.lat,h.lng];
    var exact=HOSPITAL_COORDS[key(h.name+' '+h.place)]||HOSPITAL_COORDS[key(h.name)];
    if(exact)return exact;
    var byPlace=COORDS[key(h.place)];
    if(byPlace)return byPlace;
    var lower=key(h.name+' '+h.area);
    var found=Object.keys(COORDS).find(function(k){return lower.indexOf(key(k))>=0});
    if(found)return COORDS[found];
    return [46.75+(i%8)*0.12,7.4+(i%6)*0.35];
  }
  function iconFor(count){
    var size=count>=13?48:(count>=5?40:32);
    var cls=count>=13?'high':(count>=5?'mid':(count>0?'low':'zero'));
    return L.divIcon({className:'',html:'<div class="leaflet-capacity-marker '+cls+'" style="width:'+size+'px;height:'+size+'px">'+count+'</div>',iconSize:[size,size],iconAnchor:[size/2,size/2],popupAnchor:[0,-size/2]});
  }
  function selectHospital(id){
    var select=document.getElementById('hospital');
    if(select&&id){select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}))}
  }
  function renderRealMap(){
    var target=document.getElementById('hospitalMap');
    if(!target||!window.L)return;
    var items=Array.from(target.querySelectorAll('.map-list-item')).map(parseItem);
    if(!items.length||target.querySelector('.leaflet-map-wrap'))return;
    target.innerHTML='<p class="real-map-note">Zoombare OpenStreetMap-Karte mit Straßen, Ortschaften und Spital-Markern. Marker anklicken für Details oder Filterung.</p><div class="leaflet-map-wrap"><div id="realHospitalMap"></div><div class="leaflet-map-side"></div></div>';
    var side=target.querySelector('.leaflet-map-side');
    side.innerHTML=items.slice().sort(function(a,b){return b.count-a.count||a.name.localeCompare(b.name,'de')}).map(function(h){return '<button type="button" class="leaflet-hospital-item" data-hospital-id="'+esc(h.id)+'"><strong>'+esc(h.name)+'</strong><small>'+esc(h.area||h.place||'-')+'</small><em>'+h.count+' frei</em></button>'}).join('');
    map=L.map('realHospitalMap',{scrollWheelZoom:true,zoomControl:true}).setView([47.15,8.25],8);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
    layer=L.layerGroup().addTo(map);
    var bounds=[];
    items.forEach(function(h,i){
      var c=coordsFor(h,i);bounds.push(c);
      var marker=L.marker(c,{icon:iconFor(h.count),title:h.name}).addTo(layer);
      marker.bindPopup('<strong>'+esc(h.name)+'</strong><small>'+esc(h.area||h.place||'-')+'</small><span class="popup-count">'+h.count+' freie Betten</span><br><button type="button" data-popup-hospital="'+esc(h.id)+'">Im Dashboard filtern</button>');
      marker.on('popupopen',function(){setTimeout(function(){var b=document.querySelector('[data-popup-hospital="'+CSS.escape(h.id)+'"]');if(b)b.onclick=function(){selectHospital(h.id)}},0)});
      marker.on('click',function(){map.setView(c,Math.max(map.getZoom(),13))});
    });
    side.querySelectorAll('[data-hospital-id]').forEach(function(btn){btn.onclick=function(){selectHospital(btn.getAttribute('data-hospital-id'))}});
    if(bounds.length)map.fitBounds(bounds,{padding:[36,36],maxZoom:10});
    setTimeout(function(){map.invalidateSize()},80);
  }
  function schedule(){setTimeout(renderRealMap,40)}
  document.addEventListener('DOMContentLoaded',function(){
    schedule();
    var target=document.getElementById('hospitalMap');
    if(target)new MutationObserver(schedule).observe(target,{childList:true,subtree:true});
  });
})();
