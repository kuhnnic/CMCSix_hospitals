(function activateFreeOnlyDashboardMode(){
  const isFree = (bed) => bed.status === 'free';
  const originalFilteredBeds = filteredBeds;

  filteredBeds = function filteredFreeBedsOnly() {
    return originalFilteredBeds().filter(isFree);
  };

  aggregateHospitals = function aggregateHospitalsWithFreeBedsOnly() {
    const relevant = filteredBeds();
    return hospitals.map((hospital) => {
      const freeBeds = relevant.filter((bed) => bed.hospital_id === hospital.id);
      return {
        hospital,
        total: freeBeds.length,
        free: freeBeds.length,
        occupied: 0,
        reserved: 0,
        specialties: unique(freeBeds.map((bed) => bed.specialty))
      };
    }).filter((item) => item.free > 0).sort((a, b) => b.free - a.free || a.hospital.name.localeCompare(b.hospital.name, 'de-CH'));
  };

  renderOverview = function renderFreeBedsOnlyOverview() {
    const relevant = filteredBeds();
    const free = relevant.length;
    const hospitalsWithFree = aggregateHospitals();
    E.kpis.innerHTML = [
      ['Spitäler mit freien Betten', hospitalsWithFree.length, 'sichtbar nach Filter'],
      ['Freie Betten', free, 'nur Status frei'],
      ['Angezeigte Betten', free, 'aggregiert, keine Einzelbetten'],
      ['Datenquelle', usingRemoteBeds ? 'DB' : 'Demo', usingRemoteBeds ? 'Supabase beds' : 'Demo-Fallback']
    ].map(([label, value, hint]) => `<article class="kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(hint)}</small></article>`).join('');
    E.resultContext.textContent = `${hospitalsWithFree.length} Spitäler · ${free} freie Betten`;
    E.results.innerHTML = hospitalsWithFree.length
      ? hospitalsWithFree.map(card).join('')
      : '<section class="empty"><strong>Keine freien Betten gefunden</strong><p>Passe die Standardfilter an oder prüfe die Datenquelle.</p></section>';
  };
}());
