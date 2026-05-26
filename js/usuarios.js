'use strict';
/**
 * usuarios.js — Gerenciamento de Usuários
 * Apenas Admin pode acessar. Suporta permissões granulares por seção.
 */

const SECOES = [
  { key: 'estoque',  label: 'Estoque'    },
  { key: 'pedidos',  label: 'Pedidos'    },
  { key: 'cupons',   label: 'Cupons'     },
  { key: 'config',   label: 'Config'     },
  { key: 'usuarios', label: 'Usuários'   },
];

const DEFAULT_PERMS = () => Object.fromEntries(
  SECOES.map(s => [s.key, { ver: false, editar: false }])
);

const Usuarios = (() => {
  // SVGs locais — evita conflito com constantes globais de outros módulos
  const U_PLUS  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`;
  const U_EDIT  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  const U_TRASH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
  const U_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  let _data        = [];
  let _initialized = false;

  function init() {
    if (!Auth.isAdmin()) {
      document.getElementById('section-usuarios')?.classList.remove('active');
      return;
    }
    if (!_initialized) {
      _initialized = true;
      document.getElementById('btnNewUsuario')
        ?.addEventListener('click', () => openModal_());
    }
    if (_data.length === 0) load();
  }

  async function load() {
    setBody(createSkeletonRows(3, 5));
    try {
      const res = await API.getUsuarios();
      _data = Array.isArray(res) ? res : [];
      render(_data);
    } catch (err) {
      showToast(err.message, 'error');
      setBody('<tr><td colspan="5" class="empty-state">Erro ao carregar usuários.</td></tr>');
    }
  }

  function render(data) {
    if (!data.length) {
      setBody('<tr><td colspan="5" class="empty-state">Nenhum usuário cadastrado.</td></tr>');
      return;
    }

    const me = Auth.getUser();
    setBody(data.map(u => {
      const initials = (u.nome || '?').split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase();
      const avatar   = u.foto
        ? `<img src="${u.foto}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:1px solid var(--border)" onerror="this.style.display='none'">`
        : `<div style="width:32px;height:32px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700">${initials}</div>`;

      const role = u.isAdmin
        ? `<span class="badge badge-purple">Admin</span>`
        : `<span class="badge badge-gray">Usuário</span>`;

      const status = u.ativo
        ? `<span class="badge badge-green">Ativo</span>`
        : `<span class="badge badge-red">Inativo</span>`;

      const ehEuMesmo = me?.id === u.id;
      const acoes = u.isAdmin
        ? `<span class="td-muted" style="font-size:.78rem">—</span>`
        : `<div class="actions-cell">
             <button class="btn-icon" onclick="Usuarios.openEdit('${u.id}')" title="Editar">${U_EDIT}</button>
             ${!ehEuMesmo ? `<button class="btn-icon btn-danger-icon" onclick="Usuarios.desativar('${u.id}')" title="Desativar">${U_TRASH}</button>` : ''}
           </div>`;

      return `
        <tr class="table-row">
          <td>
            <div style="display:flex;align-items:center;gap:.65rem">
              ${avatar}
              <div>
                <div class="font-medium">${esc(u.nome)}</div>
                <div style="font-size:.75rem;color:var(--text-muted)">@${esc(u.apelido)}</div>
              </div>
            </div>
          </td>
          <td class="td-muted">${esc(u.email)}</td>
          <td>${role}</td>
          <td>${status}</td>
          <td>${acoes}</td>
        </tr>`;
    }).join(''));
  }

  /** Modal de criação */
  function openModal_() {
    showModalForm(null);
  }

  function openEdit(id) {
    const u = _data.find(x => String(x.id) === String(id));
    if (u) showModalForm(u);
  }

  function showModalForm(u) {
    const isNew   = !u;
    const perms   = u?.permissoes || DEFAULT_PERMS();

    openModal(`
      <div class="modal-card" style="max-width:500px">
        <div class="modal-header">
          <h3>${isNew ? 'Novo Usuário' : 'Editar Usuário'}</h3>
          <button class="btn-icon" onclick="closeModal()" aria-label="Fechar">${U_CLOSE}</button>
        </div>
        <div class="modal-body">

          <div class="form-grid-2">
            <div class="form-group">
              <label>Nome completo *</label>
              <input type="text" id="uNome" class="input-field" value="${esc(u?.nome || '')}" placeholder="João Silva">
            </div>
            <div class="form-group">
              <label>Apelido *</label>
              <input type="text" id="uApelido" class="input-field" value="${esc(u?.apelido || '')}" placeholder="joao">
            </div>
          </div>

          <div class="form-group">
            <label>E-mail *</label>
            <input type="email" id="uEmail" class="input-field" value="${esc(u?.email || '')}" ${!isNew ? 'readonly' : ''} placeholder="joao@email.com">
          </div>

          <div class="form-group">
            <label>${isNew ? 'Senha *' : 'Nova Senha (deixe em branco para manter)'}</label>
            <input type="password" id="uSenha" class="input-field" placeholder="${isNew ? 'Mínimo 6 caracteres' : '••••••'}">
          </div>

          <div class="form-group">
            <label>Foto (URL do Cloudinary)</label>
            <input type="url" id="uFoto" class="input-field" value="${esc(u?.foto || '')}" placeholder="https://res.cloudinary.com/...">
          </div>

          <!-- Permissões -->
          <div style="margin-top:.5rem">
            <div style="font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:.75rem">Permissões de Acesso</div>
            <div style="border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden">
              <div style="display:grid;grid-template-columns:1fr 80px 80px;gap:0;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);padding:.5rem 1rem;background:var(--bg);border-bottom:1px solid var(--border)">
                <span>Seção</span><span style="text-align:center">Ver</span><span style="text-align:center">Editar</span>
              </div>
              ${SECOES.map(s => permRow(s, perms[s.key] || { ver: false, editar: false })).join('')}
            </div>
          </div>

          ${!isNew ? `
            <div class="form-group" style="margin-top:.75rem">
              <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
                <input type="checkbox" id="uAtivo" ${u?.ativo ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--accent)">
                Usuário ativo
              </label>
            </div>` : ''}

        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" id="btnSaveUsuario" onclick="Usuarios.save('${u?.id || ''}')">
            ${isNew ? 'Criar Usuário' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    `);

    // Liga os toggles de permissão
    SECOES.forEach(s => {
      const verEl    = document.getElementById(`perm_${s.key}_ver`);
      const editarEl = document.getElementById(`perm_${s.key}_editar`);
      if (!verEl || !editarEl) return;

      // Editar implica Ver
      editarEl.addEventListener('change', () => {
        if (editarEl.checked) verEl.checked = true;
      });
      // Desmarcar Ver implica desmarcar Editar
      verEl.addEventListener('change', () => {
        if (!verEl.checked) editarEl.checked = false;
      });
    });
  }

  function permRow(secao, atual) {
    return `
      <div style="display:grid;grid-template-columns:1fr 80px 80px;align-items:center;padding:.55rem 1rem;border-bottom:1px solid var(--border)">
        <span style="font-size:.875rem;font-weight:500;color:var(--text)">${secao.label}</span>
        <div style="display:flex;justify-content:center">
          <input type="checkbox" id="perm_${secao.key}_ver"    ${atual.ver    ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--accent);cursor:pointer">
        </div>
        <div style="display:flex;justify-content:center">
          <input type="checkbox" id="perm_${secao.key}_editar" ${atual.editar ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--accent);cursor:pointer">
        </div>
      </div>`;
  }

  async function save(id) {
    const nome    = document.getElementById('uNome')?.value.trim();
    const apelido = document.getElementById('uApelido')?.value.trim();
    const email   = document.getElementById('uEmail')?.value.trim();
    const senha   = document.getElementById('uSenha')?.value;
    const foto    = document.getElementById('uFoto')?.value.trim() || null;
    const ativo   = document.getElementById('uAtivo')?.checked ?? true;
    const isNew   = !id;

    if (!nome || !apelido || !email) { showToast('Preencha nome, apelido e e-mail.', 'warning'); return; }
    if (isNew && (!senha || senha.length < 6)) { showToast('A senha deve ter pelo menos 6 caracteres.', 'warning'); return; }

    // Lê permissões dos checkboxes
    const permissoes = Object.fromEntries(
      SECOES.map(s => [s.key, {
        ver:    !!(document.getElementById(`perm_${s.key}_ver`)?.checked),
        editar: !!(document.getElementById(`perm_${s.key}_editar`)?.checked),
      }])
    );

    const btn = document.getElementById('btnSaveUsuario');
    if (btn) { btn.disabled = true; btn.textContent = 'Salvando…'; }

    try {
      if (isNew) {
        const novo = await API.createUsuario({ nome, apelido, email, senha, foto, permissoes });
        _data.unshift(novo);
        showToast(`Usuário "${nome}" criado!`, 'success');
      } else {
        const dados = { nome, apelido, foto, permissoes, ativo };
        if (senha && senha.length >= 6) dados.senha = senha;
        const atualizado = await API.updateUsuario(id, dados);
        const idx = _data.findIndex(u => String(u.id) === String(id));
        if (idx !== -1) _data[idx] = { ..._data[idx], ...atualizado };
        showToast('Usuário atualizado!', 'success');
      }
      closeModal();
      render(_data);
    } catch (err) {
      showToast(err.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = isNew ? 'Criar Usuário' : 'Salvar Alterações'; }
    }
  }

  function desativar(id) {
    const u = _data.find(x => String(x.id) === String(id));
    confirmAction(
      `Desativar o usuário <strong>${esc(u?.nome || id)}</strong>? Ele não conseguirá mais fazer login.`,
      async () => {
        try {
          await API.deleteUsuario(id);
          const idx = _data.findIndex(x => String(x.id) === String(id));
          if (idx !== -1) _data[idx].ativo = false;
          render(_data);
          showToast('Usuário desativado.', 'success');
        } catch (err) { showToast(err.message, 'error'); }
      }
    );
  }

  function setBody(html) {
    const el = document.getElementById('usuariosTableBody');
    if (el) el.innerHTML = html;
  }

  function esc(s) {
    return (s || '').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { init, load, openEdit, save, desativar };
})();

window.Usuarios = Usuarios;
