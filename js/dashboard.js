'use strict';
/**
 * dashboard.js — Controlador principal
 * Auth via cookie httpOnly. Controle de visibilidade por permissões.
 */

(function () {
  const t = localStorage.getItem('sublime-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

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
  sun:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  moon:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  sparkle:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>`,
  stars:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  leaf:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M17 8C8 10 5.9 16.17 3.82 19.9A2 2 0 0 0 5.42 22C7.42 22 14 20 17 14c0 0-1 3-3 5 0 0 8-1 9-10S17 8 17 8z"/></svg>`,
  heart:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  camera:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  logout:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  upload:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
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
function isToday(d)     { const a=new Date(d),n=new Date(); return a.getDate()===n.getDate()&&a.getMonth()===n.getMonth()&&a.getFullYear()===n.getFullYear(); }
function isThisMonth(d) { const a=new Date(d),n=new Date(); return a.getMonth()===n.getMonth()&&a.getFullYear()===n.getFullYear(); }
function createSkeletonRows(r,c) { let h=''; for(let i=0;i<r;i++){h+='<tr class="skeleton-row">'; for(let j=0;j<c;j++) h+='<td><div class="skeleton-line"></div></td>'; h+='</tr>';} return h; }
function createSkeletonCards(n)  { let h=''; for(let i=0;i<n;i++) h+=`<div class="overview-card skeleton-card"><div class="skeleton-line w50"></div><div class="skeleton-line w35 mt-8"></div></div>`; return h; }
function esc(s) { return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

window.formatCurrency=formatCurrency; window.formatDate=formatDate;
window.isToday=isToday; window.isThisMonth=isThisMonth;
window.createSkeletonRows=createSkeletonRows; window.createSkeletonCards=createSkeletonCards;

// ── 6 TEMAS ───────────────────────────────────────────────────────────────────
const THEMES = {
  dark:     { label: 'Escuro',     icon: 'moon'    },
  light:    { label: 'Claro',      icon: 'sun'     },
  violet:   { label: 'Violeta',    icon: 'sparkle' },
  midnight: { label: 'Meia-noite', icon: 'stars'   },
  forest:   { label: 'Floresta',   icon: 'leaf'    },
  rose:     { label: 'Rosa',       icon: 'heart'   },
};

function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('sublime-theme', t);
  const btn = document.getElementById('themeToggle');
  if (btn) { btn.innerHTML = ICONS[THEMES[t]?.icon||'moon']; btn.title = THEMES[t]?.label||t; }
}
function toggleTheme() {
  const order = Object.keys(THEMES);
  const curr  = document.documentElement.getAttribute('data-theme') || 'dark';
  setTheme(order[(order.indexOf(curr)+1) % order.length]);
}

// ── TOASTS ───────────────────────────────────────────────────────────────────
const TOAST_META = {
  success:{ icon:ICONS.check,   title:'Sucesso'    },
  error:  { icon:ICONS.x,       title:'Erro'       },
  warning:{ icon:ICONS.warning, title:'Atenção'    },
  info:   { icon:ICONS.info,    title:'Informação' },
};
function showToast(message, type='info') {
  const c=document.getElementById('toastContainer');
  const meta=TOAST_META[type]||TOAST_META.info;
  const el=document.createElement('div');
  el.className=`toast toast-${type}`;
  el.innerHTML=`<div class="toast-icon">${meta.icon}</div><div class="toast-body"><div class="toast-title">${meta.title}</div><div class="toast-msg">${message}</div></div><button class="toast-close">${ICONS.close}</button>`;
  el.querySelector('.toast-close').onclick=()=>dismissToast(el);
  c.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('toast-in'));
  setTimeout(()=>dismissToast(el),3500);
}
function dismissToast(el) {
  if(!el.isConnected)return;
  el.classList.remove('toast-in'); el.classList.add('toast-out');
  el.addEventListener('transitionend',()=>el.remove(),{once:true});
}
window.showToast=showToast;

// ── MODAL ────────────────────────────────────────────────────────────────────
function openModal(html) {
  document.getElementById('modalContainer').innerHTML=html;
  document.getElementById('modalOverlay').classList.add('visible');
  document.body.classList.add('no-scroll');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('visible');
  document.body.classList.remove('no-scroll');
}
function confirmAction(msg, onConfirm) {
  openModal(`<div class="modal-card confirm-card">
    <div class="modal-header"><h3>Confirmar</h3><button class="btn-icon" onclick="closeModal()">${ICONS.close}</button></div>
    <div class="modal-body"><p class="confirm-msg">${msg}</p></div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-danger" id="btnConfirmOk">Confirmar</button>
    </div>
  </div>`);
  document.getElementById('btnConfirmOk').onclick=()=>{closeModal();onConfirm();};
}
window.openModal=openModal; window.closeModal=closeModal; window.confirmAction=confirmAction;

// ══════════════════════════════════════════════════════════════════════════════
// PAINEL DE PERFIL FLUTUANTE (estilo popover)
// ══════════════════════════════════════════════════════════════════════════════
let _profilePanelOpen = false;

function toggleProfilePanel(e) {
  e?.stopPropagation();
  _profilePanelOpen ? closeProfilePanel() : openProfilePanel();
}

function openProfilePanel() {
  _profilePanelOpen = true;
  _renderProfilePanel();
  const panel = document.getElementById('profilePanel');
  panel.classList.add('open');
  // Fecha ao clicar fora
  setTimeout(() => document.addEventListener('click', _onOutsideClick), 0);
}

function closeProfilePanel() {
  _profilePanelOpen = false;
  document.getElementById('profilePanel')?.classList.remove('open');
  document.removeEventListener('click', _onOutsideClick);
}

function _onOutsideClick(e) {
  const panel = document.getElementById('profilePanel');
  const btn   = document.getElementById('sidebarProfileBtn');
  if (!panel?.contains(e.target) && !btn?.contains(e.target)) {
    closeProfilePanel();
  }
}

function _renderProfilePanel() {
  const user         = Auth.getUser();
  if (!user) return;
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const initials     = (user.nome||'?').split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase();

  const avatarInner = user.foto
    ? `<img src="${esc(user.foto)}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">`
    : initials;

  document.getElementById('panelAvatarInner').innerHTML = avatarInner;
  document.getElementById('panelName').textContent      = user.nome || user.apelido;
  document.getElementById('panelRole').textContent      = user.isAdmin ? 'Administrador' : 'Usuário';

  // Lista de temas
  document.getElementById('panelThemeList').innerHTML = Object.entries(THEMES).map(([key, t]) => {
    const active = currentTheme === key;
    return `<button class="panel-item ${active ? 'panel-item-active' : ''}" onclick="selectPanelTheme('${key}')">
      <span class="panel-item-icon">${ICONS[t.icon]}</span>
      <span>${t.label}</span>
      ${active ? `<span class="panel-item-check">${ICONS.check}</span>` : ''}
    </button>`;
  }).join('');
}

// Troca de tema a partir do painel
async function selectPanelTheme(theme) {
  setTheme(theme);
  _renderProfilePanel(); // atualiza checkmark sem fechar

  const user = Auth.getUser();
  if (user) {
    try {
      await API.updateUsuario(user.id, { tema: theme });
      Auth.setUser({ ...user, tema: theme });
    } catch (_) {}
  }
}
window.selectPanelTheme = selectPanelTheme;

// Abre modal de foto a partir do painel
function openPhotoModal() {
  closeProfilePanel();
  const user = Auth.getUser();
  if (!user) return;
  const initials = (user.nome||'?').split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase();

  openModal(`
    <div class="modal-card" style="max-width:360px">
      <div class="modal-header">
        <h3>Trocar foto</h3>
        <button class="btn-icon" onclick="closeModal()">${ICONS.close}</button>
      </div>
      <div class="modal-body" style="align-items:center;gap:1.25rem">

        <div id="photoModalPreview" style="width:80px;height:80px;border-radius:50%;overflow:hidden;background:var(--accent-soft);border:3px solid var(--accent);display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;color:var(--accent);flex-shrink:0">
          ${user.foto
            ? `<img src="${esc(user.foto)}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">`
            : initials}
        </div>

        <!-- Upload direto -->
        <div style="width:100%">
          <label class="btn btn-ghost btn-full" style="cursor:pointer;justify-content:center;gap:.4rem">
            ${ICONS.upload} Enviar do dispositivo
            <input type="file" accept="image/*" style="display:none" onchange="uploadAndPreviewPhoto(this)">
          </label>
          <div id="photoUploadStatus" style="font-size:.78rem;color:var(--text-muted);text-align:center;margin-top:.35rem;min-height:1.2em"></div>
        </div>

        <!-- Ou colar URL -->
        <div style="width:100%">
          <div style="font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-dim);margin-bottom:.4rem">Ou cole um link</div>
          <input type="url" id="photoUrlInput" class="input-field" value="${esc(user.foto||'')}" placeholder="https://res.cloudinary.com/...">
        </div>

      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="savePhotoFromModal()">Salvar foto</button>
      </div>
    </div>
  `);
}
window.openPhotoModal = openPhotoModal;

async function uploadAndPreviewPhoto(input) {
  if (!input?.files?.[0]) return;
  const status = document.getElementById('photoUploadStatus');
  if (status) status.textContent = 'Enviando…';
  try {
    const fd = new FormData(); fd.append('file', input.files[0]);
    const res = await API.uploadImagem(fd);
    const url = res?.url; if (!url) throw new Error('URL não retornada');
    const urlInput = document.getElementById('photoUrlInput');
    if (urlInput) urlInput.value = url;
    const preview = document.getElementById('photoModalPreview');
    if (preview) preview.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover">`;
    if (status) status.textContent = 'Upload concluído!';
  } catch (err) {
    if (status) status.textContent = 'Erro: ' + err.message;
    showToast('Erro no upload: ' + err.message, 'error');
  }
}
window.uploadAndPreviewPhoto = uploadAndPreviewPhoto;

async function savePhotoFromModal() {
  const url  = document.getElementById('photoUrlInput')?.value.trim() || null;
  const user = Auth.getUser(); if (!user) return;
  try {
    await API.updateUsuario(user.id, { foto: url });
    const updated = { ...user, foto: url };
    Auth.setUser(updated);
    _updateSidebarAvatar(updated);
    showToast('Foto atualizada!', 'success');
    closeModal();
  } catch (err) { showToast(err.message, 'error'); }
}
window.savePhotoFromModal = savePhotoFromModal;

function _updateSidebarAvatar(user) {
  const img      = document.getElementById('sidebarAvatarImg');
  const initials = document.getElementById('sidebarAvatarInitials');
  if (user.foto && img) {
    img.src = user.foto; img.style.display = 'block';
    if (initials) initials.style.display = 'none';
  } else {
    if (img) img.style.display = 'none';
    if (initials) {
      initials.style.display = '';
      initials.textContent = (user.nome||'?').split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase();
    }
  }
}

// ── NAVEGAÇÃO ────────────────────────────────────────────────────────────────
const SECTION_TITLES = {
  overview:'Visão Geral', estoque:'Estoque', pedidos:'Pedidos',
  cupons:'Cupons', config:'Configurações de Vendas', relatorio:'Relatório', usuarios:'Usuários',
};
let _active = null;

function navigateTo(section) {
  if (section !== 'overview' && section !== 'relatorio') {
    const map = {estoque:'estoque',pedidos:'pedidos',cupons:'cupons',config:'config',usuarios:'usuarios'};
    const k   = map[section];
    if (k && !Auth.canView(k) && !Auth.isAdmin()) { showToast('Sem permissão para esta seção.','warning'); return; }
  }
  if (_active===section) { closeSidebar(); return; }
  document.querySelectorAll('.content-section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('[data-section]').forEach(e=>e.classList.remove('active'));
  document.getElementById(`section-${section}`)?.classList.add('active');
  document.querySelectorAll(`[data-section="${section}"]`).forEach(e=>e.classList.add('active'));
  document.getElementById('pageTitle').textContent = SECTION_TITLES[section]||section;
  _active=section; closeSidebar();
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
window.navigateTo=navigateTo;

function toggleSidebar(){ document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebarOverlay').classList.toggle('visible'); }
function closeSidebar()  { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebarOverlay').classList.remove('visible'); }

// ── VISÃO GERAL ───────────────────────────────────────────────────────────────
let _pedidosCache=null, _estoqueCache=null;

async function loadOverview() {
  document.getElementById('overviewCards').innerHTML=createSkeletonCards(4);
  document.getElementById('lowStockList').innerHTML='<div class="skeleton-line" style="max-width:300px"></div>';
  try {
    const [pedidos,estoque]=await Promise.all([API.getPedidos(),API.getEstoque()]);
    _pedidosCache=Array.isArray(pedidos)?pedidos:[];
    _estoqueCache=Array.isArray(estoque)?estoque:[];
    renderOverview(_pedidosCache,_estoqueCache);
  } catch(err) { showToast(err.message,'error'); document.getElementById('overviewCards').innerHTML='<p class="empty-state">Falha ao carregar dados.</p>'; }
}

function renderOverview(pedidos,estoque) {
  const hoje     =pedidos.filter(p=>isToday(p.dataCompra));
  const pendentes=pedidos.filter(p=>p.pagamento!=='REALIZADO'&&p.etapa!=='CANCELADO');
  const tHoje    =hoje.reduce((s,p)=>s+(parseFloat(p.totalVenda)||0),0);
  const tMes     =pedidos.filter(p=>isThisMonth(p.dataCompra)).reduce((s,p)=>s+(parseFloat(p.totalVenda)||0),0);
  const baixo    =estoque.filter(e=>(parseInt(e.qtd)||0)<5);

  document.getElementById('overviewCards').innerHTML=`
    <div class="overview-card"><div class="card-icon icon-blue">${ICONS.orders}</div><div class="card-info"><span class="card-label">Pedidos Hoje</span><span class="card-value">${hoje.length}</span></div></div>
    <div class="overview-card"><div class="card-icon icon-red">${ICONS.alert}</div><div class="card-info"><span class="card-label">Pagtos. Pendentes</span><span class="card-value">${pendentes.length}${pendentes.length>0?'<span class="badge badge-red pulse">!</span>':''}</span></div></div>
    <div class="overview-card"><div class="card-icon icon-green">${ICONS.dollar}</div><div class="card-info"><span class="card-label">Vendas Hoje</span><span class="card-value">${formatCurrency(tHoje)}</span></div></div>
    <div class="overview-card"><div class="card-icon icon-purple">${ICONS.monitor}</div><div class="card-info"><span class="card-label">Vendas no Mês</span><span class="card-value">${formatCurrency(tMes)}</span></div></div>`;

  const el=document.getElementById('lowStockList');
  el.innerHTML=!baixo.length
    ?'<p class="empty-state-small">Todos os produtos com estoque adequado.</p>'
    :baixo.map(p=>`<div class="low-stock-item"><span class="low-stock-name">${p.produto||p.nome||'—'}</span><span class="badge badge-red">${p.qtd} un</span></div>`).join('');
}
window.loadOverview=loadOverview;

// ── RELATÓRIO ─────────────────────────────────────────────────────────────────
async function loadRelatorio() {
  const el=document.getElementById('relatorioContainer');
  el.innerHTML='<div class="overview-grid">'+createSkeletonCards(3)+'</div>';
  try {
    if(!_pedidosCache){const r=await API.getPedidos();_pedidosCache=Array.isArray(r)?r:[];}
    renderRelatorio(_pedidosCache);
  } catch(err){showToast(err.message,'error');}
}

function renderRelatorio(pedidos) {
  const pagos  =pedidos.filter(p=>p.pagamento==='REALIZADO');
  const total  =pagos.reduce((s,p)=>s+(parseFloat(p.totalVenda)||0),0);
  const totalMs=pagos.filter(p=>isThisMonth(p.dataCompra)).reduce((s,p)=>s+(parseFloat(p.totalVenda)||0),0);
  const ticket =pagos.length?total/pagos.length:0;

  document.getElementById('relatorioContainer').innerHTML=`
    <div class="overview-grid">
      <div class="overview-card"><div class="card-icon icon-green">${ICONS.trending}</div><div class="card-info"><span class="card-label">Lucro Total</span><span class="card-value">${formatCurrency(total)}</span></div></div>
      <div class="overview-card"><div class="card-icon icon-purple">${ICONS.calendar}</div><div class="card-info"><span class="card-label">Lucro do Mês</span><span class="card-value">${formatCurrency(totalMs)}</span></div></div>
      <div class="overview-card"><div class="card-icon icon-blue">${ICONS.target}</div><div class="card-info"><span class="card-label">Ticket Médio</span><span class="card-value">${formatCurrency(ticket)}</span></div></div>
    </div>
    <div class="chart-card"><div class="chart-header"><h3 class="chart-title">Vendas — Últimos 14 Dias</h3></div><div class="chart-wrapper"><canvas id="salesChart"></canvas></div></div>`;
  requestAnimationFrame(()=>drawChart(pagos));
}

function drawChart(pedidos) {
  const canvas=document.getElementById('salesChart'); if(!canvas)return;
  const days=[]; const now=new Date();
  for(let i=13;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);const k=d.toISOString().slice(0,10);days.push({key:k,label:`${d.getDate()}/${d.getMonth()+1}`,total:0});}
  pedidos.forEach(p=>{const k=new Date(p.dataCompra).toISOString().slice(0,10);const d=days.find(x=>x.key===k);if(d)d.total+=parseFloat(p.totalVenda)||0;});
  const W=canvas.offsetWidth||600,H=220; canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  const isLight=document.documentElement.getAttribute('data-theme')==='light';
  const C_GRID=isLight?'#dddde8':'#2a2a38',C_TEXT=isLight?'#9090b8':'#6b6b88';
  const accentColor=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#7c3aed';
  const pad={top:24,right:16,bottom:44,left:64};
  const cW=W-pad.left-pad.right,cH=H-pad.top-pad.bottom;
  const maxV=Math.max(...days.map(d=>d.total),100);
  const barW=Math.max(8,(cW/days.length)*0.55),gap=cW/days.length;
  ctx.clearRect(0,0,W,H);
  for(let i=0;i<=4;i++){const y=pad.top+(cH/4)*i;ctx.strokeStyle=C_GRID;ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(W-pad.right,y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=C_TEXT;ctx.font='11px system-ui';ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText((maxV-(maxV/4)*i)>=1000?`R$${((maxV-(maxV/4)*i)/1000).toFixed(1)}k`:`R$${Math.round(maxV-(maxV/4)*i)}`,pad.left-6,y);}
  days.forEach((d,i)=>{const bH=Math.max(2,(d.total/maxV)*cH),x=pad.left+gap*i+(gap-barW)/2,y=pad.top+cH-bH;ctx.fillStyle=d.total>0?accentColor:C_GRID;ctx.beginPath();ctx.roundRect(x,y,barW,bH,[4,4,0,0]);ctx.fill();if(W<500&&i%2!==0)return;ctx.fillStyle=C_TEXT;ctx.font='10px system-ui';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(d.label,x+barW/2,H-pad.bottom+8);});
}
window.loadRelatorio=loadRelatorio;

// ── BOOTSTRAP ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const user = Auth.getUser();

  // Aplica tema preferido do usuário
  const temaInicial = user?.tema || localStorage.getItem('sublime-theme') || 'dark';
  setTheme(temaInicial);

  // Avatar + nome na sidebar
  const nameEl    = document.getElementById('sidebarUserName');
  const avatarImg = document.getElementById('sidebarAvatarImg');
  const initials  = document.getElementById('sidebarAvatarInitials');

  if (nameEl && user) nameEl.textContent = user.nome || user.apelido || 'Usuário';
  if (user?.foto && avatarImg) {
    avatarImg.src = user.foto; avatarImg.style.display = 'block';
    if (initials) initials.style.display = 'none';
  } else if (initials && user) {
    initials.textContent = (user.nome||'?').split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase();
  }

  // Mostra nav de Usuários apenas para Admin
  if (Auth.isAdmin()) document.getElementById('navUsuarios')?.style.removeProperty('display');

  // Esconde seções sem permissão
  if (!Auth.isAdmin()) {
    const map = {config:'config', cupons:'cupons'};
    Object.entries(map).forEach(([sec,chave]) => {
      if (!Auth.canView(chave)) document.querySelectorAll(`[data-section="${sec}"]`).forEach(el=>el.style.display='none');
    });
  }

  // Painel de perfil — clique no footer da sidebar
  document.getElementById('sidebarProfileBtn')?.addEventListener('click', toggleProfilePanel);

  // Theme toggle no header
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

  // Nav
  document.querySelectorAll('[data-section]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.section); });
  });

  // Hamburger + overlays
  document.getElementById('hamburger')?.addEventListener('click', toggleSidebar);
  document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);
  document.getElementById('modalOverlay')?.addEventListener('click', e => { if(e.target===e.currentTarget) closeModal(); });
  document.getElementById('panelOverlay')?.addEventListener('click', () => Pedidos.closePanel());
  document.getElementById('btnClosePanel')?.addEventListener('click', () => Pedidos.closePanel());

  // Logout rápido
  document.getElementById('btnLogout')?.addEventListener('click', () => Auth.logout());

  navigateTo('overview');
});
