function cmcsixInstallSpecialtyStationSync() {
  const specialtyBox = document.querySelector('#specialty');
  const stationBox = document.querySelector('#stations');
  if (!specialtyBox || !stationBox || specialtyBox.dataset.stationSyncInstalled === 'true') return;
  specialtyBox.dataset.stationSyncInstalled = 'true';

  let syncing = false;

  function activeSpecialties() {
    return Array.from(specialtyBox.querySelectorAll('input[type="checkbox"]:checked')).map(input => input.value);
  }

  function stationSpecialty(label) {
    const em = label.querySelector('em');
    const text = em ? em.textContent.trim() : '';
    return text.split(' · ')[0].trim();
  }

  function syncStationsToSpecialties() {
    if (syncing) return;
    const active = activeSpecialties();
    const labels = Array.from(stationBox.querySelectorAll('label.station-chip'));
    if (!labels.length) return;

    const inputsToChange = [];
    labels.forEach(label => {
      const input = label.querySelector('input[type="checkbox"]');
      if (!input) return;
      const specialty = stationSpecialty(label);
      const shouldBeChecked = active.length === 0 || active.includes(specialty);
      if (input.checked !== shouldBeChecked) {
        input.checked = shouldBeChecked;
        inputsToChange.push(input);
      }
    });

    if (!inputsToChange.length) return;
    syncing = true;
    const last = inputsToChange[inputsToChange.length - 1];
    last.dispatchEvent(new Event('change', { bubbles: true }));
    setTimeout(() => { syncing = false; }, 0);
  }

  specialtyBox.addEventListener('change', () => setTimeout(syncStationsToSpecialties, 50));
  const observer = new MutationObserver(() => setTimeout(syncStationsToSpecialties, 50));
  observer.observe(stationBox, { childList: true, subtree: true });
  setTimeout(syncStationsToSpecialties, 800);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', cmcsixInstallSpecialtyStationSync);
} else {
  cmcsixInstallSpecialtyStationSync();
}
