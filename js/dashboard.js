'use strict';
/**
 * dashboard.js — Controlador principal
 * Auth via cookie httpOnly. Controle de visibilidade por permissões.
 */

(function () {
  const t = localStorage.getItem('sublime-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

// ── GUARD ASSÍNCRONO ─────────────────────────────────────────────────────────
// requireAuth() valida o cookie no servidor se não houver sessão local
Auth.requireAuth().then(ok => { if (!ok) throw new Error('Não autenticado'); });

// ── ÍCONES ───────────────────────────────────────────────────────────────────
const ICONS = {
  orders:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>`,
  alert:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  dollar:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  monitor:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  trending: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  target:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  check:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>`,
  x:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  warning:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  close:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  sun:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  moon:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
};

// ── UTILITÁRIOS GLOBAIS ───────────────────────────────────────────────────────
function formatCurrency(v) {
  return (parseFloat(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function isToday(d)     { const a = new Date(d), n = new Date(); return a.getDate()===n.getDate() && a.getMonth()===n.getMonth() && a.getFullYear()===n.getFullYear(); }
function isThisMonth(d) { const a = new Date(d), n = new Date(); return a.getMonth()===n.getMonth() && a.getFullYear()===n.getFullYear(); }

function createSkeletonRows(r, c) {
  let h = '';
  for (let i=0;i<r;i++) { h+='<tr class="skeleton-row">'; for(let j=0;j<c;j++) h+='<td><div class="skeleton-line"></div></td>'; h+='</tr>'; }
  return h;
}
function createSkeletonCards(n) {
  let h='';
  for(let i=0;i<n;i++) h+=`<div class="overview-card skeleton-card"><div class="skeleton-line w50"></div><div class="skeleton-line w35 mt-8"></div></div>`;
  return h;
}

window.formatCurrency     = formatCurrency;
window.formatDate         = formatDate;
window.isToday            = isToday;
window.isThisMonth        = isThisMonth;
window.createSkeletonRows = createSkeletonRows;
window.createSkeletonCards= createSkeletonCards;

// ── THEME ────────────────────────────────────────────────────────────────────
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('sublime-theme', t);
  const btn = document.getElementById('themeToggle');
  if (btn) { btn.innerHTML = t==='dark' ? ICONS.sun : ICONS.moon; btn.title = t==='dark' ? 'Modo claro' : 'Modo escuro'; }
}
function toggleTheme() { setTheme(document.documentElement.getAttribute('data-theme')==='dark' ? 'light' : 'dark'); }

// ── TOASTS ───────────────────────────────────────────────────────────────────
const TOAST_META = {
  success: { icon: ICONS.check,   title: 'Sucesso'    },
  error:   { icon: ICONS.x,       title: 'Erro'       },
  warning: { icon: ICONS.warning, title: 'Atenção'    },
  info:    { icon: ICONS.info,    title: 'Informação' },
};

function showToast(message, type='info') {
  const c    = document.getElementById('toastContainer');
  const meta = TOAST_META[type] || TOAST_META.info;
  const el   = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <div class="toast-icon">${meta.icon}</div>
    <div class="toast-body">
      <div class="toast-title">${meta.title}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close">${ICONS.close}</button>`;
  el.querySelector('.toast-close').onclick = () => dismissToast(el);
  c.appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast-in'));
  setTimeout(() => dismissToast(el), 3500);
}
function dismissToast(el) {
  if (!el.isConnected) return;
  el.classList.remove('toast-in'); el.classList.add('toast-out');
  el.addEventListener('transitionend', () => el.remove(), { once: true });
}
window.showToast = showToast;

// ── MODAL ────────────────────────────────────────────────────────────────────
function openModal(html) {
  document.getElementById('modalContainer').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('visible');
  document.body.classList.add('no-scroll');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('visible');
  document.body.classList.remove('no-scroll');
}
function confirmAction(msg, onConfirm) {
  openModal(`
    <div class="modal-card confirm-card">
      <div class="modal-header"><h3>Confirmar</h3><button class="btn-icon" onclick="closeModal()">${ICONS.close}</button></div>
      <div class="modal-body"><p class="confirm-msg">${msg}</p></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-danger" id="btnConfirmOk">Confirmar</button>
      </div>
    </div>`);
  document.getElementById('btnConfirmOk').onclick = () => { closeModal(); onConfirm(); };
}
window.openModal     = openModal;
window.closeModal    = closeModal;
window.confirmAction = confirmAction;

// ── NAVEGAÇÃO ────────────────────────────────────────────────────────────────
const SECTION_TITLES = {
  overview:'Visão Geral', estoque:'Estoque', pedidos:'Pedidos',
  cupons:'Cupons', config:'Configurações de Vendas', relatorio:'Relatório', usuarios:'Usuários',
};

let _active = null;

function navigateTo(section) {
  // Verifica permissão antes de navegar
  if (section !== 'overview' && section !== 'relatorio') {
    const secaoMap = { estoque:'estoque', pedidos:'pedidos', cupons:'cupons', config:'config', usuarios:'usuarios' };
    const chave = secaoMap[section];
    if (chave && !Auth.canView(chave) && !Auth.isAdmin()) {
      showToast('Você não tem permissão para acessar esta seção.', 'warning');
      return;
    }
  }

  if (_active === section) { closeSidebar(); return; }
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('[data-section]').forEach(e => e.classList.remove('active'));
  document.getElementById(`section-${section}`)?.classList.add('active');
  document.querySelectorAll(`[data-section="${section}"]`).forEach(e => e.classList.add('active'));
  document.getElementById('pageTitle').textContent = SECTION_TITLES[section] || section;
  _active = section;
  closeSidebar();

  switch(section) {
    case 'overview':  loadOverview();  break;
    case 'estoque':   Estoque.init();  break;
    case 'pedidos':   Pedidos.init();  break;
    case 'cupons':    Cupons.init();   break;
    case 'config':    Config.init();   break;
    case 'relatorio': loadRelatorio(); break;
    case 'usuarios':  Usuarios.init(); break;
  }
}
window.navigateTo = navigateTo;

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebarOverlay').classList.toggle('visible'); }
function closeSidebar()  { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('visible'); }

// ── VISÃO GERAL ───────────────────────────────────────────────────────────────
let _pedidosCache = null, _estoqueCache = null;

async function loadOverview() {
  document.getElementById('overviewCards').innerHTML = createSkeletonCards(4);
  document.getElementById('lowStockList').innerHTML  = '<div class="skeleton-line" style="max-width:300px"></div>';
  try {
    const [pedidos, estoque] = await Promise.all([API.getPedidos(), API.getEstoque()]);
    _pedidosCache = Array.isArray(pedidos) ? pedidos : [];
    _estoqueCache = Array.isArray(estoque) ? estoque : [];
    renderOverview(_pedidosCache, _estoqueCache);
  } catch (err) {
    showToast(err.message, 'error');
    document.getElementById('overviewCards').innerHTML = '<p class="empty-state">Falha ao carregar dados.</p>';
  }
}

function renderOverview(pedidos, estoque) {
  const hoje      = pedidos.filter(p => isToday(p.dataCompra));
  const pendentes = pedidos.filter(p => p.pagamento !== 'REALIZADO' && p.etapa !== 'CANCELADO');
  const totalHoje = hoje.reduce((s,p) => s + (parseFloat(p.totalVenda)||0), 0);
  const totalMes  = pedidos.filter(p => isThisMonth(p.dataCompra)).reduce((s,p) => s + (parseFloat(p.totalVenda)||0), 0);
  const baixo     = estoque.filter(e => (parseInt(e.qtd)||0) < 5);

  document.getElementById('overviewCards').innerHTML = `
    <div class="overview-card"><div class="card-icon icon-blue">${ICONS.orders}</div><div class="card-info"><span class="card-label">Pedidos Hoje</span><span class="card-value">${hoje.length}</span></div></div>
    <div class="overview-card"><div class="card-icon icon-red">${ICONS.alert}</div><div class="card-info"><span class="card-label">Pagtos. Pendentes</span><span class="card-value">${pendentes.length}${pendentes.length>0?'<span class="badge badge-red pulse">!</span>':''}</span></div></div>
    <div class="overview-card"><div class="card-icon icon-green">${ICONS.dollar}</div><div class="card-info"><span class="card-label">Vendas Hoje</span><span class="card-value">${formatCurrency(totalHoje)}</span></div></div>
    <div class="overview-card"><div class="card-icon icon-purple">${ICONS.monitor}</div><div class="card-info"><span class="card-label">Vendas no Mês</span><span class="card-value">${formatCurrency(totalMes)}</span></div></div>`;

  const el = document.getElementById('lowStockList');
  el.innerHTML = !baixo.length
    ? '<p class="empty-state-small">Todos os produtos com estoque adequado.</p>'
    : baixo.map(p=>`<div class="low-stock-item"><span class="low-stock-name">${p.produto||p.nome||'—'}</span><span class="badge badge-red">${p.qtd} un</span></div>`).join('');
}
window.loadOverview = loadOverview;

// ── RELATÓRIO ─────────────────────────────────────────────────────────────────
async function loadRelatorio() {
  const el = document.getElementById('relatorioContainer');
  el.innerHTML = '<div class="overview-grid">' + createSkeletonCards(3) + '</div>';
  try {
    if (!_pedidosCache) { const r = await API.getPedidos(); _pedidosCache = Array.isArray(r) ? r : []; }
    renderRelatorio(_pedidosCache);
  } catch (err) { showToast(err.message, 'error'); }
}

function renderRelatorio(pedidos) {
  const pagos   = pedidos.filter(p => p.pagamento === 'REALIZADO');
  const total   = pagos.reduce((s,p) => s+(parseFloat(p.totalVenda)||0), 0);
  const totalMes= pagos.filter(p => isThisMonth(p.dataCompra)).reduce((s,p) => s+(parseFloat(p.totalVenda)||0), 0);
  const ticket  = pagos.length ? total/pagos.length : 0;

  document.getElementById('relatorioContainer').innerHTML = `
    <div class="overview-grid">
      <div class="overview-card"><div class="card-icon icon-green">${ICONS.trending}</div><div class="card-info"><span class="card-label">Lucro Total</span><span class="card-value">${formatCurrency(total)}</span></div></div>
      <div class="overview-card"><div class="card-icon icon-purple">${ICONS.calendar}</div><div class="card-info"><span class="card-label">Lucro do Mês</span><span class="card-value">${formatCurrency(totalMes)}</span></div></div>
      <div class="overview-card"><div class="card-icon icon-blue">${ICONS.target}</div><div class="card-info"><span class="card-label">Ticket Médio</span><span class="card-value">${formatCurrency(ticket)}</span></div></div>
    </div>
    <div class="chart-card"><div class="chart-header"><h3 class="chart-title">Vendas — Últimos 14 Dias</h3></div><div class="chart-wrapper"><canvas id="salesChart"></canvas></div></div>`;

  requestAnimationFrame(() => drawChart(pagos));
}

function drawChart(pedidos) {
  const canvas = document.getElementById('salesChart');
  if (!canvas) return;
  const days = [];
  const now  = new Date();
  for (let i=13;i>=0;i--) { const d=new Date(now); d.setDate(d.getDate()-i); const k=d.toISOString().slice(0,10); days.push({key:k,label:`${d.getDate()}/${d.getMonth()+1}`,total:0}); }
  pedidos.forEach(p => { const k=new Date(p.dataCompra).toISOString().slice(0,10); const d=days.find(x=>x.key===k); if(d) d.total+=parseFloat(p.totalVenda)||0; });
  const W=canvas.offsetWidth||600, H=220;
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  const isLight=document.documentElement.getAttribute('data-theme')==='light';
  const C_GRID=isLight?'#dddde8':'#2a2a38', C_TEXT=isLight?'#9090b8':'#6b6b88', C_BAR='#7c3aed';
  const pad={top:24,right:16,bottom:44,left:64};
  const cW=W-pad.left-pad.right, cH=H-pad.top-pad.bottom;
  const maxV=Math.max(...days.map(d=>d.total),100);
  const barW=Math.max(8,(cW/days.length)*0.55), gap=cW/days.length;
  ctx.clearRect(0,0,W,H);
  for(let i=0;i<=4;i++) {
    const y=pad.top+(cH/4)*i;
    ctx.strokeStyle=C_GRID; ctx.lineWidth=1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(pad.left,y); ctx.lineTo(W-pad.right,y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=C_TEXT; ctx.font='11px system-ui'; ctx.textAlign='right'; ctx.textBaseline='middle';
    ctx.fillText((maxV-(maxV/4)*i)>=1000?`R$${((maxV-(maxV/4)*i)/1000).toFixed(1)}k`:`R$${Math.round(maxV-(maxV/4)*i)}`,pad.left-6,y);
  }
  days.forEach((d,i) => {
    const bH=Math.max(2,(d.total/maxV)*cH), x=pad.left+gap*i+(gap-barW)/2, y=pad.top+cH-bH;
    ctx.fillStyle=d.total>0?C_BAR:C_GRID; ctx.beginPath(); ctx.roundRect(x,y,barW,bH,[4,4,0,0]); ctx.fill();
    if(W<500&&i%2!==0) return;
    ctx.fillStyle=C_TEXT; ctx.font='10px system-ui'; ctx.textAlign='center'; ctx.textBaseline='top';
    ctx.fillText(d.label,x+barW/2,H-pad.bottom+8);
  });
}
window.loadRelatorio = loadRelatorio;

// ── BOOTSTRAP ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const user = Auth.getUser();

  // Avatar + nome na sidebar
  const nameEl    = document.getElementById('sidebarUserName');
  const avatarImg = document.getElementById('sidebarAvatarImg');
  const initials  = document.getElementById('sidebarAvatarInitials');

  if (nameEl && user) nameEl.textContent = user.nome || user.apelido || 'Usuário';

  if (user?.foto && avatarImg) {
    avatarImg.src     = user.foto;
    avatarImg.style.display = 'block';
    if (initials) initials.style.display = 'none';
  } else if (initials && user) {
    initials.textContent = (user.nome||'?').split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase();
  }

  // Mostra nav de Usuários apenas para Admin
  if (Auth.isAdmin()) {
    document.getElementById('navUsuarios')?.style.removeProperty('display');
  }

  // Esconde nav items sem permissão (não-admin)
  if (!Auth.isAdmin()) {
    const mapSection = { config:'config', cupons:'cupons' };
    Object.entries(mapSection).forEach(([sec, chave]) => {
      if (!Auth.canView(chave)) {
        document.querySelectorAll(`[data-section="${sec}"]`).forEach(el => el.style.display = 'none');
      }
    });
  }

  // Tema
  setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

  // Nav
  document.querySelectorAll('[data-section]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.section); });
  });

  // Hamburger
  document.getElementById('hamburger')?.addEventListener('click', toggleSidebar);
  document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);
  document.getElementById('modalOverlay')?.addEventListener('click', e => { if(e.target===e.currentTarget) closeModal(); });
  document.getElementById('panelOverlay')?.addEventListener('click', () => Pedidos.closePanel());
  document.getElementById('btnClosePanel')?.addEventListener('click', () => Pedidos.closePanel());

  // Logout (agora assíncrono — apaga cookie no servidor)
  document.getElementById('btnLogout')?.addEventListener('click', () => Auth.logout());

  // Seção inicial
  navigateTo('overview');
});
