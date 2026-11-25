(function () {
  "use strict";

  var C = window.SURVEY_CONFIG;
  var STORE_KEY = "portrait-review-demo-v1";
  var app = document.getElementById("app");

  // ---------- state ----------
  function freshState() {
    return {
      screen: "consent",
      consent: false,
      rater: "",
      index: 0,
      answers: {},          // keyed by portrait ID string
      confirming: false,
      submittedAt: null
    };
  }

  var state = load() || freshState();

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable: keep in memory */ }
  }
  function reset() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
    state = freshState();
    go("consent");
  }

  function answerFor(id) {
    if (!state.answers[id]) state.answers[id] = { age: "", ageU: false, eth: "", gen: "" };
    return state.answers[id];
  }

  function go(screen, index) {
    if (state.submittedAt && screen !== "done") screen = "done"; // locked after submit
    state.screen = screen;
    if (typeof index === "number") state.index = index;
    state.confirming = false;
    save();
    render();
    window.scrollTo(0, 0);
    var h = app.querySelector("h1");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }

  // ---------- helpers ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function labelFor(list, code) {
    for (var i = 0; i < list.length; i++) if (list[i].code === code) return list[i].label;
    return "";
  }
  function ageValue(a) { return a.ageU ? "U" : a.age; }
  function isAgeValid(a) {
    if (a.ageU) return true;
    if (!/^\d+$/.test(String(a.age))) return false;
    var n = parseInt(a.age, 10);
    return n >= C.ageMin && n <= C.ageMax;
  }
  function problems(a) {
    var p = [];
    if (!isAgeValid(a)) p.push("age");
    if (!a.eth) p.push("eth");
    if (!a.gen) p.push("gen");
    return p;
  }
  function isComplete(id) { return problems(answerFor(id)).length === 0; }

  function updateMeta() {
    document.getElementById("meta-rater").textContent = state.rater || "—";
    document.getElementById("meta-sheet").textContent = C.sheet;
  }

  // ---------- screens ----------
  var screens = {};

  screens.consent = function () {
    return '' +
      '<section class="panel narrow stack-lg">' +
        '<div class="stack">' +
          '<div class="eyebrow">Step 1 of 4 · Information and consent</div>' +
          '<h1>Portrait review study</h1>' +
        '</div>' +
        '<div class="placeholder-note">Placeholder text. The approved information letter and consent wording will replace this section.</div>' +
        '<div class="consent-text stack">' +
          '<p><b>Study title:</b> [Study title]<br><b>Principal investigator:</b> [Name, department, contact]<br><b>Ethics ID:</b> [REB number, once assigned]</p>' +
          '<h2>What this study is about</h2>' +
          '<p>We are building a set of portrait images with agreed descriptive labels for research on fairness in AI systems. You will be shown 7 portraits and asked for your impression of each person’s apparent age, ethnicity and gender.</p>' +
          '<h2>What you will do</h2>' +
          '<ul>' +
            '<li>Enter the rater code you were given.</li>' +
            '<li>View 7 portraits, one at a time, and answer 3 short questions about each.</li>' +
            '<li>Check your answers and submit. This takes about [X] minutes.</li>' +
          '</ul>' +
          '<h2>Your data</h2>' +
          '<p>We record only your rater code, your answers and the time you submit. We do not collect your name, email or IP address. [Storage location, retention period and who can access the data.]</p>' +
          '<h2>Risks and your rights</h2>' +
          '<p>Some questions ask you to judge ethnicity and gender from appearance. Your answers describe your impression only, not the identity of the person shown. You can choose “Unclear” for any question. Taking part is voluntary and you may close this page at any time before submitting. [Withdrawal after submission, compensation, contacts for questions or concerns.]</p>' +
        '</div>' +
        '<label class="check" for="consent-box">' +
          '<input type="checkbox" id="consent-box"' + (state.consent ? " checked" : "") + '>' +
          '<span>I have read the information above, I am 18 or older, and I agree to take part.</span>' +
        '</label>' +
        '<div class="btn-row">' +
          '<button class="primary" id="consent-yes"' + (state.consent ? "" : " disabled") + '>Continue</button>' +
          '<button id="consent-no">I do not want to take part</button>' +
        '</div>' +
      '</section>';
  };
  screens.consent.bind = function () {
    var box = document.getElementById("consent-box");
    var yes = document.getElementById("consent-yes");
    box.addEventListener("change", function () { state.consent = box.checked; yes.disabled = !box.checked; save(); });
    yes.addEventListener("click", function () { if (state.consent) go("rater"); });
    document.getElementById("consent-no").addEventListener("click", function () { state.consent = false; go("declined"); });
  };

  screens.declined = function () {
    return '' +
      '<section class="panel narrow stack">' +
        '<h1>Thank you</h1>' +
        '<p>You chose not to take part. No answers have been recorded. You can close this page.</p>' +
        '<div class="btn-row"><button id="back-consent">Go back to the information page</button></div>' +
      '</section>';
  };
  screens.declined.bind = function () {
    document.getElementById("back-consent").addEventListener("click", function () { go("consent"); });
  };

  screens.rater = function () {
    return '' +
      '<section class="panel narrow stack-lg">' +
        '<div class="stack">' +
          '<div class="eyebrow">Step 2 of 4 · Rater code</div>' +
          '<h1>Enter your rater code</h1>' +
          '<p class="muted">Use the code you were given before this session. It links your answers without using your name.</p>' +
        '</div>' +
        '<form id="rater-form" class="stack" novalidate>' +
          '<div class="field">' +
            '<label for="rater-code">Rater code</label>' +
            '<input type="text" id="rater-code" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20" value="' + esc(state.rater) + '" placeholder="e.g. R07">' +
            '<div class="error-msg" id="rater-error" role="alert"></div>' +
          '</div>' +
          '<div class="btn-row spread">' +
            '<button type="button" id="rater-back">Back</button>' +
            '<button type="submit" class="primary">Continue</button>' +
          '</div>' +
        '</form>' +
      '</section>';
  };
  screens.rater.bind = function () {
    var input = document.getElementById("rater-code");
    input.focus();
    document.getElementById("rater-back").addEventListener("click", function () { go("consent"); });
    document.getElementById("rater-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value.trim().toUpperCase();
      var err = document.getElementById("rater-error");
      if (!v) { err.textContent = "Enter your rater code to continue."; input.focus(); return; }
      if (!/^[A-Z0-9-]{1,20}$/.test(v)) { err.textContent = "Use letters, numbers and hyphens only, exactly as on the code you were given."; input.focus(); return; }
      state.rater = v;
      updateMeta();
      go("instructions");
    });
  };

  screens.instructions = function () {
    var codes = C.ethnicity.map(function (e) {
      return '<li><span class="code">' + e.code + '</span><span>' + esc(e.label) + '</span></li>';
    }).join("");
    return '' +
      '<section class="panel narrow stack-lg">' +
        '<div class="stack">' +
          '<div class="eyebrow">Step 3 of 4 · Instructions</div>' +
          '<h1>How to review the portraits</h1>' +
        '</div>' +
        '<div class="stack">' +
          '<p>View each portrait in the order shown. Work independently. Each portrait’s ID is recorded for you. Record your own impression of the person shown. You can use <b>U (unclear)</b> for any question and still answer the others.</p>' +
          '<p>You can go back and change answers at any time until you submit.</p>' +
        '</div>' +
        '<div class="stack">' +
          '<h2>1. How old does the person appear?</h2>' +
          '<p class="muted">Write your best estimate in years as a whole number, or choose U.</p>' +
        '</div>' +
        '<div class="stack">' +
          '<h2>2. Which ethnicity category best describes your impression?</h2>' +
          '<p class="muted">Choose one letter from the list below.</p>' +
          '<ul class="code-list">' + codes + '</ul>' +
        '</div>' +
        '<div class="stack">' +
          '<h2>3. What gender does the person appear to be?</h2>' +
          '<p class="muted">Choose F (female), M (male), or U (unclear).</p>' +
        '</div>' +
        '<div class="btn-row spread">' +
          '<button id="ins-back">Back</button>' +
          '<button class="primary" id="ins-start">Start with portrait 1</button>' +
        '</div>' +
      '</section>';
  };
  screens.instructions.bind = function () {
    document.getElementById("ins-back").addEventListener("click", function () { go("rater"); });
    document.getElementById("ins-start").addEventListener("click", function () { go("rate", 0); });
  };

  screens.rate = function () {
    var i = state.index, n = C.portraits.length, p = C.portraits[i], a = answerFor(p.id);
    var eth = C.ethnicity.map(function (e) {
      var id = "eth-" + e.code;
      return '<label class="opt" for="' + id + '"><input type="radio" name="eth" id="' + id + '" value="' + e.code + '"' + (a.eth === e.code ? " checked" : "") + '>' +
        '<span><span class="code">' + e.code + '</span>' + esc(e.label) + '</span></label>';
    }).join("");
    var gen = C.gender.map(function (g) {
      var id = "gen-" + g.code;
      return '<label class="opt" for="' + id + '"><input type="radio" name="gen" id="' + id + '" value="' + g.code + '"' + (a.gen === g.code ? " checked" : "") + '>' +
        '<span><span class="code">' + g.code + '</span>' + esc(g.label) + '</span></label>';
    }).join("");
    return '' +
      '<section>' +
        '<div class="rate-head">' +
          '<h1>Portrait ' + (i + 1) + ' of ' + n + '</h1>' +
          '<div class="muted">Portrait ID <span class="portrait-id"><b>' + esc(p.id) + '</b></span></div>' +
        '</div>' +
        '<div class="progress" aria-hidden="true"><span style="width:' + Math.round(((i + 1) / n) * 100) + '%"></span></div>' +
        '<div class="rate-grid">' +
          '<figure class="portrait-frame" style="margin:0">' +
            '<img src="' + esc(p.src) + '" alt="Portrait ' + esc(p.id) + '" draggable="false">' +
          '</figure>' +
          '<form id="rate-form" class="panel stack-lg" novalidate>' +
            '<fieldset class="question" id="q-age">' +
              '<legend>1. How old does the person appear?</legend>' +
              '<div class="q-help">Best estimate in whole years (' + C.ageMin + '–' + C.ageMax + '), or U.</div>' +
              '<div class="age-row">' +
                '<input type="number" id="age" inputmode="numeric" min="' + C.ageMin + '" max="' + C.ageMax + '" step="1" aria-label="Age in years" value="' + esc(a.age) + '"' + (a.ageU ? " disabled" : "") + '>' +
                '<span class="muted">years</span>' +
                '<label class="opt unclear-toggle" for="age-u"><input type="checkbox" id="age-u"' + (a.ageU ? " checked" : "") + '><span><span class="code">U</span>Unclear</span></label>' +
              '</div>' +
              '<div class="error-msg" id="err-age" role="alert"></div>' +
            '</fieldset>' +
            '<fieldset class="question" id="q-eth">' +
              '<legend>2. Which ethnicity category best describes your impression?</legend>' +
              '<div class="options eth">' + eth + '</div>' +
              '<div class="error-msg" id="err-eth" role="alert"></div>' +
            '</fieldset>' +
            '<fieldset class="question" id="q-gen">' +
              '<legend>3. What gender does the person appear to be?</legend>' +
              '<div class="options gen">' + gen + '</div>' +
              '<div class="error-msg" id="err-gen" role="alert"></div>' +
            '</fieldset>' +
            '<div class="btn-row spread">' +
              '<button type="button" id="rate-back">Back</button>' +
              '<button type="submit" class="primary">' + (i === n - 1 ? "Check answers" : "Next portrait") + '</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</section>';
  };
  screens.rate.bind = function () {
    var p = C.portraits[state.index], a = answerFor(p.id);
    var age = document.getElementById("age"), ageU = document.getElementById("age-u");

    function clearError(key) {
      document.getElementById("err-" + key).textContent = "";
      document.getElementById("q-" + key).classList.remove("invalid");
    }

    age.addEventListener("input", function () { a.age = age.value.trim(); save(); clearError("age"); });
    ageU.addEventListener("change", function () {
      a.ageU = ageU.checked;
      if (a.ageU) { a.age = ""; age.value = ""; }
      age.disabled = a.ageU;
      if (!a.ageU) age.focus();
      save(); clearError("age");
    });
    app.querySelectorAll('input[name="eth"]').forEach(function (r) {
      r.addEventListener("change", function () { a.eth = r.value; save(); clearError("eth"); });
    });
    app.querySelectorAll('input[name="gen"]').forEach(function (r) {
      r.addEventListener("change", function () { a.gen = r.value; save(); clearError("gen"); });
    });

    document.getElementById("rate-back").addEventListener("click", function () {
      if (state.index === 0) go("instructions"); else go("rate", state.index - 1);
    });
    document.getElementById("rate-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = problems(a);
      var msgs = {
        age: a.age === "" ? "Enter an age in years, or choose U." : "Enter a whole number from " + C.ageMin + " to " + C.ageMax + ", or choose U.",
        eth: "Choose one letter, or U if unclear.",
        gen: "Choose F, M, or U."
      };
      ["age", "eth", "gen"].forEach(function (k) {
        var on = bad.indexOf(k) !== -1;
        document.getElementById("err-" + k).textContent = on ? msgs[k] : "";
        document.getElementById("q-" + k).classList.toggle("invalid", on);
      });
      if (bad.length) {
        document.getElementById("q-" + bad[0]).scrollIntoView({ block: "center", behavior: "smooth" });
        return;
      }
      if (state.index < C.portraits.length - 1) go("rate", state.index + 1); else go("review");
    });
  };

  screens.review = function () {
    var allDone = true;
    var rows = C.portraits.map(function (p, i) {
      var a = answerFor(p.id), done = isComplete(p.id);
      if (!done) allDone = false;
      return '<tr>' +
        '<td class="mono">' + esc(p.id) + '</td>' +
        '<td class="mono">' + esc(ageValue(a) || "—") + '</td>' +
        '<td class="mono">' + esc(a.eth || "—") + (a.eth ? ' <span class="muted">' + esc(labelFor(C.ethnicity, a.eth)) + '</span>' : "") + '</td>' +
        '<td class="mono">' + esc(a.gen || "—") + '</td>' +
        '<td><button class="link" data-edit="' + i + '">' + (done ? "Change" : "Answer") + '</button></td>' +
      '</tr>';
    }).join("");
    return '' +
      '<section class="panel stack-lg">' +
        '<div class="stack">' +
          '<div class="eyebrow">Step 4 of 4 · Check and submit</div>' +
          '<h1>Check your answers</h1>' +
          '<p class="muted">This is the full record that will be submitted under rater code <b>' + esc(state.rater) + '</b>. Use Change to revisit a portrait. After you submit, answers can’t be changed.</p>' +
        '</div>' +
        '<div class="table-wrap"><table class="sheet">' +
          '<thead><tr><th>Portrait ID</th><th>Age in years</th><th>Ethnicity code</th><th>Gender code</th><th><span class="muted">Edit</span></th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table></div>' +
        (allDone ? "" : '<p class="error-msg">Some portraits are missing answers. Answer them before submitting.</p>') +
        (state.confirming
          ? '<div class="confirm-box stack">' +
              '<p><b>Submit your answers?</b> You won’t be able to change them afterwards.</p>' +
              '<div class="btn-row"><button class="primary" id="confirm-submit">Yes, submit</button><button id="cancel-submit">Keep reviewing</button></div>' +
            '</div>'
          : '<div class="btn-row spread">' +
              '<button id="review-back">Back to portrait ' + C.portraits.length + '</button>' +
              '<button class="primary" id="submit"' + (allDone ? "" : " disabled") + '>Submit answers</button>' +
            '</div>') +
      '</section>';
  };
  screens.review.bind = function () {
    app.querySelectorAll("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { go("rate", parseInt(b.getAttribute("data-edit"), 10)); });
    });
    var back = document.getElementById("review-back");
    if (back) back.addEventListener("click", function () { go("rate", C.portraits.length - 1); });
    var submit = document.getElementById("submit");
    if (submit) submit.addEventListener("click", function () { state.confirming = true; render(); document.getElementById("confirm-submit").focus(); });
    var yes = document.getElementById("confirm-submit");
    if (yes) yes.addEventListener("click", function () {
      state.submittedAt = new Date().toISOString();
      go("done");
    });
    var no = document.getElementById("cancel-submit");
    if (no) no.addEventListener("click", function () { state.confirming = false; render(); });
  };

  function csv() {
    var head = "rater_code,sheet,position,portrait_id,age,ethnicity,gender,submitted_at";
    var lines = C.portraits.map(function (p, i) {
      var a = answerFor(p.id);
      return [state.rater, C.sheet, i + 1, '"' + p.id + '"', ageValue(a), a.eth, a.gen, state.submittedAt].join(",");
    });
    return [head].concat(lines).join("\n");
  }

  // e.g. portrait-review_R07_sheet1_2026-11-25T1832Z.csv
  function csvFileName() {
    var t = (state.submittedAt || new Date().toISOString()).replace(/:\d\d\.\d+Z$/, "Z").replace(/:/g, "");
    return "portrait-review_" + state.rater + "_sheet" + C.sheet + "_" + t + ".csv";
  }

  screens.done = function () {
    return '' +
      '<section class="panel narrow stack-lg">' +
        '<div class="stack">' +
          '<h1>Thank you, your answers are submitted</h1>' +
          '<p>Your rater code was <b class="portrait-id">' + esc(state.rater) + '</b>. You can close this page.</p>' +
          '<p class="muted">[Debrief text and study contact details go here.]</p>' +
        '</div>' +
        (C.demo
          ? '<div class="stack">' +
              '<div class="eyebrow">Demo only · not shown to participants</div>' +
              '<h2>Record that would be stored</h2>' +
              '<p class="muted">One row per portrait. No name, email or IP address is collected. In this demo nothing leaves your browser.</p>' +
              '<pre class="record" id="record">' + esc(csv()) + '</pre>' +
              '<div class="btn-row"><button id="download">Download CSV</button><button id="copy">Copy CSV</button><span class="muted" id="copy-status" role="status"></span></div>' +
              '<p class="muted">File name: <span class="portrait-id">' + esc(csvFileName()) + '</span>. If the download doesn’t start, use Copy CSV.</p>' +
              '<div class="btn-row"><button class="primary" id="restart">Restart demo</button></div>' +
            '</div>'
          : "") +
      '</section>';
  };
  screens.done.bind = function () {
    var download = document.getElementById("download");
    if (download) download.addEventListener("click", function () {
      var status = document.getElementById("copy-status");
      try {
        var blob = new Blob([csv() + "\n"], { type: "text/csv;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = csvFileName();
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        status.textContent = "Download started.";
      } catch (e) {
        status.textContent = "Download isn’t available here. Use Copy CSV.";
      }
    });
    var copy = document.getElementById("copy");
    if (copy) copy.addEventListener("click", function () {
      var status = document.getElementById("copy-status");
      function fallback() {
        var r = document.createRange(); r.selectNodeContents(document.getElementById("record"));
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        status.textContent = "Text selected. Press Ctrl+C or ⌘C to copy.";
      }
      try {
        navigator.clipboard.writeText(csv()).then(function () { status.textContent = "Copied."; }, fallback);
      } catch (e) { fallback(); }
    });
    var restart = document.getElementById("restart");
    if (restart) restart.addEventListener("click", reset);
  };

  // ---------- render ----------
  function render() {
    if (!screens[state.screen]) state.screen = "consent";
    if (state.submittedAt) state.screen = "done";
    app.innerHTML = screens[state.screen]();
    updateMeta();
    if (screens[state.screen].bind) screens[state.screen].bind();
  }

  document.getElementById("demo-banner").hidden = !C.demo;
  document.getElementById("demo-restart").addEventListener("click", reset);
  render();
})();
