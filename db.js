const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const dataPath = path.join(__dirname, 'database.json');
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

function defaultState() {
  return {
    users: [],
    clients: [],
    projects: [],
    tasks: [],
    timesheets: [],
    entries: []
  };
}

function ensureDataFile() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify(defaultState(), null, 2));
  }
}

function readState() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

function writeState(state) {
  fs.writeFileSync(dataPath, JSON.stringify(state, null, 2));
}

function nextId(items) {
  return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
}

function insert(table, record) {
  const state = readState();
  const entry = { id: nextId(state[table]), ...record };
  state[table].push(entry);
  writeState(state);
  return entry;
}

function updateWhere(table, predicate, updater) {
  const state = readState();
  let updatedCount = 0;
  state[table] = state[table].map((item) => {
    if (!predicate(item)) {
      return item;
    }
    updatedCount += 1;
    return { ...item, ...updater(item) };
  });
  writeState(state);
  return updatedCount;
}

function deleteWhere(table, predicate) {
  const state = readState();
  const originalLength = state[table].length;
  state[table] = state[table].filter((item) => !predicate(item));
  writeState(state);
  return originalLength - state[table].length;
}

async function initializeDatabase() {
  ensureDataFile();
  const state = readState();
  const users = [
    { name: 'System Admin', email: 'admin@test.com', password: '123', role: 'admin' },
    { name: 'Project Manager', email: 'manager@test.com', password: '123', role: 'manager' },
    { name: 'Demo Resource', email: 'user@test.com', password: '123', role: 'resource' }
  ];

  for (const user of users) {
    const existing = state.users.find((item) => item.email === user.email);
    if (!existing) {
      const password = await bcrypt.hash(user.password, 10);
      state.users.push({ id: nextId(state.users), name: user.name, email: user.email, password, role: user.role });
    }
  }

  writeState(state);
}

module.exports = {
  db,
  readState,
  writeState,
  insert,
  updateWhere,
  deleteWhere,
  initializeDatabase
};
