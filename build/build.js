/* =====================================================================
   会員サイト ジェネレーター
   使い方:  node build/build.js
   出力:    index.html / lessons/{章}-{番}.html  をすべて再生成
   入力:    build/course-data.js
   ===================================================================== */
const fs = require("fs");
const path = require("path");
const COURSE = require("./course-data.js");
const WS = require("./worksheets-data.js");

const ROOT = path.join(__dirname, "..");
const LESSONS_DIR = path.join(ROOT, "lessons");

const BRAND = '一生ダイエッター<span>卒業プログラム</span>';
const YEAR = 2026;

/* ---- フラットなレッスン列（前後ナビ用） ---- */
const FLAT = [];
COURSE.chapters.forEach((ch) => {
  ch.lessons.forEach((ls) => {
    FLAT.push({ ch, ls, id: ch.n + "-" + ls.n });
  });
});

/* ---- 共通パーツ ---- */
function head(title, cssHref) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link rel="stylesheet" href="${cssHref}">
</head>
<body>

<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>

<div class="gate-screen" id="gateScreen">
  <div class="gate-box">
    <div class="brand">${BRAND}</div>
    <h1>会員限定ページです</h1>
    <p>登録済みのメールアドレスとパスワードでログインしてください。</p>
    <button class="wbtn" onclick="bpLogin()">ログイン</button>
  </div>
</div>
`;
}

function sidebar(prefix, activeKey) {
  // activeKey: "home" | "content" | "ch{n}" | "lesson:{id}"
  const chapterLinks = COURSE.chapters
    .map((ch) => {
      const key = "ch" + ch.n;
      const active = activeKey === key ? " active" : "";
      return `      <a class="side-link${active}" href="${prefix}index.html#ch${ch.n}"><span class="ic">💗</span>第${ch.n}章　${ch.title}</a>`;
    })
    .join("\n");

  return `<div class="scrim" id="scrim"></div>
<aside class="sidebar" id="sidebar">
  <a class="brand" href="${prefix}index.html">${BRAND}</a>

  <nav class="side-nav">
    <div class="side-group">メイン</div>
    <a class="side-link${activeKey === "home" ? " active" : ""}" href="${prefix}index.html"><span class="ic">💗</span>ホーム</a>
    <a class="side-link${activeKey === "content" ? " active" : ""}" href="${prefix}index.html#dashboard"><span class="ic">💗</span>学習コンテンツ</a>
    <a class="side-link${activeKey === "workbook" ? " active" : ""}" href="${prefix}workbook.html"><span class="ic">💗</span>ワークブック</a>

    <div class="side-group">全9パート</div>
${chapterLinks}
  </nav>

  <div class="sidebar-foot">
    <a href="${prefix}index.html">レッスン一覧に戻る</a>
    <a onclick="bpLogout()">ログアウト</a>
  </div>
</aside>`;
}

function mobilebar() {
  return `<div class="mobilebar">
  <button class="hamb" id="hamb" aria-label="メニュー">☰</button>
  <div class="brand">${BRAND}</div>
  <span style="width:38px"></span>
</div>`;
}

function footScripts() {
  return `<footer>
  © ${YEAR} 一生ダイエッター卒業プログラム　無断転載・再配布を禁じます。
</footer>

</div>

<script src="assets/app.js"></script>
</body>
</html>
`;
}
function footScriptsLesson() {
  return `<footer>
  © ${YEAR} 一生ダイエッター卒業プログラム　無断転載・再配布を禁じます。
</footer>

</div>

