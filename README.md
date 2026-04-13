# SaaS Multi-Site WordPress

Este repositório contém a base de arquitetura para um SaaS que conecta múltiplos sites WordPress e permite:

- Criar categorias
- Criar páginas
- Salvar conteúdo reutilizável (template)
- Instalar plugins da biblioteca do WordPress
- Instalar temas da biblioteca do WordPress

> **Status atual:** blueprint + modelo de dados Prisma.
> Ainda não existem aplicações `frontend` e `backend` completas neste repositório.

---

## 1) Pré-requisitos

Instale no seu ambiente:

- Node.js 20+
- npm 10+
- Docker + Docker Compose

Verificação rápida:

```bash
node -v
npm -v
docker -v
docker compose version
```

---

## 2) Subir banco e Redis localmente

Crie um arquivo `docker-compose.yml` na raiz com o conteúdo abaixo:

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

Inicie os serviços:

```bash
docker compose up -d
```

---

## 3) Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz com:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wp_saas?schema=public"
REDIS_URL="redis://localhost:6379"
```

---

## 4) Aplicar o schema Prisma

O schema está em `backend/prisma/schema.prisma`.

Se você ainda não tiver um backend Node configurado, execute:

```bash
mkdir -p backend
cd backend
npm init -y
npm install prisma @prisma/client
npx prisma init --datasource-provider postgresql
```

Depois disso:

1. Substitua `backend/prisma/schema.prisma` pelo schema deste repositório (caso necessário).
2. Ajuste o `.env` do backend com o mesmo `DATABASE_URL`.

Agora aplique migrations:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## 5) Testar se está rodando

Validar tabelas criadas:

```bash
npx prisma studio
```

O Prisma Studio deve abrir no navegador mostrando as entidades:

- `User`
- `Site`
- `ContentTemplate`
- `Category`
- `Page`
- `Job`

---

## 6) Próximo passo para rodar o sistema completo

Para ter o SaaS funcional com interface moderna, a sequência recomendada é:

1. Criar API em NestJS (módulos `auth`, `sites`, `categories`, `pages`, `content-library`, `plugins`, `themes`, `jobs`).
2. Criar dashboard em Next.js + Tailwind + shadcn/ui.
3. Integrar WordPress REST API para categorias/páginas.
4. Integrar fila BullMQ para instalações e publicações em lote.

A especificação completa está em:

- `docs/saas-wordpress-architecture.md`
- `backend/prisma/schema.prisma`

---

## 7) Comandos úteis

Parar containers:

```bash
docker compose down
```

Parar e remover volumes (reset total do banco):

```bash
docker compose down -v
```
