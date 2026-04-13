const logEl = document.getElementById('log');
const templateSelect = document.getElementById('templateId');

function log(message, isError = false) {
  const line = document.createElement('div');
  line.className = isError ? 'error' : 'success';
  line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logEl.prepend(line);
}

function credentials() {
  return {
    baseUrl: document.getElementById('baseUrl').value.trim(),
    username: document.getElementById('username').value.trim(),
    appPassword: document.getElementById('appPassword').value.trim()
  };
}

async function api(path, payload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Falha inesperada');
  return data;
}

async function loadTemplates() {
  const response = await fetch('/api/templates');
  const templates = await response.json();
  templateSelect.innerHTML = templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

const actions = {
  async 'create-category'() {
    const data = await api('/api/wp/categories', {
      ...credentials(),
      name: document.getElementById('categoryName').value,
      description: document.getElementById('categoryDescription').value
    });
    log(`Categoria criada: ${data.name}`);
  },
  async 'create-page'() {
    const data = await api('/api/wp/pages', {
      ...credentials(),
      title: document.getElementById('pageTitle').value,
      content: document.getElementById('pageContent').value,
      status: 'draft'
    });
    log(`Página criada: ${data.title?.rendered || data.id}`);
  },
  async 'save-template'() {
    await api('/api/templates', {
      name: document.getElementById('templateName').value,
      content: document.getElementById('templateContent').value
    });
    log('Template salvo para uso em outros sites.');
    await loadTemplates();
  },
  async 'create-page-from-template'() {
    const data = await api('/api/wp/pages/from-template', {
      ...credentials(),
      templateId: templateSelect.value,
      title: document.getElementById('templatePageTitle').value,
      status: 'draft'
    });
    log(`Página criada com template: ${data.title?.rendered || data.id}`);
  },
  async 'install-plugin'() {
    const data = await api('/api/wp/plugins/install', {
      ...credentials(),
      slug: document.getElementById('pluginSlug').value.trim()
    });
    log(`Plugin instalado: ${data.plugin || data.slug || 'ok'}`);
  },
  async 'install-theme'() {
    const data = await api('/api/wp/themes/install', {
      ...credentials(),
      slug: document.getElementById('themeSlug').value.trim()
    });
    log(`Tema instalado: ${data.stylesheet || data.slug || 'ok'}`);
  }
};

document.querySelectorAll('button[data-action]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const action = btn.dataset.action;
    try {
      await actions[action]();
    } catch (error) {
      log(error.message, true);
    }
  });
});

loadTemplates().catch(() => {});
