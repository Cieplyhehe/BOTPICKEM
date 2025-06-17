// bracket_picks.js

const db = require('./database');
const scheduler = require('./scheduler');

module.exports = {
    createBracket,
    startBracketPickInteraction,
    saveBracketPick
};

// Tworzymy prosty bracket (Podajemy drużyny)
function createBracket(eventName, teamList) {
    const event = db.prepare(`SELECT * FROM events WHERE name = ?`).get(eventName);
    if (!event) throw new Error('Nie znaleziono eventu.');

    const teams = teamList;
    teams.forEach((team, index) => {
        db.prepare(`
            INSERT INTO bracket_picks (event_id, user_id, username, match_id, pick, last_update)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(event.id, 'system', 'system', index + 1, team, null);
    });
}

// Rozpoczynamy typowanie bracketu przez użytkownika
async function startBracketPickInteraction(interaction, eventName) {
    if (scheduler.isPickBlocked(eventName)) {
        await interaction.reply("⛔ Typowanie na ten event jest już zablokowane.");
        return;
    }

    const event = db.prepare(`SELECT * FROM events WHERE name = ?`).get(eventName);
    if (!event) {
        return interaction.reply('❌ Event nie istnieje.');
    }

    const teams = db.prepare(`
        SELECT pick FROM bracket_picks
        WHERE event_id = ? AND user_id = 'system'
        ORDER BY match_id
    `).all(event.id).map(row => row.pick);

    const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
    const components = [];

    teams.forEach((team, index) => {
        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`bracket_${event.id}_${index + 1}`)
                .setPlaceholder(`Wybierz zwycięzcę meczu ${index + 1}`)
                .addOptions(
                    teams.map(t => ({ label: t, value: t }))
                )
                .setMinValues(1).setMaxValues(1)
        );
        components.push(row);
    });

    await interaction.reply({
        content: `🎯 Pick'Em Playoff dla eventu **${eventName}**\nWybierz zwycięzców kolejnych meczów:`,
        components: components,
        ephemeral: true
    });
}

// Zapisywanie typów użytkownika
function saveBracketPick(eventId, userId, username, matchId, pick) {
    const now = new Date().toISOString();

    const existing = db.prepare(`
        SELECT * FROM bracket_picks
        WHERE event_id = ? AND user_id = ? AND match_id = ?
    `).get(eventId, userId, matchId);

    if (existing) {
        db.prepare(`
            UPDATE bracket_picks SET pick = ?, last_update = ?
            WHERE event_id = ? AND user_id = ? AND match_id = ?
        `).run(pick, now, eventId, userId, matchId);
    } else {
        db.prepare(`
            INSERT INTO bracket_picks (event_id, user_id, username, match_id, pick, last_update)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(eventId, userId, username, matchId, pick, now);
    }
}
