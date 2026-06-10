(function(){
  function esc(value){
    return String(value||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})
  }
  function countFromPoint(point){
    var button=point.querySelector('button');
    var n=Number(button?button.textContent.trim():0);
    return isFinite(n)?n:0;
  }
  function regionHtml(){
    var labels=[
      ['ZH / AG','59%','27%'],['LU','43%','46%'],['OW / NW','49%','58%'],['TG','71%','29%'],['BE','34%','67%'],['UR / SZ','55%','71%']
    ];
    var lakes=[['Vierwaldstättersee','45%','53%'],['Zürichsee','61%','35%'],['Bodensee','79%','20%']];
    return labels.map(function(l){return '<span class="map-region-label" style="left:'+l[1]+';top:'+l[2]+'">'+l[0]+'</span>'}).join('')+
      lakes.map(function(l){return '<span class="map-lake-label" style="left:'+l[1]+';top:'+l[2]+'">'+l[0]+'</span>'}).join('');
  }
  function legendHtml(){
    return '<div class="map-scale">ca. 100 km</div><div class="map-compass">N</div>'+regionHtml()+
      '<div class="map-legend"><strong>Legende</strong><span class="low"><i></i>1–4 freie Betten</span><span class="mid"><i></i>5–12 freie Betten</span><span class="high"><i></i>13+ freie Betten</span><span class="zero"><i></i>keine freien Betten</span></div>'+ 
      '<div class="map-detail-caption">Die Karte zeigt die Spitäler schematisch innerhalb der Schweiz. Die Kreisgröße entspricht der Anzahl freier Betten; Klick auf ein Spital filtert das Dashboard.</div>';
  }
  function listMetaByName(){
    var out={};
    document.querySelectorAll('.map-list-item').forEach(function(item){
      var name=(item.querySelector('strong')||{}).textContent||'';
      var area=(item.querySelector('small')||{}).textContent||'';
      var count=(item.querySelector('em')||{}).textContent||'';
      if(name) out[name.trim()]={area:area.trim(),count:count.trim()};
    });
    return out;
  }
  function enhanceMap(){
    var map=document.querySelector('.hospital-map');
    if(!map || map.dataset.detailedMap==='1') return;
    map.dataset.detailedMap='1';
    map.classList.add('detailed-map');
    map.insertAdjacentHTML('afterbegin',legendHtml());
    var meta=listMetaByName();
    map.querySelectorAll('.map-point').forEach(function(point){
      var n=countFromPoint(point);
      point.classList.toggle('capacity-low',n>0&&n<5);
      point.classList.toggle('capacity-mid',n>=5&&n<13);
      point.classList.toggle('capacity-high',n>=13);
      var name=(point.querySelector('span')||{}).textContent||'Spital';
      var m=meta[name.trim()]||{};
      if(!point.querySelector('.map-tooltip')){
        point.insertAdjacentHTML('beforeend','<div class="map-tooltip"><strong>'+esc(name)+'</strong><small>'+esc(m.area||'Gültigkeitsgebiet / Ort')+'</small><em>'+esc(m.count||n+' freie Betten')+'</em><b>Zum Filtern anklicken</b></div>');
      }
    });
  }
  function scheduleEnhance(){
    window.requestAnimationFrame(function(){setTimeout(enhanceMap,30)});
  }
  document.addEventListener('DOMContentLoaded',function(){
    scheduleEnhance();
    var target=document.getElementById('hospitalMap');
    if(!target) return;
    new MutationObserver(scheduleEnhance).observe(target,{childList:true,subtree:true});
  });
})();
