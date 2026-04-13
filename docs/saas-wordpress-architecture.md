# SaaS Multi-Site para WordPress (MVP)

## Objetivo
Criar um sistema SaaS com visual moderno para conectar em múltiplos sites WordPress e permitir:

1. **Criar categorias**
2. **Criar páginas**
3. **Salvar conteúdo reutilizável** para publicar em outros sites conectados
4. **Instalar plugins** da biblioteca oficial do WordPress
5. **Instalar temas** da biblioteca oficial do WordPress

---

## Arquitetura sugerida (Senior-level)

### Front-end
- **Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui**
- Layout em dashboard (sidebar + header + cards + data tables)
- Fluxos guiados (wizard) para reduzir erro operacional

### Back-end
- **NestJS (TypeScript)** com módulos por domínio:
  - `auth`
  - `sites`
  - `categories`
  - `pages`
  - `content-library`
  - `plugins`
  - `themes`
  - `jobs`
- Comunicação com WordPress via:
  - **WordPress REST API** (categorias e páginas)
  - **WP-CLI remoto** (preferencial para instalação de plugins/temas em produção)

### Banco de dados
- **PostgreSQL**
- **Prisma ORM**

### Fila e tarefas
- **Redis + BullMQ**
- Tarefas assíncronas para operações demoradas:
  - instalar plugin
  - instalar tema
  - publicar conteúdo em lote

### Observabilidade
- Logs estruturados (pino)
- Métricas (Prometheus + Grafana)
- Auditoria por ação de usuário

---

## Segurança de conexão com WordPress

### Opção recomendada (mais simples para MVP)
- Para cada site, armazenar:
  - URL base
  - usuário técnico
  - **Application Password** do WordPress
- Criptografar credenciais no banco (AES-256-GCM)

### Opção enterprise (fase 2)
- Plugin agente no WordPress + JWT assinado + rotação de chaves

---

## Funcionalidades detalhadas

## 1) Criar categorias
- Selecionar o site conectado
- Informar nome/slug/descrição
- Chamar endpoint WP: `POST /wp-json/wp/v2/categories`
- Persistir mapeamento local (`external_id`)

## 2) Criar páginas
- Editor de conteúdo com blocos (ou HTML)
- Escolher status: rascunho/publicado
- Chamar endpoint WP: `POST /wp-json/wp/v2/pages`
- Suportar criação em um ou vários sites

## 3) Biblioteca de conteúdo reutilizável
- Salvar página como **template interno**
- Estrutura:
  - título
  - conteúdo
  - metadados (tags internas, idioma, categoria de template)
- Botão: “Publicar em outros sites”
  - selecionar múltiplos sites
  - opcional: sobrescrever slug
  - executar em lote via fila

## 4) Instalar plugins da biblioteca WordPress
- Buscar catálogo em `api.wordpress.org/plugins/info/1.2/`
- Exibir versão, nota, instalações ativas
- Acionar job de instalação no site alvo
- Estratégia técnica:
  - Preferir WP-CLI remoto (`wp plugin install <slug> --activate`)
  - Fallback com plugin agente

## 5) Instalar temas da biblioteca WordPress
- Buscar catálogo em `api.wordpress.org/themes/info/1.2/`
- Instalar por slug
- Opção de ativar após instalação

---

## Modelo visual moderno (UX)

## Dashboard principal
- Cards:
  - Sites conectados
  - Publicações hoje
  - Jobs em execução
  - Falhas recentes
- Tabela com ações rápidas por site

## Página “Biblioteca de Conteúdo”
- Grid com cards de templates
- Preview lateral
- Tags e busca full-text

## Página “Marketplace WP”
- Abas: Plugins / Temas
- Barra de busca + filtros (rating, atualizado recentemente)
- Botão “Instalar em…” com modal multi-site

---

## API interna (exemplo)

- `POST /api/sites`
- `GET /api/sites`
- `POST /api/sites/:siteId/categories`
- `POST /api/sites/:siteId/pages`
- `POST /api/content-library`
- `POST /api/content-library/:id/publish`
- `GET /api/wp-marketplace/plugins`
- `POST /api/sites/:siteId/plugins/install`
- `GET /api/wp-marketplace/themes`
- `POST /api/sites/:siteId/themes/install`

---

## Roadmap de entrega

## Sprint 1 (MVP funcional)
- Auth, cadastro de site WP, teste de conexão
- Criar categoria
- Criar página
- Biblioteca de conteúdo local

## Sprint 2
- Publicação multi-site em lote
- Instalação de plugin/tema com job assíncrono
- Logs de auditoria

## Sprint 3
- Permissões por perfil (admin, editor, operador)
- Versionamento de templates
- Relatórios de sucesso/falha por operação

---

## Riscos e mitigação
- **Hospedagens sem SSH/WP-CLI**: usar plugin agente como fallback
- **Rate limit / timeout em lote**: usar fila com retry exponencial
- **Diferenças entre temas/plugins por site**: validação prévia de compatibilidade

---

## Próximo passo recomendado
Implementar primeiro um protótipo técnico com:
1. cadastro de site + teste de conexão,
2. criação de categoria/página,
3. salvar template e publicar em 2 sites.

Assim você valida o core do produto antes de investir na camada completa de marketplace.
