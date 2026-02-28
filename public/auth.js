// Shared auth module — include on every page
// Usage: <script src="/auth.js"></script>
// Then call: await Auth.require() at page load to guard the page

const Auth = (() => {
  const SUPABASE_URL = window.__SUPABASE_URL__ || "";
  const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__ || "";

  function getSession() {
    return {
      accessToken: localStorage.getItem("sb-access-token"),
      refreshToken: localStorage.getItem("sb-refresh-token"),
      expiry: parseInt(localStorage.getItem("sb-token-expiry") || "0"),
      user: JSON.parse(localStorage.getItem("sb-user") || "null"),
    };
  }

  function saveSession(data) {
    localStorage.setItem("sb-access-token", data.access_token || "");
    localStorage.setItem("sb-refresh-token", data.refresh_token || "");
    localStorage.setItem("sb-token-expiry", Date.now() + ((data.expires_in || 3600) * 1000));
    if (data.user) localStorage.setItem("sb-user", JSON.stringify(data.user));
  }

  function clearSession() {
    ["sb-access-token","sb-refresh-token","sb-token-expiry","sb-user"].forEach(k => localStorage.removeItem(k));
  }

  async function refreshToken() {
    const { refreshToken } = getSession();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const data = await res.json();
      if (data.access_token) { saveSession(data); return true; }
      return false;
    } catch(e) { return false; }
  }

  async function getToken() {
    const session = getSession();
    if (!session.accessToken) return null;
    // Refresh if expiring within 2 minutes
    if (Date.now() > session.expiry - 120000) {
      const ok = await refreshToken();
      if (!ok) { clearSession(); return null; }
    }
    return localStorage.getItem("sb-access-token");
  }

  // Returns fetch headers with auth token for API calls
  async function headers() {
    const token = await getToken();
    if (!token) return null;
    return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
  }

  // Redirect to login if not authenticated
  async function require() {
    const token = await getToken();
    if (!token) {
      const next = encodeURIComponent(location.pathname + location.search);
      location.href = `/login.html?next=${next}`;
      return false;
    }
    return true;
  }

  async function signOut() {
    const token = await getToken();
    if (token) {
      fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "apikey": SUPABASE_ANON_KEY }
      }).catch(() => {});
    }
    clearSession();
    location.href = "/login.html";
  }

  function getUser() {
    return JSON.parse(localStorage.getItem("sb-user") || "null");
  }

  // Handle OAuth callback hash on any page
  function handleCallback() {
    const hash = location.hash;
    if (!hash.includes("access_token")) return false;
    const params = new URLSearchParams(hash.slice(1));
    saveSession({
      access_token: params.get("access_token"),
      refresh_token: params.get("refresh_token"),
      expires_in: parseInt(params.get("expires_in") || "3600"),
    });
    history.replaceState({}, "", location.pathname);
    return true;
  }

  return { require, signOut, getToken, headers, getUser, saveSession, handleCallback };
})();
