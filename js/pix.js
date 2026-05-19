'use strict';
/**
 * pix.js — Módulo de Chave PIX
 */

const Pix = (() => {
  let _chaveAtual = '';

  async function init() {
    render('<div class="skeleton-line w60" style="height:2rem;border-radius:8px;"></div>');
    try {
      const res = await API.getPix();
      _chaveAtual = res?.chave || res?.pixKey || '';
      renderView();
    } catch (err) {
      showToast(err.message, 'error');
      render('<p class="empty-state">Erro ao carregar chave PIX.</p>');
    }
  }

  function renderView() {
    render(`
      <div class="pix-card">
        <div class="pix-icon">💠</div>
        <div class="pix-info">
          <span class="pix-label">Chave PIX atual</span>
          <span class="pix-value" id="pixChaveDisplay">${_chaveAtual || '<em>Nenhuma chave cadastrada</em>'}</span>
        </div>
        <button class="btn btn-primary" id="btnAlterarPix">✏️ Alterar Chave</button>
      </div>
    `);
    document.getElementById('btnAlterarPix').addEventListener('click', renderEdit);
  }

  function renderEdit() {
    render(`
      <div class="pix-card pix-edit-card">
        <div class="pix-icon">💠</div>
        <div class="pix-edit-body">
          <label class="pix-label" for="pixNovaChave">Nova chave PIX</label>
          <input
            type="text"
            id="pixNovaChave"
            class="input-field"
            value="${_chaveAtual}"
            placeholder="CPF, e-mail, telefone ou chave aleatória"
            autocomplete="off"
          >
          <p class="pix-hint">Formatos aceitos: CPF (000.000.000-00), e-mail, +55 11 99999-9999 ou chave aleatória.</p>
        </div>
        <div class="pix-actions">
          <button class="btn btn-ghost" id="btnCancelarPix">Cancelar</button>
          <button class="btn btn-primary" id="btnSalvarPix">💾 Salvar</button>
        </div>
      </div>
    `);

    document.getElementById('btnCancelarPix').addEventListener('click', renderView);
    document.getElementById('btnSalvarPix').addEventListener('click', save);
    document.getElementById('pixNovaChave').focus();
  }

  async function save() {
    const novaChave = document.getElementById('pixNovaChave')?.value.trim();
    if (!novaChave) {
      showToast('Informe a nova chave PIX.', 'warning');
      return;
    }

    const btn = document.getElementById('btnSalvarPix');
    btn.disabled = true;
    btn.textContent = 'Salvando…';

    try {
      await API.updatePix(novaChave);
      _chaveAtual = novaChave;
      showToast('Chave PIX atualizada com sucesso!', 'success');
      renderView();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = '💾 Salvar';
    }
  }

  function render(html) {
    const el = document.getElementById('pixContainer');
    if (el) el.innerHTML = html;
  }

  return { init };
})();

window.Pix = Pix;
