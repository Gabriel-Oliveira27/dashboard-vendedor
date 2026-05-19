'use strict';
/**
 * auth.js — Gerenciamento de autenticação JWT
 * Token armazenado em memória + sessionStorage.
 * NUNCA em localStorage ou cookies legíveis por JS.
 */

let _memToken = null;

const Auth = {
  /** Salva token em memória e sessionStorage */
  setToken(token) {
    _memToken = token;
    try { sessionStorage.setItem('jwt', token); } catch (_) {}
  },

  /** Recupera token da memória ou sessionStorage */
  getToken() {
    if (_memToken) return _memToken;
    try { _memToken = sessionStorage.getItem('jwt'); } catch (_) {}
    return _memToken;
  },

  /** Remove token de todos os locais */
  clearToken() {
    _memToken = null;
    try { sessionStorage.removeItem('jwt'); } catch (_) {}
  },

  /**
   * Decodifica payload do JWT (base64url → JSON).
   * Verificação LOCAL — não chama a API.
   */
  decodePayload(token) {
    try {
      const part = token.split('.')[1];
      // Corrige padding base64url
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '=='.slice((base64.length + 3) % 4 || 4);
      return JSON.parse(atob(padded));
    } catch (_) {
      return null;
    }
  },

  /**
   * Verifica se o token existe e não está expirado.
   * Compara Date.now() / 1000 com o campo `exp` do payload.
   */
  isTokenValid() {
    const token = this.getToken();
    if (!token) return false;
    const payload = this.decodePayload(token);
    if (!payload || typeof payload.exp !== 'number') return false;
    // Margem de 15s para compensar clock skew
    return Math.floor(Date.now() / 1000) < payload.exp - 15;
  },

  /**
   * Guard para páginas protegidas.
   * Redireciona imediatamente para index.html se token inválido.
   */
  requireAuth() {
    if (!this.isTokenValid()) {
      this.clearToken();
      window.location.replace('index.html');
      return false;
    }
    return true;
  },

  /** Encerra sessão e redireciona para login */
  logout() {
    this.clearToken();
    window.location.replace('index.html');
  },

  /** Retorna dados do usuário extraídos do token */
  getUserInfo() {
    const token = this.getToken();
    if (!token) return null;
    return this.decodePayload(token);
  }
};
