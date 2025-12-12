// add_medicine.js
// Handles add/remove cards, color selection, medium selection, collapse, meal toggles, and localStorage autosave

function qsa(sel, root = document) { return Array.from((root || document).querySelectorAll(sel)); }
function qs(sel, root = document) { return (root || document).querySelector(sel); }
function debounce(fn, wait){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait); }; }

const FORM_KEY = "remedi_add_med_draft_v1";
const banner = qs("#autosaveBanner");
const autosaveStatusEl = qs("#autosaveStatus");

function saveDraft(){
  const cards = qsa(".medicine-card");
  const out = cards.map((card, idx) => {
    const obj = {};
    qsa("input, textarea, select", card).forEach(inp => {
      if(!inp.name) return;
      
      // Special handling for dynamic time inputs
      if (inp.classList.contains('dynamic-time-input')) {
          const todValue = inp.dataset.tod;
          if (!obj.tod_times) obj.tod_times = {};
          obj.tod_times[todValue] = inp.value;
          return;
      }

      const name = inp.name.replace(/med\[\d+\]\[(.+?)\](\[\])?$/,'$1');

      if(inp.type === "checkbox"){
        if(!obj[name]) obj[name] = [];
        if(inp.checked) obj[name].push(inp.value);
      } else if(inp.type === "radio"){
        if(inp.checked) obj[name] = inp.value;
      } else {
        obj[name] = inp.value;
      }
    });
    return obj;
  });
  localStorage.setItem(FORM_KEY, JSON.stringify(out));
  autosaveStatusEl.textContent = " — Saved locally";
  banner.classList.add("saved");
}
const saveDebounced = debounce(saveDraft, 600);

function restoreDraft(){
  const raw = localStorage.getItem(FORM_KEY);
  if(!raw) return;
  try {
    const arr = JSON.parse(raw);
    const cards = qsa(".medicine-card");
    arr.forEach((data, idx) => {
      const card = cards[idx];
      if(!card) return;
      Object.keys(data).forEach(k=>{
        const v = data[k];
        if(Array.isArray(v)){
          v.forEach(val => {
            const el = card.querySelector(`[name="med[${idx}][${k}][]"][value="${val}"]`);
            if(el) el.checked = true;
          });
        } else {
          const el = card.querySelector(`[name="med[${idx}][${k}]"]`);
          if(el){
            if(el.type === "radio" || el.type === "checkbox") {
              el.checked = el.value === v;
            } else el.value = v;
          }
        }
      });
    });
    autosaveStatusEl.textContent = " — Draft restored";
  } catch(e){ console.warn("restore failed", e); }
}

// DYNAMIC FORM LOGIC
function handleTimeOfDayChange(e) {
    const checkbox = e.target;
    const container = checkbox.closest('.tod-item').querySelector('.time-input-container');
    const newIndex = checkbox.closest('.medicine-card').dataset.index;

    if (checkbox.checked) {
        const defaultTime = checkbox.dataset.defaultTime;
        const timeInput = document.createElement('input');
        timeInput.type = 'time';
        timeInput.className = 'dynamic-time-input';
        timeInput.name = `med[${newIndex}][tod_time][${checkbox.value}]`;
        timeInput.value = defaultTime;
        timeInput.dataset.tod = checkbox.value; // Link input to checkbox
        container.appendChild(timeInput);
    } else {
        container.innerHTML = ''; // Remove the time input
    }
}

function initMedicineCard(card) {
  // Event listeners for a single medicine card can be attached here.
  // For example, if there were complex widgets to initialize:
  // const colorPicker = card.querySelector('.color-picker');
  // if (colorPicker) {
  //   new ColorPicker(colorPicker);
  // }
  qsa('input[name*="[tod][]"]', card).forEach(check => {
      check.addEventListener('change', handleTimeOfDayChange);
  });
}

function toggleManualSaveUI(isAutoSaveOn) {
    const saveButtons = qsa('.manual-save-btn');
    saveButtons.forEach(btn => {
        btn.style.display = isAutoSaveOn ? 'none' : 'inline-block';
    });
    const statusEl = qs("#autoSaveStatus");
    if (statusEl) {
        statusEl.textContent = isAutoSaveOn ? "Saving automatically" : "Manual save required";
    }
}

