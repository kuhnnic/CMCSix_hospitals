function cmcsixInstallFilteredManagementMetrics() {
  const metrics = document.querySelector('#metrics');
  const beds = document.querySelector('#beds');
  const stations = document.querySelector('#stations');
  const filterArea = document.querySelector('#filterStatus')?.closest('.filters');
  if (!metrics || !beds || !stations) return;

  function text(el) {
    return (el?.textContent || '').trim();
  }

  function visibleStationLabels() {
    return Array.from(stations.querySelectorAll('label.station-chip')).filter(label => label.offsetParent !== null);
  }

  function selectedStationLabels() {
    return visibleStationLabels().filter(label => label.querySelector('input[type="checkbox"]')?.checked);
  }

  function currentRows() {
    return Array.from(beds.querySelectorAll('.bed-list-row'));
  }

  function statusFromRow(row) {
    return text(row.querySelector('.badge'));
  }

  function setMetrics() {
    const rows = currentRows();
    const visibleStations = visibleStationLabels().length;
    const selectedStations = selectedStationLabels().length;
    const free = rows.filter(row => statusFromRow(row) === 'Frei').length;
    const occupied = rows.filter(row => statusFromRow(row) === 'Belegt').length;
    const reserved = rows.filter(row => statusFromRow(row) === 'Reserviert').length;

    metrics.innerHTML = [
      ['Stationen sichtbar', visibleStations, 'nach Fachgebiet'],
      ['Stationen gewählt', selectedStations, 'für Liste'],
      ['Betten gefiltert', rows.length, 'aktuelle Ansicht'],
      ['Frei', free, 'sichtbar'],
      ['Belegt/Reserviert', occupied + reserved, 'sichtbar']
    ].map(item => `<article class="metric"><span>${item[0]}</span><strong>${item[1]}</strong><small>${item[2]}</small></article>`).join('');
  }

  const observer = new MutationObserver(() => setTimeout(setMetrics, 0));
  observer.observe(beds, { childList: true, subtree: true });
  observer.observe(stations, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

  if (filterArea) {
    filterArea.addEventListener('change', () => setTimeout(setMetrics, 0));
    filterArea.addEventListener('input', () => setTimeout(setMetrics, 0));
  }
  stations.addEventListener('change', () => setTimeout(setMetrics, 0));
  setTimeout(setMetrics, 800);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', cmcsixInstallFilteredManagementMetrics);
} else {
  cmcsixInstallFilteredManagementMetrics();
}
