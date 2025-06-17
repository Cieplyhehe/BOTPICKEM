// database.js

const Database = require('better-sqlite3');
const fs = require('fs');

// foldery na backupy i eksporty
if (!fs.existsSync('./backup')) fs.mkdirSync('./backup');
if (!fs.existsSync('./exports')) fs.mkdirSync('./exports');

// podpinamy bazę danych SQLite
const db = new Database('db.sqlite');

// Eventy 
db.prepare(`
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    deadline TEXT
)`).run();

// Drużyny w eventach
db.prepare(`
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    name TEXT,
    FOREIGN KEY(event_id) REFERENCES events(id)
)`).run();

// Pick'em grupowy (3-0, 0-3, awanse)
db.prepare(`
CREATE TABLE IF NOT EXISTS picks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    user_id TEXT,
    username TEXT,
    three_zero TEXT,
    zero_three TEXT,
    advance TEXT,
    last_update TEXT,
    FOREIGN KEY(event_id) REFERENCES events(id)
)`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS results (
    event_id INTEGER PRIMARY KEY,
    three_zero TEXT,
    zero_three TEXT,
    advance TEXT,
    FOREIGN KEY(event_id) REFERENCES events(id)
)`).run();

// Prosty bracket playoff
db.prepare(`
CREATE TABLE IF NOT EXISTS bracket_picks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    user_id TEXT,
    username TEXT,
    match_id INTEGER,
    pick TEXT,
    last_update TEXT,
    FOREIGN KEY(event_id) REFERENCES events(id)
)`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS bracket_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    match_id INTEGER,
    winner TEXT,
    FOREIGN KEY(event_id) REFERENCES events(id)
)`).run();

// Full Major Bracket
db.prepare(`
CREATE TABLE IF NOT EXISTS full_bracket (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    teams TEXT,
    FOREIGN KEY(event_id) REFERENCES events(id)
)`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS full_bracket_picks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    user_id TEXT,
    username TEXT,
    match_code TEXT,
    pick TEXT,
    last_update TEXT,
    FOREIGN KEY(event_id) REFERENCES events(id)
)`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS full_bracket_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    match_code TEXT,
    winner TEXT,
    FOREIGN KEY(event_id) REFERENCES events(id)
)`).run();

module.exports = db;
