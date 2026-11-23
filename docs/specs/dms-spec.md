# Especificação - Document Management System

## 1. Objetivo

Disponibilizar uma aplicação web para enviar, listar e baixar documentos, associando cada documento a um usuário.

## 2. Escopo

### Dentro do escopo

- Upload, listagem e download de documentos.
- Associação de documentos a um identificador de usuário e filtro por dono.
- Interface em português com estados de carregamento, sucesso e erro.
- Arquivos no filesystem local com `multer` e `diskStorage`; metadados em memória.
- Endpoint de saúde existente.

### Fora do escopo

- Armazenamento externo ou em nuvem e banco de dados persistente.
- Autenticação, autorização e isolamento seguro entre usuários.
- Versionamento, edição, exclusão, compartilhamento e pré-visualização de documentos.

### Premissas e limitações

- O campo de dono é informado pelo cliente e não comprova sua identidade; o filtro não é uma proteção de acesso.
- Os metadados são perdidos ao reiniciar o backend. Os arquivos podem permanecer em disco, mas não estarão disponíveis na listagem ou no download sem seus metadados.
- Múltiplas instâncias não compartilham metadados nem necessariamente o armazenamento local; esse cenário não é suportado nesta fase.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo e informar seu identificador de dono. |
| RF-02 | O backend recebe o arquivo em `multipart/form-data` no campo `file`. |
| RF-03 | O servidor gera identificador único e nome físico próprio e retorna os metadados públicos do documento criado. |
| RF-04 | O usuário pode listar documentos e filtrar opcionalmente pelo dono. |
| RF-05 | O usuário pode baixar um documento pelo identificador, usando seu nome original no download. |
| RF-06 | Arquivo ou dono ausente ou inválido deve gerar erro de validação; arquivos já gravados devem ser removidos se o cadastro falhar. |
| RF-07 | Documento inexistente ou arquivo correspondente indisponível deve resultar em resposta `404`. |
| RF-08 | A interface apresenta os metadados e informa carregamento, sucesso e falhas das operações. |
| RF-09 | O endpoint de saúde existente continua respondendo. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Gravar arquivos exclusivamente no filesystem local da aplicação por meio de `multer` com `diskStorage`. |
| RNF-02 | Manter os metadados em memória, sem banco de dados nesta fase. |
| RNF-03 | Respeitar o fluxo `routes → controllers → services → repositories`. |
| RNF-04 | Obter configurações, como porta, diretório e limite de upload, de variáveis de ambiente, com padrões documentados. |
| RNF-05 | Não usar o nome original para construir o caminho de armazenamento; evitar travessia de diretórios e exposição de caminhos internos. |
| RNF-06 | Retornar erros em formato consistente, sem expor detalhes internos do servidor. |
| RNF-07 | Garantir interface utilizável por teclado, com rótulos e mensagens de estado perceptíveis. |
| RNF-08 | Cobrir contratos principais e erros com testes automatizados sem serviços externos. |

## 5. Modelo de dados

### Documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string (UUID) | Identificador único do documento. |
| `originalName` | string | Nome original para exibição e download. |
| `size` | number | Tamanho em bytes. |
| `uploadedAt` | string (ISO 8601) | Data e hora do upload. |
| `owner` | string | Identificador informado para o dono. |
| `mimeType` | string | Tipo de mídia recebido no upload, não considerado confiável. |
| `storedName` | string | Nome interno gerado pelo servidor. |
| `storagePath` | string | Caminho interno do arquivo local. |

`storedName` e `storagePath` são internos e não aparecem nas respostas da API. O diretório padrão proposto é `backend/storage/uploads`, configurável por `UPLOAD_DIR`. O índice em memória não é reconstruído a partir dos arquivos após reinício.

## 6. Contratos de API

As rotas abaixo são expostas pelo backend sem prefixo. No desenvolvimento, o frontend usa `/api` e o proxy do Vite remove esse prefixo antes de encaminhar a requisição.

### Formato de erro

As respostas de erro usam JSON, com código estável e mensagem em português:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Informe o arquivo e o usuário."
  }
}
```

### `POST /upload`

- Entrada `multipart/form-data`: `file` (arquivo obrigatório) e `owner` (identificador não vazio obrigatório). Até 10 campos de texto são aceitos, com limite de 16 KiB por campo; somente um arquivo é permitido.
- `201`: metadados públicos do documento criado:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "relatorio.pdf",
  "size": 12345,
  "uploadedAt": "2026-01-01T12:00:00.000Z",
  "owner": "usuario-1",
  "mimeType": "application/pdf"
}
```

- `400`: entrada inválida ou campo obrigatório ausente.
- `413`: arquivo maior que o limite configurado.
- `500`: falha inesperada de gravação ou processamento.

### `GET /documents`

- Parâmetro opcional `owner`: filtra os documentos pelo identificador do dono, ignorando espaços no início e no fim.
- `200`: objeto com lista de metadados públicos; sem resultados, retorna `{"documents": []}`.

```json
{
  "documents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "originalName": "relatorio.pdf",
      "size": 12345,
      "uploadedAt": "2026-01-01T12:00:00.000Z",
      "owner": "usuario-1",
      "mimeType": "application/pdf"
    }
  ]
}
```

### `GET /documents/:id/download`

- `200`: conteúdo binário e `Content-Disposition` de anexo com nome original tratado com segurança.
- `404`: metadados ou arquivo correspondente não encontrado.
- `500`: outra falha inesperada de leitura.

### `GET /health`

- `200`: `{"status": "ok"}`.

## 7. Decisões arquiteturais

- **Backend:** Node.js e Express em CommonJS; rotas registram endpoints e middlewares, controllers tratam HTTP, services aplicam regras de negócio e repositories cuidam da persistência.
- **Armazenamento:** `multer.diskStorage` grava no disco local com nome gerado pelo servidor; repositório mantém metadados em memória. Em caso de falha após gravação, remover o arquivo e sinalizar falhas de limpeza.
- **Frontend:** React com componentes funcionais e Hooks; serviço centralizado usa `fetch` com prefixo `/api`.
- **Configuração:** variáveis de ambiente para configurações de execução, com valores padrão e instruções de uso documentados.
- **Segurança:** nomes e tipos recebidos do cliente não são confiáveis; associação ao dono não substitui autenticação ou autorização.

## 8. Plano de execução

1. **Preparar configuração e erros:** manter `/health` e a exportação do app para testes; definir configurações de armazenamento e limite e o formato comum de erros.
2. **Criar persistência local:** implementar repositórios para metadados em memória e acesso a arquivos locais, com nomes físicos gerados pelo servidor.
3. **Implementar regras de negócio:** cadastrar, listar e recuperar documentos; validar entradas e tratar limpeza após falhas.
4. **Implementar API:** adicionar rotas, controllers e middleware de upload com `multer.diskStorage`, respeitando os contratos e códigos HTTP.
5. **Construir frontend:** criar componentes e serviço de API para informar dono, enviar, listar, filtrar e baixar documentos, exibindo estados de operação.
6. **Testar:** ampliar testes com `node:test` para upload válido e inválido, limite de tamanho, listagem, filtro, download e erros; isolar e limpar arquivos temporários.
7. **Validar e documentar:** executar testes e build, verificar o fluxo completo e documentar comandos, configuração e limitações de persistência e segurança.

Cada etapa de implementação deve preservar a arquitetura em camadas e o armazenamento estritamente local. Este documento é apenas o plano; a implementação ocorrerá nos passos posteriores do exercício.
