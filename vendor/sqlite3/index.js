class Database {
  constructor(filename) {
    this.filename = filename;
  }
}

module.exports = {
  verbose() {
    return { Database };
  },
  Database
};
