const multer = require('multer');

function notFound(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Rota não encontrada.' },
  });
}

function handleError(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.storageErrors && err.storageErrors.length) {
    console.error('Falha ao remover arquivos após erro de upload:', err.storageErrors);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Não foi possível processar a requisição.' },
    });
  }

  if (err instanceof multer.MulterError) {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    return res.status(tooLarge ? 413 : 400).json({
      error: {
        code: tooLarge ? 'FILE_TOO_LARGE' : 'VALIDATION_ERROR',
        message: tooLarge ? 'O arquivo excede o tamanho permitido.' : 'Upload inválido.',
      },
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'O corpo da requisição excede o tamanho permitido.' },
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Corpo da requisição inválido.' },
    });
  }

  if (err.status === 400 && err.code === 'VALIDATION_ERROR') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.message },
    });
  }

  console.error('Erro ao processar requisição:', err);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Não foi possível processar a requisição.' },
  });
}

module.exports = { notFound, handleError };
