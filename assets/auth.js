/* =====================================================================
   一生ダイエッター卒業プログラム — ログインの共通処理
   - ログイン状態を「印」(bp-token) としてブラウザに持たせる
   - その印を、サーバー側の関所（gate）が確かめる
   - 印は自動で更新される（ログインし直す手間をなくすため）
   ===================================================================== */
(function () {
  "use strict";

  var COOKIE = "bp-token";

  function configured() {
    return !!(window.BP_SUPABASE_URL && window.BP_SUPABASE_ANON_KEY);
  }

  function client() {
    if (!configured()) return null;
    if (!window.supabase || !window.supabase.createClient) return null;
    if (!window.__bpClient) {
      window.__bpClient = window.supabase.createClient(
        window.BP_SUPABASE_URL,
        window.BP_SUPABASE_ANON_KEY
      );
    }
    return window.__bpClient;
  }

  /* ---------- 「印」の出し入れ ---------- */
  function setToken(token, seconds) {
    var secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
      COOKIE + "=" + token +
      "; path=/; max-age=" + (seconds || 3600) +
      "; SameSite=Lax" + secure;
  }
  function clearToken() {
    var secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = COOKIE + "=; path=/; max-age=0; SameSite=Lax" + secure;
  }

  function syncFromSession(session) {
    if (session && session.access_token) {
      setToken(session.access_token, session.expires_in || 3600);
      return true;
    }
    clearToken();
    return false;
  }

  /* ---------- 外から使えるようにするもの ---------- */
  window.bpAuth = {
    client: client,
    configured: configured,
    syncFromSession: syncFromSession,
    clearToken: clearToken,
    loginUrl: function (next) {
      var u = "/login.html";
      if (next) u += "?next=" + encodeURIComponent(next);
      return u;
    }
  };

  window.bpLogout = function () {
    var c = client();
    clearToken();
    if (c) {
      c.auth.signOut().then(function () {
        location.href = "/login.html";
      });
    } else {
      location.href = "/login.html";
    }
  };

  /* ---------- 会員ページでの見張り ---------- */
  // 関所は通っているが、印の期限が近い場合に備えて更新し続ける。
  var c = client();
  if (c) {
    c.auth.onAuthStateChange(function (event, session) {
      if (event === "SIGNED_OUT") {
        clearToken();
        return;
      }
      syncFromSession(session);
    });
    c.auth.getSession().then(function (r) {
      var session = r && r.data ? r.data.session : null;
      syncFromSession(session);
    });
  }
})();
