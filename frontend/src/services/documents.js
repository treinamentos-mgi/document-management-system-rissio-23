async function request(path, options) {
  let response;
  try {
    response = await fetch(`/api${path}`, options);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar ao servidor.');
  }

  if (!response.ok) {
    let message = `Não foi possível concluir a operação (erro ${response.status}).`;
    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await response.json();
        message = body.error?.message || message;
      } catch {
        throw new Error(`O servidor retornou uma resposta de erro inválida (erro ${response.status}).`);
      }
    }
    throw new Error(message);
  }
  return response;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    throw new Error('O servidor retornou uma resposta inválida.');
  }
}

export async function uploadDocument(file, owner) {
  const body = new FormData();
  body.append('file', file);
  body.append('owner', owner);
  const response = await request('/upload', { method: 'POST', body });
  return readJson(response);
}

export async function listDocuments(owner, signal) {
  const query = owner ? `?${new URLSearchParams({ owner })}` : '';
  const response = await request(`/documents${query}`, { signal });
  const body = await readJson(response);
  if (!Array.isArray(body.documents)) {
    throw new Error('O servidor retornou uma lista de documentos inválida.');
  }
  return body.documents;
}

export async function downloadDocument(id) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`);
  return response.blob();
}
