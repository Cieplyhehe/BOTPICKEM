// full_bracket.js

const db = require('./database');

module.exports = {
    createFullBracket,
    getFullBracketStructure
};

// Tworzymy Full Major Bracket
function createFullBracket(eventName, teamList) {
    if (teamList.length !== 8) throw new Error('Bracket wymaga dokładnie 8 drużyn.');

    const event = db.prepare(`SELECT * FROM events WHERE name = ?`).get(eventName);
    if (!event) throw new Error('Nie znaleziono eventu.');

    const teamsStr = JSON.stringify(teamList);

    db.prepare(`
        INSERT INTO full_bracket (event_id, teams)
        VALUES (?, ?)
    `).run(event.id, teamsStr);
}

// Generujemy strukturę full bracketu
function getFullBracketStructure(eventName) {
    const event = db.prepare(`SELECT * FROM events WHERE name = ?`).get(eventName);
    if (!event) return null;

    const row = db.prepare(`SELECT * FROM full_bracket WHERE event_id = ?`).get(event.id);
    if (!row) return null;

    const teams = JSON.parse(row.teams);

    // Robimy pary QF na podstawie kolejności drużyn:
    const UBQF = [
        { matchCode: 'UBQF1', teamA: teams[0], teamB: teams[1] },
        { matchCode: 'UBQF2', teamA: teams[2], teamB: teams[3] },
        { matchCode: 'UBQF3', teamA: teams[4], teamB: teams[5] },
        { matchCode: 'UBQF4', teamA: teams[6], teamB: teams[7] }
    ];

    return { UBQF };
}
