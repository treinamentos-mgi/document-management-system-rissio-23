const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');

test('API de documentos', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  process.env.UPLOAD_DIR = directory;
  process.env.MAX_UPLOAD_BYTES = '128';
  const app = require('../src/app');
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  t.after(async () => {
    await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
    await fs.rm(directory, { recursive: true, force: true });
  });

  function form(owner, content, filename = 'relatorio.txt') {
    const data = new FormData();
    if (owner !== undefined) data.append('owner', owner);
    if (content !== undefined) data.append('file', new Blob([content], { type: 'text/plain' }), filename);
    return data;
  }

  async function upload(data) {
    return fetch(`${baseUrl}/upload`, { method: 'POST', body: data });
  }

  await t.test('valida campos e remove arquivo gravado em caso de erro', async () => {
    let response = await upload(form(undefined, 'conteúdo'));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'VALIDATION_ERROR');
    assert.deepEqual(await fs.readdir(directory), []);

    response = await upload(form('   ', 'conteúdo'));
    assert.equal(response.status, 400);
    assert.deepEqual(await fs.readdir(directory), []);

    response = await upload(form('usuario-1'));
    assert.equal(response.status, 400);
    assert.deepEqual(await fs.readdir(directory), []);
  });

  await t.test('recusa arquivo acima do limite e remove o arquivo parcial', async () => {
    const response = await upload(form('usuario-1', 'x'.repeat(129)));
    assert.equal(response.status, 413);
    assert.equal((await response.json()).error.code, 'FILE_TOO_LARGE');
    assert.deepEqual(await fs.readdir(directory), []);
  });

  await t.test('envia, lista, filtra e baixa documentos', async () => {
    let response = await upload(form('usuario-1', 'conteúdo'));
    assert.equal(response.status, 201);
    const first = await response.json();
    assert.equal(first.originalName, 'relatorio.txt');
    assert.equal(first.owner, 'usuario-1');
    assert.equal(first.size, Buffer.byteLength('conteúdo'));
    assert.equal(first.mimeType, 'text/plain');
    assert.ok(first.id);
    assert.ok(!Number.isNaN(Date.parse(first.uploadedAt)));
    assert.equal('storagePath' in first, false);
    assert.equal('storedName' in first, false);

    response = await upload(form('usuario-2', 'x'.repeat(128), 'outro.txt'));
    assert.equal(response.status, 201);
    const second = await response.json();
    assert.notEqual(first.id, second.id);
    assert.equal(second.size, 128);

    response = await fetch(`${baseUrl}/documents`);
    const all = (await response.json()).documents;
    assert.equal(all.length, 2);
    assert.deepEqual(all[0], first);

    response = await fetch(`${baseUrl}/documents?owner=usuario-2`);
    assert.deepEqual((await response.json()).documents, [second]);
    response = await fetch(`${baseUrl}/documents?owner=desconhecido`);
    assert.deepEqual((await response.json()).documents, []);

    response = await fetch(`${baseUrl}/documents/${first.id}/download`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-disposition'), /attachment;.*relatorio\.txt/);
    assert.equal(await response.text(), 'conteúdo');

    const files = await fs.readdir(directory);
    assert.equal(files.length, 2);
    assert.ok(!files.includes('relatorio.txt'));
    for (const file of files) await fs.unlink(path.join(directory, file));

    response = await fetch(`${baseUrl}/documents/${first.id}/download`);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error.code, 'NOT_FOUND');
    response = await fetch(`${baseUrl}/documents/inexistente/download`);
    assert.equal(response.status, 404);
  });
});
