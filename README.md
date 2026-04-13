# Sistema de Automação para WordPress (Categorias, Páginas, Templates, Plugins e Temas)

Este projeto entrega uma base prática para você controlar um site WordPress via API com as operações:

- Criar categorias.
- Criar páginas.
- Salvar conteúdo reutilizável para usar em outros sites.
- Instalar plugins da biblioteca oficial do WordPress.
- Instalar temas da biblioteca oficial do WordPress.

## Visão de arquitetura (senior)

A abordagem mais segura e escalável é separar em **2 camadas**:

1. **Plugin WordPress (este repositório)**
   - Expõe endpoints REST customizados.
   - Executa as ações no WordPress local com as permissões corretas.
2. **Seu sistema externo (painel/API própria)**
   - Faz chamadas HTTP autenticadas para cada site WordPress conectado.
   - Centraliza templates reutilizáveis por cliente/projeto.

## Por que plugin + API customizada?

- A API nativa do WordPress cria categorias e páginas com facilidade.
- Instalar plugins/temas remotamente exige permissões administrativas e não é recomendado expor sem controle.
- Com plugin customizado, você define regras, logs e validações.

## Instalação

1. Copie `wordpress-connector.php` para a pasta `wp-content/plugins/wp-connector/wp-connector.php`.
2. Ative o plugin no painel do WordPress.
3. Gere autenticação para acesso remoto (recomendado: **Application Passwords** do WordPress).
4. Chame os endpoints abaixo a partir do seu sistema.

## Endpoints REST

Base: `/wp-json/wp-connector/v1`

### 1) Criar categoria

`POST /categories`

Body JSON:

```json
{
  "name": "Marketing",
  "slug": "marketing"
}
```

### 2) Criar página

`POST /pages`

Body JSON:

```json
{
  "title": "Página de Vendas",
  "content": "<h1>Oferta</h1><p>Conteúdo...</p>",
  "status": "publish"
}
```

### 3) Salvar conteúdo reutilizável (template)

`POST /templates`

Body JSON:

```json
{
  "title": "Bloco Hero SaaS",
  "content": "<section>...</section>",
  "meta": {
    "segmento": "tecnologia",
    "idioma": "pt-BR"
  }
}
```

### 4) Listar templates

`GET /templates`

### 5) Instalar plugin do diretório oficial

`POST /plugins/install`

Body JSON:

```json
{
  "slug": "wordpress-seo"
}
```

### 6) Instalar tema do diretório oficial

`POST /themes/install`

Body JSON:

```json
{
  "slug": "astra"
}
```

## Observações importantes

- Essas rotas exigem usuário com capacidade administrativa (`manage_options`).
- Em produção, proteja com HTTPS, controle de IP e auditoria.
- Você pode replicar templates em outros sites consumindo `/templates` de um site origem e enviando via `POST /pages` no destino.

## Próximos passos sugeridos

- Adicionar endpoint para **atualizar/remover** templates.
- Adicionar endpoint para **instalar versão específica** de plugin/tema.
- Implementar logs de auditoria em tabela customizada.
- Criar um painel web (React/Next.js) para orquestrar múltiplos sites.
