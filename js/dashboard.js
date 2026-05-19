'use strict';
/**
 * dashboard.js — Controlador principal do painel
 * Gerencia: guard de autenticação, navegação, toasts,
 * módulo Visão Geral, módulo Relatório e sistema de modais.
 */

// ════════════════════════════════════════════════════════════════════════════
// GUARD — deve ser o primeiro código executado
// ════════════════════════════════════════════════════════════════════════════
if (!Auth.requireAuth()) {
  // requireAuth já redireciona; throw impede execução do restante
  throw new Error('Sessão inválida ou expirada.');
}

// ════════════════════════════════════════════════════════════════════════════
// UTILITÁRIOS GLOBAIS (acessíveis pelos módulos)
// ════════════════════════════════════════════════════════════════════════════
function formatCurrency(value) {
  return (parseFloat(value) || 0).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL'
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return String(dateStr);
  return d.toLocaleDateString('pt-BR') + ' ' +
         d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function isToday(dateStr) {
  const d = new Date(dateStr), n = new Date();
  return d.getDate() === n.getDate() &&
         d.getMonth() === n.getMonth() &&
         d.getFullYear() === n.getFullYear();
}

function isThisMonth(dateStr) {
  const d = new Date(dateStr), n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

function createSkeletonRows(rows, cols) {
  let html = '';
  for (let r = 0; r < rows; r++) {
    html += '<tr class="skeleton-row">';
    for (let c = 0; c < cols; c++)
      html += '<td><div class="skeleton-line"></div></td>';
    html += '</tr>';
  }
  return html;
}

function createSkeletonCards(n) {
  let html = '';
  for (let i = 0; i < n; i++)
    html += `<div class="overview-card skeleton-card">
               <div class="skeleton-line w50"></div>
               <div class="skeleton-line w35 mt-8"></div>
             </div>`;
  return html;
}

// Expõe globalmente para os módulos
window.formatCurrency   = formatCurrency;
window.formatDate       = formatDate;
window.isToday          = isToday;
window.isThisMonth      = isThisMonth;
window.createSkeletonRows  = createSkeletonRows;
window.createSkeletonCards = createSkeletonCards;

// ════════════════════════════════════════════════════════════════════════════
// TOASTS
// ════════════════════════════════════════════════════════════════════════════
const TOAST_ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || 'ℹ'}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Fechar">✕</button>`;
  container.appendChild(toast);

  // Força reflow para animar entrada
  requestAnimationFrame(() => toast.classList.add('toast-in'));

  setTimeout(() => {
    toast.classList.remove('toast-in');
    toast.classList.add('toast-out');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3200);
}

window.showToast = showToast;

// ════════════════════════════════════════════════════════════════════════════
// MODAL SYSTEM
// ════════════════════════════════════════════════════════════════════════════
function openModal(html) {
  document.getElementById('modalContainer').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('visible');
  document.body.classList.add('no-scroll');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('visible');
  document.body.classList.remove('no-scroll');
}

function confirmAction(message, onConfirm) {
  openModal(`
    <div class="modal-card confirm-card">
      <div class="modal-header">
        <h3>Confirmar</h3>
        <button class="btn-icon" onclick="closeModal()" aria-label="Fechar">✕</button>
      </div>
      <div class="modal-body">
        <p class="confirm-msg">${message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-danger" id="btnConfirmOk">Confirmar</button>
      </div>
    </div>
  `);
  document.getElementById('btnConfirmOk').addEventListener('click', () => {
    closeModal();
    onConfirm();
  });
}

window.openModal    = openModal;
window.closeModal   = closeModal;
window.confirmAction = confirmAction;

// ════════════════════════════════════════════════════════════════════════════
// NAVEGAÇÃO
// ════════════════════════════════════════════════════════════════════════════
const SECTION_TITLES = {
  overview:  'Visão Geral',
  estoque:   'Estoque',
  pedidos:   'Pedidos',
  cupons:    'Cupons',
  pix:       'Chave PIX',
  relatorio: 'Relatório'
};

let _activeSection = null;

function navigateTo(section) {
  if (_activeSection === section) { closeSidebar(); return; }

  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('[data-section]').forEach(el => el.classList.remove('active'));

  const target = document.getElementById(`section-${section}`);
  if (target) target.classList.add('active');

  document.querySelectorAll(`[data-section="${section}"]`).forEach(el => el.classList.add('active'));
  document.getElementById('pageTitle').textContent = SECTION_TITLES[section] || section;

  _activeSection = section;
  closeSidebar();
  initSection(section);
}

function initSection(section) {
  switch (section) {
    case 'overview':  loadOverview();  break;
    case 'estoque':   Estoque.init();  break;
    case 'pedidos':   Pedidos.init();  break;
    case 'cupons':    Cupons.init();   break;
    case 'pix':       Pix.init();      break;
    case 'relatorio': loadRelatorio(); break;
  }
}

window.navigateTo = navigateTo;

// ════════════════════════════════════════════════════════════════════════════
// SIDEBAR / MOBILE
// ════════════════════════════════════════════════════════════════════════════
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('visible');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('visible');
}

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO: VISÃO GERAL
// ════════════════════════════════════════════════════════════════════════════
let _pedidosCache = null;
let _estoqueCache = null;

