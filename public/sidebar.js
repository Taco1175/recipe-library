// ── SIDEBAR: shared across all pages — theme switcher, nav, settings ──

const _SVG = {
  collapse: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 12L6 8l4-4"/></svg>',
  expand:   '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4l4 4-4 4"/></svg>',
  library:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="3" width="3" height="10" rx="0.5"/><rect x="7" y="3" width="3" height="10" rx="0.5"/><rect x="11" y="3" width="3" height="10" rx="0.5"/></svg>',
  planner:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M5 2v2M11 2v2M2 7h12"/></svg>',
  fridge:   '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="1.5" width="10" height="13" rx="1.5"/><path d="M3 7h10M6 4v1.5M6 9.5v3"/></svg>',
  share:    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="3" r="1.5"/><circle cx="12" cy="13" r="1.5"/><circle cx="3" cy="8" r="1.5"/><path d="M4.4 7.3L10.7 3.9M4.4 8.7l6.3 3.4"/></svg>',
  tutorial: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5v.5"/></svg>',
  signout:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M10 11l3-3-3-3M13 8H6"/></svg>',
  settings: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="2"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.1 3.1l1.1 1.1M11.8 11.8l1.1 1.1M3.1 12.9l1.1-1.1M11.8 4.2l1.1-1.1"/></svg>',
  add:      '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v10M3 8h10"/></svg>',
  bulk:     '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><path d="M11.5 9v6M9 11.5h5"/></svg>',
  image:    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="3" width="12" height="10" rx="1.5"/><circle cx="5.5" cy="6.5" r="1"/><path d="M2 11l3.5-3 3 2.5 2.5-2 3 3"/></svg>',
};

const _FUN = { library:'📚', planner:'📅', fridge:'🥦', share:'👥', tutorial:'✨', add:'＋', bulk:'📦', image:'🖼', settings:'⚙️' };

// ── THEME ──
function getTheme() { return localStorage.getItem('mp-theme') || 'dark'; }

// Use PocketBase auth token from auth.js (loaded before sidebar.js on every page)
function _getToken() {
  try {
    if (typeof Auth !== 'undefined') return Auth.getToken();
  } catch(e) {}
  return null;
}

async function _loadPrefsFromServer() {
  const token = _getToken();
  if (!token) return;
  try {
    const res = await fetch('/api/user-preferences', {
      headers: { Authorization: token }
    });
    if (!res.ok) return;
    const { theme } = await res.json();
    if (theme && theme !== localStorage.getItem('mp-theme')) {
      localStorage.setItem('mp-theme', theme);
      setTheme(theme);
    }
  } catch(e) {}
}

function _saveThemeToServer(t) {
  const token = _getToken();
  if (!token) return;
  fetch('/api/user-preferences', {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme: t })
  }).catch(() => {});
}

function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('mp-theme', t);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === t));
  _updateIcons(t);
}

function _updateIcons(theme) {
  const fun = theme === 'fun';
  document.querySelectorAll('.nav-icon[data-icon]').forEach(el => {
    const n = el.dataset.icon;
    el.innerHTML = (fun && _FUN[n]) ? _FUN[n] : (_SVG[n] || '');
  });
  const si = document.querySelector('.sign-icon');
  if (si) si.innerHTML = fun ? '🚪' : _SVG.signout;
  const mark = document.querySelector('.sidebar-logo-mark');
  if (mark) mark.textContent = '🍽';
  const mb = document.querySelector('.sidebar-toggle');
  if (mb) mb.textContent = '☰';
  _refreshColBtn();
}

function _refreshColBtn() {
  const btn = document.getElementById('sidebar-collapse-btn');
  if (!btn) return;
  const col = document.getElementById('sidebar')?.classList.contains('collapsed');
  btn.innerHTML = col ? _SVG.expand : _SVG.collapse;
}

// ── COLLAPSE ──
function toggleSidebarCollapse() {
  const sb = document.getElementById('sidebar');
  const ly = document.getElementById('sidebar-layout');
  const c = sb.classList.toggle('collapsed');
  ly?.classList.toggle('collapsed', c);
  localStorage.setItem('sidebar-collapsed', c);
  _refreshColBtn();
}

function openSidebar() {
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('sidebar-overlay')?.classList.add('show');
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('show');
}

