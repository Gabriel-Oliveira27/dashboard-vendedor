'use strict';
/**
 * pix.js — Módulo de Chave PIX
 */

const SVG_PIX = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="22" height="22">
  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
  <path d="M2 17l10 5 10-5"/>
  <path d="M2 12l10 5 10-5"/>
</svg>`;

const SVG_PENCIL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
</svg>`;

const SVG_SAVE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
  <polyline points="17 21 17 13 7 13 7 21"/>
  <polyline points="7 3 7 8 15 8"/>
</svg>`;

const Pix = (() => {
  let _chaveAtual = '';

  async function init() {
    render(`<div class="skeleton-line w60" style="height:2rem;border-radius:8px;"></div>`);
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
        <div class="pix-icon">${SVG_PIX}</div>
        <div class="pix-info">
          <span class="pix-label">Chave PIX atual</span>
          <span class="pix-value" id="pixChaveDisplay">${_chaveAtual || '<em style="color:var(--text-dim);font-style:normal">Nenhuma chave cadastrada</em>'}</span>
        </div>
        <button class="btn btn-primary" id="btnAlterarPix">
          ${SVG_PENCIL}
          Alterar Chave
        </button>
      </div>
    `);
    document.getElementById('btnAlterarPix').addEventListener('click', renderEdit);
  }

  function renderEdit() {
    render(`
      <div class="pix-card pix-edit-card">
        <div class="pix-icon">${SVG_PIX}</div>
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
          <p class="pix-hint">Formatos: CPF (000.000.000-00), e-mail, +55 11 99999-9999 ou chave aleatória.</p>
        </div>
        <div class="pix-actions">
          <button class="btn btn-ghost" id="btnCancelarPix">Cancelar</button>
          <button class="btn btn-primary" id="btnSalvarPix">
            ${SVG_SAVE}
            Salvar
          </button>
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
    btn.innerHTML = `${SVG_SAVE} Salvando…`;

    try {
      await API.updatePix(novaChave);
      _chaveAtual = novaChave;
      showToast('Chave PIX atualizada com sucesso!', 'success');
      renderView();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = `${SVG_SAVE} Salvar`;
    }
  }

  function render(html) {
    const el = document.getElementById('pixContainer');
    if (el) el.innerHTML = html;
  }

  return { init };
})();

window.Pix = Pix;