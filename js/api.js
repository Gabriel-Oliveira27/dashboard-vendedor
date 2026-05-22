'use strict';
/**
 * api.js — Camada de comunicação com a API REST (Next.js / Vercel)
 */

const API_BASE = 'https://sublime-react.vercel.app';

async function apiFetch(path, opts = {}) {
  const token = Auth.getToken();
  const isFormData = opts.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(opts.headers || {})
  };

  const { skipAuthRedirect, ...fetchOpts } = opts;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...fetchOpts, headers });
  } catch (_) {
    throw new Error('Sem conexão com o servidor. Verifique sua internet.');
  }

  if (res.status === 401) {
    if (skipAuthRedirect) {
      let msg = 'Credenciais inválidas.';
      try {
        const err = await res.json();
        msg = err.erro || err.message || err.error || msg;
      } catch (_) {}
      throw new Error(msg);
    }
    Auth.clearToken();
    window.location.replace('index.html');
    return null;
  }

  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const err = await res.json();
      msg = err.erro || err.message || err.error || msg;
    } catch (_) {}
    throw new Error(msg);
  }

  const ct = res.headers.get('Content-Type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

const API = {
  login: (email, senha) =>
    apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
      skipAuthRedirect: true,
    }),

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

  getCupons: () => apiFetch('/api/cupons'),

  createCupom: (dados) =>
    apiFetch('/api/cupons', {
      method: 'POST',
      body: JSON.stringify(dados)
    }),

  deleteCupom: (id) =>
    apiFetch(`/api/cupons/${id}`, { method: 'DELETE' }),

  devolucao: (id) =>
    apiFetch(`/api/pedidos/${id}/devolucao`, { method: 'POST' }),

  getPix: () => apiFetch('/api/config/pix'),

  updatePix: (chave) =>
    apiFetch('/api/config/pix', {
      method: 'PATCH',
      body: JSON.stringify({ chave })
    })
};
