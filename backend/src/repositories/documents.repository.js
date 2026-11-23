const fs = require('node:fs/promises');

const documents = new Map();

function save(document) {
  documents.set(document.id, document);
}

function list() {
  return Array.from(documents.values());
}

function find(id) {
  return documents.get(id);
}

function removeFile(filePath) {
  return fs.unlink(filePath);
}

module.exports = { save, list, find, removeFile };
