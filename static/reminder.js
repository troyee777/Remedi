document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const form = document.getElementById('schedule-form');
    if (!form) {
        console.error("Schedule form not found!");
        return;
    }

    const timeInput = document.getElementById('time-input');
    const frequencySelect = document.getElementById('frequency-select');
    const everyXHoursGroup = document.getElementById('every-x-hours-group');
    const everyXHoursInput = document.getElementById('every-x-hours-input');
    const enableReminderCheckbox = document.getElementById('enable-reminder-checkbox');
    const reminderOptions = document.getElementById('reminder-options');
    const snoozeSelect = document.getElementById('snooze-select');
    const notifyBrowserCheckbox = document.getElementById('notify-browser-checkbox');
    const notifyEmailCheckbox = document.getElementById('notify-email-checkbox');
    const addTimeBtn = document.getElementById('add-time-btn');
    const schedulesList = document.getElementById('schedules-list');
    const timeError = document.getElementById('time-error');
    const hoursError = document.getElementById('hours-error');
    const successMessage = document.getElementById('success-message');
    const storageError = document.getElementById('storage-error');

    /**
     * Computes the next occurrence of a given IST time (HH:MM) and returns it as a UTC ISO string.
     * The function determines the current date in the IST timezone (UTC+5:30), sets the given
     * time, and creates a Date object. If this time is in the past, it adds 24 hours to find the
     * next occurrence. This ensures the scheduled time is always in the future.
     * @param {string} hhmm - The time in "HH:MM" format, assumed to be IST.
     * @returns {string|null} The future time in UTC ISO format, or null on error.
     */
    const getNextUtcIsoFromIst = (hhmm) => {
        try {
            const [hours, minutes] = hhmm.split(':').map(Number);
            
            const nowUtc = new Date();
            const nowIst = new Date(nowUtc.getTime() + (330 * 60 * 1000));

            const year = nowIst.getUTCFullYear();
            const month = (nowIst.getUTCMonth() + 1).toString().padStart(2, '0');
            const day = nowIst.getUTCDate().toString().padStart(2, '0');
            const isoStringIst = `${year}-${month}-${day}T${hhmm}:00.000+05:30`;

            let targetDate = new Date(isoStringIst);
            
            if (targetDate.getTime() < Date.now()) {
                targetDate.setTime(targetDate.getTime() + 24 * 60 * 60 * 1000);
            }

            return targetDate.toISOString();
        } catch (error) {
            console.error("Failed to convert IST to UTC:", error);
            return null;
        }
    };

    const getSchedules = () => {
        try {
            const schedulesJson = localStorage.getItem('schedules');
            return schedulesJson ? JSON.parse(schedulesJson) : [];
        } catch (e) {
            if (storageError) storageError.textContent = "Error reading schedules from storage.";
            return [];
        }
    };

    const storeSchedules = (schedules) => {
        try {
            localStorage.setItem('schedules', JSON.stringify(schedules));
            if(storageError) storageError.textContent = "";
            return true;
        } catch (e) {
            if (storageError) storageError.textContent = "Failed to save schedule. Storage may be full.";
            return false;
        }
    };
    
    const renderSchedules = () => {
        if (!schedulesList) return;
        const schedules = getSchedules();
        schedulesList.innerHTML = '';
        if (schedules.length === 0) {
            schedulesList.innerHTML = '<li>No schedules saved yet.</li>';
            return;
        }
        schedules.forEach(schedule => {
            const li = document.createElement('li');
            li.className = 'schedule-item';
            li.innerHTML = `
                <div>
                    <p><span>Time:</span> ${schedule.time_ist} IST</p>
                    <p><span>Frequency:</span> ${schedule.frequency.replace(/_/g, ' ')}</p>
                    <p><span>Reminder:</span> ${schedule.reminder_enabled ? 'On' : 'Off'}</p>
                    <p><span>Next UTC:</span> ${schedule.iso_utc || 'N/A'}</p>
                </div>
                <button class="delete-btn" data-id="${schedule.id}">Delete</button>
            `;
            schedulesList.appendChild(li);
        });
    };
    
    const handleFormSubmit = (event) => {
        event.preventDefault();
        
        if(timeError) timeError.textContent = '';
        if(hoursError) hoursError.textContent = '';
        if(successMessage) successMessage.textContent = '';

        let isValid = true;
        if (!timeInput.value) {
            if(timeError) timeError.textContent = 'Time is required.';
            isValid = false;
        }
        if (frequencySelect.value === 'every_x_hours' && !everyXHoursInput.value) {
            if(hoursError) hoursError.textContent = 'Specify hours.';
            isValid = false;
        }
        if (!isValid) return;

        const newSchedule = {
            id: Date.now().toString(),
            time_ist: timeInput.value,
            iso_utc: getNextUtcIsoFromIst(timeInput.value),
            frequency: frequencySelect.value,
            reminder_enabled: enableReminderCheckbox.checked,
            snooze_minutes: enableReminderCheckbox.checked ? parseInt(snoozeSelect.value, 10) : null,
            notify_browser: enableReminderCheckbox.checked ? notifyBrowserCheckbox.checked : false,
            notify_email: enableReminderCheckbox.checked ? notifyEmailCheckbox.checked : false,
            saved_at: new Date().toISOString()
        };

        if (newSchedule.frequency === 'every_x_hours') {
            newSchedule.every_hours = parseInt(everyXHoursInput.value, 10);
        }

        const schedules = getSchedules();
        schedules.push(newSchedule);
        if (storeSchedules(schedules)) {
            renderSchedules();
            showSuccessMessage('Schedule saved.');
        }
    };

    const deleteSchedule = (id) => {
        let schedules = getSchedules();
        schedules = schedules.filter(s => s.id !== id);
        if (storeSchedules(schedules)) {
            renderSchedules();
            showSuccessMessage('Schedule deleted.');
        }
    };

    const toggleReminderOptions = () => {
        if (!reminderOptions || !enableReminderCheckbox) return;
        const enabled = enableReminderCheckbox.checked;
        reminderOptions.classList.toggle('disabled', !enabled);
        [snoozeSelect, notifyBrowserCheckbox, notifyEmailCheckbox].forEach(el => {
            if(el) el.disabled = !enabled;
        });
        // Update header section styling when disabled
        const headerSection = document.querySelector('.reminder-header-section');
        if (headerSection) {
            headerSection.style.opacity = enabled ? '1' : '0.6';
        }
    };

    const clearForm = () => {
        form.reset();
        toggleReminderOptions();
        if(everyXHoursGroup) everyXHoursGroup.hidden = true;
        if(timeError) timeError.textContent = '';
        if(hoursError) hoursError.textContent = '';
        if(successMessage) successMessage.textContent = '';
    };
    
    const showSuccessMessage = (message) => {
        if(successMessage) {
            successMessage.textContent = message;
            setTimeout(() => { successMessage.textContent = '' }, 3000);
        }
    };
    
    form.addEventListener('submit', handleFormSubmit);

    if (addTimeBtn) {
        addTimeBtn.addEventListener('click', clearForm);
    }

    if (frequencySelect) {
        frequencySelect.addEventListener('change', () => {
            if (everyXHoursGroup) {
                everyXHoursGroup.hidden = frequencySelect.value !== 'every_x_hours';
            }
        });
    }

    if (enableReminderCheckbox) {
        enableReminderCheckbox.addEventListener('change', toggleReminderOptions);
    }

    if (schedulesList) {
        schedulesList.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-btn')) {
                const id = event.target.getAttribute('data-id');
                deleteSchedule(id);
            }
        });
    }

    toggleReminderOptions();
    renderSchedules();
});
/*
Testing checklist:
- Load the page and verify only one Timing Info card appears with one set of controls.
- Fill out the form, save, and confirm the schedule is added to localStorage.
- Check the browser console for errors related to missing elements or duplicate IDs.
- Delete a schedule and confirm it's removed from the UI and localStorage.
- Test responsive layout on small screens to ensure controls stack correctly.
*/