function addMedicineForm() {
  const container = qs("#medicineCards");
  const template = qs(".medicine-card");
  if (!template) {
    console.error("Template card not found");
    return;
  }
  const clone = template.cloneNode(true);
  
  const newIndex = qsa(".medicine-card").length;
  clone.dataset.index = newIndex;

  // Update heading
  const heading = clone.querySelector("h3");
  if (heading) {
    heading.textContent = `Medicine ${newIndex + 1}`;
  }

  // Clear inputs and update attributes
  qsa("input, textarea, select", clone).forEach(el => {
    const name = el.getAttribute("name");
    const id = el.getAttribute("id");
    const correspondingLabel = el.id ? clone.querySelector(`label[for="${el.id}"]`) : null;

    if (id) {
        const newId = id.replace(/-\d+/, `-${newIndex}`);
        el.setAttribute("id", newId);
        if (correspondingLabel) {
            correspondingLabel.setAttribute("for", newId);
        }
    }

    if (name) {
      el.name = name.replace(/\[\d+\]/, `[${newIndex}]`);
    }

    // Reset values
    if (el.type === "text" || el.tagName.toLowerCase() === "textarea") {
      el.value = "";
    } else if (el.type === "number") {
      el.value = "1";
    } else if (el.type === "radio" || el.type === "checkbox") {
      el.checked = false;
    } else if (el.tagName.toLowerCase() === "select") {
        el.selectedIndex = 0;
    }
  });



  // Re-enable remove button if it was disabled in the template
  const removeBtn = clone.querySelector(".action-box--remove");
  if (removeBtn) {
    removeBtn.disabled = false;
  }

  // Ensure save button visibility matches current auto-save state
  const isAutoSaveOn = qs("#autoSaveToggle").checked;
  const saveBtn = clone.querySelector('.manual-save-btn');
  if (saveBtn) {
      saveBtn.style.display = isAutoSaveOn ? 'none' : 'inline-block';
  }

  // Copy Time of Day selections and edited times
  const sourceTodCheckboxes = qsa('input[name*="[tod][]"]', template);
  const cloneTodCheckboxes = qsa('input[name*="[tod][]"]', clone);
  
  sourceTodCheckboxes.forEach((sourceCheckbox, i) => {
      const cloneCheckbox = cloneTodCheckboxes[i];
      if (sourceCheckbox.checked) {
          cloneCheckbox.checked = true;
          // Trigger the creation of the time input and copy its value
          const sourceTimeInput = sourceCheckbox.closest('.tod-item').querySelector('.dynamic-time-input');
          if (sourceTimeInput) {
              const container = cloneCheckbox.closest('.tod-item').querySelector('.time-input-container');
              const newTimeInput = document.createElement('input');
              newTimeInput.type = 'time';
              newTimeInput.className = 'dynamic-time-input';
              newTimeInput.name = `med[${newIndex}][tod_time][${cloneCheckbox.value}]`;
              newTimeInput.value = sourceTimeInput.value;
              newTimeInput.dataset.tod = cloneCheckbox.value;
              container.appendChild(newTimeInput);
          }
      }
  });

  initMedicineCard(clone); // Initialize any JS widgets on the new card
  container.appendChild(clone);
  saveDebounced();
}

// Attach event listener to the "Add Another" button
qs("#addAnotherBtn")?.addEventListener("click", addMedicineForm);

