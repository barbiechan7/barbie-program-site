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

- 現在、**第0章〜第7章（全43レッスン）** を収録しています。第8章を追加する場合は
  `build/course-data.js` に章データを足して `node build/build.js` を実行してください
  （下記「サイトの編集方法」参照）
- 動画埋め込み枠・ワークシートDLリンクは、現在プレースホルダーです。
  実際のYouTube限定公開URLやPDFファイルへのリンクに差し替えてください
- 学習の進捗（完了チェック・進捗バー・「続きから学習する」）は、閲覧者の
  ブラウザ内（localStorage）に保存されます。端末をまたいだ同期はされません

---

## サイトの編集方法（重要）

`index.html` / `workbook.html` / `lessons/*.html` は **自動生成ファイル**です。直接編集しないでください。

1. 内容を編集する
   - 章・レッスン・本文・ワークシートのタイトル → `build/course-data.js`
   - ワークシートの記入欄（問い） → `build/worksheets-data.js`
2. リポジトリのルートで `node build/build.js` を実行
3. `index.html` `workbook.html` `lessons/*.html` が再生成される
4. まとめて commit / push すると Netlify が再デプロイ

共通のデザインは `style.css`、ログインゲート・進捗・ワークブックの自動保存ロジックは `assets/app.js` にあります。

- 学習の進捗、ワークブックの記入内容は、いずれも閲覧者のブラウザ（localStorage）に保存され、端末間では同期されません。
- ワークブックはブラウザの「印刷」で手書き用にも出力できます（印刷用CSSあり）。
