'use strict';
/**
 * login.js — Lógica da tela de login
 */

document.addEventListener('DOMContentLoaded', () => {
  // Se já está logado, redireciona direto para o dashboard
  if (Auth.isTokenValid()) {
    window.location.replace('dashboard.html');
    return;
  }

  const form      = document.getElementById('loginForm');
  const btnLogin  = document.getElementById('btnLogin');
  const btnText   = btnLogin.querySelector('.btn-text');
  const btnLoader = btnLogin.querySelector('.btn-loader');
  const errBox    = document.getElementById('loginError');
  const toggleBtn = document.getElementById('toggleSenha');
  const senhaInput = document.getElementById('senha');

  // ── Toggle mostrar/ocultar senha ──────────────────────────────────────────
  toggleBtn.addEventListener('click', () => {
    const isPassword = senhaInput.type === 'password';
    senhaInput.type = isPassword ? 'text' : 'password';
    toggleBtn.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
    toggleBtn.querySelector('.eye-open').style.display  = isPassword ? 'none'  : 'block';
    toggleBtn.querySelector('.eye-closed').style.display = isPassword ? 'block' : 'none';
  });

  // ── Submit ────────────────────────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usuario = document.getElementById('usuario').value.trim();
    const senha   = senhaInput.value;

    if (!usuario || !senha) {
      showError('Preencha usuário e senha.');
      return;
    }

    setLoading(true);
    hideError();

    try {
      const res = await API.login(usuario, senha);
      if (res?.token) {
        Auth.setToken(res.token);
        window.location.replace('dashboard.html');
      } else {
        showError('Resposta inesperada do servidor.');
      }
    } catch (err) {
      showError(err.message || 'Falha ao fazer login. Tente novamente.');
      shake(btnLogin);
    } finally {
      setLoading(false);
    }
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function setLoading(state) {
    btnLogin.disabled = state;
    btnText.hidden    = state;
    btnLoader.hidden  = !state;
  }

  function showError(msg) {
    errBox.textContent = msg;
    errBox.hidden = false;
    errBox.classList.add('shake');
    errBox.addEventListener('animationend', () => errBox.classList.remove('shake'), { once: true });
  }

  function hideError() {
    errBox.hidden = true;
  }

  function shake(el) {
    el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
  }
});
