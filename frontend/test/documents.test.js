import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { uploadDocument, listDocuments, downloadDocument } from '../src/services/documents.js';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('frontend integra o serviço e o proxy à API de documentos', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'dms-frontend-test-'));
  const previousUploadDir = process.env.UPLOAD_DIR;
  const originalFetch = globalThis.fetch;
  let backend;
  let vite;

  t.after(async () => {
    globalThis.fetch = originalFetch;
    if (vite) await vite.close();
    if (backend) {
      await new Promise((resolve, reject) => backend.close((error) => error ? reject(error) : resolve()));
    }
    if (previousUploadDir === undefined) delete process.env.UPLOAD_DIR;
    else process.env.UPLOAD_DIR = previousUploadDir;
    await rm(directory, { recursive: true, force: true });
  });

  process.env.UPLOAD_DIR = directory;
  const require = createRequire(import.meta.url);
  const app = require('../../backend/src/app.js');
  backend = app.listen(0, '127.0.0.1');
  await once(backend, 'listening');
  vite = await createServer({
    configFile: path.join(frontendRoot, 'vite.config.js'),
    root: frontendRoot,
    logLevel: 'silent',
    server: {
      host: '127.0.0.1',
      port: 0,
      hmr: false,
      proxy: { '/api': { target: `http://127.0.0.1:${backend.address().port}` } },
    },
  });
  await vite.listen();
  const baseUrl = `http://127.0.0.1:${vite.httpServer.address().port}`;
  globalThis.fetch = (input, options) => originalFetch(new URL(input, baseUrl), options);

  const html = await originalFetch(baseUrl);
  assert.equal(html.status, 200);
  assert.match(await html.text(), /src\/main\.jsx/);

  const file = new File(['conteúdo do documento'], 'relatorio.txt', { type: 'text/plain' });
  const created = await uploadDocument(file, 'usuario-1');
  assert.equal(created.originalName, file.name);
  assert.equal(created.owner, 'usuario-1');
  assert.deepEqual(await listDocuments('usuario-1'), [created]);
  assert.deepEqual(await listDocuments('outro usuário'), []);
  assert.equal(await (await downloadDocument(created.id)).text(), 'conteúdo do documento');
  await assert.rejects(downloadDocument('inexistente'), /Documento não encontrado/);

  const { default: DocumentList } = await vite.ssrLoadModule('/src/components/DocumentList.jsx');
  const markup = renderToStaticMarkup(React.createElement(DocumentList, { documents: [created] }));
  assert.match(markup, /relatorio\.txt/);
  assert.match(markup, /usuario-1/);
  assert.match(markup, /Baixar relatorio\.txt/);

  const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
  const appMarkup = renderToStaticMarkup(React.createElement(App));
  assert.match(appMarkup, /Enviar documento/);
  assert.match(appMarkup, /Filtrar por usuário/);

  globalThis.fetch = async () => new Response('{"documents":null}', {
    headers: { 'content-type': 'application/json' },
  });
  await assert.rejects(listDocuments(''), /lista de documentos inválida/);

  globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
  await assert.rejects(listDocuments(''), /Não foi possível conectar ao servidor/);
});
