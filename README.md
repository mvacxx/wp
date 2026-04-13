# WP SaaS Manager (JavaScript, sem Docker)

Projeto SaaS inicial para conectar em sites WordPress e executar ações administrativas:

- Criar categorias.
- Criar páginas.
- Salvar conteúdo reutilizável (template) para usar em outros sites.
- Criar nova página a partir de template salvo.
- Instalar plugins da biblioteca do WordPress.
- Instalar temas da biblioteca do WordPress.

## Stack

- Node.js + Express (backend API)
- HTML/CSS/JavaScript puro (frontend moderno)

## Como executar

```bash
npm install
npm run dev
```

Abra: `http://localhost:3000`

## Pré-requisitos WordPress

1. Usuário com permissão de administrador.
2. Application Password habilitada no usuário WP.
3. REST API disponível em `https://seusite.com/wp-json/wp/v2/...`.

## Observações técnicas

- Os templates estão em memória (`Map`) para simplificar MVP.
- Em produção, use banco multi-tenant (ex.: PostgreSQL) com autenticação do SaaS.
- Endpoints de plugins/temas dependem de permissões e versão/configuração do WordPress.
