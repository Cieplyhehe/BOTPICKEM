// full_bracket_picks.js

const db = require('./database');
const scheduler = require('./scheduler');
const full_bracket = require('./full_bracket');

module.exports = {
    startFullBracketPickInteraction,
    saveFullBracketPick,
    getFullBracketPick
};

// Start interakcji dla full bracket
async function startFullBracketPickInteraction(interaction, eventName) {
    if (scheduler.isPickBlocked(eventName)) {
        await interaction.reply("⛔ Typowanie na ten event jest już zablokowane.");
        return;
    }

    const structure = full_bracket.getFullBracketStructure(eventName);
    if (!structure) {
        return interaction.reply('❌ Bracket nie został jeszcze utworzony.');
    }

    const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
    const components = [];

    for (const match of structure.UBQF) {
        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`fullpick_${eventName}_${match.matchCode}`)
                .setPlaceholder(`Wybierz zwycięzcę: ${match.teamA} vs ${match.teamB}`)
                .addOptions([
                    { label: match.teamA, value: match.teamA },
                    { label: match.teamB, value: match.teamB }
                ])
                .setMinValues(1).setMaxValues(1)
        );
        components.push(row);
    }

    await interaction.reply({
        content: `🎯 Full Bracket Pick'Em dla eventu **${eventName}**\nWybierz swoich zwycięzców pierwszej rundy:`,
        components: components,
        ephemeral: true
    });
}

// Zapisywanie picków użytkownika
function saveFullBracketPick(eventName, userId, username, matchCode, pick) {
    const event = db.prepare(`SELECT * FROM events WHERE name = ?`).get(eventName);
    if (!event) throw new Error('Nie znaleziono eventu.');

    const now = new Date().toISOString();

    const existing = db.prepare(`
        SELECT * FROM full_bracket_picks
        WHERE event_id = ? AND user_id = ? AND match_code = ?
    `).get(event.id, userId, matchCode);

    if (existing) {
        db.prepare(`
            UPDATE full_bracket_picks SET pick = ?, last_update = ?
            WHERE event_id = ? AND user_id = ? AND match_code = ?
        `).run(pick, now, event.id, userId, matchCode);
    } else {
        db.prepare(`
            INSERT INTO full_bracket_picks (event_id, user_id, username, match_code, pick, last_update)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(event.id, userId, username, matchCode, pick, now);
    }
}

// Pobieranie picków danego użytkownika
function getFullBracketPick(eventName, userId) {
    const event = db.prepare(`SELECT * FROM events WHERE name = ?`).get(eventName);
    if (!event) throw new Error('Nie znaleziono eventu.');

    return db.prepare(`
        SELECT match_code, pick FROM full_bracket_picks
        WHERE event_id = ? AND user_id = ?
    `).all(event.id, userId);
}
