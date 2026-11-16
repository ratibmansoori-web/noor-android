/* Noor - phone alarm (runs only inside the Android APK). Rings the azan at the exact prayer time,
   even when the app is closed, using Android's own alarm system. */
(function () {
  "use strict";
  var cap = window.Capacitor;
  if (!cap || typeof cap.isNativePlatform !== "function" || !cap.isNativePlatform()) return;

  var API = "__SITE__";

  // 1) calls like /api/... must go to the live Noor server (the APK has no server of its own)
  var _f = window.fetch;
  window.fetch = function (u, o) {
    try { if (typeof u === "string" && u.indexOf("/api/") === 0) u = API + u; } catch (e) {}
    return _f.call(window, u, o);
  };

  // 2) hide the web-only parts (browser push, install banner) inside the APK
  var st = document.createElement("style");
  st.textContent = "#pu,#pst,#pt,#pts,#ib,#azd,[data-t=puNote],[data-t=snSteps]{display:none!important}";
  document.head.appendChild(st);

  var NLN = cap.registerPlugin("LocalNotifications");
  var CH = "azan_v1", TEST_ID = 999999, KEY = "noorNat";
  var NAMES = ["Fajr", "Zuhr", "Asr", "Maghrib", "Isha"];

  var L = {
    title: ["\uD83D\uDCF2 \u092B\u093C\u094B\u0928 \u0905\u0932\u093E\u0930\u094D\u092E (\u0905\u091C\u093C\u093E\u0928)", "\uD83D\uDCF2 \u0641\u0648\u0646 \u0627\u0644\u0627\u0631\u0645 (\u0627\u0630\u0627\u0646)", "\uD83D\uDCF2 Phone alarm (azan)"],
    on: ["\u0928\u092E\u093E\u091C\u093C \u0915\u0947 \u0920\u0940\u0915 \u0935\u0915\u093C\u094D\u0924 \u092A\u0930 \u0905\u091C\u093C\u093E\u0928 \u0915\u093E \u0905\u0932\u093E\u0930\u094D\u092E \u091A\u093E\u0932\u0942 \u0930\u0916\u0947\u0902", "\u0646\u0645\u0627\u0632 \u06A9\u06D2 \u0679\u06BE\u06CC\u06A9 \u0648\u0642\u062A \u067E\u0631 \u0627\u0630\u0627\u0646 \u06A9\u0627 \u0627\u0644\u0627\u0631\u0645 \u0686\u0627\u0644\u0648 \u0631\u06A9\u06BE\u06CC\u06BA", "Azan alarm at the exact prayer time"],
    note: ["\u092F\u0939 \u0905\u0932\u093E\u0930\u094D\u092E \u0910\u092A \u092C\u0902\u0926 \u0939\u094B\u0928\u0947 \u092A\u0930 \u092D\u0940 \u092C\u091C\u0924\u093E \u0939\u0948\u0964 \u092A\u0939\u0932\u0940 \u092C\u093E\u0930 \u0928\u094B\u091F\u093F\u092B\u093C\u093F\u0915\u0947\u0936\u0928 \u0915\u0940 \u0907\u091C\u093C\u093E\u091C\u093C\u0924 \u0926\u0947\u0902\u0964", "\u06CC\u06C1 \u0627\u0644\u0627\u0631\u0645 \u0627\u06CC\u067E \u0628\u0646\u062F \u06C1\u0648\u0646\u06D2 \u067E\u0631 \u0628\u06BE\u06CC \u0628\u062C\u062A\u0627 \u06C1\u06D2\u06D4 \u067E\u06C1\u0644\u06CC \u0628\u0627\u0631 \u0646\u0648\u0679\u06CC\u0641\u06CC\u06A9\u06CC\u0634\u0646 \u06A9\u06CC \u0627\u062C\u0627\u0632\u062A \u062F\u06CC\u06BA\u06D4", "This rings even when the app is closed. Allow notifications the first time."],
    test: ["10 \u0938\u0947\u0915\u0902\u0921 \u092C\u093E\u0926 \u091F\u0947\u0938\u094D\u091F \u0905\u091C\u093C\u093E\u0928", "10 \u0633\u06CC\u06A9\u0646\u0688 \u0628\u0639\u062F \u0679\u06CC\u0633\u0679 \u0627\u0630\u0627\u0646", "Test azan in 10 seconds"],
    testT: ["\u091F\u0947\u0938\u094D\u091F \u0905\u091C\u093C\u093E\u0928", "\u0679\u06CC\u0633\u0679 \u0627\u0630\u0627\u0646", "Test azan"],
    st_on: ["\u091A\u093E\u0932\u0942: \u0905\u0917\u0932\u0947 {n} \u0905\u0932\u093E\u0930\u094D\u092E \u0932\u0917\u0947 \u0939\u0948\u0902 (\u092A\u0939\u0932\u093E: {t})", "\u0686\u0627\u0644\u0648: \u0627\u06AF\u0644\u06D2 {n} \u0627\u0644\u0627\u0631\u0645 \u0644\u06AF\u06D2 \u06C1\u06CC\u06BA (\u067E\u06C1\u0644\u0627: {t})", "On: {n} upcoming alarms set (first: {t})"],
    st_off: ["\u092C\u0902\u0926", "\u0628\u0646\u062F", "Off"],
    st_perm: ["\u0907\u091C\u093C\u093E\u091C\u093C\u0924 \u0928\u0939\u0940\u0902 \u092E\u093F\u0932\u0940\u0964 \u092B\u093C\u094B\u0928 \u0915\u0940 Settings \u2192 Apps \u2192 Noor \u2192 Notifications \u091A\u093E\u0932\u0942 \u0915\u0930\u0947\u0902\u0964", "\u0627\u062C\u0627\u0632\u062A \u0646\u06C1\u06CC\u06BA \u0645\u0644\u06CC\u06D4 \u0641\u0648\u0646 \u06A9\u06CC Settings \u2192 Apps \u2192 Noor \u2192 Notifications \u0686\u0627\u0644\u0648 \u06A9\u0631\u06CC\u06BA\u06D4", "Permission not granted. Phone Settings \u2192 Apps \u2192 Noor \u2192 Notifications \u2192 turn on."],
    st_ex: ["\u0938\u091F\u0940\u0915 \u0905\u0932\u093E\u0930\u094D\u092E \u0915\u0940 \u0907\u091C\u093C\u093E\u091C\u093C\u0924 \u092C\u0902\u0926 \u0939\u0948\u0964 \u0916\u0941\u0932\u0928\u0947 \u0935\u093E\u0932\u0940 \u0938\u094D\u0915\u094D\u0930\u0940\u0928 \u092E\u0947\u0902 Noor \u0915\u094B Allow \u0915\u0930\u0947\u0902, \u092B\u093C\u093F\u0930 \u0938\u094D\u0935\u093F\u091A \u0926\u094B\u092C\u093E\u0930\u093E \u0926\u092C\u093E\u090F\u0901\u0964", "\u062F\u0631\u0633\u062A \u0627\u0644\u0627\u0631\u0645 \u06A9\u06CC \u0627\u062C\u0627\u0632\u062A \u0628\u0646\u062F \u06C1\u06D2\u06D4 \u06A9\u06BE\u0644\u0646\u06D2 \u0648\u0627\u0644\u06CC \u0627\u0633\u06A9\u0631\u06CC\u0646 \u0645\u06CC\u06BA Noor \u06A9\u0648 Allow \u06A9\u0631\u06CC\u06BA\u060C \u067E\u06BE\u0631 \u0633\u0648\u0626\u0686 \u062F\u0648\u0628\u0627\u0631\u06C1 \u062F\u0628\u0627\u0626\u06CC\u06BA\u06D4", "Exact alarms are off. Allow Noor on the screen that opens, then switch this on again."],
    test_set: ["\u091F\u0947\u0938\u094D\u091F \u0932\u0917 \u0917\u092F\u093E: \u0910\u092A \u092C\u0902\u0926 \u0915\u0930\u0915\u0947 10 \u0938\u0947\u0915\u0902\u0921 \u0907\u0902\u0924\u095B\u093E\u0930 \u0915\u0930\u0947\u0902\u0964", "\u0679\u06CC\u0633\u0679 \u0644\u06AF \u06AF\u06CC\u0627: \u0627\u06CC\u067E \u0628\u0646\u062F \u06A9\u0631 \u06A9\u06D2 10 \u0633\u06CC\u06A9\u0646\u0688 \u0627\u0646\u062A\u0638\u0627\u0631 \u06A9\u0631\u06CC\u06BA\u06D4", "Test set: close the app and wait 10 seconds."],
    body: ["{n} \u0915\u0940 \u0928\u092E\u093E\u091C\u093C \u0915\u093E \u0935\u0915\u093C\u094D\u0924 \u0939\u094B \u0917\u092F\u093E ({t})", "{n} \u06A9\u06CC \u0646\u0645\u0627\u0632 \u06A9\u0627 \u0648\u0642\u062A \u06C1\u0648 \u06AF\u06CC\u0627 ({t})", "It is time for {n} prayer ({t})"],
    err: ["\u0917\u0921\u093C\u092C\u0921\u093C \u0939\u0941\u0908: {e}", "\u06A9\u0686\u06BE \u062E\u0631\u0627\u0628\u06CC \u06C1\u0648\u0626\u06CC: {e}", "Something went wrong: {e}"]
  };

  function li() { var i = ["hi", "ur", "en"].indexOf(localStorage.getItem("rzg") || "hi"); return i < 0 ? 0 : i; }
  function T(k, v) { var s = L[k][li()]; for (var x in v) s = s.split("{" + x + "}").join(v[x]); return s; }
  function load() { try { var c = JSON.parse(localStorage.getItem(KEY) || "{}"); c.on = !!c.on; c.p = c.p || {}; return c; } catch (e) { return { on: false, p: {} }; } }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  function pname(n) { return typeof t === "function" ? t("n" + n) : n; }
  function status(m) { var e = document.getElementById("nats"); if (e) e.textContent = m || ""; }

  async function ensure() {
    var p = await NLN.checkPermissions();
    if (p.display !== "granted") { p = await NLN.requestPermissions(); if (p.display !== "granted") return "perm"; }
    try {
      var ex = await NLN.checkExactNotificationSetting();
      if (ex && ex.exact_alarm === "denied") { try { await NLN.changeExactNotificationSetting(); } catch (e) {} return "exact"; }
    } catch (e) {}
    await NLN.createChannel({ id: CH, name: "Azan", description: "Azan at prayer time", importance: 5, visibility: 1, sound: "azan.mp3", vibration: true, lights: true });
    return "ok";
  }

  async function cancelAll() {
    try {
      var pe = await NLN.getPending();
      var ids = (pe.notifications || []).filter(function (n) { return n.id !== TEST_ID; }).map(function (n) { return { id: n.id }; });
      if (ids.length) await NLN.cancel({ notifications: ids });
    } catch (e) {}
  }

  // schedule the next 30 days of azan alarms from the app's own prayer-time calculation
  async function sched() {
    var c = load();
    await cancelAll();
    if (!c.on || typeof nam !== "function") return { n: 0, first: "" };
    var now = Date.now(), list = [], i, k, r;
    for (i = 0; i < 30; i++) {
      r = nam(new Date(now + i * 864e5));
      for (k = 0; k < r.length; k++) {
        if (c.p[r[k][0]] === 0) continue;
        if (r[k][1] > now + 5000) list.push(r[k]);
      }
    }
    list.sort(function (a, b) { return a[1] - b[1]; });
    var notes = list.map(function (x, idx) {
      var nm = pname(x[0]);
      return { id: idx + 1, title: "\uD83D\uDD4C " + nm, body: T("body", { n: nm, t: f12(x[1]) }),
        schedule: { at: new Date(x[1]), allowWhileIdle: true }, channelId: CH, smallIcon: "ic_stat_noor", sound: "azan.mp3" };
    });
    if (notes.length) await NLN.schedule({ notifications: notes });
    return { n: notes.length, first: notes.length ? f12(list[0][1]) : "" };
  }

  async function turnOn() {
    var c = load(), r = await ensure();
    if (r !== "ok") { c.on = false; save(c); return r; }
    c.on = true; save(c);
    return sched();
  }

  async function refresh() {
    var c = load();
    if (!c.on) { status(T("st_off")); return; }
    try { var s = await sched(); status(T("st_on", { n: s.n, t: s.first || "-" })); }
    catch (e) { status(T("err", { e: (e && e.message) || e })); }
  }

  async function sendTest() {
    var r = await ensure();
    if (r !== "ok") { status(r === "perm" ? T("st_perm") : T("st_ex")); return; }
    await NLN.schedule({ notifications: [{ id: TEST_ID, title: "\uD83D\uDD4C " + T("testT"), body: "azan",
      schedule: { at: new Date(Date.now() + 10000), allowWhileIdle: true }, channelId: CH, smallIcon: "ic_stat_noor", sound: "azan.mp3" }] });
    status(T("test_set"));
  }

  function build() {
    var host = document.querySelector("#ovA .in");
    if (!host) return;
    var old = document.getElementById("nat"); if (old) old.remove();
    var c = load(), d = document.createElement("div");
    d.className = "card"; d.id = "nat";
    var h = "<h3>" + T("title") + "</h3>" +
      '<label style="display:flex;gap:10px;align-items:center;font-size:15px;color:var(--tx);margin-bottom:10px"><input type="checkbox" id="natOn" style="width:22px;height:22px;margin:0"' + (c.on ? " checked" : "") + "> <span>" + T("on") + "</span></label>" +
      '<div style="display:flex;flex-wrap:wrap;gap:8px 14px;margin-bottom:10px">';
    NAMES.forEach(function (n) {
      h += '<label style="display:flex;gap:6px;align-items:center;font-size:14px;color:var(--tx)"><input type="checkbox" data-p="' + n + '" style="width:18px;height:18px;margin:0"' + (c.p[n] === 0 ? "" : " checked") + "> " + pname(n) + "</label>";
    });
    h += '</div><button class="p" id="natT">' + T("test") + '</button><div class="mu" id="nats" style="margin-bottom:8px"></div><div class="mu">' + T("note") + "</div>";
    d.innerHTML = h;
    host.insertBefore(d, host.firstChild);

    document.getElementById("natOn").onchange = async function () {
      var el = this, cc = load();
      try {
        if (el.checked) {
          status("...");
          var r = await turnOn();
          if (r === "perm") { el.checked = false; status(T("st_perm")); }
          else if (r === "exact") { el.checked = false; status(T("st_ex")); }
          else status(T("st_on", { n: r.n, t: r.first || "-" }));
        } else { cc.on = false; save(cc); await cancelAll(); status(T("st_off")); }
      } catch (e) { el.checked = false; status(T("err", { e: (e && e.message) || e })); }
    };
    Array.prototype.forEach.call(d.querySelectorAll("[data-p]"), function (cb) {
      cb.onchange = function () { var cc = load(); cc.p[cb.getAttribute("data-p")] = cb.checked ? 1 : 0; save(cc); if (cc.on) refresh(); };
    });
    document.getElementById("natT").onclick = function () { sendTest().catch(function (e) { status(T("err", { e: (e && e.message) || e })); }); };
    refresh();
  }

  var ba = document.getElementById("ba");
  if (ba) ba.addEventListener("click", function () { setTimeout(build, 0); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden && load().on) refresh(); });
  setTimeout(function () { if (load().on) refresh(); }, 4000);
  setInterval(function () { if (load().on) refresh(); }, 30 * 60 * 1000);

  window.noorNat = { ensure: ensure, sched: sched, turnOn: turnOn, cancelAll: cancelAll, sendTest: sendTest, build: build, load: load, save: save };
})();
