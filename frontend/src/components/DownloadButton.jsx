import { useState } from 'react';
import { downloadDocument } from '../services/documents.js';

export default function DownloadButton({ document: item }) {
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleDownload() {
    setDownloading(true);
    setMessage('');
    setError('');
    try {
      const blob = await downloadDocument(item.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Download iniciado.');
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleDownload} disabled={downloading}>
        {downloading ? 'Baixando...' : `Baixar ${item.originalName}`}
      </button>
      {downloading && <p role="status">Preparando download...</p>}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
