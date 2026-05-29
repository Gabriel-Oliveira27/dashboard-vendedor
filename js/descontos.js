'use strict';
/**
 * descontos.js — Gerenciamento de Descontos
 * Desconto global e por linha de produto.
 * Chaves Config: DESCONTO_GLOBAL, DESCONTO_LINHA_<LINHA>
 */

const LINHAS_DESCONTO = ['FREEZER','AQUECER','CONSERVAR','PREPARAR','SERVIR','ARMAZENAR'];

const SVG_PERCENT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`;
const SVG_SAVE_D  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;

const Descontos = (() => {
  let _cfg   = {};
  let _dirty = false;

  const canEdit = () => Auth.isAdmin() || Auth.canEdit('config');

  /* ── Init ── */
  async function init() {
    render(loadingHtml());
    try {
      _cfg = await API.getConfigVendas();
      renderView();
    } catch (err) {
      showToast(err.message, 'error');
      render('<p class="empty-state">Erro ao carregar descontos.</p>');
    }
  }

  function loadingHtml() {
    return `<div style="display:flex;flex-direction:column;gap:.75rem;max-width:560px">
      ${[1,2].map(()=>`<div class="skeleton-line" style="height:120px;border-radius:12px"></div>`).join('')}
    </div>`;
  }

  /* ── View ── */
  function renderView() {
    const podeEditar = canEdit();
    const global     = parseInt(_cfg.DESCONTO_GLOBAL) || 0;

    const linhasHtml = LINHAS_DESCONTO.map(l => {
      const v = parseInt(_cfg[`DESCONTO_LINHA_${l}`]) || 0;
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--border)">
        <span style="font-size:.875rem;font-weight:500;color:var(--text)">${l}</span>
        <span class="badge ${v > 0 ? 'badge-purple' : 'badge-gray'}">${v > 0 ? v + '%' : 'Sem desconto'}</span>
      </div>`;
    }).join('');

    render(`
      <div style="display:flex;flex-direction:column;gap:1.25rem;max-width:560px">

        <!-- Desconto global -->
        <div class="pix-card" style="flex-direction:column;align-items:flex-start;gap:.75rem">
          <div style="display:flex;align-items:center;gap:.65rem">
            <div class="pix-icon">${SVG_PERCENT}</div>
            <div>
              <span class="pix-label" style="display:block">Desconto Global</span>
              <span class="pix-value">${global > 0 ? global + '% em toda a loja' : 'Sem desconto global'}</span>
            </div>
          </div>
          <p style="font-size:.8rem;color:var(--text-muted);margin:0">
            Aplicado a todos os produtos quando não há desconto específico por linha.
            Substitui <code>STORE.DISCOUNT_PERCENT</code> em <code>lib/config.js</code>.
          </p>
        </div>

        <!-- Desconto por linha -->
        <div class="pix-card" style="flex-direction:column;align-items:flex-start;gap:.75rem">
          <div style="display:flex;align-items:center;gap:.65rem">
            <div class="pix-icon">${SVG_PERCENT}</div>
            <span class="pix-label" style="margin:0">Desconto por Linha</span>
          </div>
          <div style="width:100%">${linhasHtml}</div>
          <p style="font-size:.8rem;color:var(--text-muted);margin:0">
            Prioridade: desconto de linha &gt; desconto global &gt; sem desconto.
          </p>
        </div>

        ${podeEditar
          ? `<button class="btn btn-primary" id="btnEditarDescontos" style="align-self:flex-start">
               ${SVG_PERCENT} Editar Descontos
             </button>`
          : `<p style="font-size:.85rem;color:var(--text-dim)">Você tem acesso somente de visualização.</p>`}
      </div>
    `);

    if (podeEditar) document.getElementById('btnEditarDescontos').addEventListener('click', renderEdit);
  }

  /* ── Edit ── */
  function renderEdit() {
    const global = parseInt(_cfg.DESCONTO_GLOBAL) || 0;

    const linhasInputs = LINHAS_DESCONTO.map(l => {
      const v = parseInt(_cfg[`DESCONTO_LINHA_${l}`]) || 0;
      return `<div style="display:flex;align-items:center;gap:.75rem;padding:.5rem 0;border-bottom:1px solid var(--border)">
        <span style="flex:1;font-size:.875rem;font-weight:500;color:var(--text)">${l}</span>
        <div style="display:flex;align-items:center;gap:.4rem">
          <input type="number" id="descLinha_${l}" class="input-field" value="${v}"
            min="0" max="100" step="1"
            style="width:80px;text-align:right"
            oninput="Descontos._markDirty()">
          <span style="color:var(--text-muted);font-size:.9rem">%</span>
        </div>
      </div>`;
    }).join('');

    render(`
      <div style="display:flex;flex-direction:column;gap:1.25rem;max-width:560px">

        <!-- Global -->
        <div class="pix-card pix-edit-card" style="gap:.75rem">
          <div style="display:flex;align-items:center;gap:.65rem;margin-bottom:.25rem">
            <div class="pix-icon">${SVG_PERCENT}</div>
            <span class="pix-label" style="margin:0">Desconto Global (toda a loja)</span>
          </div>
          <div style="display:flex;align-items:center;gap:.75rem">
            <input type="number" id="descGlobal" class="input-field" value="${global}"
              min="0" max="100" step="1" style="max-width:100px;text-align:right"
              oninput="Descontos._markDirty()">
            <span style="color:var(--text-muted)">%</span>
            <span style="font-size:.82rem;color:var(--text-muted)">— 0 = sem desconto</span>
          </div>
          <p class="pix-hint" style="margin-top:.25rem">
            Valor lido pela loja via <code>/api/config/public</code> → <code>desconto_global</code>.
            Substitui o valor hardcoded em <code>lib/config.js</code>.
          </p>
        </div>

        <!-- Por linha -->
        <div class="pix-card pix-edit-card" style="gap:.75rem">
          <div style="display:flex;align-items:center;gap:.65rem;margin-bottom:.25rem">
            <div class="pix-icon">${SVG_PERCENT}</div>
            <span class="pix-label" style="margin:0">Desconto por Linha de Produto</span>
          </div>
          <div style="width:100%">${linhasInputs}</div>
          <p class="pix-hint" style="margin-top:.25rem">
            Tem prioridade sobre o desconto global. Use 0 para não aplicar desconto naquela linha.
          </p>
        </div>

        <!-- Ações -->
        <div style="display:flex;gap:.75rem;justify-content:flex-end">
          <button class="btn btn-ghost" id="btnCancelarDescontos">Cancelar</button>
          <button class="btn btn-primary" id="btnSalvarDescontos">${SVG_SAVE_D} Salvar</button>
        </div>
      </div>
    `);

    document.getElementById('btnCancelarDescontos').addEventListener('click', renderView);
    document.getElementById('btnSalvarDescontos').addEventListener('click', save);
    document.getElementById('descGlobal').focus();
  }

  /* ── Helpers ── */
  function _markDirty() { _dirty = true; }

  /* ── Save ── */
  async function save() {
    if (!canEdit()) { showToast('Sem permissão.', 'warning'); return; }

    const global = String(parseInt(document.getElementById('descGlobal')?.value) || 0);

    const linhaValues = LINHAS_DESCONTO.map(l => ({
      chave: `DESCONTO_LINHA_${l}`,
      valor: String(parseInt(document.getElementById(`descLinha_${l}`)?.value) || 0),
    }));

    const btn = document.getElementById('btnSalvarDescontos');
    if (btn) { btn.disabled = true; btn.innerHTML = `${SVG_SAVE_D} Salvando…`; }

    try {
      await Promise.all([
        API.setConfigKey('DESCONTO_GLOBAL', global),
        ...linhaValues.map(({ chave, valor }) => API.setConfigKey(chave, valor)),
      ]);

      // Atualiza cache local
      _cfg.DESCONTO_GLOBAL = global;
      linhaValues.forEach(({ chave, valor }) => { _cfg[chave] = valor; });
      _dirty = false;

      showToast('Descontos salvos!', 'success');
      renderView();
    } catch (err) {
      showToast(err.message, 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = `${SVG_SAVE_D} Salvar`; }
    }
  }

  function render(html) {
    const el = document.getElementById('descontosContainer');
    if (el) el.innerHTML = html;
  }

  return { init, _markDirty };
})();

window.Descontos = Descontos;
