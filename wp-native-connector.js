/**
 * Cliente de automação WordPress sem plugin customizado.
 *
 * Requer Node 18+ (fetch nativo).
 */

const config = {
  baseUrl: 'https://example.com',
  username: 'admin',
  appPassword: 'xxxx xxxx xxxx xxxx xxxx xxxx',
};

function authHeader(username, appPassword) {
  const token = Buffer.from(`${username}:${appPassword}`).toString('base64');
  return `Basic ${token}`;
}

async function wpRequest(path, method, body) {
  const response = await fetch(`${config.baseUrl}/wp-json${path}`, {
    method,
    headers: {
      Authorization: authHeader(config.username, config.appPassword),
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Erro ${response.status} em ${path}: ${JSON.stringify(data)}`);
  }

  return data;
}

async function createCategory({ name, slug }) {
  return wpRequest('/wp/v2/categories', 'POST', { name, slug });
}

async function createPage({ title, content, status = 'draft' }) {
  return wpRequest('/wp/v2/pages', 'POST', { title, content, status });
}

async function saveReusableContent({ title, content, status = 'publish' }) {
  return wpRequest('/wp/v2/blocks', 'POST', { title, content, status });
}

async function listReusableContent() {
  return wpRequest('/wp/v2/blocks', 'GET');
}

async function installPlugin({ slug, status = 'inactive' }) {
  return wpRequest('/wp/v2/plugins', 'POST', { slug, status });
}

async function installTheme({ stylesheet }) {
  return wpRequest('/wp/v2/themes', 'POST', { stylesheet });
}

async function demo() {
  console.log('Executando demo (ajuste config antes)...');

  const category = await createCategory({ name: 'Marketing', slug: 'marketing' });
  console.log('Categoria criada:', category.id);

  const block = await saveReusableContent({
    title: 'Hero SaaS',
    content: '<!-- wp:paragraph --><p>Bloco reutilizável</p><!-- /wp:paragraph -->',
  });
  console.log('Template salvo (wp_block):', block.id);

  const page = await createPage({
    title: 'Página de Vendas',
    content: '<h1>Oferta</h1><p>Conteúdo principal</p>',
    status: 'draft',
  });
  console.log('Página criada:', page.id);

  // Descomente se seu host liberar instalação via REST:
  // const plugin = await installPlugin({ slug: 'wordpress-seo' });
  // console.log('Plugin instalado:', plugin.plugin);

  // const theme = await installTheme({ stylesheet: 'astra' });
  // console.log('Tema instalado:', theme.stylesheet);

  const blocks = await listReusableContent();
  console.log('Total de templates:', Array.isArray(blocks) ? blocks.length : 0);
}

if (require.main === module) {
  demo().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  createCategory,
  createPage,
  saveReusableContent,
  listReusableContent,
  installPlugin,
  installTheme,
};
