# Document Management System com GitHub Copilot

<img src="https://octodex.github.com/images/Professortocat_v2.png" align="right" height="200px" />

Hey rissio!

Mona here. I'm done preparing your exercise. Hope you enjoy! 💚

Remember, it's self-paced so feel free to take a break! ☕️

[![](https://img.shields.io/badge/Go%20to%20Exercise-%E2%86%92-1f883d?style=for-the-badge&logo=github&labelColor=197935)](https://github.com/treinamentos-mgi/document-management-system-rissio-23/issues/1)

---

## Backend

Execute `cd backend && npm install && npm start` para iniciar o servidor
na porta `3000`; `npm test` executa os testes. A porta pode ser alterada
com `PORT`. Os uploads usam `backend/storage/uploads` por padrão; `UPLOAD_DIR`
altera o diretório local e `MAX_UPLOAD_BYTES` define o limite em bytes
(padrão: 10485760).
Cada upload também aceita até 10 campos de texto de até 16 KiB cada e uma
única parte de arquivo.

A API oferece `POST /upload` com `file` e `owner` em `multipart/form-data`,
`GET /documents` (filtro opcional `owner`) e `GET /documents/:id/download`.
Os metadados são mantidos apenas em memória e se perdem no reinício. O dono
informado pelo cliente não é autenticado e o filtro não controla acesso.
Consulte a [especificação](docs/specs/dms-spec.md) para os contratos completos.

## Frontend

Com o backend em execução, use `cd frontend && npm install && npm run dev` e
abra o endereço exibido pelo Vite. A interface utiliza o proxy `/api` para enviar,
listar, filtrar e baixar documentos. Para testar a integração, execute
`node --test frontend/test/documents.test.js` na raiz do repositório, após
instalar as dependências do backend e do frontend.

## Integração contínua

A pipeline executa em pushes e pull requests com Node.js 24: instala as
dependências, executa os testes do backend e de integração e compila o frontend.

---

&copy; 2025 GitHub &bull; [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md) &bull; [MIT License](https://gh.io/mit)