async function loadOverview() {
  document.getElementById('overviewCards').innerHTML = createSkeletonCards(4);
  document.getElementById('lowStockList').innerHTML =
    '<div class="skeleton-line" style="max-width:300px"></div>';

  try {
    const [pedidos, estoque] = await Promise.all([
      API.getPedidos(),
      API.getEstoque()
    ]);
    _pedidosCache = Array.isArray(pedidos) ? pedidos : [];
    _estoqueCache = Array.isArray(estoque) ? estoque : [];
    renderOverview(_pedidosCache, _estoqueCache);
  } catch (err) {
    showToast(err.message, 'error');
    document.getElementById('overviewCards').innerHTML =
      '<p class="empty-state">Falha ao carregar dados.</p>';
  }
}

function renderOverview(pedidos, estoque) {
  const hoje      = pedidos.filter(p => isToday(p.createdAt));
  const pendentes = pedidos.filter(p =>
    p.pagamento !== 'REALIZADO' && p.etapa !== 'CANCELADO'
  );
  const totalHoje = hoje.reduce((s, p) => s + (parseFloat(p.totalVenda) || 0), 0);
  const totalMes  = pedidos
    .filter(p => isThisMonth(p.createdAt))
    .reduce((s, p) => s + (parseFloat(p.totalVenda) || 0), 0);
  const baixo = estoque.filter(e => (parseInt(e.qtd) || 0) < 5);

  document.getElementById('overviewCards').innerHTML = `
    <div class="overview-card">
      <div class="card-icon icon-blue">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
      </div>
      <div class="card-info">
        <span class="card-label">Pedidos Hoje</span>
        <span class="card-value">${hoje.length}</span>
      </div>
    </div>

    <div class="overview-card">
      <div class="card-icon icon-red">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div class="card-info">
        <span class="card-label">Pagtos. Pendentes</span>
        <span class="card-value">
          ${pendentes.length}
          ${pendentes.length > 0 ? '<span class="badge badge-red pulse">!</span>' : ''}
        </span>
      </div>
    </div>

    <div class="overview-card">
      <div class="card-icon icon-green">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      </div>
      <div class="card-info">
        <span class="card-label">Vendas Hoje</span>
        <span class="card-value">${formatCurrency(totalHoje)}</span>
      </div>
    </div>

    <div class="overview-card">
      <div class="card-icon icon-purple">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      </div>
      <div class="card-info">
        <span class="card-label">Vendas no Mês</span>
        <span class="card-value">${formatCurrency(totalMes)}</span>
      </div>
    </div>
  `;

  // Lista de estoque baixo
  const el = document.getElementById('lowStockList');
  if (!baixo.length) {
    el.innerHTML = '<p class="empty-state-small">✓ Todos os produtos com estoque adequado.</p>';
  } else {
    el.innerHTML = baixo.map(p => `
      <div class="low-stock-item">
        <span class="low-stock-name">${p.nome || '—'}</span>
        <span class="badge badge-red">${p.qtd} un</span>
      </div>`).join('');
  }
}

window.loadOverview = loadOverview;

