'use strict';
/**
 * estoque.js — Módulo de Estoque
 * Coluna do banco: "produto" (não "nome")
 */

const SVG_PACKAGE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
  <line x1="12" y1="22.08" x2="12" y2="12"/>
</svg>`;

const SVG_EDIT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
</svg>`;

const SVG_TRASH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  <path d="M10 11v6M14 11v6"/>
  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
</svg>`;

const SVG_IMAGE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
  <rect x="3" y="3" width="18" height="18" rx="2"/>
  <circle cx="8.5" cy="8.5" r="1.5"/>
  <polyline points="21 15 16 10 5 21"/>
</svg>`;

const Estoque = (() => {
  let _data = [];
  let _initialized = false;
  let _editingId = null;

  function init() {
    if (!_initialized) {
      _initialized = true;
      document.getElementById('estoqueSearch')
        ?.addEventListener('input', (e) => filter(e.target.value));
      document.getElementById('btnNewProduto')
        ?.addEventListener('click', () => openEditModal(null));
    }
    if (_data.length === 0) load();
  }

  async function load() {
    renderSkeleton();
    document.getElementById('estoqueSearch').value = '';
    try {
      const res = await API.getEstoque();
      _data = Array.isArray(res) ? res : [];
      render(_data);
    } catch (err) {
      showToast(err.message, 'error');
      setBody('<tr><td colspan="8" class="empty-state">Erro ao carregar estoque.</td></tr>');
    }
  }

  function renderSkeleton() {
    setBody(createSkeletonRows(7, 8));
  }

  function render(data) {
    if (!data.length) {
      setBody('<tr><td colspan="8" class="empty-state">Nenhum produto encontrado.</td></tr>');
      return;
    }
    setBody(data.map(p => {
      const qtd  = parseInt(p.qtd) ?? 0;
      const baixo = qtd < 5;
      // Banco usa "produto", não "nome"
      const nome = p.produto || p.nome || '—';
      const thumb = p.imagem
        ? `<img src="${p.imagem}" alt="${esc(nome)}" class="product-thumb" loading="lazy" onerror="this.outerHTML='<div class=no-thumb>${SVG_PACKAGE}</div>'">`
        : `<div class="no-thumb">${SVG_PACKAGE}</div>`;
      return `
        <tr class="table-row" data-id="${p.id}">
          <td class="td-thumb">${thumb}</td>
          <td class="font-medium">${esc(nome)}</td>
          <td class="td-muted">${esc(p.linha)}</td>
          <td class="td-muted">${p.litros ? p.litros + ' L' : '—'}</td>
          <td class="td-muted">${esc(p.cores)}</td>
          <td>
            <span class="badge ${baixo ? 'badge-red' : 'badge-green'}">${qtd}</span>
          </td>
          <td class="font-medium">${formatCurrency(p.valor)}</td>
          <td class="actions-cell">
            <button class="btn-icon" onclick="Estoque.openEditModal('${p.id}')" title="Editar">${SVG_EDIT}</button>
            <button class="btn-icon btn-danger-icon" onclick="Estoque.deleteItem('${p.id}')" title="Excluir">${SVG_TRASH}</button>
          </td>
        </tr>`;
    }).join(''));
  }

  function filter(query) {
    const q = query.toLowerCase().trim();
    if (!q) { render(_data); return; }
    render(_data.filter(p =>
      (p.produto || p.nome || '').toLowerCase().includes(q) ||
      (p.linha   || '').toLowerCase().includes(q) ||
      (p.cores   || '').toLowerCase().includes(q)
    ));
  }

  function openEditModal(id) {
    const p = id ? _data.find(x => String(x.id) === String(id)) : null;
    _editingId = id || null;

    const ro     = p ? 'readonly' : '';
    const nome   = p?.produto || p?.nome || '';
    const linha  = p?.linha   || '';
    const litros = p?.litros  || '';
    const cores  = p?.cores   || '';
    const qtd    = p?.qtd  ?? '';
    const valor  = p?.valor ?? '';
    const img    = p?.imagem || '';

    openModal(`
      <div class="modal-card">
        <div class="modal-header">
          <h3>${p ? 'Editar Produto' : 'Novo Produto'}</h3>
          <button class="btn-icon" onclick="closeModal()" aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-grid-2">
            <div class="form-group ${p ? 'field-readonly' : ''}">
              <label>Produto *</label>
              <input type="text" id="mProdNome" class="input-field" value="${esc(nome)}" ${ro} placeholder="Nome do produto">
            </div>
            <div class="form-group ${p ? 'field-readonly' : ''}">
              <label>Linha</label>
              <input type="text" id="mProdLinha" class="input-field" value="${esc(linha)}" ${ro} placeholder="Ex: Smart">
            </div>
            <div class="form-group ${p ? 'field-readonly' : ''}">
              <label>Litros</label>
              <input type="text" id="mProdLitros" class="input-field" value="${esc(litros)}" ${ro} placeholder="Ex: 1.4">
            </div>
            <div class="form-group ${p ? 'field-readonly' : ''}">
              <label>Cores</label>
              <input type="text" id="mProdCores" class="input-field" value="${esc(cores)}" ${ro} placeholder="Ex: Azul, Rosa">
            </div>
            <div class="form-group">
              <label>Quantidade *</label>
              <input type="number" id="mProdQtd" class="input-field" value="${qtd}" min="0" placeholder="0">
            </div>
            <div class="form-group">
              <label>Valor (R$) *</label>
              <input type="number" id="mProdValor" class="input-field" value="${valor}" min="0" step="0.01" placeholder="0,00">
            </div>
          </div>
          <div class="form-group mt-8">
            <label>Imagem do Produto</label>
            <div class="image-upload-area" id="imageUploadArea" onclick="document.getElementById('mProdImagem').click()">
              ${img
                ? `<img src="${img}" class="image-preview" id="imagePreview" alt="Imagem atual">`
                : `<div class="image-placeholder" id="imagePreview">
                     ${SVG_IMAGE}
                     <span>Clique para selecionar</span>
                   </div>`}
              <input type="file" id="mProdImagem" accept="image/*" class="input-file" onchange="Estoque.previewImage(this)">
            </div>
          </div>
          ${p ? '<p class="field-hint">Somente Quantidade e Valor podem ser editados.</p>' : ''}
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" id="btnSaveEstoque" onclick="Estoque.save()">
            ${p ? 'Salvar Alterações' : 'Criar Produto'}
          </button>
        </div>
      </div>
    `);
  }

  function previewImage(input) {
    if (!input?.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const area = document.getElementById('imagePreview');
      if (!area) return;
      if (area.tagName === 'IMG') {
        area.src = e.target.result;
      } else {
        area.outerHTML = `<img src="${e.target.result}" class="image-preview" id="imagePreview" alt="Preview">`;
      }
    };
    reader.readAsDataURL(input.files[0]);
  }

  async function save() {
    const qtd   = parseInt(document.getElementById('mProdQtd')?.value);
    const valor = parseFloat(document.getElementById('mProdValor')?.value);

    if (isNaN(qtd)   || qtd   < 0) { showToast('Quantidade inválida.', 'warning'); return; }
    if (isNaN(valor) || valor < 0) { showToast('Valor inválido.', 'warning');     return; }

    const btn = document.getElementById('btnSaveEstoque');
    if (btn) { btn.disabled = true; btn.textContent = 'Salvando…'; }

    let imagemUrl = null;
    const fileInput = document.getElementById('mProdImagem');
    if (fileInput?.files?.[0]) {
      try {
        const fd = new FormData();
        fd.append('file', fileInput.files[0]);
        const res = await API.uploadImagem(fd);
        imagemUrl = res?.url || res?.imageUrl || res?.path || null;
      } catch (err) {
        showToast('Erro no upload da imagem: ' + err.message, 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Salvar Alterações'; }
        return;
      }
    }

    const dados = { qtd, valor };
    if (imagemUrl) dados.imagem = imagemUrl;

    try {
      if (_editingId) {
        const updated = await API.updateEstoque(_editingId, dados);
        const idx = _data.findIndex(p => String(p.id) === String(_editingId));
        if (idx !== -1) _data[idx] = { ..._data[idx], ...dados, ...(updated || {}) };
        showToast('Produto atualizado!', 'success');
      } else {
        const nomeProd = document.getElementById('mProdNome')?.value.trim();
        if (!nomeProd) { showToast('Nome é obrigatório.', 'warning'); return; }
        // Banco usa coluna "produto"
        dados.produto = nomeProd;
        dados.linha   = document.getElementById('mProdLinha')?.value.trim();
        dados.litros  = document.getElementById('mProdLitros')?.value.trim();
        dados.cores   = document.getElementById('mProdCores')?.value.trim();
        showToast('Criação de produto em breve!', 'info');
        closeModal();
        return;
      }
      closeModal();
      render(_data);
    } catch (err) {
      showToast(err.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Salvar Alterações'; }
    }
  }

  function deleteItem(id) {
    const p = _data.find(x => String(x.id) === String(id));
    const nome = p?.produto || p?.nome || 'este produto';
    confirmAction(
      `Excluir <strong>${esc(nome)}</strong>? Esta ação não pode ser desfeita.`,
      async () => {
        try {
          await API.deleteEstoque(id);
          _data = _data.filter(x => String(x.id) !== String(id));
          render(_data);
          showToast('Produto excluído.', 'success');
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    );
  }

  function setBody(html) {
    const el = document.getElementById('estoqueTableBody');
    if (el) el.innerHTML = html;
  }

  function esc(str) {
    return (str || '—')
      .toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { init, load, openEditModal, previewImage, save, deleteItem };
})();

window.Estoque = Estoque;