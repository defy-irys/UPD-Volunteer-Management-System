import { API_BASE_URL } from '../shared/config.js';

let currentUser = null;
let searchTerm = '';
let programFilter = 'all';
let yearFilter = 'all';
let pageSize = getPageSize();
let offset = 0;
let totalCount = 0;
let rows = [];
let searchTimer = null;

const ICONS = {
  user: `<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M20 21a8 8 0 0 0-16 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  warning: `<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 3l9 16H3l9-16z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    <path d="M12 9v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="17" r="1" fill="currentColor"/>
  </svg>`,
  search: `<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M20 20l-3.5-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  inbox: `<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M3 13l4-8h10l4 8v6H3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    <path d="M3 13h6l2 3h2l2-3h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
};

function apiFetch(path, options = {}) {
  const opts = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    credentials: 'include'
  };

  return fetch(`${API_BASE_URL}${path}`, opts)
    .then(async res => {
      let body = null;
      try {
        body = await res.json();
      } catch (e) {
        body = null;
      }

      if (!res.ok || !body || body.success === false) {
        const message = body && body.message ? body.message : 'Request failed.';
        throw new Error(message);
      }
      return body;
    });
}

function getPageSize() {
  return window.innerWidth < 720 ? 5 : 10;
}

function setStatsLoading(isLoading) {
  const ids = ['statTotal','statMonth','statFiltered','statTutorial','statHealth','statDisaster','topbarTotal'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('loading', isLoading);
    if (isLoading) el.textContent = '...';
  });
}

function updateFilterStyles() {
  const programEl = document.getElementById('programFilter');
  const yearEl = document.getElementById('yearFilter');
  if (programEl) programEl.classList.toggle('active', programEl.value !== 'all');
  if (yearEl) yearEl.classList.toggle('active', yearEl.value !== 'all');
}

function showLoginInfo(text) {
  const info = document.getElementById('loginInfo');
  if (!info) return;
  info.textContent = text;
  info.classList.add('show');
}

function clearLoginInfo() {
  const info = document.getElementById('loginInfo');
  if (info) info.classList.remove('show');
}

function showLoginError(text) {
  const err = document.getElementById('loginErr');
  if (!err) return;
  err.textContent = text;
  err.classList.add('show');
}

function clearLoginError() {
  const err = document.getElementById('loginErr');
  if (err) err.classList.remove('show');
}

function openDashboard(name) {
  currentUser = name;
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('dashPage').style.display = 'block';
  document.getElementById('topbarUser').innerHTML = `${ICONS.user}<span>${escHtml(currentUser)}</span>`;
  loadStats();
  resetQuery();
}

function resetQuery() {
  if (!currentUser) return;
  offset = 0;
  rows = [];
  totalCount = 0;
  loadVolunteers({ reset: true });
}

async function doLogin() {
  const name = document.getElementById('loginName').value.trim();
  const pass = document.getElementById('loginPass').value;
  const remember = document.getElementById('rememberMe').checked;

  clearLoginError();
  clearLoginInfo();

  if (!name || !pass) {
    showLoginError('Please enter your account name and password.');
    return;
  }

  try {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ name, password: pass, rememberMe: remember })
    });

    if (remember) {
      localStorage.setItem('vms_remember_name', name);
    } else {
      localStorage.removeItem('vms_remember_name');
    }

    openDashboard(res.data.name || name);
  } catch (err) {
    showLoginError(err.message || 'Login failed.');
    document.getElementById('loginPass').value = '';
  }
}

async function doLogout() {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch (err) {
    // ignore
  }
  currentUser = null;
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('dashPage').style.display = 'none';
  document.getElementById('loginName').value = '';
  document.getElementById('loginPass').value = '';
}

function toggleCreate() {
  const wrap = document.getElementById('createWrap');
  const msg = document.getElementById('createMsg');
  if (!wrap) return;
  wrap.classList.toggle('show');
  if (msg) { msg.classList.remove('show', 'error'); msg.textContent = ''; }
}

function showCreateMsg(text, isError) {
  const msg = document.getElementById('createMsg');
  if (!msg) return;
  msg.textContent = text;
  msg.classList.add('show');
  msg.classList.toggle('error', !!isError);
}

async function handleCreateAccount() {
  const name = document.getElementById('createName').value.trim();
  const pass = document.getElementById('createPass').value;
  const pass2 = document.getElementById('createPass2').value;
  const code = document.getElementById('createCode').value;

  if (!name || !pass || !pass2 || !code) {
    showCreateMsg('Please complete all fields.', true);
    return;
  }
  if (pass.length < 6) {
    showCreateMsg('Password must be at least 6 characters.', true);
    return;
  }
  if (pass !== pass2) {
    showCreateMsg('Passwords do not match.', true);
    return;
  }

  try {
    await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, password: pass, setupCode: code })
    });
    showCreateMsg('Account created. You can sign in now.', false);
    document.getElementById('createName').value = '';
    document.getElementById('createPass').value = '';
    document.getElementById('createPass2').value = '';
    document.getElementById('createCode').value = '';
    document.getElementById('loginName').value = name;
    document.getElementById('loginPass').focus();
  } catch (err) {
    showCreateMsg(err.message || 'Unable to create account.', true);
  }
}

function showForgot() {
  showLoginInfo('Please contact the lead admin to reset your password.');
}

function handleAuthError(err) {
  if (err && String(err.message || '').toLowerCase().includes('unauthorized')) {
    doLogout();
    showLoginInfo('Session expired. Please sign in again.');
    return true;
  }
  return false;
}

async function restoreSession() {
  const remembered = localStorage.getItem('vms_remember_name');
  if (remembered) {
    document.getElementById('loginName').value = remembered;
    document.getElementById('rememberMe').checked = true;
  }

  try {
    const res = await apiFetch('/api/auth/me');
    if (res && res.data && res.data.name) {
      openDashboard(res.data.name);
    }
  } catch (err) {
    // not logged in
  }
}

async function loadStats() {
  setStatsLoading(true);
  try {
    const res = await apiFetch('/api/volunteers/stats');
    const stats = res.data || {};

    setStatsLoading(false);
    setStatValue('statTotal', stats.total || 0);
    setStatValue('statMonth', stats.this_month || 0);
    setStatValue('statTutorial', stats.tutorial || 0);
    setStatValue('statHealth', stats.health || 0);
    setStatValue('statDisaster', stats.disaster || 0);
    setStatValue('topbarTotal', stats.total || 0);
  } catch (err) {
    if (handleAuthError(err)) return;
    setStatsLoading(false);
    setStatValue('statTotal', '-');
    setStatValue('statMonth', '-');
    setStatValue('statTutorial', '-');
    setStatValue('statHealth', '-');
    setStatValue('statDisaster', '-');
    setStatValue('topbarTotal', '-');
  }
}

function setStatValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('loading');
  el.textContent = value;
}

function buildQueryParams(limit, offsetOverride) {
  const params = new URLSearchParams();
  params.set('limit', limit);
  params.set('offset', offsetOverride !== undefined ? offsetOverride : offset);
  if (searchTerm) params.set('search', searchTerm);
  if (programFilter !== 'all') params.set('program', programFilter);
  if (yearFilter !== 'all') params.set('year', yearFilter);
  return params.toString();
}

async function loadVolunteers({ reset = true, limitOverride } = {}) {
  if (reset) {
    offset = 0;
    rows = [];
    totalCount = 0;
    document.getElementById('tableWrap').innerHTML =
      '<div class="spinner-wrap"><div class="spinner"></div><p style="color:var(--muted);font-size:13px">Loading volunteers...</p></div>';
  }

  const limit = limitOverride || pageSize;

  try {
    const res = await apiFetch(`/api/volunteers?${buildQueryParams(limit)}`);
    const data = res.data || { rows: [], total: 0 };
    totalCount = data.total || 0;

    rows = reset ? data.rows : rows.concat(data.rows || []);
    offset = rows.length;

    renderTable(rows);
    setStatValue('statFiltered', totalCount);
  } catch (err) {
    if (handleAuthError(err)) return;
    document.getElementById('tableWrap').innerHTML =
      `<div class="no-results"><div class="icon warn">${ICONS.warning}</div><p>${escHtml(err.message || 'Unable to load volunteers.')}</p></div>`;
    setStatValue('statFiltered', '-');

  }
}

function renderTable(currentRows) {
  const wrap = document.getElementById('tableWrap');
  const showMoreBtn = document.getElementById('showMoreBtn');
  const term = (searchTerm || '').toLowerCase();

  if (!currentRows.length) {
    wrap.innerHTML = `<div class="no-results">
      <div class="icon">${term ? ICONS.search : ICONS.inbox}</div>
      <p>${term ? `No volunteers match "<strong>${escHtml(term)}</strong>"` : 'No volunteers found.'}</p>
    </div>`;
    if (showMoreBtn) showMoreBtn.style.display = 'none';
    document.getElementById('resultCount').textContent = '0 results';
    return;
  }

  const shown = currentRows.length;
  document.getElementById('resultCount').textContent =
    term || programFilter !== 'all' || yearFilter !== 'all'
      ? `Showing ${shown} of ${totalCount} result(s)`
      : `Showing ${shown} of ${totalCount} total`;

  const hl = (txt) => {
    if (!term || !txt) return escHtml(txt || '');
    const regex = new RegExp(`(${escRegex(term)})`, 'gi');
    return escHtml(txt).replace(regex, '<span class="highlight">$1</span>');
  };

  const fmt = (v) => {
    const d = new Date(v.created_at);
    return d.toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' });
  };

  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>UID</th>
          <th>Full Name</th>
          <th>Program</th>
          <th>Mobile</th>
          <th>Email</th>
          <th>Year Joined</th>
          <th>Registered</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${currentRows.map(v => {
          const fullName = v.full_name || '';
          const mobile = v.mobile || '';
          return `
          <tr>
            <td><span class="uid-badge">${hl(v.uid)}</span></td>
            <td class="name-cell">${hl(fullName)}</td>
            <td>${hl(v.program || '-')}</td>
            <td>${hl(mobile || '-')}</td>
            <td>${hl(v.email || '-')}</td>
            <td>${hl(v.year_joined || '-')}</td>
            <td style="white-space:nowrap;color:var(--muted);font-size:12.5px">${fmt(v)}</td>
            <td><button class="view-btn" type="button" data-action="view" data-id="${escAttr(v.id)}" style="background:var(--navy);color:#fff;border:none;padding:6px 12px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">View</button></td>
          </tr>
        `;}).join('')}
      </tbody>
    </table>
  `;

  if (showMoreBtn) {
    showMoreBtn.style.display = currentRows.length < totalCount ? 'inline-flex' : 'none';
  }
}

