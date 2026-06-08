function cmcsixRefreshStatusLabel() {
  var label = document.querySelector('.split .title small');
  if (!label) return;
  var rows = Array.prototype.slice.call(document.querySelectorAll('#overview .row.active'));
  var names = rows.map(function(row) {
    var spans = row.querySelectorAll('span');
    return spans[1] ? spans[1].textContent.trim() : '';
  }).filter(Boolean);
  label.textContent = 'Aktiver Statusfilter: ' + (names.length ? names.join(' + ') : 'Alle Status');
}

setInterval(cmcsixRefreshStatusLabel, 300);
document.addEventListener('click', function() {
  setTimeout(cmcsixRefreshStatusLabel, 0);
});
