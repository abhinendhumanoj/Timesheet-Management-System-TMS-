const { readState, insert } = require('../db');

function getAll() {
  const state = readState();
  return state.tasks
    .map((task) => ({
      ...task,
      project_name: state.projects.find((project) => project.id === task.project_id)?.name || 'Unknown'
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function create(name, projectId) {
  return insert('tasks', { name, project_id: Number(projectId) });
}

module.exports = {
  getAll,
  create
};
