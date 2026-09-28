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
  const supabaseUrl = Netlify.env.get("SUPABASE_URL");
  const supabaseAnonKey = Netlify.env.get("SUPABASE_ANON_KEY");

  // 設定が未入力のときは「開ける」のではなく「閉じる」。
  // 設定ミスで中身が丸見えになる事故を防ぐため。
  if (!supabaseUrl || !supabaseAnonKey) {
    return toLogin(request, "setup");
  }

  const token = context.cookies.get("bp-token");
  if (!token) {
    return toLogin(request);
  }

  let ok = false;
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
    });
    ok = res.ok;
  } catch (_e) {
    // Supabase に届かなかったときも閉じる（安全側に倒す）
    ok = false;
  }

  if (!ok) {
    return toLogin(request);
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
