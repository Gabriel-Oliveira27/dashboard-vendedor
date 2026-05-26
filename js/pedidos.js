'use strict';
/**
 * pedidos.js — Módulo de Pedidos
 *
 * Estrutura real do item em pedido.pedido (Json) — montada em checkout/page.jsx:
 *   { id: string, descricao: string, cores: string, qty: number }
 *   Nota: valor NÃO é armazenado nos itens do pedido.
 *   O preço é buscado do estoque em tempo real ao abrir o painel.
 */

const SVG_RETURN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
  <polyline points="1 4 1 10 7 10"/>
  <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
</svg>`;

const Pedidos = (() => {
  let _data = [];
  let _initialized = false;
  let _activePedido = null;
  let _precos = null; // { [estoqueId]: valor } — cache de preços do estoque

  const ETAPA_SEQUENCE = [
    'RESERVADO', 'CONFIRMADO', 'EM_PREPARO',
    'SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO',
  ];

  const ETAPA_LABEL = {
    RESERVADO:         { label: 'Reservado',       class: 'badge-yellow' },
    CONFIRMADO:        { label: 'Confirmado',       class: 'badge-blue'   },
    EM_PREPARO:        { label: 'Em Preparo',       class: 'badge-orange' },
    SAIU_PARA_ENTREGA: { label: 'Saiu p/ Entrega', class: 'badge-purple' },
    ENTREGUE:          { label: 'Entregue',         class: 'badge-green'  },
    CANCELADO:         { label: 'Cancelado',        class: 'badge-red'    },
  };

  function init() {
    if (!_initialized) {
      _initialized = true;
      document.getElementById('filterEtapa')
        ?.addEventListener('change', applyFilters);
      document.getElementById('filterPagamento')
        ?.addEventListener('change', applyFilters);
    }
    if (_data.length === 0) load();
  }

  async function load() {
    renderSkeleton();
    try {
      const res = await API.getPedidos();
      _data = Array.isArray(res) ? res : [];
      applyFilters();
    } catch (err) {
      showToast(err.message, 'error');
      setBody('<tr><td colspan="7" class="empty-state">Erro ao carregar pedidos.</td></tr>');
    }
  }

  /** Busca preços do estoque uma única vez e cacheia */
  async function carregarPrecos() {
    if (_precos !== null) return;
    try {
      const estoque = await API.getEstoque();
      _precos = Object.fromEntries(
        (Array.isArray(estoque) ? estoque : []).map(p => [String(p.id), parseFloat(p.valor) || 0])
      );
    } catch (_) {
      _precos = {};
    }
  }

  function applyFilters() {
    const etapa     = document.getElementById('filterEtapa')?.value     || '';
    const pagamento = document.getElementById('filterPagamento')?.value || '';
    render(_data.filter(p =>
      (!etapa     || p.etapa     === etapa)     &&
      (!pagamento || p.pagamento === pagamento)
    ));
  }

  function renderSkeleton() { setBody(createSkeletonRows(6, 7)); }

  function render(data) {
    if (!data.length) {
      setBody('<tr><td colspan="7" class="empty-state">Nenhum pedido encontrado.</td></tr>');
      return;
    }
    setBody(data.map(p => {
      const et   = ETAPA_LABEL[p.etapa] || { label: p.etapa, class: 'badge-gray' };
      const pago = p.pagamento === 'REALIZADO';
      return `
        <tr class="table-row clickable-row" onclick="Pedidos.openPanel('${p.id}')">
          <td><code class="code-sm">${esc(p.idRastreio || p.id)}</code></td>
          <td class="font-medium">${esc(p.nome)}</td>
          <td class="font-medium">${formatCurrency(p.totalVenda)}</td>
          <td class="td-muted">${esc(p.metodoPagamento)}</td>
          <td><span class="badge ${et.class}">${et.label}</span></td>
          <td><span class="badge ${pago ? 'badge-green' : 'badge-yellow'}">${pago ? 'Realizado' : 'Pendente'}</span></td>
          <td class="td-muted td-date">${formatDate(p.dataCompra)}</td>
        </tr>`;
    }).join(''));
  }

  async function openPanel(id) {
    _activePedido = _data.find(p => String(p.id) === String(id));
    if (!_activePedido) return;

    // Busca preços do estoque antes de renderizar (apenas na primeira vez)
    await carregarPrecos();

    renderPanel(_activePedido);
    document.getElementById('detailPanel').classList.add('open');
    document.getElementById('panelOverlay').classList.add('visible');
    document.body.classList.add('no-scroll');
  }

  function closePanel() {
    document.getElementById('detailPanel').classList.remove('open');
    document.getElementById('panelOverlay').classList.remove('visible');
    document.body.classList.remove('no-scroll');
    _activePedido = null;
  }

  function renderPanel(p) {
    const et        = ETAPA_LABEL[p.etapa] || { label: p.etapa, class: 'badge-gray' };
    const pago      = p.pagamento === 'REALIZADO';
    const cancelado = p.etapa === 'CANCELADO';
    const nextEtapa = getNextEtapa(p.etapa);
    const nextLabel = nextEtapa ? (ETAPA_LABEL[nextEtapa]?.label || nextEtapa) : null;

    // Permissão de edição para pedidos
    const podEditar = Auth.isAdmin() || Auth.canEdit('pedidos');

    // Itens: { id: string, descricao, cores, qty }
    const itens = Array.isArray(p.pedido) ? p.pedido : [];
    const itensHtml = itens.length
      ? `<ul class="order-items">${itens.map(i => {
          // Busca preço do estoque pelo id do item
          const preco = (_precos && _precos[String(i.id)]) || 0;
          const total = preco * (i.qty || 1);
          return `
          <li class="order-item">
            <span class="item-name">${esc(i.descricao)}</span>
            ${i.cores ? `<span class="item-qty" style="color:var(--text-dim)">${esc(i.cores)}</span>` : ''}
            <span class="item-qty">x${i.qty}</span>
            <span class="item-price">${preco > 0 ? formatCurrency(total) : '—'}</span>
          </li>`;
        }).join('')}</ul>`
      : '<p class="td-muted" style="font-size:.85rem">Sem itens detalhados.</p>';

    document.getElementById('panelBody').innerHTML = `
      <div class="panel-section">
        <h4>Cliente</h4>
        <div class="detail-grid">
          <div class="detail-row"><span>Nome</span><strong>${esc(p.nome)}</strong></div>
          <div class="detail-row"><span>Contato</span><strong>${esc(p.contato || '—')}</strong></div>
          <div class="detail-row"><span>Endereço</span><strong>${esc(p.endereco || '—')}</strong></div>
        </div>
      </div>

      <div class="panel-section">
        <h4>Pedido <code class="code-sm">${esc(p.idRastreio || p.id)}</code></h4>
        ${itensHtml}
        <div class="detail-grid mt-8">
          <div class="detail-row"><span>Subtotal</span><strong>${formatCurrency(p.subtotal)}</strong></div>
          <div class="detail-row"><span>Frete</span><strong>${formatCurrency(p.frete)}</strong></div>
          ${p.cupom      ? `<div class="detail-row"><span>Cupom</span><strong>${esc(p.cupom)}</strong></div>` : ''}
          ${p.parcelas && p.parcelas > 1 ? `<div class="detail-row"><span>Parcelas</span><strong>${p.parcelas}x</strong></div>` : ''}
          ${p.trocoPara  ? `<div class="detail-row"><span>Troco p/</span><strong>${formatCurrency(p.trocoPara)}</strong></div>` : ''}
          <div class="detail-row total-row"><span>Total</span><strong>${formatCurrency(p.totalVenda)}</strong></div>
        </div>
      </div>

      <div class="panel-section">
        <h4>Status</h4>
        <div class="detail-grid">
          <div class="detail-row">
            <span>Etapa</span>
            <strong><span class="badge ${et.class}">${et.label}</span></strong>
          </div>
          <div class="detail-row">
            <span>Pagamento</span>
            <strong><span class="badge ${pago ? 'badge-green' : 'badge-yellow'}">${pago ? 'Realizado' : 'Pendente'}</span></strong>
          </div>
          <div class="detail-row"><span>Método</span><strong>${esc(p.metodoPagamento || '—')}</strong></div>
          <div class="detail-row"><span>Data</span><strong>${formatDate(p.dataCompra)}</strong></div>
        </div>
      </div>

      <div class="panel-actions">
        ${cancelado
          ? `<div style="text-align:center;padding:.5rem;font-size:.85rem;color:var(--text-dim)">
               Pedido cancelado — nenhuma ação disponível.
             </div>`
          : podEditar
            ? `
              ${nextLabel
                ? `<button class="btn btn-primary btn-full" onclick="Pedidos.advanceEtapa('${p.id}', '${p.etapa}')">
                     Avançar para ${nextLabel}
                   </button>`
                : '<button class="btn btn-ghost btn-full" disabled>Etapa final</button>'}

              ${!pago
                ? `<button class="btn btn-success btn-full" onclick="Pedidos.markAsPaid('${p.id}')">
                     Marcar como Pago
                   </button>`
                : '<button class="btn btn-ghost btn-full" disabled>Pagamento Confirmado</button>'}

              <button class="btn btn-danger btn-full" onclick="Pedidos.devolucao('${p.id}')">
                ${SVG_RETURN} Registrar Devolução
              </button>`
            : `<div style="text-align:center;padding:.5rem;font-size:.85rem;color:var(--text-dim)">
                 Você tem acesso somente de visualização.
               </div>`
        }
      </div>
    `;
  }

  function getNextEtapa(etapa) {
    const idx = ETAPA_SEQUENCE.indexOf(etapa);
    if (idx === -1 || idx >= ETAPA_SEQUENCE.length - 2) return null;
    return ETAPA_SEQUENCE[idx + 1];
  }

  function advanceEtapa(id, etapaAtual) {
    const proximo = getNextEtapa(etapaAtual);
    if (!proximo) return;
    const label = ETAPA_LABEL[proximo]?.label || proximo;
    if (proximo === 'CANCELADO') {
      confirmAction(`Tem certeza que deseja <strong>cancelar</strong> este pedido?`, () => doAdvance(id, proximo, label));
    } else {
      doAdvance(id, proximo, label);
    }
  }

  async function doAdvance(id, novaEtapa, label) {
    try {
      await API.updateEtapa(id, novaEtapa);
      const p = _data.find(x => String(x.id) === String(id));
      if (p) p.etapa = novaEtapa;
      applyFilters();
      if (_activePedido?.id == id) { _activePedido.etapa = novaEtapa; renderPanel(_activePedido); }
      showToast(`Etapa avançada para "${label}".`, 'success');
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function markAsPaid(id) {
    try {
      await API.updatePagamento(id);
      const p = _data.find(x => String(x.id) === String(id));
      if (p) p.pagamento = 'REALIZADO';
      applyFilters();
      if (_activePedido?.id == id) { _activePedido.pagamento = 'REALIZADO'; renderPanel(_activePedido); }
      showToast('Pagamento confirmado!', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  }

  function devolucao(id) {
    const p     = _data.find(x => String(x.id) === String(id));
    const itens = Array.isArray(p?.pedido) ? p.pedido : [];

    const listaHtml = itens.length
      ? `<ul style="margin:.6rem 0 0;padding-left:1.25rem;font-size:.85rem;color:var(--text-muted);line-height:1.8">
           ${itens.map(i => `<li>${esc(i.descricao)} — <strong>x${i.qty}</strong></li>`).join('')}
         </ul>`
      : '';

    confirmAction(
      `Registrar <strong>devolução</strong> deste pedido?<br>
       O estoque de cada produto será restaurado automaticamente.${listaHtml}`,
      async () => {
        try {
          await API.devolucao(id);
          const pedido = _data.find(x => String(x.id) === String(id));
          if (pedido) pedido.etapa = 'CANCELADO';
          applyFilters();
          if (_activePedido?.id == id) { _activePedido.etapa = 'CANCELADO'; renderPanel(_activePedido); }
          showToast('Devolução registrada e estoque restaurado.', 'success');
        } catch (err) { showToast(err.message, 'error'); }
      }
    );
  }

  function setBody(html) { const el = document.getElementById('pedidosTableBody'); if (el) el.innerHTML = html; }

  function esc(str) {
    return (str || '—').toString()
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { init, load, openPanel, closePanel, advanceEtapa, markAsPaid, devolucao };
})();

window.Pedidos = Pedidos;
