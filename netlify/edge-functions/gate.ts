// 会員限定ページの関所
//
// やっていること:
//   1. ブラウザが持っている「ログイン済みの印」(bp-token) を受け取る
//   2. それが本物かを Supabase に問い合わせる
//   3. 本物なら中身を返す。そうでなければログインページへ送る
//
// 大事な点: 2 を通らなかったリクエストには、ページの中身を一切返さない。

import type { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  // 貼り付け時に混ざりやすい前後の空白・改行は取り除く
  const supabaseUrl = (Netlify.env.get("SUPABASE_URL") || "").trim().replace(/\/+$/, "");
  const supabaseAnonKey = (Netlify.env.get("SUPABASE_ANON_KEY") || "").trim();

  // 設定が未入力のときは「開ける」のではなく「閉じる」。
  // 設定ミスで中身が丸見えになる事故を防ぐため。
  if (!supabaseUrl || !supabaseAnonKey) {
    // どちらが読めていないかを、ログイン画面に伝える（原因の特定用）
    const reason = !supabaseUrl && !supabaseAnonKey ? "setup-both"
      : !supabaseUrl ? "setup-url" : "setup-key";
    return toLogin(request, reason);
  }

  // 値の取り違え・貼り間違いを、ログイン画面で分かるようにする（値そのものは出さない）
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)) {
    return toLogin(request, "setup-url-format");
  }
  if (!/^(eyJ|sb_publishable_)/.test(supabaseAnonKey)) {
    return toLogin(request, "setup-key-format");
  }
  // 鍵に、途中の改行・空白・全角文字などが混ざっていないか
  if (!/^[A-Za-z0-9._-]+$/.test(supabaseAnonKey)) {
    return toLogin(request, "setup-key-chars");
  }

  // URL のプロジェクトIDが、鍵（anon）に入っているプロジェクトIDと一致するか
  try {
    const b64 = supabaseAnonKey.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const ref = JSON.parse(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4))).ref;
    const host = new URL(supabaseUrl).hostname.split(".")[0];
    if (ref && host !== ref) {
      return toLogin(request, "setup-url-mismatch");
    }
  } catch (_e) {
    // 鍵の形式が想定と違う場合は、ここでは判定せず先へ進む
  }

  const token = context.cookies.get("bp-token");
  if (!token) {
    return toLogin(request);
  }

  let ok = false;
  let status = 0;
  let netErr = "";
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
    });
    ok = res.ok;
    status = res.status;
  } catch (e) {
    // Supabase に届かなかったときも閉じる（安全側に倒す）
    ok = false;
    status = -1;
    netErr = String((e && (e as Error).name) || "err").replace(/[^A-Za-z0-9]/g, "").slice(0, 16) +
      "-" + String((e && (e as Error).message) || "").replace(/https?:\/\/\S+/g, "URL").replace(/[^A-Za-z0-9]/g, "").slice(0, 40);
  }

  if (!ok) {
    // 印はあったのに通らなかった → 応答コードをログイン画面に伝える（原因の特定用）
    return toLogin(request, status === -1 ? "net-" + netErr : "token-" + status);
  }

  // ここまで来たら本人確認ができている。中身を返す。
  const response = await context.next();
  const gated = new Response(response.body, response);
  // 会員向けの中身を、途中のキャッシュに残させない
  gated.headers.set("Cache-Control", "private, no-store");
  return gated;
};

function toLogin(request: Request, reason?: string) {
  const here = new URL(request.url);
  const login = new URL("/login.html", request.url);
  // ログイン後に、見ようとしていたページへ戻すため
  login.searchParams.set("next", here.pathname + here.search);
  if (reason) login.searchParams.set("reason", reason);
  return Response.redirect(login.toString(), 302);
}
