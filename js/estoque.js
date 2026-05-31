'use strict';


const SVG_PACKAGE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`;
const SVG_EDIT    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const SVG_TRASH   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
const SVG_EYE     = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const SVG_IMG_PH  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
const SVG_CLOSE   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

const LINHAS = ['FREEZER','AQUECER','CONSERVAR','PREPARAR','SERVIR','ARMAZENAR'];

(function injectStyles() {
  if (document.getElementById('estoque-styles')) return;
  const s = document.createElement('style'); s.id='estoque-styles';
  s.textContent=`
    #estoqueZoomOverlay{position:fixed;z-index:9000;pointer-events:none;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:6px;box-shadow:0 12px 48px rgba(0,0,0,.55);opacity:0;transform:scale(.94);transition:opacity .22s,transform .22s}
    #estoqueZoomOverlay.visible{opacity:1;transform:scale(1)}
    #estoqueZoomOverlay img{display:block;width:240px;height:240px;object-fit:contain;border-radius:8px}
    .estoque-preview-card{background:#1a1a24;border:1px solid #2a2a38;border-radius:16px;overflow:hidden;font-family:'Outfit',system-ui,sans-serif;width:240px}
    html[data-theme="light"] .estoque-preview-card{background:#fff;border-color:#d8d8e8}
    .estoque-preview-img{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#0f0f13}
    html[data-theme="light"] .estoque-preview-img{background:#f2f2f8}
    .estoque-preview-body{padding:.85rem}
    .estoque-preview-name{font-weight:600;color:var(--text);margin-bottom:.2rem;font-size:.9rem;line-height:1.3}
    .estoque-preview-sub{font-size:.75rem;color:var(--text-muted);margin-bottom:.4rem}
    .estoque-preview-price{color:#7c3aed;font-weight:700;font-size:1.05rem;margin-bottom:.3rem}
    .estoque-preview-stock{font-size:.75rem;color:var(--text-muted);margin-bottom:.65rem}
    .estoque-preview-btn{background:#7c3aed;color:#fff;border-radius:8px;padding:.45rem;text-align:center;font-size:.82rem;font-weight:600;opacity:.55;cursor:not-allowed}
    /* Markdown toolbar */
    .md-toolbar{display:flex;gap:4px;margin-bottom:6px;flex-wrap:wrap}
    .md-toolbar button{height:28px;padding:0 10px;border-radius:6px;border:1px solid var(--border);background:var(--bg);color:var(--text-muted);font-size:.78rem;font-weight:600;cursor:pointer;font-family:inherit;transition:background .15s,color .15s}
    .md-toolbar button:hover{background:var(--accent-soft);color:var(--accent);border-color:var(--accent)}
    .md-toolbar button code{font-family:'SF Mono','Fira Code',monospace;font-size:.72rem}
  `;
  document.head.appendChild(s);
})();

let _zoomEl=null, _zoomTimer=null;
function _getZoom() { if(!_zoomEl){_zoomEl=document.createElement('div');_zoomEl.id='estoqueZoomOverlay';_zoomEl.innerHTML='<img alt="">';document.body.appendChild(_zoomEl);}return _zoomEl; }
function _showZoom(el,src){const z=_getZoom();z.querySelector('img').src=src;const r=el.getBoundingClientRect();let l=r.right+12,t=r.top;if(l+260>window.innerWidth)l=r.left-260;if(t+260>window.innerHeight)t=window.innerHeight-260;z.style.left=`${Math.max(8,l)}px`;z.style.top=`${Math.max(8,t)}px`;z.classList.add('visible');}
function _hideZoom(){clearTimeout(_zoomTimer);_zoomEl?.classList.remove('visible');}

/** Aplica formatação Markdown no textarea de detalhes */
function applyMarkdown(type) {
  const ta = document.getElementById('mProdDetalhes');
  if (!ta) return;
  const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
  const sel = v.slice(s, e) || 'texto';
  const map = {
    bold:   `**${sel}**`,
    italic: `_${sel}_`,
    list:   `\n- ${sel}`,
    dash:   `\n— ${sel}`,
  };
  const rep = map[type] || sel;
  ta.value = v.slice(0, s) + rep + v.slice(e);
  ta.focus();
  const newPos = s + rep.length;
  ta.setSelectionRange(newPos, newPos);
}

const Estoque = (() => {
  let _data=[], _initialized=false, _editingId=null;

  function init() {
    if (!_initialized) {
      _initialized = true;
      document.getElementById('estoqueSearch')?.addEventListener('input', e => filter(e.target.value));
      document.getElementById('btnNewProduto')?.addEventListener('click', () => openEditModal(null));
    }
    const btnNew = document.getElementById('btnNewProduto');
    if (btnNew) btnNew.style.display = canEdit() ? '' : 'none';
    if (_data.length === 0) load();
  }

  const canEdit = () => Auth.isAdmin() || Auth.canEdit('estoque');

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

  function renderSkeleton() { setBody(createSkeletonRows(7,8)); }

  function render(data) {
    if (!data.length) { setBody('<tr><td colspan="8" class="empty-state">Nenhum produto encontrado.</td></tr>'); return; }
    const podeEditar = canEdit();
    setBody(data.map(p => {
      const qtd=parseInt(p.qtd)??0, baixo=qtd<5, nome=p.produto||p.nome||'—';
      const imgSrc = esc(p.imagem || '');
      const thumb = p.imagem
        ? `<img src="${imgSrc}" alt="${esc(nome)}" class="product-thumb" loading="lazy" data-imgzoom="${imgSrc}" onerror="Estoque.imgError(this)" style="cursor:zoom-in">`
        : `<div class="no-thumb">${SVG_PACKAGE}</div>`;

      const acoes = podeEditar
        ? `<button class="btn-icon" onclick="Estoque.previewCard('${p.id}')" title="Ver card da loja">${SVG_EYE}</button>
           <button class="btn-icon" onclick="Estoque.openEditModal('${p.id}')" title="Editar">${SVG_EDIT}</button>
           <button class="btn-icon btn-danger-icon" onclick="Estoque.deleteItem('${p.id}')" title="Excluir">${SVG_TRASH}</button>`
        : `<button class="btn-icon" onclick="Estoque.previewCard('${p.id}')" title="Ver card da loja">${SVG_EYE}</button>`;

      return `<tr class="table-row" data-id="${p.id}">
        <td class="td-thumb">${thumb}</td>
        <td class="font-medium">${esc(nome)}</td>
        <td class="td-muted">${esc(p.linha)}</td>
        <td class="td-muted">${esc(p.litros)||'—'}</td>
        <td class="td-muted">${esc(p.cores)}</td>
        <td><span class="badge ${baixo?'badge-red':'badge-green'}">${qtd}</span></td>
        <td class="font-medium">${formatCurrency(p.valor)}</td>
        <td class="actions-cell">${acoes}</td>
      </tr>`;
    }).join(''));
  }

  function imgError(img) { _hideZoom(); const d=document.createElement('div');d.className='no-thumb';d.innerHTML=SVG_PACKAGE;img.replaceWith(d); }
  function _hoverStart(el,src) { clearTimeout(_zoomTimer); _zoomTimer=setTimeout(()=>_showZoom(el,src),3000); }
  function _hoverEnd()         { clearTimeout(_zoomTimer); _hideZoom(); }

  function previewCard(id) {
    const p=_data.find(x=>String(x.id)===String(id)); if(!p) return;
    const nome=p.produto||p.nome||'—', preco=parseFloat(p.valor)||0, qtd=parseInt(p.qtd)||0;
    const sub=[p.linha,p.litros].filter(Boolean).join(' · ');
    const imgHtml=p.imagem?`<img src="${p.imagem}" class="estoque-preview-img" alt="${esc(nome)}" onerror="this.style.display='none'">`:`<div class="estoque-preview-img" style="display:flex;align-items:center;justify-content:center;color:#55556a">${SVG_PACKAGE}</div>`;
    const badge=qtd<=5?`<span style="background:rgba(239,68,68,.85);color:#fff;font-size:.6rem;font-weight:700;padding:2px 7px;border-radius:100px;position:absolute;top:8px;left:8px">Últimas unidades</span>`:'';
    openModal(`<div class="modal-card" style="max-width:280px">
      <div class="modal-header"><h3 style="font-size:.9rem">Preview — Card da Loja</h3><button class="btn-icon" onclick="closeModal()">${SVG_CLOSE}</button></div>
      <div class="modal-body" style="padding:1.25rem;align-items:center">
        <div class="estoque-preview-card"><div style="position:relative">${imgHtml}${badge}</div>
          <div class="estoque-preview-body">
            <div class="estoque-preview-name">${esc(nome)}</div>
            ${sub?`<div class="estoque-preview-sub">${esc(sub)}</div>`:''}
            <div class="estoque-preview-price">R$ ${preco.toFixed(2)}</div>
            <div class="estoque-preview-stock">${qtd} em estoque</div>
            <div class="estoque-preview-btn">Adicionar ao Carrinho</div>
          </div>
        </div>
        <p style="font-size:.72rem;color:var(--text-dim);margin-top:.75rem;text-align:center">Visualização aproximada.</p>
      </div>
    </div>`);
  }

  function filter(q) {
    const s=q.toLowerCase().trim();
    if(!s){render(_data);return;}
    render(_data.filter(p=>(p.produto||p.nome||'').toLowerCase().includes(s)||(p.linha||'').toLowerCase().includes(s)||(p.cores||'').toLowerCase().includes(s)));
  }

  function openEditModal(id) {
    if (!canEdit()) { showToast('Sem permissão para editar.', 'warning'); return; }
    const p=id?_data.find(x=>String(x.id)===String(id)):null;
    _editingId=id||null;
    const isNew=!p, nome=p?.produto||p?.nome||'', img=p?.imagem||'';
    const linhaOpts = LINHAS.map(l=>`<option value="${l}" ${p?.linha===l?'selected':''}>${l}</option>`).join('');
    const detalhes = esc(p?.detalhes || '');

    openModal(`<div class="modal-card">
      <div class="modal-header">
        <h3>${isNew?'Novo Produto':'Editar Produto'}</h3>
        <button class="btn-icon" onclick="closeModal()">${SVG_CLOSE}</button>
      </div>
      <div class="modal-body">
        <div class="form-grid-2">
          <div class="form-group ${!isNew?'field-readonly':''}">
            <label>Produto *</label>
            <input type="text" id="mProdNome" class="input-field" value="${esc(nome)}" ${!isNew?'readonly':''} placeholder="Nome do produto">
          </div>
          <div class="form-group ${!isNew?'field-readonly':''}">
            <label>Linha *</label>
            ${isNew
              ? `<select id="mProdLinha" class="input-field" style="height:38px">${linhaOpts}</select>`
              : `<input type="text" id="mProdLinha" class="input-field" value="${esc(p?.linha||'')}" readonly>`}
          </div>
          <div class="form-group ${!isNew?'field-readonly':''}">
            <label>Litros</label>
            <input type="text" id="mProdLitros" class="input-field" value="${esc(p?.litros||'')}" ${!isNew?'readonly':''} placeholder="Ex: 1.5L">
          </div>
          <div class="form-group ${!isNew?'field-readonly':''}">
            <label>Cores</label>
            <input type="text" id="mProdCores" class="input-field" value="${esc(p?.cores||'')}" ${!isNew?'readonly':''} placeholder="Ex: Azul, Rosa">
          </div>
          <div class="form-group">
            <label>Quantidade *</label>
            <input type="number" id="mProdQtd" class="input-field" value="${p?.qtd??''}" min="0" placeholder="0">
          </div>
          <div class="form-group">
            <label>Valor (R$) *</label>
            <input type="number" id="mProdValor" class="input-field" value="${p?.valor??''}" min="0" step="0.01" placeholder="0,00">
          </div>
        </div>

        <!-- Imagem -->
        <div class="form-group mt-8">
          <label>Imagem do Produto</label>
          ${img?`<div style="margin-bottom:.75rem"><img src="${img}" style="height:80px;border-radius:8px;object-fit:cover;border:1px solid var(--border)" onerror="this.style.display='none'"></div>`:''}
          <div class="image-upload-area" onclick="document.getElementById('mProdImagem').click()">
            <div class="image-placeholder" id="imagePreview">
              ${SVG_IMG_PH}
              <span>${img?'Clique para trocar':'Clique para selecionar'}</span>
            </div>
            <input type="file" id="mProdImagem" accept="image/*" class="input-file" onchange="Estoque.previewImage(this)">
          </div>
          <span class="field-hint">Upload para o Cloudinary. Formatos: JPG, PNG, WEBP.</span>
        </div>

        <!-- Detalhes / Características -->
        <div class="form-group mt-8" style="grid-column:1/-1">
          <label>Descrição / Características</label>
          <div class="md-toolbar">
            <button type="button" onclick="applyMarkdown('bold')"   title="Negrito"><code>**N**</code></button>
            <button type="button" onclick="applyMarkdown('italic')" title="Itálico"><code>_I_</code></button>
            <button type="button" onclick="applyMarkdown('list')"   title="Item de lista">• Lista</button>
            <button type="button" onclick="applyMarkdown('dash')"   title="Traço">— Traço</button>
          </div>
          <textarea id="mProdDetalhes" class="input-field" rows="6"
            style="resize:vertical;height:auto;padding:.6rem .85rem;line-height:1.5"
            placeholder="Suporta **negrito**, _itálico_, - listas...&#10;Capacidade: 1.5L&#10;Material: plástico BPA Free&#10;Garantia de fábrica: 10 anos">${detalhes}</textarea>
          <p class="field-hint">Markdown suportado. Exibido como "Ver características" na página do produto.</p>
        </div>

        ${!isNew?'<p class="field-hint mt-8">Somente Quantidade, Valor, Imagem e Detalhes podem ser editados.</p>':''}
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveEstoque" onclick="Estoque.save()">
          ${isNew?'Criar Produto':'Salvar Alterações'}
        </button>
      </div>
    </div>`);
  }

  function previewImage(input) {
    if(!input?.files?.[0]) return;
    const r=new FileReader();
    r.onload=e=>{const el=document.getElementById('imagePreview');if(el)el.innerHTML=`<img src="${e.target.result}" style="max-height:120px;border-radius:6px;object-fit:contain" alt="Preview">`;};
    r.readAsDataURL(input.files[0]);
  }

  async function save() {
    if (!canEdit()) { showToast('Sem permissão para salvar.', 'warning'); return; }
    const nomeProd = document.getElementById('mProdNome')?.value.trim();
    const qtd      = parseInt(document.getElementById('mProdQtd')?.value);
    const valor    = parseFloat(document.getElementById('mProdValor')?.value);
    const detalhes = document.getElementById('mProdDetalhes')?.value || null;
    const isNew    = !_editingId;

    if (isNew && !nomeProd)       { showToast('Nome é obrigatório.', 'warning');   return; }
    if (isNaN(qtd)  || qtd  < 0) { showToast('Quantidade inválida.', 'warning'); return; }
    if (isNaN(valor)|| valor < 0) { showToast('Valor inválido.', 'warning');       return; }

    const btn = document.getElementById('btnSaveEstoque');
    if (btn) { btn.disabled=true; btn.textContent='Salvando…'; }

    let imagemUrl = null;
    const fileInput = document.getElementById('mProdImagem');
    if (fileInput?.files?.[0]) {
      if (btn) btn.textContent='Enviando imagem…';
      try {
        const fd = new FormData(); fd.append('file', fileInput.files[0]);
        const res = await API.uploadImagem(fd);
        imagemUrl = res?.url || null;
        if (!imagemUrl) throw new Error('URL não retornada pelo servidor.');
      } catch (err) {
        showToast('Erro no upload: ' + err.message, 'error');
        if (btn){btn.disabled=false;btn.textContent=isNew?'Criar Produto':'Salvar Alterações';}
        return;
      }
    }

    try {
      if (isNew) {
        const linha  = document.getElementById('mProdLinha')?.value.trim();
        const litros = document.getElementById('mProdLitros')?.value.trim();
        const cores  = document.getElementById('mProdCores')?.value.trim();
        if (!linha) { showToast('Selecione a linha do produto.', 'warning'); return; }
        const dados = { produto: nomeProd, linha, litros: litros||'', cores: cores||'', qtd, valor, imagem: imagemUrl||'', detalhes, filtros:'' };
        const novo  = await API.createEstoque(dados);
        _data.unshift(novo);
        showToast(`Produto "${nomeProd}" criado!`, 'success');
      } else {
        const dados = { qtd, valor, detalhes };
        if (imagemUrl) dados.imagem = imagemUrl;
        const updated = await API.updateEstoque(_editingId, dados);
        const idx = _data.findIndex(p => String(p.id) === String(_editingId));
        if (idx !== -1) _data[idx] = { ..._data[idx], ...dados, ...(updated||{}) };
        showToast('Produto atualizado!', 'success');
      }
      closeModal(); render(_data);
    } catch (err) {
      showToast(err.message, 'error');
      if (btn){btn.disabled=false;btn.textContent=isNew?'Criar Produto':'Salvar Alterações';}
    }
  }

  function deleteItem(id) {
    if (!canEdit()) { showToast('Sem permissão para excluir.', 'warning'); return; }
    const p=_data.find(x=>String(x.id)===String(id)), nome=p?.produto||p?.nome||'este produto';
    confirmAction(`Excluir <strong>${esc(nome)}</strong>? Esta ação não pode ser desfeita.`, async()=>{
      try{await API.deleteEstoque(id);_data=_data.filter(x=>String(x.id)!==String(id));render(_data);showToast('Produto excluído.','success');}
      catch(err){showToast(err.message,'error');}
    });
  }

  function setBody(html) {
    const el = document.getElementById('estoqueTableBody');
    if (!el) return;
    el.innerHTML = html;
    // Bind zoom events via DOM — avoids XSS por inline handlers com dados não confiáveis
    el.querySelectorAll('img[data-imgzoom]').forEach(img => {
      img.addEventListener('mouseenter', () => Estoque._hoverStart(img, img.dataset.imgzoom));
      img.addEventListener('mouseleave', () => Estoque._hoverEnd());
    });
  }
  function esc(s){return(s||'—').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  return { init, load, openEditModal, previewImage, save, deleteItem, previewCard, imgError, _hoverStart, _hoverEnd };
})();

window.Estoque   = Estoque;
window.applyMarkdown = applyMarkdown;