// global click handler
document.addEventListener("click", function(e){
  // manual save
  if (e.target.classList.contains('manual-save-btn')) {
    saveDraft(); // Save to local storage first
    const form = qs('#medicineForm');
    if (form) {
      form.requestSubmit ? form.requestSubmit() : form.submit();
    }
    return;
  }

  // remove
  if(e.target.closest(".action-box--remove")){
    const btn = e.target.closest(".action-box--remove");
    const card = btn.closest(".medicine-card");
    if(confirm("Remove this medicine?")) {
      card.remove();
      saveDebounced();
    }
  }

  // collapse toggle
  if(e.target.closest(".action-box--toggle")){
    const btn = e.target.closest(".action-box--toggle");
    const card = btn.closest(".medicine-card");
    const body = card.querySelector(".card-body");
    const expanded = btn.getAttribute("aria-expanded")==="true";
    if(expanded){
      body.style.display = "none";
      btn.setAttribute("aria-expanded","false");
      btn.querySelector(".chev").style.transform = "rotate(-90deg)";
    } else {
      body.style.display = "";
      btn.setAttribute("aria-expanded","true");
      btn.querySelector(".chev").style.transform = "rotate(0deg)";
    }
  }

  // medium selection
  if(e.target.closest(".medium-option")){
    const opt = e.target.closest(".medium-option");
    const card = opt.closest(".medicine-card");
    const radio = opt.querySelector('input[type="radio"]');
    if(radio) radio.checked = true;
    qsa(".medium-option", card).forEach(m=> m.classList.remove("selected"));
    opt.classList.add("selected");
    const sub = card.querySelector(".card-subtitle .sub-val");
    if(sub) sub.textContent = opt.dataset.value;
    saveDebounced();
  }

  // meal toggle
  if(e.target.classList.contains("meal-toggle")){
    const toggle = e.target;
    const option = toggle.closest(".meal-option");
    const infoId = toggle.getAttribute("aria-controls");
    const info = document.getElementById(infoId);
    const radio = option.querySelector('.meal-input');

    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', (!expanded).toString());
    toggle.textContent = expanded ? '▶' : '▼';
    if(expanded) info.hidden = true; else info.hidden = false;
    if(radio) radio.checked = true;

    // collapse others
    document.querySelectorAll('.meal-option').forEach(opt=>{
      if(opt !== option){
        const t = opt.querySelector('.meal-toggle');
        const id = t.getAttribute('aria-controls');
        const inf = document.getElementById(id);
        if(inf) inf.hidden = true;
        t.setAttribute('aria-expanded', 'false');
        t.textContent = '▶';
      }
    });
    saveDebounced();
  }

  // click meal-card label selects radio
  if(e.target.closest(".meal-card")){
    const opt = e.target.closest(".meal-option");
    if(opt){
      const radio = opt.querySelector('.meal-input');
      if(radio) radio.checked = true;
      saveDebounced();
    }
  }
});

// autosave on input
document.addEventListener('input', function(){ 
    if(qs("#autoSaveToggle")?.checked) {
        saveDebounced(); 
    }
});

// init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function(){
  restoreDraft();
  initMedicineCard(document.body); // Initialize for the first card
  
  const autoSaveToggle = qs("#autoSaveToggle");
  if(autoSaveToggle) {
    toggleManualSaveUI(autoSaveToggle.checked); // Set initial state
    autoSaveToggle.addEventListener('change', (e) => {
      toggleManualSaveUI(e.target.checked);
      if(e.target.checked) {
          saveDraft(); // Save once when toggled on
      }
    });
  }
});

// --- Persistence helpers for Add -> Schedule flow ---
const DRAFT_KEY = 'appScheduleDraft_v1';

function collectAddPageDraftFallback() {
  // Minimal safe collector to capture main fields so Schedule can restore them.
  try {
    const medicines = [];
    document.querySelectorAll('.medicine-card').forEach((block, index) => {
      const nameEl = block.querySelector(`[name="med[${index}][name]"]`);
      const dosageEl = block.querySelector(`[name="med[${index}][dosage]"]`);
      const timeEls = block.querySelectorAll('.dynamic-time-input');
      const times = Array.from(timeEls).map(t => t.value).filter(Boolean);
      
      const timeOfDay = {};
      block.querySelectorAll(`[name="med[${index}][tod][]"]:checked`).forEach(cb => {
          timeOfDay[cb.value] = true;
      });

      medicines.push({
        id: block.dataset.index || ('tmp-' + Math.random().toString(36).slice(2, 8)),
        medicineName: nameEl ? nameEl.value : '',
        dosage: dosageEl ? dosageEl.value : '',
        times,
        timeOfDay
      });
    });
    // overallStart and totalQuantity are not on this page, so we don't collect them.
    return { medicines, overallStart: '', totalQuantity: '' };
  } catch (e) {
    console.warn('collectAddPageDraftFallback failed', e);
    return { medicines: [], overallStart: '', totalQuantity: '' };
  }
}

function saveDraftFromAddPage() {
  try {
    // prefer an existing builder if present
    const model = (typeof buildAddMedicineModel === 'function') ? buildAddMedicineModel() : collectAddPageDraftFallback();
    window.appScheduleDraft = model;
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(model));
  } catch (err) {
    console.warn('saveDraftFromAddPage failed', err);
  }
}

// Attach non-destructive Next hook
document.addEventListener('DOMContentLoaded', () => {
  const medicineForm = document.querySelector('#medicineForm');
  if (medicineForm) {
    medicineForm.addEventListener('submit', () => {
      try {
        saveDraftFromAddPage();
      } catch (e) {
        console.warn('draft save on submit failed', e);
      }
    });
  } else {
    console.warn('Medicine form not found to attach draft saving listener (add_medicine.js)');
  }
});
