# Sistema de Automação WordPress **sem plugin customizado**

Sim — dá para rodar sem copiar `wordpress-connector.php` para o servidor.

A estratégia é usar **somente a REST API nativa do WordPress** + autenticação com **Application Passwords**.

## O que este modelo cobre

- Criar categorias.
- Criar páginas.
- Salvar conteúdo reutilizável para usar em outros sites.
- Instalar plugins da biblioteca oficial.
- Instalar temas da biblioteca oficial.

## Pré-requisitos no WordPress

1. WordPress com REST API ativa.
2. Usuário administrador.
3. Application Password criada para esse usuário.
4. HTTPS habilitado.

> Observação: em alguns hosts/versões antigas, endpoints de plugins/temas podem estar restritos. Nesse caso, mantenha fallback via WP-CLI/SSH.

## Endpoints nativos usados

Base: `https://seu-site.com/wp-json`

### 1) Criar categoria

`POST /wp/v2/categories`

```json
{
  "name": "Marketing",
  "slug": "marketing"
}
```

### 2) Criar página

`POST /wp/v2/pages`

```json
{
  "title": "Página de Vendas",
  "content": "<h1>Oferta</h1><p>Conteúdo...</p>",
  "status": "publish"
}
```

### 3) Salvar conteúdo reutilizável

Use o post type nativo `wp_block` (blocos reutilizáveis):

`POST /wp/v2/blocks`

```json
{
  "title": "Hero SaaS",
  "content": "<!-- wp:paragraph --><p>Meu bloco reutilizável</p><!-- /wp:paragraph -->",
  "status": "publish"
}
```

Para listar:

`GET /wp/v2/blocks`

### 4) Instalar plugin do diretório oficial

`POST /wp/v2/plugins`

```json
{
  "slug": "wordpress-seo",
  "status": "inactive"
}
```

### 5) Instalar tema do diretório oficial

`POST /wp/v2/themes`

```json
{
  "stylesheet": "astra"
}
```

## Uso no seu sistema

Este repositório inclui `wp-native-connector.js`, um cliente Node.js que encapsula as chamadas acima.

### Exemplo rápido

```bash
node wp-native-connector.js
```

Edite as variáveis no arquivo para seu ambiente (`baseUrl`, `username`, `appPassword`).

## Arquitetura recomendada (senior)

- **Camada de orquestração (seu sistema)**: controla vários sites, templates e automações.
- **Camada de execução**: chama APIs nativas de cada WordPress com credenciais próprias.
- **Logs/auditoria**: registrar request/response e `site_id`, `actor`, `timestamp`.

## Quando ainda vale plugin customizado?

- Regras de negócio muito específicas.
- Necessidade de endpoints próprios com validações complexas.
- Compatibilidade com ambiente onde endpoints nativos de plugin/tema estejam bloqueados.
