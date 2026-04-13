import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const templates = new Map();

function wpHeaders({ username, appPassword }) {
  const token = Buffer.from(`${username}:${appPassword}`).toString('base64');
  return {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json'
  };
}

async function wpRequest({ baseUrl, endpoint, method = 'GET', credentials, body }) {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const response = await fetch(`${cleanBase}${endpoint}`, {
    method,
    headers: wpHeaders(credentials),
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WordPress retornou ${response.status}: ${error}`);
  }

  return response.status === 204 ? {} : response.json();
}

app.post('/api/templates', (req, res) => {
  const { name, content } = req.body;

  if (!name || !content) {
    return res.status(400).json({ message: 'Nome e conteúdo são obrigatórios.' });
  }

  const id = crypto.randomUUID();
  templates.set(id, {
    id,
    name,
    content,
    createdAt: new Date().toISOString()
  });

  return res.status(201).json({ id, message: 'Template salvo com sucesso.' });
});

app.get('/api/templates', (req, res) => {
  return res.json(Array.from(templates.values()));
});

app.post('/api/wp/categories', async (req, res) => {
  try {
    const { baseUrl, username, appPassword, name, description } = req.body;
    const result = await wpRequest({
      baseUrl,
      endpoint: '/wp-json/wp/v2/categories',
      method: 'POST',
      credentials: { username, appPassword },
      body: { name, description }
    });

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post('/api/wp/pages', async (req, res) => {
  try {
    const { baseUrl, username, appPassword, title, content, status = 'draft' } = req.body;
    const result = await wpRequest({
      baseUrl,
      endpoint: '/wp-json/wp/v2/pages',
      method: 'POST',
      credentials: { username, appPassword },
      body: { title, content, status }
    });

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post('/api/wp/pages/from-template', async (req, res) => {
  try {
    const { baseUrl, username, appPassword, templateId, title, status = 'draft' } = req.body;
    const template = templates.get(templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template não encontrado.' });
    }

    const result = await wpRequest({
      baseUrl,
      endpoint: '/wp-json/wp/v2/pages',
      method: 'POST',
      credentials: { username, appPassword },
      body: { title, content: template.content, status }
    });

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post('/api/wp/plugins/install', async (req, res) => {
  try {
    const { baseUrl, username, appPassword, slug } = req.body;
    const result = await wpRequest({
      baseUrl,
      endpoint: '/wp-json/wp/v2/plugins',
      method: 'POST',
      credentials: { username, appPassword },
      body: { slug, status: 'inactive' }
    });

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post('/api/wp/themes/install', async (req, res) => {
  try {
    const { baseUrl, username, appPassword, slug } = req.body;
    const result = await wpRequest({
      baseUrl,
      endpoint: '/wp-json/wp/v2/themes',
      method: 'POST',
      credentials: { username, appPassword },
      body: { stylesheet: slug }
    });

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get('*', (req, res) => {
  return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`WP SaaS Manager rodando em http://localhost:${port}`);
});
