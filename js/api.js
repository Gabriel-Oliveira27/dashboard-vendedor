'use strict';
/**
 * api.js — Camada de comunicação com a API REST (Next.js / Vercel)
 * Centraliza todos os fetch, injeta o header Authorization
 * e redireciona para login automaticamente em caso de 401.
 */

// ⚠️ Substitua pela URL real da sua API no Vercel
const API_BASE = 'https://sublime-react.vercel.app';

/**
 * Fetch centralizado com autenticação e tratamento de erros.
 * @param {string} path  - rota relativa, ex: '/api/estoque'
 * @param {object} opts  - opções do fetch (method, body, headers...)
 */
async function apiFetch(path, opts = {}) {
  const token = Auth.getToken();
  const isFormData = opts.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(opts.headers || {})
  };

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  } catch (_) {
    throw new Error('Sem conexão com o servidor. Verifique sua internet.');
  }

  // Token expirado ou inválido no servidor → volta ao login
  if (res.status === 401) {
    Auth.clearToken();
    window.location.replace('index.html');
    return null;
  }

  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const err = await res.json();
      msg = err.message || err.error || msg;
    } catch (_) {}
    throw new Error(msg);
  }

  const ct = res.headers.get('Content-Type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

/** Todos os endpoints da aplicação */
const API = {
  // ── Autenticação ──────────────────────────────────────────────────────────
  login: (usuario, senha) =>
    apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usuario, senha })
    }),

  // ── Estoque ───────────────────────────────────────────────────────────────
  getEstoque: () => apiFetch('/api/estoque'),

  updateEstoque: (id, dados) =>
    apiFetch(`/api/estoque/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dados)
    }),

  deleteEstoque: (id) =>
    apiFetch(`/api/estoque/${id}`, { method: 'DELETE' }),

  uploadImagem: (formData) =>
    apiFetch('/api/upload', { method: 'POST', body: formData }),

  // ── Pedidos ───────────────────────────────────────────────────────────────
  getPedidos: () => apiFetch('/api/pedidos'),

  updateEtapa: (id, etapa) =>
    apiFetch(`/api/pedidos/${id}/etapa`, {
      method: 'PATCH',
      body: JSON.stringify({ etapa })
    }),

  updatePagamento: (id) =>
    apiFetch(`/api/pedidos/${id}/pagamento`, {
      method: 'PATCH',
      body: JSON.stringify({ pagamento: 'REALIZADO' })
    }),

  // ── Cupons ────────────────────────────────────────────────────────────────
  getCupons: () => apiFetch('/api/cupons'),

  createCupom: (dados) =>
    apiFetch('/api/cupons', {
      method: 'POST',
      body: JSON.stringify(dados)
    }),

  deleteCupom: (id) =>
    apiFetch(`/api/cupons/${id}`, { method: 'DELETE' }),

  // ── Chave PIX ─────────────────────────────────────────────────────────────
  getPix: () => apiFetch('/api/config/pix'),

  updatePix: (chave) =>
    apiFetch('/api/config/pix', {
      method: 'PATCH',
      body: JSON.stringify({ chave })
    })
};
