// ── Shared sidebar logic for all pages ──
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
      sl && sl.classList.add('collapsed');
      if (btn) btn.textContent = '▶';
    } else {
      sb.classList.remove('collapsed');
      sl && sl.classList.remove('collapsed');
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
    document.getElementById('user-dropdown')?.classList.toggle('show');
  };

  // Close dropdown on outside click
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.user-info')) {
      document.getElementById('user-dropdown')?.classList.remove('show');
    }
  });

  // Apply collapsed state immediately on load
  document.addEventListener('DOMContentLoaded', function() {
    applyCollapsed(isCollapsed());
  });

  // Force reload on browser back/forward cache
  window.addEventListener('pageshow', function(e) {
    if (e.persisted) window.location.reload();
  });
})();