// ════════════════════════════════════════════════════════════════════════════
// MÓDULO: RELATÓRIO
// ════════════════════════════════════════════════════════════════════════════
async function loadRelatorio() {
  const el = document.getElementById('relatorioContainer');
  el.innerHTML = '<div class="overview-grid">' + createSkeletonCards(3) + '</div>';

  try {
    let pedidos = _pedidosCache;
    if (!pedidos) {
      pedidos = await API.getPedidos();
      _pedidosCache = Array.isArray(pedidos) ? pedidos : [];
    }
    renderRelatorio(_pedidosCache);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderRelatorio(pedidos) {
  const pagos    = pedidos.filter(p => p.pagamento === 'REALIZADO');
  const pagosMes = pagos.filter(p => isThisMonth(p.createdAt));
  const total    = pagos.reduce((s, p) => s + (parseFloat(p.totalVenda) || 0), 0);
  const totalMes = pagosMes.reduce((s, p) => s + (parseFloat(p.totalVenda) || 0), 0);
  const ticket   = pagos.length ? total / pagos.length : 0;

  document.getElementById('relatorioContainer').innerHTML = `
    <div class="overview-grid">
      <div class="overview-card">
        <div class="card-icon icon-green">💰</div>
        <div class="card-info">
          <span class="card-label">Lucro Total</span>
          <span class="card-value">${formatCurrency(total)}</span>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon icon-purple">📅</div>
        <div class="card-info">
          <span class="card-label">Lucro do Mês</span>
          <span class="card-value">${formatCurrency(totalMes)}</span>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon icon-blue">🎯</div>
        <div class="card-info">
          <span class="card-label">Ticket Médio</span>
          <span class="card-value">${formatCurrency(ticket)}</span>
        </div>
      </div>
    </div>

    <div class="chart-card">
      <div class="chart-header">
        <h3 class="chart-title">Vendas — Últimos 14 Dias</h3>
      </div>
      <div class="chart-wrapper">
        <canvas id="salesChart"></canvas>
      </div>
    </div>
  `;

  // Aguarda renderização para pegar tamanho correto do canvas
  requestAnimationFrame(() => drawChart(pagos));
}

function drawChart(pedidos) {
  const canvas = document.getElementById('salesChart');
  if (!canvas) return;

  // Build last 14 days
  const days = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, label: `${d.getDate()}/${d.getMonth() + 1}`, total: 0 });
  }
  pedidos.forEach(p => {
    const key = new Date(p.createdAt).toISOString().slice(0, 10);
    const day = days.find(d => d.key === key);
    if (day) day.total += parseFloat(p.totalVenda) || 0;
  });

  // Canvas dimensions
  const W = canvas.offsetWidth || 600;
  const H = 220;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const pad   = { top: 24, right: 16, bottom: 44, left: 64 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top  - pad.bottom;
  const maxVal = Math.max(...days.map(d => d.total), 100);
  const barW   = Math.max(8, (chartW / days.length) * 0.55);
  const gap    = chartW / days.length;

  // Colours (match CSS theme)
  const C_GRID  = '#2a2a38';
  const C_TEXT  = '#6b6b88';
  const C_BAR   = '#7c3aed';
  const C_BAR_H = '#9d5cf6';

  ctx.clearRect(0, 0, W, H);

  // Grid + Y labels
  const ySteps = 4;
  for (let i = 0; i <= ySteps; i++) {
    const y = pad.top + (chartH / ySteps) * i;
    ctx.strokeStyle = C_GRID;
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.setLineDash([]);

    const val = maxVal - (maxVal / ySteps) * i;
    ctx.fillStyle  = C_TEXT;
    ctx.font       = '11px system-ui, sans-serif';
    ctx.textAlign  = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(shortCurrency(val), pad.left - 6, y);
  }

  // Bars + X labels
  days.forEach((day, i) => {
    const barH = Math.max(2, (day.total / maxVal) * chartH);
    const x    = pad.left + gap * i + (gap - barW) / 2;
    const y    = pad.top + chartH - barH;

    // Bar with rounded top
    ctx.fillStyle = day.total > 0 ? C_BAR : C_GRID;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();

    // X label (every other day on small screens)
    if (W < 500 && i % 2 !== 0) return;
    ctx.fillStyle    = C_TEXT;
    ctx.font         = '10px system-ui, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(day.label, x + barW / 2, H - pad.bottom + 8);
  });
}

function shortCurrency(v) {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$${Math.round(v)}`;
}

window.loadRelatorio = loadRelatorio;

// ════════════════════════════════════════════════════════════════════════════
// BOOTSTRAP
// ════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Exibe nome do usuário na sidebar
  const info = Auth.getUserInfo();
  const userEl = document.getElementById('sidebarUserName');
  if (userEl && info) userEl.textContent = info.nome || info.sub || 'Vendedor';

  // Nav items
  document.querySelectorAll('[data-section]').forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); navigateTo(el.dataset.section); });
  });

  // Hamburger (mobile)
  document.getElementById('hamburger')
    ?.addEventListener('click', toggleSidebar);

  // Overlays fecham painéis
  document.getElementById('sidebarOverlay')
    ?.addEventListener('click', closeSidebar);

  document.getElementById('modalOverlay')
    ?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });

  document.getElementById('panelOverlay')
    ?.addEventListener('click', () => Pedidos.closePanel());

  // Fechar painel lateral
  document.getElementById('btnClosePanel')
    ?.addEventListener('click', () => Pedidos.closePanel());

  // Logout
  document.getElementById('btnLogout')
    ?.addEventListener('click', () => Auth.logout());

  // Seção inicial
  navigateTo('overview');
});
