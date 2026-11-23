import { useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/documents.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [ownerInput, setOwnerInput] = useState('');
  const [owner, setOwner] = useState('');
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    listDocuments(owner, controller.signal)
      .then(setDocuments)
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [owner, revision]);

  function applyFilter(event) {
    event.preventDefault();
    setOwner(ownerInput.trim());
    setRevision((value) => value + 1);
  }

  function handleUploaded() {
    setOwnerInput('');
    setOwner('');
    setRevision((value) => value + 1);
  }

  return (
    <main className="container">
      <header>
        <h1>Gestão de documentos</h1>
        <p>Envie, consulte e baixe seus documentos.</p>
      </header>

      <UploadComponent onUploaded={handleUploaded} />

      <section aria-labelledby="documents-title">
        <h2 id="documents-title">Documentos</h2>
        <form className="filter" onSubmit={applyFilter}>
          <label htmlFor="owner-filter">Filtrar por usuário</label>
          <div className="filter-controls">
            <input
              id="owner-filter"
              value={ownerInput}
              onChange={(event) => setOwnerInput(event.target.value)}
              placeholder="Todos os usuários"
            />
            <button type="submit">Filtrar</button>
          </div>
        </form>
        {loading && <p role="status">Carregando documentos...</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && <DocumentList documents={documents} />}
      </section>
    </main>
  );
}
