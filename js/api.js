'use strict';
/**
 * api.js — Camada de comunicação com a API REST
 * Usa credentials:'include' para enviar o cookie httpOnly automaticamente.
 * O header Authorization não é mais necessário.
 */

const API_BASE = 'https://sublime-react.vercel.app';

async function apiFetch(path, opts = {}) {
  const isFormData = opts.body instanceof FormData;
  const { skipAuthRedirect, ...fetchOpts } = opts;

  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(opts.headers || {}),
  };

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...fetchOpts,
      headers,
      credentials: 'include', // envia o cookie httpOnly automaticamente
    });
  } catch (_) {
    throw new Error('Sem conexão com o servidor. Verifique sua internet.');
  }

  if (res.status === 401) {
    if (skipAuthRedirect) {
      let msg = 'Credenciais inválidas.';
      try { const e = await res.json(); msg = e.erro || e.message || msg; } catch (_) {}
      throw new Error(msg);
    }
    Auth.clearUser();
    window.location.replace('index.html');
    return null;
  }

  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try { const e = await res.json(); msg = e.erro || e.message || e.error || msg; } catch (_) {}
    throw new Error(msg);
  }

  const ct = res.headers.get('Content-Type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

const API = {
  // ── Autenticação ──────────────────────────────────────────────────────────
  login: (email, senha) =>
    apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
      skipAuthRedirect: true,
    }),

  logout: () =>
    apiFetch('/api/auth/logout', { method: 'POST' }),

  me: () => apiFetch('/api/auth/me'),

  // ── Estoque ───────────────────────────────────────────────────────────────
  getEstoque: () => apiFetch('/api/estoque'),

  createEstoque: (dados) =>
    apiFetch('/api/estoque', { method: 'POST', body: JSON.stringify(dados) }),

  updateEstoque: (id, dados) =>
    apiFetch(`/api/estoque/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),

  deleteEstoque: (id) =>
    apiFetch(`/api/estoque/${id}`, { method: 'DELETE' }),

  uploadImagem: (formData) =>
    apiFetch('/api/upload', { method: 'POST', body: formData }),

  // ── Pedidos ───────────────────────────────────────────────────────────────
  getPedidos:      ()           => apiFetch('/api/pedidos'),
  updateEtapa:     (id, etapa)  => apiFetch(`/api/pedidos/${id}/etapa`,    { method: 'PATCH', body: JSON.stringify({ etapa }) }),
  updatePagamento: (id)         => apiFetch(`/api/pedidos/${id}/pagamento`, { method: 'PATCH', body: JSON.stringify({ pagamento: 'REALIZADO' }) }),
  devolucao:       (id)         => apiFetch(`/api/pedidos/${id}/devolucao`, { method: 'POST' }),

  // ── Cupons ────────────────────────────────────────────────────────────────
  getCupons:    ()      => apiFetch('/api/cupons'),
  createCupom:  (dados) => apiFetch('/api/cupons',      { method: 'POST',   body: JSON.stringify(dados) }),
  deleteCupom:  (id)    => apiFetch(`/api/cupons/${id}`, { method: 'DELETE' }),

  // ── Configurações de Vendas ───────────────────────────────────────────────
  getConfigVendas:    ()      => apiFetch('/api/config/vendas'),
  updateConfigVendas: (dados) => apiFetch('/api/config/vendas', { method: 'PATCH', body: JSON.stringify(dados) }),

  // ── Usuários ──────────────────────────────────────────────────────────────
  getUsuarios:    ()         => apiFetch('/api/usuarios'),
  createUsuario:  (dados)    => apiFetch('/api/usuarios',      { method: 'POST',   body: JSON.stringify(dados) }),
  updateUsuario:  (id, dados) => apiFetch(`/api/usuarios/${id}`, { method: 'PATCH',  body: JSON.stringify(dados) }),
  deleteUsuario:  (id)        => apiFetch(`/api/usuarios/${id}`, { method: 'DELETE' }),
};
