import DownloadButton from './DownloadButton.jsx';

export default function DocumentList({ documents }) {
  if (documents.length === 0) {
    return <p>Nenhum documento encontrado.</p>;
  }

  return (
    <ul className="document-list">
      {documents.map((document) => (
        <li key={document.id}>
          <div className="document-details">
            <strong>{document.originalName}</strong>
            <span>Identificador: {document.id}</span>
            <span>Usuário: {document.owner}</span>
            <span>Tamanho: {document.size.toLocaleString('pt-BR')} bytes</span>
            <span>Enviado em: {new Date(document.uploadedAt).toLocaleString('pt-BR')}</span>
            <span>Tipo: {document.mimeType}</span>
          </div>
          <DownloadButton document={document} />
        </li>
      ))}
    </ul>
  );
}
