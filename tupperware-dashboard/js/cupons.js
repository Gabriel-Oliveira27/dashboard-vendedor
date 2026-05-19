'use strict';
/**
 * cupons.js — Módulo de Cupons
 */

const Cupons = (() => {
  let _data = [];
  let _initialized = false;

  function init() {
    if (!_initialized) {
      _initialized = true;
      document.getElementById('btnNewCupom')
        ?.addEventListener('click', openNewModal);
    }
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

  function renderSkeleton() {
    setTableBody(createSkeletonRows(4, 4));
  }

  function render(data) {
    if (!data.length) {
      setTableBody('<tr><td colspan="4" class="empty-state">Nenhum cupom cadastrado.</td></tr>');
      return;
    }
    setTableBody(data.map(c => {
      const esgotado = (parseInt(c.usosRestantes) || 0) <= 0;
      return `
        <tr class="table-row">
          <td><code class="code-badge">${c.codigo}</code></td>
          <td>${c.desconto}</td>
          <td>
            <span class="badge ${esgotado ? 'badge-red' : 'badge-green'}">
              ${esgotado ? 'Esgotado' : c.usosRestantes + ' uso(s)'}
            </span>
          </td>
          <td>
            <button class="btn-icon btn-delete" onclick="Cupons.deleteItem('${c.id}')" title="Excluir cupom">🗑️</button>
          </td>
        </tr>`;
    }).join(''));
  }

  function setTableBody(html) {
    const el = document.getElementById('cuponsTableBody');
    if (el) el.innerHTML = html;
  }

  function openNewModal() {
    openModal(`
      <div class="modal-card">
        <div class="modal-header">
          <h3>Novo Cupom</h3>
          <button class="btn-icon" onclick="closeModal()" aria-label="Fechar">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="mCupomCodigo">Código *</label>
            <input
              type="text"
              id="mCupomCodigo"
              class="input-field"
              placeholder="EX: DESCONTO10"
              oninput="this.value = this.value.toUpperCase()"
              autocomplete="off"
            >
            <span class="field-hint">O código será convertido para maiúsculas automaticamente.</span>
          </div>
          <div class="form-group">
            <label for="mCupomDesconto">Desconto *</label>
            <input
              type="text"
              id="mCupomDesconto"
              class="input-field"
              placeholder='Ex: "10" para 10% ou "frete grátis"'
            >
          </div>
          <div class="form-group">
            <label for="mCupomUsos">Quantidade de Usos *</label>
            <input
              type="number"
              id="mCupomUsos"
              class="input-field"
              min="1"
              placeholder="Ex: 100"
            >
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
      const novo = await API.createCupom({ codigo, desconto, usosRestantes: usos });
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
    const cupom = _data.find(c => c.id == id);
    confirmAction(
      `Excluir o cupom <strong>${cupom?.codigo || id}</strong>? Esta ação não pode ser desfeita.`,
      async () => {
        try {
          await API.deleteCupom(id);
          _data = _data.filter(c => c.id != id);
          render(_data);
          showToast('Cupom excluído.', 'success');
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    );
  }

  return { init, load, save, deleteItem };
})();

window.Cupons = Cupons;
