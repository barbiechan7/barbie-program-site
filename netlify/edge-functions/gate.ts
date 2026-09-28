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
  // 接続先と anon 鍵は「公開して構わない値」で、assets/supabase-config.js にも同じものが入っている。
  // Netlify の環境変数の貼り間違いで止まらないよう、ここに直接持つ。
  // （service_role など秘密の鍵は、絶対にここへ書かない）
  // 変更するときは assets/supabase-config.js と、下の2行を同じ値にそろえること。
  const supabaseUrl = "https://csbmijlryhzzhaziitpc.supabase.co";
  const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzYm1pamxyeWh6emhhemlpdHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NjkyNjYsImV4cCI6MjEwNjE0NTI2Nn0.uhpNmKfnO7_jrdjr1Ki5e34fYIC1QiqPH_qHrhz3wqY";

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
    if (!ok) {
      // Supabase が返した理由の頭だけ（英数字のみ・短く）。原因の特定用
      const body = await res.text();
      netErr = body.replace(/[^A-Za-z]/g, "").slice(0, 40);
    }
  } catch (e) {
    // Supabase に届かなかったときも閉じる（安全側に倒す）
    ok = false;
    status = -1;
    netErr = String((e && (e as Error).name) || "err").replace(/[^A-Za-z0-9]/g, "").slice(0, 16) +
      "-" + String((e && (e as Error).message) || "").replace(/https?:\/\/\S+/g, "URL").replace(/[^A-Za-z0-9]/g, "").slice(0, 40);
  }

  if (!ok) {
    // 印はあったのに通らなかった → 応答コードをログイン画面に伝える（原因の特定用）
    return toLogin(request, status === -1 ? "net-" + netErr : "token-" + status + (netErr ? "-" + netErr : ""));
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
