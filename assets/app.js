/* =====================================================================
   一生ダイエッター卒業プログラム 会員サイト — 共通スクリプト
   - Netlify Identity ログインゲート
   - 学習の進捗管理（localStorage・端末内のみ）
   - サイドバー（モバイルのドロワー）／章アコーディオン
   ===================================================================== */
(function () {
  "use strict";

  var PKEY = "bp:progress";
  var LKEY = "bp:last";

  /* ---------- localStorage ヘルパー（必ず try/catch） ---------- */
  function loadProgress() {
    try {
      var raw = localStorage.getItem(PKEY);
      return raw ? JSON.parse(raw) || {} : {};
    } catch (e) {
      return {};
    }
  }
  function saveProgress(p) {
    try {
      localStorage.setItem(PKEY, JSON.stringify(p));
    } catch (e) {}
  }
  function setLast(id) {
    try {
      localStorage.setItem(LKEY, id);
    } catch (e) {}
  }
  function getLast() {
    try {
      return localStorage.getItem(LKEY) || "";
    } catch (e) {
      return "";
    }
  }
  function isDone(p, id) {
    return !!p[id];
  }

  /* ---------- Netlify Identity ゲート ---------- */
  function showApp(user) {
    var g = document.getElementById("gateScreen");
    var s = document.getElementById("siteContent");
    if (g) g.style.display = "none";
    if (s) s.style.display = "block";
    if (user) fillProfile(user);
  }
  function fillProfile(user) {
    try {
      var nm =
        (user.user_metadata && user.user_metadata.full_name) ||
        (user.email ? user.email.split("@")[0] : "") ||
        "会員のあなた";
      var el = document.getElementById("pname");
      if (el) el.textContent = nm;
      var av = document.getElementById("pavatar");
      if (av && nm) av.textContent = nm.trim().charAt(0).toUpperCase();
    } catch (e) {}
  }
  function showGate() {
    var g = document.getElementById("gateScreen");
    var s = document.getElementById("siteContent");
    if (g) g.style.display = "flex";
    if (s) s.style.display = "none";
  }
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", function (user) {
      user ? showApp(user) : showGate();
    });
    window.netlifyIdentity.on("login", function (user) {
      showApp(user);
      window.netlifyIdentity.close();
    });
    window.netlifyIdentity.on("logout", showGate);
    window.netlifyIdentity.init();
  } else {
    // ウィジェット未読込でも本文が見えないよう、既定はゲート表示
    showGate();
  }
  window.bpLogout = function () {
    if (window.netlifyIdentity) window.netlifyIdentity.logout();
  };
  window.bpLogin = function () {
    if (window.netlifyIdentity) window.netlifyIdentity.open("login");
  };

  /* ---------- サイドバー（モバイル・ドロワー） ---------- */
  function initSidebar() {
    var sb = document.getElementById("sidebar");
    var scrim = document.getElementById("scrim");
    var toggle = document.getElementById("hamb");
    if (!sb || !toggle) return;
    function open() {
      sb.classList.add("open");
      if (scrim) scrim.classList.add("show");
    }
    function close() {
      sb.classList.remove("open");
      if (scrim) scrim.classList.remove("show");
    }
    toggle.addEventListener("click", function () {
      sb.classList.contains("open") ? close() : open();
    });
    if (scrim) scrim.addEventListener("click", close);
    // ドロワー内リンククリックで閉じる
    sb.addEventListener("click", function (e) {
      if (e.target.closest("a") && window.matchMedia("(max-width: 900px)").matches) close();
    });
  }

  /* ---------- 章アコーディオン ---------- */
  function initAccordion() {
    var heads = document.querySelectorAll(".chapter-head");
    heads.forEach(function (h) {
      h.addEventListener("click", function () {
        h.closest(".chapter").classList.toggle("open");
      });
    });
  }

  /* ---------- ダッシュボード（index）の進捗描画 ---------- */
  function renderDashboard() {
    var dash = document.getElementById("dashboard");
    if (!dash) return;
    var p = loadProgress();
    var totalAll = 0,
      doneAll = 0;

    // 各レッスン行に done クラス
    document.querySelectorAll(".lesson-row[data-lesson]").forEach(function (row) {
      var id = row.getAttribute("data-lesson");
      totalAll++;
      if (isDone(p, id)) {
        row.classList.add("done");
        doneAll++;
      } else {
        row.classList.remove("done");
      }
    });

    // 章ごとの集計
    document.querySelectorAll(".chapter[data-chapter]").forEach(function (ch) {
      var rows = ch.querySelectorAll(".lesson-row[data-lesson]");
      var t = rows.length,
        d = 0;
      rows.forEach(function (r) {
        if (isDone(p, r.getAttribute("data-lesson"))) d++;
      });
      var cnt = ch.querySelector(".chapter-count");
      if (cnt) cnt.textContent = d + "/" + t + " 完了";
      ch.querySelector(".chapter-head").classList.toggle("all-done", t > 0 && d === t);

      // ロードマップの該当ステップ
      var chNum = ch.getAttribute("data-chapter");
      var step = document.querySelector('.rm-step[data-step="' + chNum + '"]');
      if (step) {
        step.classList.remove("todo", "partial", "done", "current");
        var dot = step.querySelector(".rm-dot");
        if (t > 0 && d === t) {
          step.classList.add("done");
          if (dot) dot.textContent = "✓";
        } else {
          if (d > 0) step.classList.add("partial");
          else step.classList.add("todo");
          if (dot) dot.textContent = chNum;
        }
        var rc = step.querySelector(".rm-count");
        if (rc) rc.textContent = d + "/" + t;
      }
    });

    // 全体プログレスバー
    var fill = document.querySelector(".progress-fill");
    var label = document.querySelector(".progress-label");
    var pct = totalAll ? Math.round((doneAll / totalAll) * 100) : 0;
    if (fill) fill.style.width = pct + "%";
    if (label) label.textContent = doneAll + "/" + totalAll + " (" + pct + "%)";

    // 「続きから学習する」
    var resume = document.getElementById("resumeCard");
    if (resume) {
      var last = getLast();
      var target = null;
      // 1) 最後に開いたレッスンが未完了ならそれ
      if (last) {
        var lr = document.querySelector('.lesson-row[data-lesson="' + last + '"]');
        if (lr && !isDone(p, last)) target = lr;
      }
      // 2) なければ最初の未完了レッスン
      if (!target) {
        var rows2 = document.querySelectorAll(".lesson-row[data-lesson]");
        for (var i = 0; i < rows2.length; i++) {
          if (!isDone(p, rows2[i].getAttribute("data-lesson"))) {
            target = rows2[i];
            break;
          }
        }
      }
      if (target) {
        var a = target.closest("a");
        resume.setAttribute("href", a ? a.getAttribute("href") : "#");
        var tt = resume.querySelector(".rc-title");
        var kk = resume.querySelector(".rc-eyebrow");
        if (tt) tt.textContent = target.querySelector(".lr-title").textContent;
        if (kk) kk.textContent = doneAll === 0 ? "はじめる" : "続きから学習する";
        // ロードマップの「現在地」
        var tChap = target.getAttribute("data-lesson").split("-")[0];
        var cStep = document.querySelector('.rm-step[data-step="' + tChap + '"]');
        if (cStep && !cStep.classList.contains("done")) {
          cStep.classList.remove("todo", "partial");
          cStep.classList.add("current");
        }
      } else {
        // 全レッスン完了
        var tt2 = resume.querySelector(".rc-title");
        var kk2 = resume.querySelector(".rc-eyebrow");
        if (tt2) tt2.textContent = "全レッスン完了！ おつかれさまでした";
        if (kk2) kk2.textContent = "コンプリート";
        resume.setAttribute("href", "#dashboard");
      }
    }

    // 最初の未完了レッスンを含む章を開く
    var opened = false;
    document.querySelectorAll(".chapter[data-chapter]").forEach(function (ch) {
      if (opened) return;
      var rows = ch.querySelectorAll(".lesson-row[data-lesson]");
      for (var i = 0; i < rows.length; i++) {
        if (!isDone(p, rows[i].getAttribute("data-lesson"))) {
          ch.classList.add("open");
          opened = true;
          break;
        }
      }
    });
    if (!opened) {
      var first = document.querySelector(".chapter[data-chapter]");
      if (first) first.classList.add("open");
    }
  }

  /* ---------- レッスンページ：完了ボタン ---------- */
  function initLessonPage() {
    var bar = document.getElementById("completeBar");
    if (!bar) return;
    var id = bar.getAttribute("data-lesson");
    setLast(id);

    var btn = bar.querySelector(".complete-btn");
    var text = bar.querySelector(".cb-text");

    function paint() {
      var p = loadProgress();
      var done = isDone(p, id);
      bar.classList.toggle("is-done", done);
      btn.textContent = done ? "完了済み ✓（取り消す）" : "このレッスンを完了にする";
      if (text)
        text.textContent = done
          ? "おつかれさまでした。次のレッスンへ進みましょう。"
          : "動画を見て、ワークに取り組めたら、完了にしておきましょう。";
    }
    btn.addEventListener("click", function () {
      var p = loadProgress();
      if (p[id]) delete p[id];
      else p[id] = 1;
      saveProgress(p);
      paint();
    });
    paint();
  }

  /* ---------- 起動 ---------- */
  function boot() {
    initSidebar();
    initAccordion();
    renderDashboard();
    initLessonPage();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