// ── USER MENU ──
function toggleUserMenu(e) {
  e?.stopPropagation();
  document.getElementById('user-info-btn')?.classList.toggle('open');
  document.getElementById('user-dropdown')?.classList.toggle('show');
}
document.addEventListener('click', e => {
  if (!e.target.closest('#user-info-btn') && !e.target.closest('#user-dropdown')) {
    document.getElementById('user-info-btn')?.classList.remove('open');
    document.getElementById('user-dropdown')?.classList.remove('show');
  }
});

window.addEventListener('pageshow', e => { if (e.persisted) window.location.reload(); });

// ── SETTINGS MODAL ──────────────────────────────────────────────────────────


function openSettings() {
  document.getElementById('settings-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'settings-modal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);padding:16px;
  `;
  modal.innerHTML = `
    <div style="background:var(--bg2,#1a1f2e);border:1px solid var(--border,#2a2f3e);border-radius:16px;
      padding:28px;width:100%;max-width:420px;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <h2 style="margin:0;font-size:17px;color:var(--text,#E8E4DC)">Settings</h2>
        <button onclick="document.getElementById('settings-modal').remove()"
          style="background:none;border:none;color:var(--text2,#b0b5c4);font-size:20px;cursor:pointer;line-height:1">×</button>
      </div>

      <div id="s-msg" style="font-size:13px;font-family:monospace;margin-bottom:12px;display:none"></div>

      <button onclick="_saveSettings()"
        style="width:100%;background:var(--accent,#6e8efb);color:#fff;border:none;border-radius:8px;
          padding:11px;font-size:14px;font-weight:500;cursor:pointer;">
        Save Settings
      </button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

async function _saveSettings() {
  const token = _getToken();
  if (!token) { _showSettingsMsg('Not logged in', 'error'); return; }

  try {
    const res = await fetch('/api/user-preferences', {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      _showSettingsMsg('Settings saved!', 'success');
      setTimeout(() => document.getElementById('settings-modal')?.remove(), 1200);
    } else {
      _showSettingsMsg('Save failed — try again.', 'error');
    }
  } catch(e) {
    _showSettingsMsg('Network error.', 'error');
  }
}

function _showSettingsMsg(text, type) {
  const el = document.getElementById('s-msg');
  if (!el) return;
  el.textContent = text;
  el.style.color = type === 'error' ? '#f87171' : '#7bcf8e';
  el.style.display = 'block';
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  // Restore collapse
  if (localStorage.getItem('sidebar-collapsed') === 'true') {
    document.getElementById('sidebar')?.classList.add('collapsed');
    document.getElementById('sidebar-layout')?.classList.add('collapsed');
  }

  // Build dropdown items: theme switcher + settings + sign out
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown && !dropdown.querySelector('.theme-switcher')) {
    // Separator
    const sep = document.createElement('div');
    sep.className = 'dd-sep';
    dropdown.appendChild(sep);

    // Theme switcher
    const sw = document.createElement('div');
    sw.className = 'theme-switcher';
    [['dark','Dark'],['light','Light'],['fun','Fun']].forEach(([t, lbl]) => {
      const b = document.createElement('button');
      b.className = 'theme-btn'; b.dataset.theme = t; b.textContent = lbl;
      b.onclick = e => { e.stopPropagation(); setTheme(t); _saveThemeToServer(t); };
      sw.appendChild(b);
    });
    dropdown.appendChild(sw);

    // Settings button
    const sb = document.createElement('button');
    sb.id = 'sidebar-settings-btn';
    sb.title = 'Settings';
    sb.innerHTML = `<span style="width:15px;height:15px;display:inline-flex">${_SVG.settings}</span> Settings`;
    sb.onclick = e => { e.stopPropagation(); openSettings(); };
    dropdown.appendChild(sb);

    // Sign out button
    const so = document.createElement('button');
    so.className = 'signout-btn';
    so.innerHTML = `<span class="sign-icon" style="width:15px;height:15px;display:inline-flex"></span> <span class="sign-label">Sign out</span>`;
    so.onclick = e => { e.stopPropagation(); Auth.signOut(); };
    dropdown.appendChild(so);
  }

  // Apply saved theme (also calls _updateIcons)
  setTheme(getTheme());
  _loadPrefsFromServer(); // sync from server (no flash: localStorage applied first)

  // Last updated
  const el = document.getElementById('last-updated-date');
  if (el) {
    try {
      const d = new Date(document.lastModified);
      if (d && !isNaN(d.getTime()) && d.getFullYear() > 2020) {
        el.textContent = 'Last updated ' + d.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' });
        return;
      }
    } catch(e) {}
    el.textContent = 'Last updated March 2026';
  }
});
