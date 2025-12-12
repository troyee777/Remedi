// Handles saving and loading of schedule form data to localStorage.

const SCHEDULE_STORAGE_KEY = 'scheduleData';

/**
 * Gathers all data from the schedule form and saves it to localStorage.
 */
function saveScheduleData() {
    const selectedPillPack = document.querySelector('.pill-pack-options .option.selected');
    const scheduleData = {
        presetDays: selectedPillPack ? selectedPillPack.dataset.days : null,
        customDays: document.getElementById('customDaysInput').value,
        totalQuantity: document.getElementById('totalQuantityInput').value,
        startDate: document.getElementById('startDate').value,
        weeklySchedule: Array.from(document.querySelectorAll('.days-of-week .day.selected')).map(el => el.dataset.day),
        time: document.getElementById('time-input').value,
        frequency: document.getElementById('frequency-select').value,
        everyXHours: document.getElementById('every-x-hours-input').value,
        reminderEnabled: document.getElementById('enable-reminder-checkbox').checked,
        snoozeMinutes: document.getElementById('snooze-select').value,
        notifyBrowser: document.getElementById('notify-browser-checkbox').checked,
        notifyEmail: document.getElementById('notify-email-checkbox').checked,
    };

    try {
        localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(scheduleData));
    } catch (e) {
        console.error("Failed to save schedule data to localStorage", e);
    }
}

/**
 * Loads schedule data from localStorage and populates the form fields.
 */
function loadScheduleData() {
    const savedDataJSON = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (!savedDataJSON) {
        return;
    }

    try {
        const savedData = JSON.parse(savedDataJSON);

        // Pill pack and custom days
        document.querySelectorAll('.pill-pack-options .option').forEach(btn => {
            if (btn.dataset.days === savedData.presetDays) {
                btn.classList.add('selected');
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.remove('selected');
                btn.setAttribute('aria-pressed', 'false');
            }
        });
        document.getElementById('customDaysInput').value = savedData.customDays || '';

        // Other text/value inputs
        document.getElementById('totalQuantityInput').value = savedData.totalQuantity || '';
        document.getElementById('startDate').value = savedData.startDate || '';
        document.getElementById('time-input').value = savedData.time || '';
        document.getElementById('frequency-select').value = savedData.frequency || 'once_a_day';
        document.getElementById('every-x-hours-input').value = savedData.everyXHours || '';
        document.getElementById('snooze-select').value = savedData.snoozeMinutes || '10';

        // Weekly schedule buttons
        const weeklySchedule = savedData.weeklySchedule || [];
        document.querySelectorAll('.days-of-week .day').forEach(dayEl => {
            if (weeklySchedule.includes(dayEl.dataset.day)) {
                dayEl.classList.add('selected');
                dayEl.setAttribute('aria-pressed', 'true');
            } else {
                dayEl.classList.remove('selected');
                dayEl.setAttribute('aria-pressed', 'false');
            }
        });

        // Checkboxes
        document.getElementById('enable-reminder-checkbox').checked = savedData.reminderEnabled;
        document.getElementById('notify-browser-checkbox').checked = savedData.notifyBrowser;
        document.getElementById('notify-email-checkbox').checked = savedData.notifyEmail;

    } catch (e) {
        console.error("Failed to load or parse schedule data from localStorage", e);
    }
}

/**
 * Attaches all necessary event listeners to form elements for autosaving.
 */
function attachAutosaveListeners() {
    const elementsToWatch = [
        // Inputs
        document.getElementById('customDaysInput'),
        document.getElementById('totalQuantityInput'),
        document.getElementById('startDate'),
        document.getElementById('time-input'),
        document.getElementById('every-x-hours-input'),
        // Selects
        document.getElementById('frequency-select'),
        document.getElementById('snooze-select'),
        // Checkboxes
        document.getElementById('enable-reminder-checkbox'),
        document.getElementById('notify-browser-checkbox'),
        document.getElementById('notify-email-checkbox')
    ];

    elementsToWatch.forEach(element => {
        if (element) {
            element.addEventListener('input', saveScheduleData);
            element.addEventListener('change', saveScheduleData);
        }
    });

    // Button groups (pill pack and weekly schedule)
    document.querySelectorAll('.pill-pack-options .option, .days-of-week .day').forEach(button => {
        button.addEventListener('click', () => {
            // Handle mutual exclusivity for pill packs
            if (button.parentElement.classList.contains('pill-pack-options')) {
                document.querySelectorAll('.pill-pack-options .option').forEach(b => {
                    b.classList.remove('selected');
                    b.setAttribute('aria-pressed', 'false');
                });
                 document.getElementById('customDaysInput').value = '';
            }
            
            const isPressed = button.getAttribute('aria-pressed') === 'true';
            button.classList.toggle('selected', !isPressed);
            button.setAttribute('aria-pressed', String(!isPressed));

            // For pill pack, clear custom input if a preset is chosen
            if (button.parentElement.classList.contains('pill-pack-options') && !isPressed) {
                document.getElementById('customDaysInput').value = '';
            }
            
            saveScheduleData();
        });
    });
    
     // Clear pill pack selection if custom days are entered
    const customDaysInput = document.getElementById('customDaysInput');
    if (customDaysInput) {
        customDaysInput.addEventListener('input', () => {
            document.querySelectorAll('.pill-pack-options .option').forEach(b => {
                b.classList.remove('selected');
                b.setAttribute('aria-pressed', 'false');
            });
            saveScheduleData();
        });
    }

    // Navigation buttons should save before leaving
    const backBtn = document.getElementById('backBtn');
    const nextBtn = document.getElementById('nextBtnSched');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            saveScheduleData();
            window.location.href = '/add_medicine'; 
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveScheduleData();
            window.location.href = '/confirmation';
        });
    }

    // Final save button should clear the draft
    const saveScheduleBtn = document.getElementById('save-schedule-btn');
    if (saveScheduleBtn) {
        saveScheduleBtn.addEventListener('click', () => {
            localStorage.removeItem(SCHEDULE_STORAGE_KEY);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadScheduleData();
    attachAutosaveListeners();
});


