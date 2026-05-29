'use strict';
/**
 * frete.js — Modelo de Frete
 * Chaves Config: FRETE_MODELO, FRETE_FAIXAS, FRETE_CUSTO_KM, FRETE_GRATIS_ACIMA_KM
 */

const SVG_TRUCK  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
const SVG_SAVE_F = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;
const SVG_PLUS_F = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const SVG_DEL_F  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`;

const Frete = (() => {
  let _cfg   = {};
  let _faixas = []; // Array de { raio_km_max: number|null, valor: number|'combinar', label?: string }

  const DEFAULT_FAIXAS = [
    { raio_km_max: 5,    valor: 0,          label: 'Grátis (até 5km)' },
    { raio_km_max: 15,   valor: 8.90,       label: '' },
    { raio_km_max: 30,   valor: 14.90,      label: '' },
    { raio_km_max: null, valor: 'combinar', label: 'Acima de 30km' },
  ];

  const canEdit = () => Auth.isAdmin() || Auth.canEdit('config');

  /* ── Init ── */
  async function init() {
    render(loadingHtml());
    try {
      _cfg = await API.getConfigVendas();
      _faixas = _parseFaixas(_cfg.FRETE_FAIXAS);
      renderView();
    } catch (err) {
      showToast(err.message, 'error');
      render('<p class="empty-state">Erro ao carregar configuração de frete.</p>');
    }
  }

  function _parseFaixas(raw) {
    if (!raw) return [...DEFAULT_FAIXAS];
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [...DEFAULT_FAIXAS];
    } catch (_) {
      return [...DEFAULT_FAIXAS];
    }
  }

  function loadingHtml() {
    return `<div style="display:flex;flex-direction:column;gap:.75rem;max-width:560px">
      <div class="skeleton-line" style="height:140px;border-radius:12px"></div>
      <div class="skeleton-line" style="height:100px;border-radius:12px"></div>
    </div>`;
  }

  /* ── View ── */
  function renderView() {
    const podeEditar = canEdit();
    const modelo     = _cfg.FRETE_MODELO     || 'FIXO';
    const custoKm    = _cfg.FRETE_CUSTO_KM   || '1.50';
    const gratisBkm  = _cfg.FRETE_GRATIS_ACIMA_KM || '0';

    const modeloLabel = modelo === 'KM' ? 'Cálculo por km (automático)' : 'Valores fixos por distância';

    const faixasHtml = modelo === 'FIXO'
      ? _faixas.map(f => {
          const limiteStr = f.raio_km_max != null ? `até ${f.raio_km_max} km` : 'acima disso';
          const valorStr  = f.valor === 'combinar' ? 'Combinar' : `R$ ${parseFloat(f.valor).toFixed(2)}`;
          const label     = f.label ? ` — ${f.label}` : '';
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:.45rem 0;border-bottom:1px solid var(--border);font-size:.875rem">
            <span style="color:var(--text-muted)">${limiteStr}${label}</span>
            <span class="badge ${f.valor === 0 ? 'badge-green' : f.valor === 'combinar' ? 'badge-yellow' : 'badge-blue'}">${valorStr}</span>
          </div>`;
        }).join('')
      : `<div style="display:flex;gap:1rem;flex-wrap:wrap">
          <div><span class="badge badge-blue">R$ ${parseFloat(custoKm).toFixed(2)}/km</span></div>
          ${parseFloat(gratisBkm) > 0 ? `<div><span class="badge badge-green">Grátis até ${gratisBkm} km</span></div>` : ''}
        </div>`;

    render(`
      <div style="display:flex;flex-direction:column;gap:1.25rem;max-width:560px">

        <div class="pix-card" style="flex-direction:column;align-items:flex-start;gap:.75rem">
          <div style="display:flex;align-items:center;gap:.65rem">
            <div class="pix-icon">${SVG_TRUCK}</div>
            <div>
              <span class="pix-label" style="display:block">Modelo de Frete</span>
              <span class="pix-value" style="font-size:.95rem">${modeloLabel}</span>
            </div>
          </div>
          <div style="width:100%">${faixasHtml}</div>
        </div>

        ${podeEditar
          ? `<button class="btn btn-primary" id="btnEditarFrete" style="align-self:flex-start">
               ${SVG_TRUCK} Editar Configuração de Frete
             </button>`
          : `<p style="font-size:.85rem;color:var(--text-dim)">Você tem acesso somente de visualização.</p>`}
      </div>
    `);

    if (podeEditar) document.getElementById('btnEditarFrete').addEventListener('click', renderEdit);
  }

  /* ── Edit ── */
  function renderEdit() {
    const modelo     = _cfg.FRETE_MODELO     || 'FIXO';
    const custoKm    = _cfg.FRETE_CUSTO_KM   || '1.50';
    const gratisBkm  = _cfg.FRETE_GRATIS_ACIMA_KM || '0';

    render(`
      <div style="display:flex;flex-direction:column;gap:1.25rem;max-width:560px">

        <!-- Seletor de modelo -->
        <div class="pix-card pix-edit-card" style="gap:.75rem">
          <div style="display:flex;align-items:center;gap:.65rem;margin-bottom:.25rem">
            <div class="pix-icon">${SVG_TRUCK}</div>
            <span class="pix-label" style="margin:0">Modelo de Frete</span>
          </div>
          <div style="display:flex;gap:1rem">
            ${modeloRadio('FIXO', modelo, 'Valores fixos por distância/cidade')}
            ${modeloRadio('KM',   modelo, 'Cálculo por km (automático)')}
          </div>
        </div>

        <!-- Painel FIXO -->
        <div id="painelFaixas" style="display:${modelo==='FIXO'?'block':'none'}">
          <div class="pix-card pix-edit-card" style="gap:.75rem">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.25rem">
              <span class="pix-label" style="margin:0">Tabela de Faixas</span>
              <button class="btn btn-ghost btn-sm" onclick="Frete._addFaixa()">${SVG_PLUS_F} Adicionar faixa</button>
            </div>
            <div id="faixasList" style="width:100%"></div>
            <p class="pix-hint">Use <strong>0</strong> no valor para "Grátis". Use <strong>combinar</strong> para contato manual. Deixe "Km máx" em branco para a última faixa (acima de tudo).</p>
          </div>
        </div>

        <!-- Painel KM -->
        <div id="painelKm" style="display:${modelo==='KM'?'block':'none'}">
          <div class="pix-card pix-edit-card" style="gap:.75rem">
            <div class="form-grid-2">
              <div class="form-group">
                <label>Custo por km (R$)</label>
                <input type="number" id="cfgCustoKm" class="input-field" value="${custoKm}" min="0" step="0.10" placeholder="1.50">
              </div>
              <div class="form-group">
                <label>Frete grátis até (km)</label>
                <input type="number" id="cfgGratisKm" class="input-field" value="${gratisBkm}" min="0" step="1" placeholder="0 = desabilitado">
                <p class="field-hint">0 = frete nunca é grátis por distância.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Ações -->
        <div style="display:flex;gap:.75rem;justify-content:flex-end">
          <button class="btn btn-ghost" id="btnCancelarFrete">Cancelar</button>
          <button class="btn btn-primary" id="btnSalvarFrete">${SVG_SAVE_F} Salvar</button>
        </div>
      </div>
    `);

    // Liga radios ao toggle de painéis
    document.querySelectorAll('input[name="freteModelo"]').forEach(r => {
      r.addEventListener('change', () => {
        document.getElementById('painelFaixas').style.display = r.value === 'FIXO' ? 'block' : 'none';
        document.getElementById('painelKm').style.display     = r.value === 'KM'   ? 'block' : 'none';
      });
    });

    _renderFaixas();

    document.getElementById('btnCancelarFrete').addEventListener('click', renderView);
    document.getElementById('btnSalvarFrete').addEventListener('click', save);
  }

  function modeloRadio(value, current, label) {
    return `<label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.875rem;color:var(--text)">
      <input type="radio" name="freteModelo" value="${value}" ${current === value ? 'checked' : ''}
        style="accent-color:var(--accent);cursor:pointer">
      ${label}
    </label>`;
  }

  function _renderFaixas() {
    const el = document.getElementById('faixasList');
    if (!el) return;
    el.innerHTML = _faixas.map((f, i) => `
      <div class="frete-faixa-row" data-idx="${i}"
        style="display:grid;grid-template-columns:1fr 1fr 1.4fr auto;gap:.5rem;align-items:center;margin-bottom:.5rem">
        <div>
          <label style="font-size:.7rem;color:var(--text-dim);display:block;margin-bottom:2px">Km máx (vazio=∞)</label>
          <input type="number" class="input-field faixa-km" value="${f.raio_km_max ?? ''}"
            min="0" placeholder="∞" style="text-align:right">
        </div>
        <div>
          <label style="font-size:.7rem;color:var(--text-dim);display:block;margin-bottom:2px">Valor (R$ ou "combinar")</label>
          <input type="text" class="input-field faixa-valor" value="${f.valor}"
            placeholder="0 = grátis">
        </div>
        <div>
          <label style="font-size:.7rem;color:var(--text-dim);display:block;margin-bottom:2px">Rótulo (opcional)</label>
          <input type="text" class="input-field faixa-label" value="${esc(f.label || '')}"
            placeholder="Ex: Grátis!">
        </div>
        <button class="btn-icon btn-danger-icon" onclick="Frete._removeFaixa(${i})" title="Remover faixa" style="margin-top:1rem">${SVG_DEL_F}</button>
      </div>
    `).join('');
  }

  function _addFaixa() {
    _faixas.push({ raio_km_max: null, valor: 0, label: '' });
    _renderFaixas();
  }

  function _removeFaixa(idx) {
    if (_faixas.length <= 1) { showToast('Deve haver ao menos uma faixa.', 'warning'); return; }
    _faixas.splice(idx, 1);
    _renderFaixas();
  }

  function _collectFaixas() {
    const rows = document.querySelectorAll('.frete-faixa-row');
    const result = [];
    rows.forEach(row => {
      const kmRaw   = row.querySelector('.faixa-km')?.value.trim();
      const valorRaw = row.querySelector('.faixa-valor')?.value.trim();
      const labelRaw = row.querySelector('.faixa-label')?.value.trim();
      const km       = kmRaw === '' || kmRaw == null ? null : parseFloat(kmRaw);
      const valor    = valorRaw === 'combinar' ? 'combinar' : parseFloat(valorRaw) || 0;
      result.push({ raio_km_max: km, valor, label: labelRaw || '' });
    });
    return result;
  }

  /* ── Save ── */
  async function save() {
    if (!canEdit()) { showToast('Sem permissão.', 'warning'); return; }

    const modelo = document.querySelector('input[name="freteModelo"]:checked')?.value || 'FIXO';
    const custoKm   = document.getElementById('cfgCustoKm')?.value  || '1.50';
    const gratisKm  = document.getElementById('cfgGratisKm')?.value || '0';

    let faixasJson = _cfg.FRETE_FAIXAS || '';
    if (modelo === 'FIXO') {
      _faixas = _collectFaixas();
      faixasJson = JSON.stringify(_faixas);
    }

    const btn = document.getElementById('btnSalvarFrete');
    if (btn) { btn.disabled = true; btn.innerHTML = `${SVG_SAVE_F} Salvando…`; }

    try {
      await Promise.all([
        API.setConfigKey('FRETE_MODELO',          modelo),
        API.setConfigKey('FRETE_FAIXAS',          faixasJson),
        API.setConfigKey('FRETE_CUSTO_KM',        custoKm),
        API.setConfigKey('FRETE_GRATIS_ACIMA_KM', gratisKm),
      ]);

      _cfg.FRETE_MODELO          = modelo;
      _cfg.FRETE_FAIXAS          = faixasJson;
      _cfg.FRETE_CUSTO_KM        = custoKm;
      _cfg.FRETE_GRATIS_ACIMA_KM = gratisKm;

      showToast('Configuração de frete salva!', 'success');
      renderView();
    } catch (err) {
      showToast(err.message, 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = `${SVG_SAVE_F} Salvar`; }
    }
  }

  function render(html) {
    const el = document.getElementById('freteContainer');
    if (el) el.innerHTML = html;
  }

  function esc(s) {
    return (s || '').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { init, _addFaixa, _removeFaixa };
})();

window.Frete = Frete;
