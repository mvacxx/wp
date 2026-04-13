# SaaS Multi-Site WordPress

Este repositório contém a base para um SaaS que conecta múltiplos sites WordPress e oferece:

- Criação de categorias
- Criação de páginas
- Biblioteca de conteúdo reutilizável
- Instalação de plugins da biblioteca WordPress
- Instalação de temas da biblioteca WordPress

> **Importante:** neste momento, o repositório possui **documentação + schema Prisma**.
> Ainda não existe aplicação `frontend`/`backend` completa pronta para produção.

---

## Guia completo de instalação (passo a passo)

## Passo 0 — Confirmar que você está na pasta do projeto

```bash
pwd
```

Resultado esperado: caminho terminando com `.../wp`.

---

## Passo 1 — Instalar pré-requisitos

Você precisa ter:

1. **Node.js 20+**
2. **npm 10+**
3. **Docker**
4. **Docker Compose**

### 1.1 Validar versões instaladas

```bash
node -v
npm -v
docker -v
docker compose version
```

Se algum comando falhar, instale a dependência faltante e repita a validação.

---

## Passo 2 — Criar infraestrutura local (PostgreSQL + Redis)

## 2.1 Criar arquivo `docker-compose.yml` na raiz

Crie o arquivo com este conteúdo:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: wp_saas_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: wp_saas
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    container_name: wp_saas_redis
    restart: unless-stopped
    ports:
      - "6379:6379"

volumes:
  pg_data:
```

## 2.2 Subir containers

```bash
docker compose up -d
```

## 2.3 Conferir se os serviços estão de pé

```bash
docker compose ps
```

Resultado esperado: serviços `wp_saas_postgres` e `wp_saas_redis` com status `running`/`Up`.

---

## Passo 3 — Criar variáveis de ambiente

## 3.1 Arquivo `.env` na raiz do repositório

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wp_saas?schema=public"
REDIS_URL="redis://localhost:6379"
```

## 3.2 Validar conexão com PostgreSQL (opcional, recomendado)

```bash
docker exec -it wp_saas_postgres psql -U postgres -d wp_saas -c '\dt'
```

Se o banco estiver vazio, o comando pode retornar "Did not find any relations" (normal antes da migration).

---

## Passo 4 — Preparar ambiente Prisma

O schema principal está em:

- `backend/prisma/schema.prisma`

## 4.1 Entrar na pasta backend

```bash
cd backend
```

## 4.2 Inicializar projeto Node (caso ainda não exista `package.json`)

```bash
npm init -y
```

## 4.3 Instalar dependências Prisma

```bash
npm install prisma @prisma/client
```

## 4.4 Inicializar Prisma (se necessário)

```bash
npx prisma init --datasource-provider postgresql
```

> Se esse comando gerar outro `prisma/schema.prisma`, mantenha o schema deste repositório em `backend/prisma/schema.prisma`.

## 4.5 Criar/ajustar `.env` dentro de `backend/`

Crie `backend/.env` com:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wp_saas?schema=public"
```

---

## Passo 5 — Aplicar migrations no banco

Ainda em `backend/`, execute:

```bash
npx prisma migrate dev --name init
```

Depois gere o client Prisma:

```bash
npx prisma generate
```

Resultado esperado:

- migration criada/aplicada com sucesso
- Prisma Client gerado sem erro

---

## Passo 6 — Validar se o sistema base está funcionando

## 6.1 Abrir Prisma Studio

```bash
npx prisma studio
```

Isso deve abrir uma interface web com os modelos:

- `User`
- `Site`
- `ContentTemplate`
- `Category`
- `Page`
- `Job`

## 6.2 Testar listagem de tabelas no PostgreSQL

Em outro terminal:

```bash
docker exec -it wp_saas_postgres psql -U postgres -d wp_saas -c '\dt'
```

Resultado esperado: tabelas relacionadas ao schema Prisma.

---

## Passo 7 — Encerrar ambiente local

Parar serviços:

```bash
docker compose down
```

Parar e remover volumes (reset completo do banco):

```bash
docker compose down -v
```

---

## Erros comuns e solução

## Erro: porta 5432 ocupada

- Ajuste a porta no `docker-compose.yml` (ex.: `5433:5432`)
- Atualize também o `DATABASE_URL`

Exemplo:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/wp_saas?schema=public"
```

## Erro: `P1001 Can't reach database server`

- Verifique se o container do Postgres está ativo com `docker compose ps`
- Verifique host/porta/usuário/senha no `DATABASE_URL`

## Erro: `prisma` não encontrado

- Rode novamente `npm install prisma @prisma/client`
- Use `npx prisma ...` em vez de `prisma ...`

---

## Próximos passos (para rodar o SaaS completo)

Após validar banco + Prisma, evolua nesta ordem:

1. API em NestJS (`auth`, `sites`, `categories`, `pages`, `content-library`, `plugins`, `themes`, `jobs`)
2. Dashboard Next.js + Tailwind + shadcn/ui
3. Integração WordPress REST API
4. Fila BullMQ para jobs assíncronos
5. Logs/auditoria e controle de permissões

Referências deste repositório:

- `docs/saas-wordpress-architecture.md`
- `backend/prisma/schema.prisma`
