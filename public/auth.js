// Shared Supabase auth helper — included on every page
const Auth = (() => {
  const API = "/.netlify/functions";
  let _url = "", _key = "", _token = null, _user = null;

  async function init() {
    if (!_url) {
      try {
        const cfg = await fetch(`${API}/config`).then(r => r.json());
        _url = cfg.supabaseUrl;
        _key = cfg.supabaseAnonKey;
      } catch(e) { console.error("Auth config failed", e); return false; }
    }

    // Handle OAuth hash callback
    if (location.hash.includes("access_token")) {
      const params = new URLSearchParams(location.hash.slice(1));
      const session = {
        access_token: params.get("access_token"),
        refresh_token: params.get("refresh_token"),
        expires_in: parseInt(params.get("expires_in") || "3600"),
      };
      try {
        const res = await fetch(`${_url}/auth/v1/user`, {
          headers: { "Authorization": `Bearer ${session.access_token}`, "apikey": _key }
        });
        session.user = await res.json();
      } catch(e) {}
      _save(session);
      history.replaceState({}, "", location.pathname);
      return true;
    }

    // Restore from localStorage
    const token = localStorage.getItem("sb-access-token");
    const expiry = parseInt(localStorage.getItem("sb-token-expiry") || "0");
    const refresh = localStorage.getItem("sb-refresh-token");

    if (token && Date.now() < expiry - 60000) {
      _token = token;
      try { _user = JSON.parse(localStorage.getItem("sb-user") || "null"); } catch(e) {}
      return true;
    }

    // Token expired or missing — try refresh
    if (refresh) {
      const ok = await _refresh(refresh);
      if (ok) return true;
    }

    return false;
  }

  async function _refresh(refreshToken) {
    if (!_url) return false;
    try {
      const res = await fetch(`${_url}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": _key },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const data = await res.json();
      if (data.error || !data.access_token) {
        // Refresh token invalid — clear storage
        localStorage.removeItem("sb-refresh-token");
        return false;
      }
      // Fetch user info if not included
      if (!data.user) {
        try {
          const ur = await fetch(`${_url}/auth/v1/user`, {
            headers: { "Authorization": `Bearer ${data.access_token}`, "apikey": _key }
          });
          data.user = await ur.json();
        } catch(e) {}
      }
      _save(data);
      return true;
    } catch(e) { return false; }
  }

  function _save(data) {
    _token = data.access_token;
    _user = data.user || null;
    localStorage.setItem("sb-access-token", data.access_token);
    localStorage.setItem("sb-refresh-token", data.refresh_token || "");
    localStorage.setItem("sb-token-expiry", Date.now() + ((data.expires_in || 3600) * 1000));
    localStorage.setItem("sb-user", JSON.stringify(_user));
  }

  function signOut() {
    localStorage.removeItem("sb-access-token");
    localStorage.removeItem("sb-refresh-token");
    localStorage.removeItem("sb-token-expiry");
    localStorage.removeItem("sb-user");
    _token = null; _user = null;
    location.href = "/login.html";
  }

  function getToken() { return _token; }
  function getUser() { return _user; }
  function getUrl() { return _url; }
  function getKey() { return _key; }

  async function requireAuth() {
    const ok = await init();
    if (!ok) {
      location.href = `/login.html?next=${encodeURIComponent(location.pathname)}`;
      return false;
    }
    return true;
  }

  // Alias so pages can call Auth.require()
  async function require() { return requireAuth(); }

  // Returns headers object for API calls
  async function headers() {
    const ok = await init();
    if (!ok) return null;
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${_token}`,
    };
  }

  return { init, require, requireAuth, signOut, getToken, getUser, getUrl, getKey, headers };
})();
