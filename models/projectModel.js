const { readState, insert } = require('../db');

function getAll() {
  const state = readState();
  return state.projects
    .map((project) => ({
      ...project,
      client_name: state.clients.find((client) => client.id === project.client_id)?.name || 'Unknown',
      manager_name: state.users.find((user) => user.id === project.manager_id)?.name || null
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function create(name, clientId, managerId) {
  return insert('projects', {
    name,
    client_id: Number(clientId),
    manager_id: managerId ? Number(managerId) : null
  });
}

function countAll() {
  return readState().projects.length;
}

module.exports = {
  getAll,
  create,
  countAll
};
