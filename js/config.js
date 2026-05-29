'use strict';
/**
 * config.js — Configurações de Vendas
 * v2: PIX, WhatsApp, toggle WA, métodos de pagamento, origem/localização.
 */

const SVG_PIX    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`;
const SVG_WA     = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;
const SVG_PAY    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`;
const SVG_PIN    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const SVG_SAVE   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;
const SVG_PENCIL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

const Config = (() => {
  let _cfg = {
    pix: '', whatsapp: '',
    PAGAMENTO_PIX: 'true', PAGAMENTO_CREDITO: 'true', PAGAMENTO_DINHEIRO: 'true',
    WHATSAPP_ATIVO: 'true',
    ORIGEM_ENDERECO: '', ORIGEM_LAT: '', ORIGEM_LON: '', ORIGEM_CEP: '',
  };

  const canEdit = () => Auth.isAdmin() || Auth.canEdit('config');

  /* ── Init ── */
  async function init() {
    render(loadingHtml());
    try {
      const raw  = await API.getConfigVendas();
      _cfg = { ..._cfg, ...raw };
      renderView();
    } catch (err) {
      showToast(err.message, 'error');
      render('<p class="empty-state">Erro ao carregar configurações.</p>');
    }
  }

  function loadingHtml() {
    return `<div style="display:flex;flex-direction:column;gap:.75rem;max-width:620px">
      ${[1,2,3,4].map(()=>`<div class="skeleton-line" style="height:80px;border-radius:12px"></div>`).join('')}
    </div>`;
  }

  /* ── View ── */
  function renderView() {
    const podeEditar = canEdit();
    const waAtivo    = _cfg.WHATSAPP_ATIVO !== 'false';
    const pagPix     = _cfg.PAGAMENTO_PIX      !== 'false';
    const pagCred    = _cfg.PAGAMENTO_CREDITO  !== 'false';
    const pagDin     = _cfg.PAGAMENTO_DINHEIRO !== 'false';

    render(`
      <div style="display:flex;flex-direction:column;gap:1rem;max-width:620px">

        ${configCard(SVG_PIX,  'Chave PIX',              _cfg.pix      || 'Não configurada')}
        ${configCard(SVG_WA,   'Contato WhatsApp',       _cfg.whatsapp || 'Não configurado')}

        <!-- WhatsApp toggle -->
        <div class="pix-card" style="gap:.75rem">
          ${configCardIcon(SVG_WA)}
          <div style="flex:1">
            <span class="pix-label">Pedidos via WhatsApp</span>
            <span class="pix-value" style="font-size:.95rem">${waAtivo ? '✅ Habilitado' : '⛔ Desabilitado'}</span>
          </div>
        </div>

        <!-- Métodos de pagamento -->
        <div class="pix-card" style="flex-direction:column;align-items:flex-start;gap:.6rem">
          <div style="display:flex;align-items:center;gap:.65rem">
            ${configCardIcon(SVG_PAY)}
            <span class="pix-label" style="margin:0">Métodos de Pagamento</span>
          </div>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            ${payBadge('PIX',            pagPix)}
            ${payBadge('Cartão Crédito', pagCred)}
            ${payBadge('Dinheiro',       pagDin)}
          </div>
        </div>

        <!-- Origem -->
        <div class="pix-card" style="gap:.75rem">
          ${configCardIcon(SVG_PIN)}
          <div style="flex:1">
            <span class="pix-label">Local de Origem / Retirada</span>
            <span class="pix-value" style="font-size:.9rem">${esc(_cfg.ORIGEM_ENDERECO || 'Não configurado')}</span>
            ${_cfg.ORIGEM_LAT && _cfg.ORIGEM_LON
              ? `<span style="font-size:.78rem;color:var(--text-dim)">Lat ${_cfg.ORIGEM_LAT} · Lon ${_cfg.ORIGEM_LON}</span>`
              : ''}
          </div>
        </div>

      </div>
      ${podeEditar
        ? `<button class="btn btn-primary" id="btnEditarConfig" style="margin-top:1.25rem">${SVG_PENCIL} Editar Configurações</button>`
        : `<p style="margin-top:1rem;font-size:.85rem;color:var(--text-dim)">Você tem acesso somente de visualização.</p>`}
    `);

    if (podeEditar) document.getElementById('btnEditarConfig').addEventListener('click', renderEdit);
  }

  function configCard(icon, label, valor) {
    return `<div class="pix-card">${configCardIcon(icon)}<div class="pix-info"><span class="pix-label">${label}</span><span class="pix-value">${esc(valor)}</span></div></div>`;
  }
  function configCardIcon(icon) {
    return `<div class="pix-icon">${icon}</div>`;
  }
  function payBadge(label, ativo) {
    return `<span class="badge ${ativo ? 'badge-green' : 'badge-gray'}">${label}</span>`;
  }

  /* ── Edit ── */
  function renderEdit() {
    const waAtivo  = _cfg.WHATSAPP_ATIVO     !== 'false';
    const pagPix   = _cfg.PAGAMENTO_PIX      !== 'false';
    const pagCred  = _cfg.PAGAMENTO_CREDITO  !== 'false';
    const pagDin   = _cfg.PAGAMENTO_DINHEIRO !== 'false';

    render(`
      <div style="display:flex;flex-direction:column;gap:1rem;max-width:620px">

        <!-- PIX -->
        <div class="pix-card pix-edit-card">
          ${configCardIcon(SVG_PIX)}
          <div class="pix-edit-body">
            <label class="pix-label" for="cfgPix">Chave PIX</label>
            <input type="text" id="cfgPix" class="input-field" value="${esc(_cfg.pix)}"
              placeholder="CPF, e-mail, telefone ou chave aleatória" autocomplete="off">
            <p class="pix-hint">CPF (000.000.000-00), e-mail, +55 11 99999-9999 ou chave aleatória.</p>
          </div>
        </div>

        <!-- WhatsApp contato -->
        <div class="pix-card pix-edit-card">
          ${configCardIcon(SVG_WA)}
          <div class="pix-edit-body">
            <label class="pix-label" for="cfgWA">Contato WhatsApp do Vendedor</label>
            <input type="tel" id="cfgWA" class="input-field" value="${esc(_cfg.whatsapp)}"
              placeholder="5588999999999 (só números, com DDI)">
            <p class="pix-hint">Formato internacional sem espaços. Ex: 5588999990000</p>
          </div>
        </div>

        <!-- Toggle WhatsApp ativo -->
        <div class="pix-card" style="gap:.85rem;align-items:center">
          ${configCardIcon(SVG_WA)}
          <div style="flex:1">
            <span class="pix-label" style="display:block;margin-bottom:.2rem">Pedidos via WhatsApp</span>
            <span style="font-size:.82rem;color:var(--text-muted)">Exibe ou oculta o botão "Pedir pelo WhatsApp" na loja.</span>
          </div>
          <label class="cfg-toggle" title="Ativar/desativar pedidos pelo WhatsApp">
            <input type="checkbox" id="cfgWaAtivo" ${waAtivo ? 'checked' : ''}>
            <span class="cfg-toggle-track"><span class="cfg-toggle-thumb"></span></span>
          </label>
        </div>

        <!-- Métodos de pagamento -->
        <div class="pix-card pix-edit-card" style="gap:.75rem">
          <div style="display:flex;align-items:center;gap:.65rem;margin-bottom:.25rem">
            ${configCardIcon(SVG_PAY)}
            <span class="pix-label" style="margin:0">Métodos de Pagamento aceitos</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:.6rem;padding-left:.25rem">
            ${toggleCheck('cfgPagPix',  'PIX',            pagPix,  'Aprovação imediata')}
            ${toggleCheck('cfgPagCred', 'Cartão de Crédito', pagCred, 'Parcelamento em até 12x')}
            ${toggleCheck('cfgPagDin',  'Dinheiro',        pagDin,  'Pagamento na entrega/retirada')}
          </div>
        </div>

        <!-- Origem / Ponto de Retirada -->
        <div class="pix-card pix-edit-card" style="gap:.75rem">
          <div style="display:flex;align-items:center;gap:.65rem;margin-bottom:.25rem">
            ${configCardIcon(SVG_PIN)}
            <span class="pix-label" style="margin:0">Local de Origem / Ponto de Retirada</span>
          </div>
          <div class="pix-edit-body">
            <label class="pix-label" for="cfgOrigem">Endereço completo</label>
            <input type="text" id="cfgOrigem" class="input-field" value="${esc(_cfg.ORIGEM_ENDERECO)}"
              placeholder="Rua Exemplo, 110 — Bairro, Cidade/UF">
            <div class="form-grid-2" style="margin-top:.6rem">
              <div class="form-group">
                <label>CEP</label>
                <input type="text" id="cfgOrigemCep" class="input-field" value="${esc(_cfg.ORIGEM_CEP)}" placeholder="00000-000" maxlength="9">
              </div>
              <div class="form-group">
                <label>Coordenadas</label>
                <div style="display:flex;gap:.4rem">
                  <input type="text" id="cfgOrigemLat" class="input-field" value="${esc(_cfg.ORIGEM_LAT)}" placeholder="Lat" style="flex:1">
                  <input type="text" id="cfgOrigemLon" class="input-field" value="${esc(_cfg.ORIGEM_LON)}" placeholder="Lon" style="flex:1">
                </div>
              </div>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" style="margin-top:.6rem" onclick="Config._geolocate()">
              ${SVG_PIN} Detectar coordenadas pelo endereço
            </button>
            <p class="pix-hint">As coordenadas substituem os valores hardcoded em <code>lib/config.js</code> da loja.</p>
          </div>
        </div>

        <!-- Ações -->
        <div style="display:flex;gap:.75rem;justify-content:flex-end;padding-bottom:.5rem">
          <button class="btn btn-ghost" id="btnCancelarConfig">Cancelar</button>
          <button class="btn btn-primary" id="btnSalvarConfig">${SVG_SAVE} Salvar</button>
        </div>
      </div>
    `);

    document.getElementById('btnCancelarConfig').addEventListener('click', renderView);
    document.getElementById('btnSalvarConfig').addEventListener('click', save);
    document.getElementById('cfgPix').focus();
  }

  function toggleCheck(id, label, checked, hint) {
    return `
      <label style="display:flex;align-items:center;gap:.6rem;cursor:pointer;user-select:none">
        <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}
          style="width:16px;height:16px;accent-color:var(--accent);cursor:pointer;flex-shrink:0">
        <span>
          <span style="font-size:.875rem;font-weight:500;color:var(--text)">${label}</span>
          ${hint ? `<span style="font-size:.78rem;color:var(--text-muted);margin-left:.35rem">${hint}</span>` : ''}
        </span>
      </label>`;
  }

  /* ── Geocode pelo endereço ── */
  async function _geolocate() {
    const endereco = document.getElementById('cfgOrigem')?.value.trim();
    if (!endereco) { showToast('Preencha o endereço antes de detectar.', 'warning'); return; }

    const btn = document.querySelector('[onclick="Config._geolocate()"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Buscando…'; }

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(endereco)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
      const data = await res.json();
      if (!data?.length) throw new Error('Endereço não encontrado. Tente incluir a cidade/UF.');

      const { lat, lon } = data[0];
      const latEl = document.getElementById('cfgOrigemLat');
      const lonEl = document.getElementById('cfgOrigemLon');
      if (latEl) latEl.value = parseFloat(lat).toFixed(6);
      if (lonEl) lonEl.value = parseFloat(lon).toFixed(6);
      showToast('Coordenadas detectadas!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = `${SVG_PIN} Detectar coordenadas pelo endereço`; }
    }
  }

  /* ── Save ── */
  async function save() {
    if (!canEdit()) { showToast('Sem permissão.', 'warning'); return; }

    const pix       = document.getElementById('cfgPix')?.value.trim();
    const whatsapp  = document.getElementById('cfgWA')?.value.trim().replace(/\D/g, '');
    const waAtivo   = document.getElementById('cfgWaAtivo')?.checked  ? 'true' : 'false';
    const pagPix    = document.getElementById('cfgPagPix')?.checked   ? 'true' : 'false';
    const pagCred   = document.getElementById('cfgPagCred')?.checked  ? 'true' : 'false';
    const pagDin    = document.getElementById('cfgPagDin')?.checked   ? 'true' : 'false';
    const origem    = document.getElementById('cfgOrigem')?.value.trim();
    const origemCep = document.getElementById('cfgOrigemCep')?.value.trim();
    const origemLat = document.getElementById('cfgOrigemLat')?.value.trim();
    const origemLon = document.getElementById('cfgOrigemLon')?.value.trim();

    const btn = document.getElementById('btnSalvarConfig');
    if (btn) { btn.disabled = true; btn.innerHTML = `${SVG_SAVE} Salvando…`; }

    try {
      // Salva em paralelo — uma chamada por chave
      await Promise.all([
        API.updateConfigVendas({ pix, whatsapp }),
        API.setConfigKey('WHATSAPP_ATIVO',      waAtivo),
        API.setConfigKey('PAGAMENTO_PIX',        pagPix),
        API.setConfigKey('PAGAMENTO_CREDITO',    pagCred),
        API.setConfigKey('PAGAMENTO_DINHEIRO',   pagDin),
        API.setConfigKey('ORIGEM_ENDERECO',      origem),
        API.setConfigKey('ORIGEM_CEP',           origemCep),
        API.setConfigKey('ORIGEM_LAT',           origemLat),
        API.setConfigKey('ORIGEM_LON',           origemLon),
      ]);

      // Atualiza cache local
      Object.assign(_cfg, {
        pix, whatsapp,
        WHATSAPP_ATIVO: waAtivo, PAGAMENTO_PIX: pagPix, PAGAMENTO_CREDITO: pagCred,
        PAGAMENTO_DINHEIRO: pagDin, ORIGEM_ENDERECO: origem, ORIGEM_CEP: origemCep,
        ORIGEM_LAT: origemLat, ORIGEM_LON: origemLon,
      });

      showToast('Configurações salvas!', 'success');
      renderView();
    } catch (err) {
      showToast(err.message, 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = `${SVG_SAVE} Salvar`; }
    }
  }

  function render(html) {
    const el = document.getElementById('configContainer');
    if (el) el.innerHTML = html;
  }

  function esc(s) {
    return (s || '').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { init, _geolocate };
})();

window.Config = Config;
