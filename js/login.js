'use strict';
/**
 * login.js — Tela de login
 * O token JWT fica no cookie httpOnly (nunca em JS).
 * Apenas dados de exibição (nome, permissoes) ficam no sessionStorage.
 */

(function () {
  const t = localStorage.getItem('sublime-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

document.addEventListener('DOMContentLoaded', () => {
  // Se já tem sessão local, vai pro dashboard
  if (Auth.hasSession()) {
    window.location.replace('dashboard.html');
    return;
  }

  const form       = document.getElementById('loginForm');
  const btnLogin   = document.getElementById('btnLogin');
  const btnText    = btnLogin.querySelector('.btn-text');
  const btnLoader  = btnLogin.querySelector('.btn-loader');
  const errBox     = document.getElementById('loginError');
  const toggleBtn  = document.getElementById('toggleSenha');
  const senhaInput = document.getElementById('senha');
  const themeBtn   = document.getElementById('loginThemeToggle');

  btnText.style.display   = '';
  btnLoader.style.display = 'none';
  errBox.style.display    = 'none';

  // ── Theme toggle ──────────────────────────────────────────────────────────
  const SVG_SUN  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  const SVG_MOON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

  function updateThemeIcon() {
    if (!themeBtn) return;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    themeBtn.innerHTML = isDark ? SVG_SUN : SVG_MOON;
    themeBtn.title = isDark ? 'Modo claro' : 'Modo escuro';
  }

  updateThemeIcon();
  themeBtn?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sublime-theme', next);
    updateThemeIcon();
  });

  // ── Toggle senha ──────────────────────────────────────────────────────────
  toggleBtn.addEventListener('click', () => {
    const isPwd = senhaInput.type === 'password';
    senhaInput.type = isPwd ? 'text' : 'password';
    toggleBtn.querySelector('.eye-open').style.display   = isPwd ? 'none'  : 'block';
    toggleBtn.querySelector('.eye-closed').style.display = isPwd ? 'block' : 'none';
  });

  // ── Submit ────────────────────────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('usuario').value.trim();
    const senha = senhaInput.value;

    if (!email || !senha) {
      showError('Preencha o e-mail e a senha.');
      shake(btnLogin);
      return;
    }

    setLoading(true);
    hideError();

    try {
      const res = await API.login(email, senha);

      if (res?.usuario) {
        // Salva apenas dados de exibição — o token está no cookie httpOnly
        Auth.setUser(res.usuario);
        window.location.replace('dashboard.html');
      } else {
        showError('Resposta inesperada do servidor.');
        setLoading(false);
      }
    } catch (err) {
      showError(err.message || 'Falha ao fazer login. Tente novamente.');
      shake(btnLogin);
      setLoading(false);
    }
  });

  function setLoading(s) {
    btnLogin.disabled       = s;
    btnText.style.display   = s ? 'none' : '';
    btnLoader.style.display = s ? 'flex' : 'none';
  }

  function showError(msg) {
    errBox.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>${msg}</span>`;
    errBox.style.display = 'flex';
    errBox.classList.add('shake');
    errBox.addEventListener('animationend', () => errBox.classList.remove('shake'), { once: true });
  }

  function hideError()  { errBox.style.display = 'none'; }
  function shake(el)    { el.classList.add('shake'); el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true }); }
});
