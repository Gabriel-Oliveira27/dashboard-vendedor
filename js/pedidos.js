'use strict';
/**
 * pedidos.js — Módulo de Pedidos
 */

const Pedidos = (() => {
  let _data = [];
  let _initialized = false;
  let _activePedido = null;

  const ETAPA_SEQUENCE = [
    'RESERVADO',
    'CONFIRMADO',
    'EM_PREPARO',
    'SAIU_PARA_ENTREGA',
    'ENTREGUE',
    'CANCELADO'
  ];

  const ETAPA_LABEL = {
    RESERVADO:          { label: 'Reservado',          class: 'badge-yellow' },
    CONFIRMADO:         { label: 'Confirmado',          class: 'badge-blue'   },
    EM_PREPARO:         { label: 'Em Preparo',          class: 'badge-orange' },
    SAIU_PARA_ENTREGA:  { label: 'Saiu p/ Entrega',    class: 'badge-purple' },
    ENTREGUE:           { label: 'Entregue',            class: 'badge-green'  },
    CANCELADO:          { label: 'Cancelado',           class: 'badge-red'    }
  };

  // ── Init ──────────────────────────────────────────────────────────────────
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

  // ── Load ──────────────────────────────────────────────────────────────────
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

  // ── Filters ───────────────────────────────────────────────────────────────
  function applyFilters() {
    const etapa     = document.getElementById('filterEtapa')?.value     || '';
    const pagamento = document.getElementById('filterPagamento')?.value || '';

    const filtered = _data.filter(p =>
      (!etapa     || p.etapa     === etapa)     &&
      (!pagamento || p.pagamento === pagamento)
    );
    render(filtered);
  }

  // ── Render table ──────────────────────────────────────────────────────────
  function renderSkeleton() {
    setBody(createSkeletonRows(6, 7));
  }

  function render(data) {
    if (!data.length) {
      setBody('<tr><td colspan="7" class="empty-state">Nenhum pedido encontrado.</td></tr>');
      return;
    }

    setBody(data.map(p => {
      const et = ETAPA_LABEL[p.etapa] || { label: p.etapa, class: 'badge-gray' };
      const pago = p.pagamento === 'REALIZADO';
      return `
        <tr class="table-row clickable-row" onclick="Pedidos.openPanel('${p.id}')">
          <td><code class="code-sm">${p.rastreio || p.id}</code></td>
          <td class="font-medium">${esc(p.nome || p.cliente?.nome)}</td>
          <td class="font-medium">${formatCurrency(p.totalVenda)}</td>
          <td class="td-muted">${esc(p.metodoPagamento || p.metodo)}</td>
          <td><span class="badge ${et.class}">${et.label}</span></td>
          <td>
            <span class="badge ${pago ? 'badge-green' : 'badge-yellow'}">
              ${pago ? 'Realizado' : 'Pendente'}
            </span>
          </td>
          <td class="td-muted td-date">${formatDate(p.createdAt)}</td>
        </tr>`;
    }).join(''));
  }

  // ── Detail panel ──────────────────────────────────────────────────────────
  function openPanel(id) {
    _activePedido = _data.find(p => String(p.id) === String(id));
    if (!_activePedido) return;
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
    const et  = ETAPA_LABEL[p.etapa] || { label: p.etapa, class: 'badge-gray' };
    const pago = p.pagamento === 'REALIZADO';
    const nextEtapa = getNextEtapa(p.etapa);
    const nextLabel = nextEtapa ? (ETAPA_LABEL[nextEtapa]?.label || nextEtapa) : null;

    // Itens do pedido
    const itens = Array.isArray(p.itens) ? p.itens : [];
    const itensHtml = itens.length
      ? `<ul class="order-items">${itens.map(i =>
          `<li class="order-item">
            <span class="item-name">${esc(i.nome || i.produto)}</span>
            <span class="item-qty">x${i.qtd || i.quantidade || 1}</span>
            <span class="item-price">${formatCurrency(i.valor || i.preco)}</span>
          </li>`).join('')}</ul>`
      : '<p class="td-muted">Sem itens detalhados.</p>';

    // Endereço
    const end = p.endereco || p.cliente?.endereco || {};
    const endStr = [end.logradouro, end.numero, end.complemento, end.bairro, end.cidade, end.estado]
      .filter(Boolean).join(', ') || '—';

    document.getElementById('panelBody').innerHTML = `
      <div class="panel-section">
        <h4>Cliente</h4>
        <div class="detail-grid">
          <div class="detail-row"><span>Nome</span><strong>${esc(p.nome || p.cliente?.nome)}</strong></div>
          <div class="detail-row"><span>Contato</span><strong>${esc(p.contato || p.cliente?.telefone || p.cliente?.email || '—')}</strong></div>
          <div class="detail-row"><span>Endereço</span><strong>${endStr}</strong></div>
        </div>
      </div>

      <div class="panel-section">
        <h4>Pedido <code class="code-sm">${p.rastreio || p.id}</code></h4>
        ${itensHtml}
        <div class="detail-grid mt-8">
          <div class="detail-row"><span>Frete</span><strong>${formatCurrency(p.frete)}</strong></div>
          ${p.cupom ? `<div class="detail-row"><span>Cupom</span><strong>${esc(p.cupom)}</strong></div>` : ''}
          ${p.parcelas ? `<div class="detail-row"><span>Parcelas</span><strong>${p.parcelas}x</strong></div>` : ''}
          ${p.troco  ? `<div class="detail-row"><span>Troco p/</span><strong>${formatCurrency(p.troco)}</strong></div>` : ''}
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
          <div class="detail-row">
            <span>Método</span>
            <strong>${esc(p.metodoPagamento || p.metodo || '—')}</strong>
          </div>
          <div class="detail-row">
            <span>Data</span>
            <strong>${formatDate(p.createdAt)}</strong>
          </div>
        </div>
      </div>

      <div class="panel-actions">
        ${nextLabel
          ? `<button class="btn btn-primary btn-full" onclick="Pedidos.advanceEtapa('${p.id}', '${p.etapa}')">
               Avançar → ${nextLabel}
             </button>`
          : '<button class="btn btn-ghost btn-full" disabled>Etapa final</button>'}
        ${!pago
          ? `<button class="btn btn-success btn-full" onclick="Pedidos.markAsPaid('${p.id}')">
               ✓ Marcar como Pago
             </button>`
          : '<button class="btn btn-ghost btn-full" disabled>✓ Pagamento Confirmado</button>'}
      </div>
    `;
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  function getNextEtapa(etapa) {
    const idx = ETAPA_SEQUENCE.indexOf(etapa);
    if (idx === -1 || idx >= ETAPA_SEQUENCE.length - 2) return null; // ENTREGUE e CANCELADO são finais
    return ETAPA_SEQUENCE[idx + 1];
  }

  function advanceEtapa(id, etapaAtual) {
    const proximo = getNextEtapa(etapaAtual);
    if (!proximo) return;

    const proximo_label = ETAPA_LABEL[proximo]?.label || proximo;

    // Confirmação extra ao cancelar
    if (proximo === 'CANCELADO') {
      confirmAction(
        `⚠️ Tem certeza que deseja <strong>cancelar</strong> este pedido? Esta ação não pode ser revertida.`,
        () => doAdvance(id, proximo, proximo_label)
      );
    } else {
      doAdvance(id, proximo, proximo_label);
    }
  }

  async function doAdvance(id, novaEtapa, label) {
    try {
      await API.updateEtapa(id, novaEtapa);
      const p = _data.find(x => String(x.id) === String(id));
      if (p) p.etapa = novaEtapa;
      applyFilters();
      if (_activePedido?.id == id) {
        _activePedido.etapa = novaEtapa;
        renderPanel(_activePedido);
      }
      showToast(`Etapa avançada para "${label}"!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function markAsPaid(id) {
    try {
      await API.updatePagamento(id);
      const p = _data.find(x => String(x.id) === String(id));
      if (p) p.pagamento = 'REALIZADO';
      applyFilters();
      if (_activePedido?.id == id) {
        _activePedido.pagamento = 'REALIZADO';
        renderPanel(_activePedido);
      }
      showToast('Pagamento confirmado!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function setBody(html) {
    const el = document.getElementById('pedidosTableBody');
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

  return { init, load, openPanel, closePanel, advanceEtapa, markAsPaid };
})();

window.Pedidos = Pedidos;
