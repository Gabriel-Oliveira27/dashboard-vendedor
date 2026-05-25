'use strict';
/**
 * auth.js — Autenticação via cookie httpOnly
 *
 * O JWT fica em um cookie HttpOnly, Secure, SameSite=None → nunca acessível
 * por JavaScript. O sessionStorage guarda apenas dados de exibição (nome,
 * permissoes) que vieram no body do login.
 */

const USER_KEY = 'sublime_user';

const Auth = {
  /** Salva dados do usuário (não o token) */
  setUser(usuario) {
    try { sessionStorage.setItem(USER_KEY, JSON.stringify(usuario)); } catch (_) {}
  },

  /** Retorna dados do usuário ou null */
  getUser() {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  },

  /** Remove dados da sessão */
  clearUser() {
    try { sessionStorage.removeItem(USER_KEY); } catch (_) {}
  },

  /** Verifica se há sessão local */
  hasSession() {
    return !!this.getUser();
  },

  /**
   * Guard assíncrono para páginas protegidas.
   * Chama /api/auth/me para validar o cookie no servidor.
   * Se inválido, redireciona para login.
   */
  async requireAuth() {
    // Se já temos dados locais, confia — o cookie valida automaticamente nas chamadas API
    if (this.hasSession()) return true;

    // Sem dados locais: tenta recuperar do servidor (ex: após reload)
    try {
      const res = await fetch(
        `${typeof API_BASE !== 'undefined' ? API_BASE : 'https://sublime-react.vercel.app'}/api/auth/me`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Não autenticado');
      const { usuario } = await res.json();
      this.setUser(usuario);
      return true;
    } catch (_) {
      this.clearUser();
      window.location.replace('index.html');
      return false;
    }
  },

  /** Desloga: chama endpoint de logout (apaga o cookie no servidor) e limpa local */
  async logout() {
    try {
      await fetch(
        `${typeof API_BASE !== 'undefined' ? API_BASE : 'https://sublime-react.vercel.app'}/api/auth/logout`,
        { method: 'POST', credentials: 'include' }
      );
    } catch (_) {}
    this.clearUser();
    window.location.replace('index.html');
  },

  /** Retorna info do usuário logado */
  getUserInfo() { return this.getUser(); },

  /** Atalhos de permissão */
  isAdmin() { return !!this.getUser()?.isAdmin; },

  canView(secao) {
    const u = this.getUser();
    if (!u) return false;
    if (u.isAdmin) return true;
    return !!(u.permissoes?.[secao]?.ver);
  },

  canEdit(secao) {
    const u = this.getUser();
    if (!u) return false;
    if (u.isAdmin) return true;
    return !!(u.permissoes?.[secao]?.editar);
  },
};
