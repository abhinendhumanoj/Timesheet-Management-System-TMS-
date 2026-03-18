const bcrypt = require('bcrypt');
const { readState, writeState, insert } = require('../db');

function sanitize(user) {
  const { password, ...rest } = user;
  return rest;
}

function findByEmail(email) {
  const state = readState();
  return state.users.find((user) => user.email === email) || null;
}

function getAll() {
  const state = readState();
  return state.users
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(sanitize);
}

function getByRole(role) {
  const state = readState();
  return state.users
    .filter((user) => user.role === role)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((user) => ({ id: user.id, name: user.name }));
}

async function create({ name, email, password, role }) {
  const state = readState();
  if (state.users.some((user) => user.email === email)) {
    throw new Error('Email already exists');
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  return insert('users', { name, email, password: hashedPassword, role });
}

function countAll() {
  return readState().users.length;
}

module.exports = {
  findByEmail,
  getAll,
  getByRole,
  create,
  countAll
};
