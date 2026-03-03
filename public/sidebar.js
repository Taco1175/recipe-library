// ── SIDEBAR: shared across all pages — theme switcher + nav icons ──

const _SVG = {
  collapse: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 12L6 8l4-4"/></svg>',
  expand:   '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4l4 4-4 4"/></svg>',
  library:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="3" width="3" height="10" rx="0.5"/><rect x="7" y="3" width="3" height="10" rx="0.5"/><rect x="11" y="3" width="3" height="10" rx="0.5"/></svg>',
  planner:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M5 2v2M11 2v2M2 7h12"/></svg>',
  fridge:   '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="1.5" width="10" height="13" rx="1.5"/><path d="M3 7h10M6 4v1.5M6 9.5v3"/></svg>',
  share:    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="3" r="1.5"/><circle cx="12" cy="13" r="1.5"/><circle cx="3" cy="8" r="1.5"/><path d="M4.4 7.3L10.7 3.9M4.4 8.7l6.3 3.4"/></svg>',
  tutorial: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5v.5"/></svg>',
  signout:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M10 11l3-3-3-3M13 8H6"/></svg>',
  add:      '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v10M3 8h10"/></svg>',
  bulk:     '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><path d="M11.5 9v6M9 11.5h5"/></svg>',
  image:    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="3" width="12" height="10" rx="1.5"/><circle cx="5.5" cy="6.5" r="1"/><path d="M2 11l3.5-3 3 2.5 2.5-2 3 3"/></svg>',
};

// Fun mode uses emojis instead of SVGs
const _FUN = { library:'📚', planner:'📅', fridge:'🥦', share:'👥', tutorial:'✨', add:'＋', bulk:'📦', image:'🖼' };

// ── THEME ──
function getTheme() { return localStorage.getItem('mp-theme') || 'dark'; }

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
  const si = document.querySelector('.sidebar-signout .sign-icon');
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

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  // Restore collapse
  if (localStorage.getItem('sidebar-collapsed') === 'true') {
    document.getElementById('sidebar')?.classList.add('collapsed');
    document.getElementById('sidebar-layout')?.classList.add('collapsed');
  }

  // Build theme switcher and insert before user-info in footer
  const footer = document.querySelector('.sidebar-footer');
  if (footer && !footer.querySelector('.theme-switcher')) {
    const sw = document.createElement('div');
    sw.className = 'theme-switcher';
    [['dark','Dark'],['light','Light'],['fun','Fun']].forEach(([t, lbl]) => {
      const b = document.createElement('button');
      b.className = 'theme-btn'; b.dataset.theme = t; b.textContent = lbl;
      b.onclick = () => setTheme(t);
      sw.appendChild(b);
    });
    const ui = footer.querySelector('.user-info');
    if (ui) footer.insertBefore(sw, ui); else footer.prepend(sw);
  }

  // Apply saved theme (also calls _updateIcons)
  setTheme(getTheme());

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
