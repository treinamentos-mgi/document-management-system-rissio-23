import { useState } from 'react';
import { uploadDocument } from '../services/documents.js';

export default function UploadComponent({ onUploaded }) {
  const [owner, setOwner] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!owner.trim() || !file) {
      setError('Informe o usuário e selecione um arquivo.');
      return;
    }

    const form = event.currentTarget;
    setUploading(true);
    try {
      await uploadDocument(file, owner.trim());
      form.reset();
      setOwner('');
      setFile(null);
      setMessage('Documento enviado com sucesso.');
      onUploaded();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section aria-labelledby="upload-title">
      <h2 id="upload-title">Enviar documento</h2>
      <form className="upload-form" onSubmit={handleSubmit}>
        <label htmlFor="owner">Usuário</label>
        <input
          id="owner"
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          required
          disabled={uploading}
        />
        <label htmlFor="file">Arquivo</label>
        <input
          id="file"
          type="file"
          onChange={(event) => setFile(event.target.files[0] || null)}
          required
          disabled={uploading}
        />
        <button type="submit" disabled={uploading}>
          {uploading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      {uploading && <p role="status">Enviando documento...</p>}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