<script src="../assets/app.js"></script>
</body>
</html>
`;
}

/* ---- index.html ---- */
function buildIndex() {
  const roadmap = COURSE.chapters
    .map((ch) => {
      return `    <div class="rm-step todo" data-step="${ch.n}">
      <a href="#ch${ch.n}">
        <span class="rm-dot">${ch.n}</span>
        <span class="rm-label">第${ch.n}章<br>${ch.title}</span>
        <span class="rm-count">0/${ch.lessons.length}</span>
      </a>
    </div>`;
    })
    .join("\n");

  const chapters = COURSE.chapters
    .map((ch) => {
      const rows = ch.lessons
        .map((ls) => {
          const id = ch.n + "-" + ls.n;
          return `      <a href="lessons/${id}.html" style="display:block">
        <div class="lesson-row" data-lesson="${id}">
          <span class="lr-icon">${ls.n}</span>
          <span class="lr-body">
            <span class="lr-kicker">第${ch.n}章　${ch.kicker}　${ls.mark}</span>
            <span class="lr-title">${ls.title}</span>
          </span>
          <span class="lr-type">${ls.type}</span>
          <span class="lr-go">›</span>
        </div>
      </a>`;
        })
        .join("\n");

      return `  <section class="chapter" id="ch${ch.n}" data-chapter="${ch.n}">
    <button class="chapter-head" type="button">
      <span class="chapter-badge">${ch.n}</span>
      <span class="chapter-meta">
        <span class="ch-title">第${ch.n}章　${ch.title}</span>
        <span class="ch-sub">${ch.subtitle}</span>
      </span>
      <span class="chapter-count">0/${ch.lessons.length} 完了</span>
      <span class="chapter-chevron">▾</span>
    </button>
    <div class="chapter-body">
${rows}
    </div>
  </section>`;
    })
    .join("\n\n");

  const total = FLAT.length;

  return (
    head(
      "一生ダイエッター卒業プログラム｜会員ページ",
      "style.css"
    ) +
    `
<div id="siteContent" style="display:none">
<div class="app">
${mobilebar()}
${sidebar("", "home")}

<main class="main" id="dashboard">

  <div class="course-head">
    <h1>${COURSE.title}</h1>
    <p>${COURSE.description}</p>
    <div class="progress-row">
      <span class="progress-track"><span class="progress-fill"></span></span>
      <span class="progress-label">0/${total} (0%)</span>
    </div>
    <a class="resume-card" id="resumeCard" href="lessons/0-1.html">
      <span>
        <span class="rc-eyebrow">はじめる</span><br>
        <span class="rc-title">この講座の進め方</span>
      </span>
      <span class="rc-arrow">→</span>
    </a>
  </div>

  <div class="roadmap-wrap">
    <h2>学習ロードマップ</h2>
    <div class="roadmap">
${roadmap}
    </div>
  </div>

${chapters}

</main>
</div>
</div>

` +
    footScripts()
  );
}

/* ---- lesson page ---- */
function buildLesson(idx) {
  const { ch, ls, id } = FLAT[idx];
  const prev = idx > 0 ? FLAT[idx - 1] : null;
  const next = idx < FLAT.length - 1 ? FLAT[idx + 1] : null;

  const ws = ls.worksheet
    ? `
  <a class="worksheet-card" href="../workbook.html#wb-${id}">
    <div>
      <div class="wtitle">💗 ${ls.worksheet.title}</div>
      <div class="wnote">${ls.worksheet.note}</div>
    </div>
    <span class="wbtn">ワークを開く →</span>
  </a>
`
    : "";

  function navLink(item, dir) {
    if (!item)
      return dir === "prev"
        ? `<a href="../index.html"><span class="dir">← 戻る</span>トップページ</a>`
        : `<a href="../index.html" class="next"><span class="dir">修了 →</span>トップページに戻る</a>`;
    const label = dir === "prev" ? "← 前のレッスン" : "次のレッスン →";
    const cls = dir === "next" ? ' class="next"' : "";
    return `<a href="${item.id}.html"${cls}><span class="dir">${label}</span>${item.ls.title}</a>`;
  }

  return (
    head(`${ls.title}｜一生ダイエッター卒業プログラム`, "../style.css") +
    `
<div id="siteContent" style="display:none">
<div class="app">
${mobilebar()}
${sidebar("../", "ch" + ch.n)}

<main class="main">
  <div class="breadcrumb">
    <a href="../index.html#dashboard">学習コンテンツ</a>
    <span class="sep">/</span>
    <a href="../index.html#ch${ch.n}">第${ch.n}章　${ch.title}</a>
    <span class="sep">/</span>
    <span>${ls.title}</span>
  </div>

  <div class="lesson-shell">
    <div class="lesson-kicker">第${ch.n}章　${ch.kicker}　${ls.mark}</div>
    <h1>${ls.title}</h1>

    <div class="video-frame">
      <div>
        <div class="play"></div>
        <div class="placeholder-text">動画はこちらに公開されます</div>
      </div>
    </div>
    <p class="video-caption">※ 動画は限定公開のYouTubeリンクに差し替えてください（現在プレースホルダー）</p>

    <div class="article">
