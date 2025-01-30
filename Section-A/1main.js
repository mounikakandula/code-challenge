class Event {
    constructor(name, startTime, endTime) {
        this.name = name;
        this.startTime = startTime;
        this.endTime = endTime;
        this.duration = this.calculateDuration();
    }

    calculateDuration() {
        const start = new Date(`2000-01-01T${this.startTime}`);
        const end = new Date(`2000-01-01T${this.endTime}`);
        return (end - start) / (1000 * 60); // Duration in minutes
    }
}

class EventScheduler {
    constructor() {
        this.events = [];
        this.workingHourStart = "08:00";
        this.workingHourEnd = "18:00";
    }

    addEvent(event) {
        this.events.push(event);
        this.events.sort((a, b) => a.startTime.localeCompare(b.startTime));
        return this.findConflicts();
    }

    findConflicts() {
        const conflicts = [];
        for (let i = 0; i < this.events.length - 1; i++) {
            const currentEvent = this.events[i];
            const nextEvent = this.events[i + 1];
            
            if (currentEvent.endTime > nextEvent.startTime) {
                const suggestedTimes = this.findAlternativeSlots(nextEvent);
                conflicts.push({
                    event1: currentEvent,
                    event2: nextEvent,
                    suggestions: suggestedTimes
                });
            }
        }
        return conflicts;
    }

    findAlternativeSlots(event) {
        const suggestions = [];
        const workStart = new Date(`2000-01-01T${this.workingHourStart}`);
        const workEnd = new Date(`2000-01-01T${this.workingHourEnd}`);
        const eventDuration = event.duration;

        // Convert all events to Date objects for easier comparison
        const busySlots = this.events.map(e => ({
            start: new Date(`2000-01-01T${e.startTime}`),
            end: new Date(`2000-01-01T${e.endTime}`)
        }));

        // Check each 30-minute slot in the working hours
        for (let time = workStart; time < workEnd; time = new Date(time.getTime() + 30 * 60000)) {
            const potentialEnd = new Date(time.getTime() + eventDuration * 60000);
            
            // Skip if the event would end after working hours
            if (potentialEnd > workEnd) continue;

            // Check if this slot conflicts with any existing events
            const hasConflict = busySlots.some(slot => {
                return (time < slot.end && potentialEnd > slot.start);
            });

            if (!hasConflict) {
                suggestions.push({
                    start: time.toTimeString().slice(0, 5),
                    end: potentialEnd.toTimeString().slice(0, 5)
                });

                // Only keep up to 3 suggestions
                if (suggestions.length >= 3) break;
            }
        }

        return suggestions;
    }
}

// Initialize scheduler
const scheduler = new EventScheduler();

// DOM Elements
const eventForm = document.getElementById('eventForm');
const eventsListDiv = document.getElementById('eventsList');
const conflictsListDiv = document.getElementById('conflictsList');

// Event Handlers
eventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('eventName').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    if (startTime >= endTime) {
        alert('End time must be after start time');
        return;
    }

    const newEvent = new Event(name, startTime, endTime);
    const conflicts = scheduler.addEvent(newEvent);
    
    updateEventsDisplay();
    updateConflictsDisplay(conflicts);
    
    eventForm.reset();
});

function updateEventsDisplay() {
    eventsListDiv.innerHTML = '';
    scheduler.events.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event-item';
        eventDiv.innerHTML = `
            <strong>${event.name}</strong><br>
            Start: ${formatTime(event.startTime)} - End: ${formatTime(event.endTime)}
        `;
        eventsListDiv.appendChild(eventDiv);
    });
}

function updateConflictsDisplay(conflicts) {
    conflictsListDiv.innerHTML = '';
    if (conflicts.length === 0) {
        conflictsListDiv.innerHTML = '<p>No conflicts found.</p>';
        return;
    }

    conflicts.forEach(conflict => {
        const conflictDiv = document.createElement('div');
        conflictDiv.className = 'event-item conflict';
        
        let suggestionsHtml = '';
        if (conflict.suggestions && conflict.suggestions.length > 0) {
            suggestionsHtml = `
                <p><strong>Suggested alternative times for "${conflict.event2.name}":</strong></p>
                <ul>
                    ${conflict.suggestions.map(slot => 
                        `<li>Start: ${slot.start} - End: ${slot.end}</li>`
                    ).join('')}
                </ul>
            `;
        }

        conflictDiv.innerHTML = `
            <p>Conflict between:</p>
            <p>"${conflict.event1.name}" (${formatTime(conflict.event1.startTime)} - ${formatTime(conflict.event1.endTime)})</p>
            <p>"${conflict.event2.name}" (${formatTime(conflict.event2.startTime)} - ${formatTime(conflict.event2.endTime)})</p>
            ${suggestionsHtml}
        `;
        conflictsListDiv.appendChild(conflictDiv);
    });
}

function formatTime(time) {
    return time;
}