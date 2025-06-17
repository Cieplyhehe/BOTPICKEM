// index.js

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require('./database');
const scheduler = require('./scheduler');

const events = require('./events');
const picks = require('./picks');
const bracket_picks = require('./bracket_picks');
const full_bracket = require('./full_bracket');
const full_bracket_picks = require('./full_bracket_picks');
const mojePicki = require('./moje-picki');

// WPISZ SWOJE DANE BOTA:
const TOKEN = 'MTM4NDI5OTYxMTMyMTAxMjI3NQ.GCTJlR.tbHZurx_XwmQITzNA7FazjjA5ARy7Dau9Ttq3c';
const CLIENT_ID = '1384299611321012275';
const GUILD_ID = '1321222990465073224';

// KOMENDY BOTA:
const commands = [

    new SlashCommandBuilder().setName('nowy-event').setDescription('Tworzy nowy event')
        .addStringOption(opt => opt.setName('nazwa').setDescription('Nazwa eventu').setRequired(true)),

    new SlashCommandBuilder().setName('dodaj-druzyny').setDescription('Dodaje drużyny do eventu')
        .addStringOption(opt => opt.setName('event').setDescription('Nazwa eventu').setRequired(true))
        .addStringOption(opt => opt.setName('lista').setDescription('Lista drużyn, przecinkami').setRequired(true)),

    new SlashCommandBuilder().setName('ustaw-deadline').setDescription('Ustawia deadline eventu')
        .addStringOption(opt => opt.setName('event').setDescription('Nazwa eventu').setRequired(true))
        .addStringOption(opt => opt.setName('deadline').setDescription('Deadline w formacie YYYY-MM-DD HH:MM').setRequired(true)),

    new SlashCommandBuilder().setName('typuj-grupy').setDescription('Rozpoczyna typowanie grupowe')
        .addStringOption(opt => opt.setName('event').setDescription('Nazwa eventu').setRequired(true)),

    new SlashCommandBuilder().setName('typuj-bracket').setDescription('Rozpoczyna typowanie playoff bracketu')
        .addStringOption(opt => opt.setName('event').setDescription('Nazwa eventu').setRequired(true)),

    new SlashCommandBuilder().setName('typuj-full-bracket').setDescription('Rozpoczyna typowanie full major bracketu')
        .addStringOption(opt => opt.setName('event').setDescription('Nazwa eventu').setRequired(true)),

    new SlashCommandBuilder().setName('moje-picki').setDescription('Wyświetla Twoje aktualne picki')
        .addStringOption(opt => opt.setName('event').setDescription('Nazwa eventu').setRequired(true))
        .addStringOption(opt => opt.setName('typ').setDescription('Typ picków (grupy/bracket/full)').setRequired(true)
            .addChoices(
                { name: 'grupy', value: 'grupy' },
                { name: 'bracket', value: 'bracket' },
                { name: 'full', value: 'full' }
            )),
];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log(`✅ Zalogowano jako ${client.user.tag}`);
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('✅ Komendy zarejestrowane.');
    scheduler.startBackupScheduler();
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isStringSelectMenu()) {

            const [prefix, eventId] = interaction.customId.split('_');
            const event = db.prepare(`SELECT * FROM events WHERE id = ?`).get(eventId);
            const eventName = event.name;

            if (prefix === 'three') {
                picks.savePick(eventId, interaction.user.id, interaction.user.username, 'three_zero', interaction.values);
                await interaction.reply({ content: `✅ Zapisano picki 3-0`, ephemeral: true });
            }

            if (prefix === 'zero') {
                picks.savePick(eventId, interaction.user.id, interaction.user.username, 'zero_three', interaction.values);
                await interaction.reply({ content: `✅ Zapisano picki 0-3`, ephemeral: true });
            }

            if (prefix === 'advance') {
                picks.savePick(eventId, interaction.user.id, interaction.user.username, 'advance', interaction.values);
                await interaction.reply({ content: `✅ Zapisano picki awansów`, ephemeral: true });
            }

            if (interaction.customId.startsWith('bracket_')) {
                const parts = interaction.customId.split('_');
                const eventId = parts[1];
                const matchId = parts[2];
                const event = db.prepare(`SELECT * FROM events WHERE id = ?`).get(eventId);
                bracket_picks.saveBracketPick(event.id, interaction.user.id, interaction.user.username, matchId, interaction.values[0]);
                await interaction.reply({ content: `✅ Pick zapisany dla meczu ${matchId}.`, ephemeral: true });
            }

            if (interaction.customId.startsWith('fullpick_')) {
                const parts = interaction.customId.split('_');
                const eventName = parts[1];
                const matchCode = parts[2];
                full_bracket_picks.saveFullBracketPick(eventName, interaction.user.id, interaction.user.username, matchCode, interaction.values[0]);
                await interaction.reply({ content: `✅ Pick zapisany dla meczu ${matchCode}.`, ephemeral: true });
            }

            return;
        }

        if (!interaction.isCommand()) return;
        const { commandName, options } = interaction;

        if (commandName === 'nowy-event') {
            events.createEvent(options.getString('nazwa'));
            await interaction.reply('✅ Event utworzony.');
        }

        if (commandName === 'dodaj-druzyny') {
            const teamList = options.getString('lista').split(',').map(t => t.trim());
            events.addTeamsToEvent(options.getString('event'), teamList);
            await interaction.reply('✅ Drużyny dodane.');
        }

        if (commandName === 'ustaw-deadline') {
            const event = db.prepare(`SELECT * FROM events WHERE name = ?`).get(options.getString('event'));
            db.prepare(`UPDATE events SET deadline = ? WHERE id = ?`).run(options.getString('deadline'), event.id);
            await interaction.reply('✅ Deadline ustawiony.');
        }

        if (commandName === 'typuj-grupy') {
            await picks.startPickemInteraction(interaction, options.getString('event'));
        }

        if (commandName === 'typuj-bracket') {
            await bracket_picks.startBracketPickInteraction(interaction, options.getString('event'));
        }

        if (commandName === 'typuj-full-bracket') {
            await full_bracket_picks.startFullBracketPickInteraction(interaction, options.getString('event'));
        }

        if (commandName === 'moje-picki') {
            const eventName = options.getString('event');
            const typ = options.getString('typ');
            let response = '';

            if (typ === 'grupy') {
                response = mojePicki.getMyGroupPicks(eventName, interaction.user.id);
            } else if (typ === 'bracket') {
                response = mojePicki.getMyBracketPicks(eventName, interaction.user.id);
            } else if (typ === 'full') {
                response = mojePicki.getMyFullBracketPicks(eventName, interaction.user.id);
            }

            await interaction.reply({ content: response, ephemeral: true });
        }

    } catch (err) {
        console.error(err);
        await interaction.reply('❌ Błąd: ' + err.message);
    }
});

client.login(TOKEN);
