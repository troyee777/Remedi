// confirmation.js - V2
document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let medicines = [];
    let schedule = {};
    let chartInstance = null;

    // --- DOM ELEMENTS ---
    const medicineListEl = document.getElementById('medicine-list');
    const noMedicinesMessage = document.getElementById('no-medicines-message');

    // --- DATA FETCHING & MAPPING ---
    function getConfirmationData() {
        const medRaw = localStorage.getItem('medicines');
        const schedRaw = sessionStorage.getItem('scheduleDraft_v1');
        
        medicines = medRaw ? JSON.parse(medRaw) : [];
        schedule = schedRaw ? JSON.parse(schedRaw)?.schedule : {};

        // Data mapping (adapt property names if needed)
        medicines = medicines.map(med => ({
            id: med.id || `med_${Math.random()}`,
            name: med.medicineName || med.name || 'Unnamed Medicine',
            dosage: med.dosage || '',
            form: med.type || med.medium || 'Tablet',
            startDate: schedule.startDate || 'Not set',
            durationDays: schedule.duration || 'Not set',
            repeatPattern: schedule.daysOfWeek ? schedule.daysOfWeek.join(', ') : 'Daily',
            times: med.times && med.times.length > 0 ? med.times : (med.timeOfDay ? Object.keys(med.timeOfDay).filter(k => med.timeOfDay[k]) : []),
            reminderOn: schedule.enableReminder !== false,
            snoozeMinutes: schedule.snooze || 10,
        }));
    }

    // --- RENDERING ---
    function render() {
        if (!medicines || medicines.length === 0) {
            medicineListEl.innerHTML = '<p>No medicines yet — go back to the schedule to add some.</p>';
        } else {
            medicineListEl.innerHTML = '';
            medicines.forEach((med, index) => {
                const item = document.createElement('div');
                item.className = 'medicine-item';
                item.innerHTML = `
                    <button class="medicine-header" data-collapse-toggle="details-${index}">
                        <div>
                            <div class="title">${med.name}</div>
                            <div class="subtitle">${med.dosage} • ${med.form}</div>
                        </div>
                        <div class="caret">▼</div>
                    </button>
                    <div class="medicine-details collapsible" id="details-${index}">
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>Start Date</strong>
                                <span>${med.startDate}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Duration</strong>
                                <span>${med.durationDays} days</span>
                            </div>
                            <div class="detail-item">
                                <strong>Repeat</strong>
                                <span>${med.repeatPattern}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Times</strong>
                                <span>${med.times.join(', ') || 'Not set'}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Reminders</strong>
                                <span>${med.reminderOn ? 'On' : 'Off'}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Snooze</strong>
                                <span>${med.snoozeMinutes} min</span>
                            </div>
                        </div>
                        <div class="medicine-actions">
                            <button class="conf-btn conf-btn-edit">Edit</button>
                            <button class="conf-btn conf-btn-delete">Delete</button>
                        </div>
                    </div>
                `;
                const header = item.querySelector('.medicine-header');
                const details = item.querySelector('.medicine-details');
                header.addEventListener('click', () => toggleDetails(item, details));
                item.querySelector('.conf-btn-edit').addEventListener('click', () => editMedicine(med.id));
                item.querySelector('.conf-btn-delete').addEventListener('click', () => deleteMedicine(med.id));
                medicineListEl.appendChild(item);
            });
        }
        updateSummary();
    }
    
    function updateSummary() {
        const medCount = medicines.length;
        document.getElementById('summary-med-count').textContent = medCount;

        const totalRemindersDay = medicines.reduce((acc, med) => acc + (med.times?.length || 0), 0);
        document.getElementById('summary-reminders-day').textContent = totalRemindersDay;

        document.getElementById('summary-start-date').textContent = schedule.startDate || 'Not set';
        if (schedule.startDate && schedule.duration) {
            const startDate = new Date(schedule.startDate.split('-').reverse().join('-'));
            const durationDays = parseInt(String(schedule.duration).match(/\d+/)?.[0]);
            if (!isNaN(startDate.getTime()) && !isNaN(durationDays)) {
                startDate.setDate(startDate.getDate() + durationDays);
                document.getElementById('summary-end-date').textContent = startDate.toLocaleDateString('en-GB').replace(/\//g, '-');
            } else {
                 document.getElementById('summary-end-date').textContent = 'Not set';
            }
        } else {
             document.getElementById('summary-end-date').textContent = 'Not set';
        }
        
        renderDonutChart();
    }

    function renderDonutChart() {
        const ctx = document.getElementById('medicine-donut-chart').getContext('2d');
        const labels = medicines.map(m => m.name);
        const data = medicines.map(m => m.times?.length || 0);

        if(chartInstance) {
            chartInstance.destroy();
        }

        if (medicines.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            return;
        }

        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Reminders per Medicine',
                    data: data,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                }
            }
        });
    }

    // --- BEHAVIOUR ---
    function toggleDetails(medicineItem, details) {
        const isOpen = medicineItem.classList.toggle('open');
        details.classList.toggle('open', isOpen);
        if (isOpen) {
            details.style.maxHeight = details.scrollHeight + 'px';
        } else {
            details.style.maxHeight = null;
        }
    }

    function editMedicine(id) {
        const medicineToEdit = medicines.find(m => m.id === id);
        console.log('Attempting to edit medicine:', medicineToEdit);
        alert(`Navigating to edit schedule for ${medicineToEdit.name}. (Not implemented)`);
    }

    function deleteMedicine(id) {
        if (confirm('Are you sure you want to delete this medicine?')) {
            medicines = medicines.filter(m => m.id !== id);
            localStorage.setItem('medicines', JSON.stringify(medicines));
            render();
        }
    }
    
    function saveDraft() {
        console.log('Saving draft...', {medicines, schedule});
        alert('Draft saved!');
    }
    
    function saveAndActivate() {
        console.log('Saving and activating schedule...', {medicines, schedule});
        alert('Schedule activated! (See console for payload)');
    }

    // --- INITIALIZATION ---
    function init() {
        getConfirmationData();
        render();

        document.getElementById('back-btn').addEventListener('click', () => window.location.href = '/schedule');
        document.getElementById('save-draft-btn').addEventListener('click', saveDraft);
        document.getElementById('activate-btn').addEventListener('click', saveAndActivate);
    }

    init();
});