${ls.article}
    </div>
${ws}
    <div class="complete-bar" id="completeBar" data-lesson="${id}">
      <span class="cb-text">動画を見て、ワークに取り組めたら、完了にしておきましょう。</span>
      <button class="complete-btn" type="button">このレッスンを完了にする</button>
    </div>

    <div class="lesson-nav">
      ${navLink(prev, "prev")}
      ${navLink(next, "next")}
    </div>
  </div>

</main>
</div>
</div>

` +
    footScriptsLesson()
  );
}

/* ---- workbook.html（ワークシート一括ページ） ---- */
function buildWorkbook() {
  const esc = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const chapterBlocks = COURSE.chapters
    .map((ch) => {
      const cards = ch.lessons
        .filter((ls) => ls.worksheet && WS[ch.n + "-" + ls.n])
        .map((ls) => {
          const id = ch.n + "-" + ls.n;
          const w = WS[id];
          const fields = w.fields
            .map((f, i) => {
              const rows = f.rows || 2;
              return `        <label class="wb-field">
          <span class="wb-flabel">${esc(f.label)}</span>
          <textarea rows="${rows}" data-wb="${id}" data-wf="${i}" placeholder="ここに書いてみましょう"></textarea>
        </label>`;
            })
            .join("\n");
          return `      <article class="wb-card" id="wb-${id}">
        <div class="wb-head">
          <span class="wb-badge">第${ch.n}章 ${ls.mark}</span>
          <h3 class="wb-title">💗 ${esc(ls.worksheet.title)}</h3>
        </div>
        <p class="wb-intro">${esc(w.intro)}</p>
${fields}
        <div class="wb-foot">
          <a class="wb-lesson-link" href="lessons/${id}.html">▶ このワークの動画・解説を見る</a>
          <span class="wb-saved" data-wb-saved="${id}"></span>
        </div>
      </article>`;
        })
        .join("\n");
      if (!cards) return "";
      return `  <section class="wb-chapter" id="wbch-${ch.n}">
    <h2 class="wb-chapter-title"><span class="wb-chapter-num">第${ch.n}章</span>${ch.title}<span class="wb-chapter-sub">${ch.subtitle}</span></h2>
${cards}
  </section>`;
    })
    .filter(Boolean)
    .join("\n\n");

  const toc = COURSE.chapters
    .map(
      (ch) =>
        `<a href="#wbch-${ch.n}">第${ch.n}章 ${ch.title}</a>`
    )
    .join("");

  return (
    head("ワークブック｜一生ダイエッター卒業プログラム", "style.css") +
    `
<div id="siteContent" style="display:none">
<div class="app">
${mobilebar()}
${sidebar("", "workbook")}

<main class="main">
  <div class="course-head wb-hero">
    <h1>💗 ワークブック</h1>
    <p>各章のワークを、このページにまとめています。書き込んだ内容は、この端末のブラウザに自動保存されます（他の端末とは同期されません）。印刷して手書きで取り組んでも大丈夫です。</p>
    <div class="wb-toolbar">
      <button class="wb-print" type="button" onclick="window.print()">🖨 印刷する</button>
      <span class="wb-autosave-note">入力すると自動保存されます</span>
    </div>
    <nav class="wb-toc">${toc}</nav>
  </div>

${chapterBlocks}

</main>
</div>
</div>

` +
    footScripts()
  );
}

/* ---- 実行 ---- */
fs.writeFileSync(path.join(ROOT, "index.html"), buildIndex());
console.log("✓ index.html");

fs.writeFileSync(path.join(ROOT, "workbook.html"), buildWorkbook());
console.log("✓ workbook.html");

if (!fs.existsSync(LESSONS_DIR)) fs.mkdirSync(LESSONS_DIR);
FLAT.forEach((_, i) => {
  const id = FLAT[i].id;
  fs.writeFileSync(path.join(LESSONS_DIR, id + ".html"), buildLesson(i));
  console.log("✓ lessons/" + id + ".html");
});

console.log("\n完了：" + FLAT.length + " レッスン + index.html + workbook.html を生成しました。");
