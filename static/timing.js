// timing.js - show/hide the "Every X hours" group and manage required/disabled state
(function () {
  function isEveryXOptionSelected(selectEl) {
    if (!selectEl) return false;
    var val = (selectEl.value || '').toString().trim();
    var text = (selectEl.options && selectEl.options[selectEl.selectedIndex] && selectEl.options[selectEl.selectedIndex].text) || '';
    // Check common patterns robustly: value might be "every_x_hours" or the label "Every X hours"
    var pattern = /every[\s-_]*x|every[\s-_]*x[\s-_]*hours|every x hours|every-x-hours/i;
    return pattern.test(val) || pattern.test(text);
  }

  function updateEveryXGroup() {
    var freq = document.getElementById('frequency-select');
    var everyGroup = document.getElementById('every-x-hours-group');
    var everyInput = document.getElementById('every-x-hours-input');

    if (!freq || !everyGroup || !everyInput) {
      return;
    }

    var show = isEveryXOptionSelected(freq);

    if (show) {
      everyGroup.style.display = ''; // allow CSS/default to show
      everyGroup.setAttribute('aria-hidden', 'false');
      everyInput.disabled = false;
      everyInput.required = true;
      // restore tabindex if it was removed
      everyInput.removeAttribute('tabindex');
    } else {
      everyGroup.style.display = 'none';
      everyGroup.setAttribute('aria-hidden', 'true');
      everyInput.disabled = true;
      everyInput.required = false;
      // remove from tab order to prevent accidental keyboard focus
      everyInput.setAttribute('tabindex', '-1');
    }
  }

  // Initialize on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    var freq = document.getElementById('frequency-select');

    updateEveryXGroup();

    if (freq) {
      freq.addEventListener('change', function () {
        updateEveryXGroup();
      });

      // If server pre-fills by setting select.value, also handle possible mutation.
      // Observe attribute changes to the select in case server-side script updates after load.
      if (window.MutationObserver) {
        var mo = new MutationObserver(function () {
          updateEveryXGroup();
        });
        mo.observe(freq, { attributes: true, childList: true, subtree: false });
      }
    }
  });

  // Expose update function for debugging or manual calls
  window.__updateEveryXGroup = updateEveryXGroup;
})();
