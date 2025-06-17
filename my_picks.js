// moje-picki.js

const db = require('./database');

module.exports = {
    getMyGroupPicks,
    getMyBracketPicks,
    getMyFullBracketPicks
};

// PODGLĄD GRUP PICK'EM
function getMyGroupPicks(eventName, userId) {
    const event = db.prepare(`SELECT * FROM events WHERE name = ?`).get(eventName);
    if (!event) return '❌ Event nie istnieje.';

    const pick = db.prepare(`
        SELECT * FROM picks
        WHERE event_id = ? AND user_id = ?
    `).get(event.id, userId);

    if (!pick) return '❌ Nie masz jeszcze zapisanych picków.';

    return `**Twoje typy:**\n\n**3-0:** ${pick.three_zero}\n**0-3:** ${pick.zero_three}\n**Awans:** ${pick.advance}\n*(Ostatnia aktualizacja: ${pick.last_update})*`;
}

// PODGLĄD PROSTEGO BRACKETU
function getMyBracketPicks(eventName, userId) {
    const event = db.prepare(`SELECT * FROM events WHERE name = ?`).get(eventName);
    if (!event) return '❌ Event nie istnieje.';

    const picks = db.prepare(`
        SELECT match_id, pick FROM bracket_picks
        WHERE event_id = ? AND user_id = ?
    `).all(event.id, userId);

    if (picks.length === 0) return '❌ Nie masz jeszcze zapisanych picków.';

    const lines = picks.map(p => `Mecz ${p.match_id}: ${p.pick}`);
    return `**Twoje picki bracket:**\n\n${lines.join('\n')}`;
}

// PODGLĄD FULL BRACKETU
function getMyFullBracketPicks(eventName, userId) {
    const event = db.prepare(`SELECT * FROM events WHERE name = ?`).get(eventName);
    if (!event) return '❌ Event nie istnieje.';

    const picks = db.prepare(`
        SELECT match_code, pick FROM full_bracket_picks
        WHERE event_id = ? AND user_id = ?
    `).all(event.id, userId);

    if (picks.length === 0) return '❌ Nie masz jeszcze zapisanych picków.';

    const lines = picks.map(p => `${p.match_code}: ${p.pick}`);
    return `**Twoje picki Full Bracket:**\n\n${lines.join('\n')}`;
}
