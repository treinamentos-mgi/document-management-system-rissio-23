---
description: Valida o fluxo de documentos e relata resultados e limitações.
name: validar-fluxo-dms
agent: agent
---

# Validar o fluxo do DMS

Verifique a implementação atual sem alterar arquivos de produção:

1. Leia os contratos relevantes em `docs/specs/dms-spec.md` e identifique as
   alterações ou os fluxos que precisam de validação.
2. Execute `npm test --prefix backend`, `npm run build --prefix frontend` e
   `node --test frontend/test/documents.test.js` a partir da raiz.
3. Quando houver navegador disponível, valide envio, filtro, listagem e
   download pela interface, incluindo um caso de erro e navegação por teclado.
4. Isole os arquivos de teste em diretórios temporários e remova somente os
   dados criados pela própria validação. Não use serviços externos.
5. Relate comandos e resultados, problemas encontrados e verificações não
   realizadas. Não apresente testes automatizados como validação manual.

Se uma etapa falhar, mostre a causa observada e não declare o fluxo validado
integralmente. Não instale dependências sem necessidade.
