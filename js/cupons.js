'use strict';
/**
 * cupons.js — Módulo de Cupons
 * Banco: coluna "cupom" (não "codigo"), "quantidadeUsos" (não "usosRestantes")
 */

const SVG_TRASH_SM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  <path d="M10 11v6M14 11v6"/>
  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
</svg>`;

const Cupons = (() => {
  let _data = [];
  let _initialized = false;

  const canEdit = () => Auth.isAdmin() || Auth.canEdit('cupons');

  function init() {
    if (!_initialized) {
      _initialized = true;
      document.getElementById('btnNewCupom')
        ?.addEventListener('click', openNewModal);
    }
    // Esconde botão de criar se não puder editar
    const btnNew = document.getElementById('btnNewCupom');
    if (btnNew) btnNew.style.display = canEdit() ? '' : 'none';

    if (_data.length === 0) load();
  }

  async function load() {
    renderSkeleton();
    try {
      const res = await API.getCupons();
      _data = Array.isArray(res) ? res : [];
      render(_data);
    } catch (err) {
      showToast(err.message, 'error');
      setTableBody('<tr><td colspan="4" class="empty-state">Erro ao carregar cupons.</td></tr>');
    }
  }

  function renderSkeleton() { setTableBody(createSkeletonRows(4, 4)); }

  function render(data) {
    if (!data.length) {
      setTableBody('<tr><td colspan="4" class="empty-state">Nenhum cupom cadastrado.</td></tr>');
      return;
    }
    const podeEditar = canEdit();
    setTableBody(data.map(c => {
      const codigo   = c.cupom || c.codigo || '—';
      const usos     = parseInt(c.quantidadeUsos ?? c.usosRestantes) || 0;
      const esgotado = usos <= 0;
      return `
        <tr class="table-row">
          <td><code class="code-badge">${esc(codigo)}</code></td>
          <td>${esc(c.desconto)}</td>
          <td>
            <span class="badge ${esgotado ? 'badge-red' : 'badge-green'}">
              ${esgotado ? 'Esgotado' : usos + ' uso(s)'}
            </span>
          </td>
          <td>
            ${podeEditar
              ? `<button class="btn-icon btn-danger-icon" onclick="Cupons.deleteItem('${c.id}')" title="Excluir cupom">${SVG_TRASH_SM}</button>`
              : `<span class="td-muted" style="font-size:.78rem">—</span>`}
          </td>
        </tr>`;
    }).join(''));
  }

  function setTableBody(html) {
    const el = document.getElementById('cuponsTableBody');
    if (el) el.innerHTML = html;
  }

  function openNewModal() {
    if (!canEdit()) { showToast('Sem permissão para criar cupons.', 'warning'); return; }
    openModal(`
      <div class="modal-card">
        <div class="modal-header">
          <h3>Novo Cupom</h3>
          <button class="btn-icon" onclick="closeModal()" aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="mCupomCodigo">Código *</label>
            <input type="text" id="mCupomCodigo" class="input-field" placeholder="EX: DESCONTO10"
              oninput="this.value = this.value.toUpperCase()" autocomplete="off">
            <span class="field-hint">Convertido automaticamente para maiúsculas.</span>
          </div>
          <div class="form-group">
            <label for="mCupomDesconto">Desconto *</label>
            <input type="text" id="mCupomDesconto" class="input-field" placeholder='Ex: "10" para 10% ou "frete grátis"'>
          </div>
          <div class="form-group">
            <label for="mCupomUsos">Quantidade de Usos *</label>
            <input type="number" id="mCupomUsos" class="input-field" min="1" placeholder="Ex: 100">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" onclick="Cupons.save()">Criar Cupom</button>
        </div>
      </div>
    `);
    document.getElementById('mCupomCodigo')?.focus();
  }

  async function save() {
    if (!canEdit()) { showToast('Sem permissão.', 'warning'); return; }
    const codigo   = document.getElementById('mCupomCodigo')?.value.trim().toUpperCase();
    const desconto = document.getElementById('mCupomDesconto')?.value.trim();
    const usos     = parseInt(document.getElementById('mCupomUsos')?.value);

    if (!codigo || !desconto || isNaN(usos) || usos < 1) {
      showToast('Preencha todos os campos corretamente.', 'warning');
      return;
    }

    const btn = document.querySelector('#modalContainer .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = 'Criando…'; }

    try {
      const novo = await API.createCupom({ cupom: codigo, desconto, quantidadeUsos: usos });
      _data.unshift(novo);
      render(_data);
      closeModal();
      showToast(`Cupom "${codigo}" criado!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Criar Cupom'; }
    }
  }

  function deleteItem(id) {
    if (!canEdit()) { showToast('Sem permissão para excluir.', 'warning'); return; }
    const cupom  = _data.find(c => c.id == id);
    const codigo = cupom?.cupom || cupom?.codigo || id;
    confirmAction(
      `Excluir o cupom <strong>${esc(codigo)}</strong>? Esta ação não pode ser desfeita.`,
      async () => {
        try {
          await API.deleteCupom(id);
          _data = _data.filter(c => c.id != id);
          render(_data);
          showToast('Cupom excluído.', 'success');
        } catch (err) { showToast(err.message, 'error'); }
      }
    );
  }

  function esc(str) {
    return (str || '—').toString()
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { init, load, save, deleteItem };
})();

window.Cupons = Cupons;
