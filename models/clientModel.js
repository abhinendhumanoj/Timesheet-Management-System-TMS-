const { readState, insert } = require('../db');

function getAll() {
  return readState().clients.slice().sort((a, b) => a.name.localeCompare(b.name));
}

function create(name) {
  const state = readState();
  if (state.clients.some((client) => client.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('Client already exists');
  }
  return insert('clients', { name });
}

module.exports = {
  getAll,
  create
};
