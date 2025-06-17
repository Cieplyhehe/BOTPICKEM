// scheduler.js

const fs = require('fs');
const cron = require('node-cron');
const db = require('./database');

// Codzienny backup bazy danych
function startBackupScheduler() {
    cron.schedule('0 3 * * *', () => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        fs.copyFileSync('./db.sqlite', `./backup/db-backup-${timestamp}.sqlite`);
        console.log(`✅ Backup wykonany: db-backup-${timestamp}.sqlite`);
    });
}

// Sprawdzanie blokady picków
function isPickBlocked(eventName) {
    const event = db.prepare(`SELECT * FROM events WHERE name = ?`).get(eventName);
    if (!event || !event.deadline) return false;

    const deadlineTime = new Date(event.deadline).getTime();
    const now = new Date().getTime();

    return now >= deadlineTime;
}

module.exports = {
    startBackupScheduler,
    isPickBlocked
}
