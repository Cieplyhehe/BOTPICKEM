// events.js

const db = require('./database');

module.exports = {
    createEvent,
    addTeamsToEvent
};

// Tworzenie nowego eventu
function createEvent(eventName) {
    db.prepare(`INSERT INTO events (name) VALUES (?)`).run(eventName);
}

// Dodawanie drużyn do eventu
function addTeamsToEvent(eventName, teamList) {
    const event = db.prepare(`SELECT * FROM events WHERE name = ?`).get(eventName);
    if (!event) throw new Error('Event nie istnieje.');

    for (const team of teamList) {
        db.prepare(`INSERT INTO teams (event_id, name) VALUES (?, ?)`).run(event.id, team);
    }
}
