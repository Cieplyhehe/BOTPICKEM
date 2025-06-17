// picks.js

const db = require('./database');
const scheduler = require('./scheduler');

module.exports = {
    startPickemInteraction,
    savePick
};

async function startPickemInteraction(interaction, eventName) {
    if (scheduler.isPickBlocked(eventName)) {
        await interaction.reply("⛔ Typowanie na ten event jest już zablokowane.");
        return;
    }

    const event = db.prepare(`SELECT * FROM events WHERE name = ?`).get(eventName);
    if (!event) {
        return interaction.reply('❌ Event nie istnieje.');
    }

    const teams = db.prepare(`SELECT name FROM teams WHERE event_id = ?`).all(event.id).map(row => row.name);
    if (teams.length < 8) {
        return interaction.reply('❌ Za mało drużyn w evencie (min. 8).');
    }

    const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
    const selectOptions = teams.map(team => ({ label: team, value: team }));

    const rowThreeZero = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`three_zero_${event.id}`)
            .setPlaceholder('Wybierz 2 drużyny na 3-0')
            .addOptions(selectOptions)
            .setMinValues(2).setMaxValues(2)
    );

    const rowZeroThree = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`zero_three_${event.id}`)
            .setPlaceholder('Wybierz 2 drużyny na 0-3')
            .addOptions(selectOptions)
            .setMinValues(2).setMaxValues(2)
    );

    const rowAdvance = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`advance_${event.id}`)
            .setPlaceholder('Wybierz 6 drużyn awansujących')
            .addOptions(selectOptions)
            .setMinValues(6).setMaxValues(6)
    );

    await interaction.reply({
        content: `🎯 Pick'Em dla eventu **${eventName}**\nWybierz swoje typy:`,
        components: [rowThreeZero, rowZeroThree, rowAdvance],
        ephemeral: true
    });
}

function savePick(eventId, userId, username, type, values) {
    let pick = db.prepare(`SELECT * FROM picks WHERE event_id = ? AND user_id = ?`).get(eventId, userId);
    const now = new Date().toISOString();

    if (!pick) {
        pick = { event_id: eventId, user_id: userId, username, three_zero: '', zero_three: '', advance: '', last_update: now };
        db.prepare(`
            INSERT INTO picks (event_id, user_id, username, three_zero, zero_three, advance, last_update)
            VALUES (@event_id, @user_id, @username, @three_zero, @zero_three, @advance, @last_update)
        `).run(pick);
    }

    if (type === 'three_zero') {
        db.prepare(`UPDATE picks SET three_zero = ?, last_update = ? WHERE event_id = ? AND user_id = ?`)
            .run(values.join(','), now, eventId, userId);
    }

    if (type === 'zero_three') {
        db.prepare(`UPDATE picks SET zero_three = ?, last_update = ? WHERE event_id = ? AND user_id = ?`)
            .run(values.join(','), now, eventId, userId);
    }

    if (type === 'advance') {
        db.prepare(`UPDATE picks SET advance = ?, last_update = ? WHERE event_id = ? AND user_id = ?`)
            .run(values.join(','), now, eventId, userId);
    }
}
