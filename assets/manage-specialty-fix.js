function cmcsixInstallManagementSpecialtyFix() {
  var container = document.querySelector('#specialty');
  var allBtn = document.querySelector('#allSpecialties');
  var clearBtn = document.querySelector('#clearSpecialties');
  var stationList = document.querySelector('#stations');
  var stationCount = document.querySelector('#stationCount');
  if (!container || !stationList) return;

  function activeValues() {
    return Array.prototype.slice.call(container.querySelectorAll('input[type="checkbox"]:checked')).map(function(input) {
      return input.value;
    });
  }

  function applyStationFilter() {
    var active = activeValues();
    var buttons = Array.prototype.slice.call(stationList.querySelectorAll('button[data-id]'));
    var visible = 0;
    buttons.forEach(function(button) {
      var specialty = button.getAttribute('data-specialty') || '';
      var show = active.length === 0 || active.indexOf(specialty) >= 0;
      button.style.display = show ? '' : 'none';
      if (show) visible += 1;
    });
    if (stationCount) stationCount.textContent = visible;
  }

  function enrichStationButtons() {
    var chips = Array.prototype.slice.call(stationList.querySelectorAll('button[data-id]'));
    chips.forEach(function(button) {
      if (button.getAttribute('data-specialty')) return;
      var em = button.querySelector('em');
      if (!em) return;
      var text = em.textContent || '';
      var specialty = text.split(' · ')[0].trim();
      if (specialty) button.setAttribute('data-specialty', specialty);
    });
  }

  container.addEventListener('change', function(event) {
    if (event.target && event.target.matches('input[type="checkbox"]')) {
      setTimeout(function() {
        enrichStationButtons();
        applyStationFilter();
      }, 0);
    }
  });

  if (allBtn) {
    allBtn.addEventListener('click', function(event) {
      event.preventDefault();
      container.querySelectorAll('input[type="checkbox"]').forEach(function(input) { input.checked = true; });
      setTimeout(function() { enrichStationButtons(); applyStationFilter(); }, 0);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function(event) {
      event.preventDefault();
      container.querySelectorAll('input[type="checkbox"]').forEach(function(input) { input.checked = false; });
      setTimeout(function() { enrichStationButtons(); applyStationFilter(); }, 0);
    });
  }

  new MutationObserver(function() {
    enrichStationButtons();
    applyStationFilter();
  }).observe(stationList, { childList: true, subtree: true });

  setTimeout(function() { enrichStationButtons(); applyStationFilter(); }, 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', cmcsixInstallManagementSpecialtyFix);
} else {
  cmcsixInstallManagementSpecialtyFix();
}