function showMore() {
  if (rows.length >= totalCount) return;
  loadVolunteers({ reset: false });
}

function viewAll() {
  if (!totalCount || rows.length >= totalCount) {
    document.getElementById('tableWrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  loadVolunteers({ reset: true, limitOverride: totalCount });
}

function onSearch(q) {
  searchTerm = q.trim();
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    resetQuery();
  }, 400);
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  searchTerm = '';
  resetQuery();
}

function openDetail(id) {
  const v = rows.find(r => r.id === id);
  if (!v) return;
  const modal = document.getElementById('modalContent');
  const empty = '-';
  const d = val => escHtml(val || empty);
  const fullName = v.full_name || empty;
  const mobile = v.mobile || empty;
  const occupation = v.occupation || empty;

  let extraSection = '';
  if (occupation === 'Licensed Professional') {
    extraSection = `
      <div class="modal-section">
        <div class="modal-section-title">Professional Details</div>
        <div class="modal-row"><span class="modal-key">PRC License</span><span class="modal-val">${d(v.prc_license)}</span></div>
        <div class="modal-row"><span class="modal-key">Department</span><span class="modal-val">${d(v.department_office)}</span></div>
      </div>
      <hr class="modal-divider"/>
    `;
  } else if (occupation === 'Student') {
    extraSection = `
      <div class="modal-section">
        <div class="modal-section-title">Student Details</div>
        <div class="modal-row"><span class="modal-key">College</span><span class="modal-val">${d(v.college)}</span></div>
        <div class="modal-row"><span class="modal-key">Course</span><span class="modal-val">${d(v.course)}</span></div>
        <div class="modal-row"><span class="modal-key">Year Level</span><span class="modal-val">${d(v.year_level)}</span></div>
      </div>
      <hr class="modal-divider"/>
    `;
  }

  modal.innerHTML = `
    <div class="modal-header">
      <div>
        <div style="font-size:11px;color:var(--amber);font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px">Volunteer Profile</div>
        <div class="modal-uid">${d(v.uid)}</div>
      </div>
      <button class="modal-close" type="button" data-action="close-modal">&times;</button>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Basic Information</div>
      <div class="modal-row"><span class="modal-key">Full Name</span><span class="modal-val">${d(fullName)}</span></div>
      <div class="modal-row"><span class="modal-key">Program</span><span class="modal-val">${d(v.program)}</span></div>
      <div class="modal-row"><span class="modal-key">Year Joined</span><span class="modal-val">${d(v.year_joined)}</span></div>
      <div class="modal-row"><span class="modal-key">Occupation</span><span class="modal-val">${d(occupation)}</span></div>
      <div class="modal-row"><span class="modal-key">UP Alumnus</span><span class="modal-val">${d(v.alumnus_up)}</span></div>
      <div class="modal-row"><span class="modal-key">PGH Connection</span><span class="modal-val">${d(v.connected_pgh)}</span></div>
    </div>
    <hr class="modal-divider"/>
    <div class="modal-section">
      <div class="modal-section-title">Contact Details</div>
      <div class="modal-row"><span class="modal-key">Mobile</span><span class="modal-val">${d(mobile)}</span></div>
      <div class="modal-row"><span class="modal-key">Email</span><span class="modal-val">${d(v.email)}</span></div>
    </div>
    <hr class="modal-divider"/>
    ${extraSection}
    <div style="font-size:12px;color:var(--muted)">Registered: ${escHtml(new Date(v.created_at).toLocaleString('en-PH'))}</div>
  `;
  document.getElementById('detailModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('detailModal').style.display = 'none';
}

function printList() {
  document.getElementById('printDate').textContent = 'Date: ' + new Date().toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'});
  document.getElementById('printCount').textContent = `Total: ${rows.length} volunteer(s)`;
  window.print();
}

async function exportExcel() {
  if (!totalCount) {
    alert('No data to export.');
    return;
  }

  let exportRows = rows;
  if (rows.length < totalCount) {
    try {
      const res = await apiFetch(`/api/volunteers?${buildQueryParams(totalCount, 0)}`);
      exportRows = res.data.rows || [];
    } catch (err) {
      if (handleAuthError(err)) return;
      alert('Unable to export right now.');
      return;
    }
  }

  const out = exportRows.map(v => ({
    'UID': v.uid || '',
    'Full Name': v.full_name || '',
    'Program': v.program || '',
    'Mobile': v.mobile || '',
    'Email': v.email || '',
    'UP Alumnus': v.alumnus_up || '',
    'Connected with PGH': v.connected_pgh || '',
    'Occupation': v.occupation || '',
    'Year Joined': v.year_joined || '',
    'PRC License': v.prc_license || '',
    'Department/Office': v.department_office || '',
    'College': v.college || '',
    'Course': v.course || '',
    'Year Level': v.year_level || '',
    'Registered': v.created_at ? new Date(v.created_at).toLocaleDateString('en-PH') : ''
  }));

  const ws = XLSX.utils.json_to_sheet(out);
  ws['!cols'] = [
    {wch:12},{wch:26},{wch:34},{wch:16},{wch:28},{wch:12},{wch:16},{wch:16},
    {wch:14},{wch:14},{wch:20},{wch:24},{wch:20},{wch:18},{wch:14}
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Volunteers');

  const fname = `volunteers_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, fname);
}

function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function escAttr(s) {
  return escHtml(s);
}

function escRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function initEvents() {
  document.getElementById('loginPass').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });

  document.getElementById('searchInput').addEventListener('input', e => {
    onSearch(e.target.value);
  });

  document.getElementById('programFilter').addEventListener('change', e => {
    programFilter = e.target.value;
    updateFilterStyles();
    resetQuery();
  });

  document.getElementById('yearFilter').addEventListener('change', e => {
    yearFilter = e.target.value;
    updateFilterStyles();
    resetQuery();
  });

  document.getElementById('createPass2').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleCreateAccount();
  });

  document.getElementById('createCode').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleCreateAccount();
  });

  document.addEventListener('click', e => {
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === 'login') doLogin();
    else if (action === 'logout') doLogout();
    else if (action === 'forgot-pass') showForgot();
    else if (action === 'clear-search') clearSearch();
    else if (action === 'refresh') { loadStats(); resetQuery(); }
    else if (action === 'export-excel') exportExcel();
    else if (action === 'print') printList();
    else if (action === 'toggle-create') toggleCreate();
    else if (action === 'create-account') handleCreateAccount();
    else if (action === 'view') openDetail(actionEl.dataset.id);
    else if (action === 'close-modal') closeModal();
    else if (action === 'view-all') viewAll();
    else if (action === 'show-more') showMore();
  });

  const modalBg = document.getElementById('detailModal');
  if (modalBg) {
    modalBg.addEventListener('click', e => {
      if (e.target === modalBg) closeModal();
    });
  }

  window.addEventListener('resize', () => {
    const nextSize = getPageSize();
    if (nextSize !== pageSize) {
      pageSize = nextSize;
      resetQuery();
    }
  });
}

function init() {
  initEvents();
  updateFilterStyles();
  restoreSession();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}



