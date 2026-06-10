(function(){
  var current=document.currentScript&&document.currentScript.src?document.currentScript.src:'';
  var src=current?current.replace(/dashboard-leaflet-map\.js.*/,'dashboard-leaflet-map-v2.js?v=leaflet-osm-map-v2'):'assets/dashboard-leaflet-map-v2.js?v=leaflet-osm-map-v2';
  var script=document.createElement('script');
  script.src=src;
  script.onload=function(){document.dispatchEvent(new Event('DOMContentLoaded'))};
  document.head.appendChild(script);
})();
