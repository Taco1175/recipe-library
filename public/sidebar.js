(function() {
  const COLLAPSED_KEY = 'sidebar-collapsed';

  function isCollapsed() { return localStorage.getItem(COLLAPSED_KEY) === '1'; }

  function applyCollapsed(collapsed) {
    const sb = document.getElementById('sidebar');
    const sl = document.getElementById('sidebar-layout');
    const btn = document.getElementById('sidebar-collapse-btn');
    if (!sb) return;
    if (collapsed) {
      sb.classList.add('collapsed');
      if (sl) sl.classList.add('collapsed');
      if (btn) btn.textContent = '▶';
    } else {
      sb.classList.remove('collapsed');
      if (sl) sl.classList.remove('collapsed');
      if (btn) btn.textContent = '◀';
    }
  }

  window.toggleSidebarCollapse = function() {
    const next = !isCollapsed();
    localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
    applyCollapsed(next);
  };

  window.openSidebar = function() {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebar-overlay')?.classList.add('show');
  };

  window.closeSidebar = function() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('show');
  };

  window.toggleUserMenu = function(e) {
    if (e) e.stopPropagation();
    const dd = document.getElementById('user-dropdown');
    const btn = document.getElementById('user-info-btn');
    const isOpen = dd?.classList.toggle('show');
    btn?.classList.toggle('open', isOpen);
  };

  // Close dropdown on outside click
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.user-info') && !e.target.closest('.user-dropdown')) {
      document.getElementById('user-dropdown')?.classList.remove('show');
      document.getElementById('user-info-btn')?.classList.remove('open');
    }
  });

  // Apply collapsed state on load
  document.addEventListener('DOMContentLoaded', function() {
    applyCollapsed(isCollapsed());
  });

  // Never cache HTML — force fresh on back/forward
  window.addEventListener('pageshow', function(e) {
    if (e.persisted) window.location.reload();
  });
})();

// ── Last updated date ──
(function() {
  function setLastUpdated() {
    const el = document.getElementById('last-updated-date');
    if (!el) return;
    // Use the HTML file's last-modified header as a proxy for deploy date
    // Falls back to document.lastModified (local dev)
    try {
      const d = new Date(document.lastModified);
      if (d && !isNaN(d.getTime()) && d.getFullYear() > 2020) {
        el.textContent = 'Last updated ' + d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        return;
      }
    } catch(e) {}
    el.textContent = 'Last updated March 2026';
  }
  document.addEventListener('DOMContentLoaded', setLastUpdated);
})();
