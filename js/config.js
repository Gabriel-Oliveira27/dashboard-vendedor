'use strict';
/**
 * config.js — Configurações de Vendas
 * Gerencia: Chave PIX e WhatsApp do vendedor
 */

const SVG_PIX = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`;
const SVG_WA  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;
const SVG_SAVE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;
const SVG_PENCIL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

const Config = (() => {
  let _config = { pix: '', whatsapp: '' };

  async function init() {
    render(loadingHtml());
    try {
      _config = await API.getConfigVendas();
      renderView();
    } catch (err) {
      showToast(err.message, 'error');
      render('<p class="empty-state">Erro ao carregar configurações.</p>');
    }
  }

  function loadingHtml() {
    return `<div style="display:flex;flex-direction:column;gap:.75rem;max-width:560px">
      <div class="skeleton-line" style="height:80px;border-radius:12px"></div>
      <div class="skeleton-line" style="height:80px;border-radius:12px"></div>
    </div>`;
  }

  function renderView() {
    render(`
      <div style="display:flex;flex-direction:column;gap:1rem;max-width:560px">
        ${configCard(SVG_PIX,   'Chave PIX',              _config.pix      || 'Não configurada', 'pix')}
        ${configCard(SVG_WA,    'Contato WhatsApp',        _config.whatsapp || 'Não configurado',  'whatsapp')}
      </div>
      <button class="btn btn-primary" id="btnEditarConfig" style="margin-top:1.25rem">
        ${SVG_PENCIL} Editar Configurações
      </button>
    `);
    document.getElementById('btnEditarConfig').addEventListener('click', renderEdit);
  }

  function configCard(icon, label, valor, tipo) {
    return `
      <div class="pix-card">
        <div class="pix-icon">${icon}</div>
        <div class="pix-info">
          <span class="pix-label">${label}</span>
          <span class="pix-value">${esc(valor)}</span>
        </div>
      </div>`;
  }

  function renderEdit() {
    render(`
      <div style="display:flex;flex-direction:column;gap:1rem;max-width:560px">
        <div class="pix-card pix-edit-card">
          <div class="pix-icon">${SVG_PIX}</div>
          <div class="pix-edit-body">
            <label class="pix-label" for="cfgPix">Chave PIX</label>
            <input type="text" id="cfgPix" class="input-field" value="${esc(_config.pix)}" placeholder="CPF, e-mail, telefone ou chave aleatória" autocomplete="off">
            <p class="pix-hint">CPF (000.000.000-00), e-mail, +55 11 99999-9999 ou chave aleatória.</p>
          </div>
        </div>

        <div class="pix-card pix-edit-card">
          <div class="pix-icon">${SVG_WA}</div>
          <div class="pix-edit-body">
            <label class="pix-label" for="cfgWA">Contato WhatsApp do Vendedor</label>
            <input type="tel" id="cfgWA" class="input-field" value="${esc(_config.whatsapp)}" placeholder="5588999999999 (só números, com DDI)">
            <p class="pix-hint">Use o formato internacional sem espaços ou símbolos. Ex: 5588999990000</p>
          </div>
        </div>

        <div style="display:flex;gap:.75rem;justify-content:flex-end">
          <button class="btn btn-ghost" id="btnCancelarConfig">Cancelar</button>
          <button class="btn btn-primary" id="btnSalvarConfig">${SVG_SAVE} Salvar</button>
        </div>
      </div>
    `);

    document.getElementById('btnCancelarConfig').addEventListener('click', renderView);
    document.getElementById('btnSalvarConfig').addEventListener('click', save);
    document.getElementById('cfgPix').focus();
  }

  async function save() {
    const pix      = document.getElementById('cfgPix')?.value.trim();
    const whatsapp = document.getElementById('cfgWA')?.value.trim().replace(/\D/g, '');

    if (!pix && !whatsapp) {
      showToast('Preencha ao menos um campo.', 'warning');
      return;
    }

    const btn = document.getElementById('btnSalvarConfig');
    btn.disabled = true;
    btn.innerHTML = `${SVG_SAVE} Salvando…`;

    try {
      await API.updateConfigVendas({ pix, whatsapp });
      _config = { pix, whatsapp };
      showToast('Configurações salvas!', 'success');
      renderView();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = `${SVG_SAVE} Salvar`;
    }
  }

  function render(html) {
    const el = document.getElementById('configContainer');
    if (el) el.innerHTML = html;
  }

  function esc(s) {
    return (s || '').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { init };
})();

window.Config = Config;
