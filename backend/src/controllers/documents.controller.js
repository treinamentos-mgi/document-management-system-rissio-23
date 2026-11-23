const service = require('../services/documents.service');

async function upload(req, res) {
  const document = await service.create(req.file, req.body && req.body.owner);
  res.status(201).json(document);
}

function list(req, res) {
  res.json({ documents: service.list(req.query.owner) });
}

function download(req, res, next) {
  const document = service.find(req.params.id);
  if (!document) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Documento não encontrado.' },
    });
  }

  return res.download(document.storagePath, document.originalName, (err) => {
    if (!err) {
      return;
    }
    if (err.code === 'ENOENT' && !res.headersSent) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Documento não encontrado.' },
      });
    }
    return next(err);
  });
}

module.exports = { upload, list, download };
