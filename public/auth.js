// auth.js — PocketBase auth helper
// Replaces the Supabase auth.js. Include on every page before other scripts.
//
// PocketBase runs at the same origin (https://mealplannr.xyz).
// All API calls go to /api/... — no separate config fetch needed.

const Auth = (() => {
  const PB_URL = ""; // Same origin — PocketBase serves the frontend too
  const STORE_KEY = "pb_auth"; // Single localStorage key for the full session

  let _token = null;
  let _user  = null;
  let _model = null; // full PocketBase record

  // ── Internal helpers ──────────────────────────────────────────────────────

  function _load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return false;
      const { token, record } = JSON.parse(raw);
      if (!token || !record) return false;
      _token = token;
      _user  = record;
      _model = record;
      return true;
    } catch (e) { return false; }
  }

  function _save(token, record) {
    _token = token;
    _user  = record;
    _model = record;
    localStorage.setItem(STORE_KEY, JSON.stringify({ token, record }));
  }

  function _clear() {
    _token = null;
    _user  = null;
    _model = null;
    localStorage.removeItem(STORE_KEY);
  }

  // POST to PocketBase REST API (no SDK dependency — plain fetch)
  async function _pb(path, method = "GET", body = null, authToken = null) {
    const headers = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = authToken;
    const res = await fetch(`${PB_URL}/api/${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { _raw: text }; }
    return { ok: res.ok, status: res.status, data };
  }

  // ── Token validation ───────────────────────────────────────────────────────
  // PocketBase tokens are JWTs. We check expiry from the payload.
  function _tokenExpiry(token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return (payload.exp || 0) * 1000; // ms
    } catch { return 0; }
  }

  function _isValid(token) {
    return token && Date.now() < _tokenExpiry(token) - 30000; // 30s buffer
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async function init() {
    // 1. Handle OAuth2 redirect from PocketBase
    //    PocketBase redirects back with ?code=...&state=... handled via SDK flow.
    //    We store a pending flag and complete it here.
    const params = new URLSearchParams(location.search);
    if (params.has("code") && params.has("state")) {
      return await _completeOAuth(params);
    }

    // 2. Restore from storage
    if (!_load()) return false;

    // 3. Validate token — PocketBase tokens last 15 minutes by default.
    //    If expired, try to refresh.
    if (_isValid(_token)) return true;

    return await _refresh();
  }

  async function _refresh() {
    if (!_token) return false;
    try {
      const { ok, data } = await _pb("collections/users/auth-refresh", "POST", null, _token);
      if (!ok || !data.token) { _clear(); return false; }
      _save(data.token, data.record);
      return true;
    } catch { _clear(); return false; }
  }

  // Called when PocketBase redirects back after Google OAuth
  async function _completeOAuth(params) {
    const provider   = sessionStorage.getItem("pb_oauth_provider");
    const codeVerifier = sessionStorage.getItem("pb_oauth_verifier");
    const state      = sessionStorage.getItem("pb_oauth_state");

    if (!provider || !codeVerifier || params.get("state") !== state) {
      console.error("OAuth state mismatch or missing session data");
      return false;
    }

    try {
      const { ok, data } = await _pb(
        `collections/users/auth-with-oauth2`,
        "POST",
        {
          provider,
          code:         params.get("code"),
          codeVerifier,
          redirectUrl:  location.origin + "/login.html",
        }
      );
      if (!ok || !data.token) return false;
      _save(data.token, data.record);
      sessionStorage.removeItem("pb_oauth_provider");
      sessionStorage.removeItem("pb_oauth_verifier");
      sessionStorage.removeItem("pb_oauth_state");
      // Clean URL
      history.replaceState({}, "", location.pathname + (new URLSearchParams(location.search).get("next") ? "?next=" + new URLSearchParams(location.search).get("next") : ""));
      return true;
    } catch (e) {
      console.error("OAuth completion error", e);
      return false;
    }
  }

  // Initiate Google OAuth — stores PKCE verifier & state, then redirects
  async function signInWithGoogle() {
    try {
      // Step 1: Ask PocketBase for the list of OAuth2 providers to get
      // the authUrl, codeVerifier, and state for Google
      const { ok, data } = await _pb("collections/users/auth-methods");
      if (!ok) throw new Error("Could not load auth methods");

      const google = (data.oauth2?.providers || []).find(p => p.name === "google");
      if (!google) throw new Error("Google OAuth not configured in PocketBase");

      // Store PKCE data for the callback
      sessionStorage.setItem("pb_oauth_provider",  "google");
      sessionStorage.setItem("pb_oauth_verifier",  google.codeVerifier);
      sessionStorage.setItem("pb_oauth_state",     google.state);

      // Redirect to Google via PocketBase's authUrl
      location.href = google.authUrl;
    } catch (e) {
      console.error("Google sign-in error:", e);
      throw e;
    }
  }

  async function signInWithEmail(email, password) {
    const { ok, data } = await _pb("collections/users/auth-with-password", "POST", {
      identity: email,
      password,
    });
    if (!ok) throw new Error(data.message || "Sign in failed");
    _save(data.token, data.record);
    return data;
  }

  async function signUp(email, password, passwordConfirm) {
    const { ok, data } = await _pb("collections/users", "POST", {
      email,
      password,
      passwordConfirm,
    });
    if (!ok) throw new Error(data.message || "Sign up failed");
    // Auto sign in after registration
    return signInWithEmail(email, password);
  }

  async function requestPasswordReset(email) {
    const { ok, data } = await _pb("collections/users/request-password-reset", "POST", { email });
    if (!ok) throw new Error(data.message || "Reset request failed");
    return true;
  }

  function signOut() {
    _clear();
    location.href = "/login.html";
  }

  // Redirect to login if not authenticated
  async function require() {
    const ok = await init();
    if (!ok) {
      location.href = `/login.html?next=${encodeURIComponent(location.pathname)}`;
      return false;
    }
    return true;
  }

  // Returns headers for API calls to our backend proxy (backend/api/*.js)
  async function headers() {
    const ok = await init();
    if (!ok) return null;
    return {
      "Content-Type": "application/json",
      "Authorization": _token,
    };
  }

  function getToken()  { return _token; }
  function getUser()   { return _user; }
  function getModel()  { return _model; }

  return {
    init,
    require,
    signInWithEmail,
    signInWithGoogle,
    signUp,
    requestPasswordReset,
    signOut,
    getToken,
    getUser,
    getModel,
    headers,
  };
})();
