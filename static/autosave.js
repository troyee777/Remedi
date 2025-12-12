// Auto-save status and focus behavior with localStorage persistence
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.querySelector('#autoSaveToggle');
  const statusEl = document.querySelector('#autoSaveStatus');

  if (!toggle || !statusEl) {
    console.warn('[AutoSave] toggle or status element not found.');
    return;
  }

  // Helper to check element visibility
  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
  }

  function updateStatus(isOn) {
    if (isOn) {
      statusEl.textContent = 'Saving automatically';
      statusEl.classList.remove('autosave-off');
      statusEl.classList.add('autosave-on');
      // Focus first input when enabling
      const firstInput = document.querySelector('.medicine-card input[type="text"], input[name="med[0][name]"], textarea');
      if (firstInput && isVisible(firstInput)) {
        setTimeout(() => {
          try { firstInput.focus({ preventScroll: false }); } catch (e) { firstInput.focus(); }
        }, 40);
      }
    } else {
      statusEl.textContent = 'Manual save required';
      statusEl.classList.remove('autosave-on');
      statusEl.classList.add('autosave-off');
    }
    // Persist preference
    localStorage.setItem('autoSaveEnabled', isOn ? '1' : '0');
  }

  // Load saved preference on page load
  const saved = localStorage.getItem('autoSaveEnabled');
  const shouldBeEnabled = saved === null || saved === '1'; // Default to ON if not set
  toggle.checked = shouldBeEnabled;
  updateStatus(shouldBeEnabled);

  // Listen for toggle changes
  toggle.addEventListener('change', function (e) {
    updateStatus(e.target.checked);
  });
});
