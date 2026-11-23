const { randomUUID } = require('node:crypto');
const repository = require('../repositories/documents.repository');

function publicDocument(document) {
  const { id, originalName, size, uploadedAt, owner, mimeType } = document;
  return { id, originalName, size, uploadedAt, owner, mimeType };
}

async function create(file, owner) {
  try {
    if (!file || typeof owner !== 'string' || !owner.trim()) {
      const error = new Error('Informe o arquivo e o usuário.');
      error.status = 400;
      throw error;
    }

    const document = {
      id: randomUUID(),
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner: owner.trim(),
      mimeType: file.mimetype,
      storedName: file.filename,
      storagePath: file.path,
    };
    repository.save(document);
    return publicDocument(document);
  } catch (error) {
    if (file) {
      try {
        await repository.removeFile(file.path);
      } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], 'Falha ao remover arquivo após erro de upload.');
      }
    }
    throw error;
  }
}

function list(owner) {
  return repository.list()
    .filter((document) => owner === undefined || document.owner === owner)
    .map(publicDocument);
}

function find(id) {
  return repository.find(id);
}

module.exports = { create, list, find };
