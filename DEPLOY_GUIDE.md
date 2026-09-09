# 公開手順（GitHub → Netlify → ログイン設定）

このサイトは、GitHub Pagesではなく **Netlify** にホスティングします。
（GitHub Pagesは静的ファイルしか置けず、ログイン機能を持てないため）

---

## ステップ1：GitHubにリポジトリを作る

1. https://github.com/new でリポジトリを新規作成（例：`barbie-program-site`）
2. このフォルダの中身（`index.html`, `style.css`, `lessons/`, `netlify.toml`）をアップロード
   - Gitに慣れていない場合は、GitHubのリポジトリページ上部の「Add file」→「Upload files」から、
     フォルダの中身をそのままドラッグ＆ドロップでOKです

---

## ステップ2：Netlifyでサイトを作る

1. https://app.netlify.com にアクセスし、GitHubアカウントでログイン
2. 「Add new site」→「Import an existing project」を選択
3. 先ほど作ったGitHubリポジトリを選択
4. Build settings はそのまま（Build command は空欄、Publish directory は `.`）でOK
5. 「Deploy site」をクリック

数十秒〜数分で、`https://ランダムな名前.netlify.app` のようなURLが発行されます。
（サイト設定の「Site name」から、好きな名前に変更できます）

---

## ステップ3：Identity（ログイン機能）を有効にする

1. Netlifyのサイト管理画面 →「Site configuration」→「Identity」
2. 「Enable Identity」をクリック
3. 「Registration preferences」を **「Invite only（招待制）」** に変更
   - これをやらないと、誰でも自分でメールアドレスを登録してアクセスできてしまいます
4. 必要であれば「Emails」タブから、招待メールの文面を日本語向けにカスタマイズ可能

---

## ステップ4：購入者を招待する

1. 「Identity」タブ →「Invite users」
2. 購入者のメールアドレスを入力して招待を送信
3. 購入者にNetlifyから招待メールが届く
4. 購入者がメール内のリンクからパスワードを設定
5. 設定後、サイトにアクセスすると自動的にログイン状態になり、中身が見られるようになります

---

## 独自ドメインを使いたい場合

「Site configuration」→「Domain management」から、
お持ちのドメイン（例：barbiechan.com）を接続できます。

---

## 注意点

- 今回のプロトタイプは「第0章（6レッスン）」のみです。第1章以降を追加する際は、
  同じ `lessons/` フォルダに `1-1.html` のようなファイルを追加していく形になります
- 動画埋め込み枠・ワークシートDLリンクは、現在プレースホルダーです。
  実際のYouTube限定公開URLやPDFファイルへのリンクに差し替えてください
