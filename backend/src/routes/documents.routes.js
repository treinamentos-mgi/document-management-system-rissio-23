const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const controller = require('../controllers/documents.controller');

const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../storage/uploads'));
const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024);

if (!Number.isSafeInteger(maxUploadBytes) || maxUploadBytes <= 0 || maxUploadBytes === Number.MAX_SAFE_INTEGER) {
  throw new Error('MAX_UPLOAD_BYTES deve ser um inteiro positivo.');
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(uploadDir, { recursive: true }, (err) => callback(err, uploadDir));
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});

// O parser sinaliza o limite ao alcançá-lo, portanto aceita-se até o valor configurado.
const upload = multer({ storage, limits: { fileSize: maxUploadBytes + 1 } });
const router = express.Router();

router.post('/upload', upload.single('file'), controller.upload);
router.get('/documents', controller.list);
router.get('/documents/:id/download', controller.download);

module.exports = router;
