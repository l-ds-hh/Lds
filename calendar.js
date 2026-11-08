/* ===== 日历选择器（年 / 月 / 日）===== */
(function () {
  "use strict";

  var WEEK = ["日", "一", "二", "三", "四", "五", "六"];
  var el = null;
  var state = { y: 0, m: 0, mode: "month", picked: "", onPick: null };

  function pad(n) { return String(n).padStart(2, "0"); }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function build() {
    el = document.createElement("div");
    el.innerHTML =
      '<div class="cal-mask" id="calMask"></div>' +
      '<div class="sheet cal-sheet" id="calSheet">' +
        '<div class="handle"></div>' +
        '<div class="cal-head">' +
          '<button class="cal-nav" data-k="py">‹</button>' +
          '<span class="cal-year" id="calYear">2026 年</span>' +
          '<button class="cal-nav" data-k="ny">›</button>' +
        "</div>" +
        '<div class="cal-head sub">' +
          '<button class="cal-nav" data-k="pm">‹</button>' +
          '<span class="cal-month" id="calMonth">11 月</span>' +
          '<button class="cal-nav" data-k="nm">›</button>' +
        "</div>" +
        '<div class="cal-week">' + WEEK.map(function (w) { return "<span>" + w + "</span>"; }).join("") + "</div>" +
        '<div class="cal-grid" id="calGrid"></div>' +
        '<div class="cal-foot">' +
          '<button class="btn-ghost" id="calToday">今天</button>' +
          '<button class="btn-primary" style="flex:1" id="calOk">完成</button>' +
        "</div>" +
      "</div>";
    document.body.appendChild(el);

    el.querySelector("#calMask").addEventListener("click", close);
    el.querySelectorAll(".cal-nav").forEach(function (b) {
      b.addEventListener("click", function () {
        if (typeof window.haptic === "function") window.haptic("light");
        var k = b.dataset.k;
        if (k === "py") state.y--;
        if (k === "ny") state.y++;
        if (k === "pm") { state.m--; if (state.m < 1) { state.m = 12; state.y--; } }
        if (k === "nm") { state.m++; if (state.m > 12) { state.m = 1; state.y++; } }
        render();
      });
    });
    el.querySelector("#calToday").addEventListener("click", function () {
      var t = todayStr().split("-");
      state.y = +t[0]; state.m = +t[1]; state.picked = todayStr();
      render();
      if (state.mode === "date") confirmPick();
      else render();
    });
    el.querySelector("#calOk").addEventListener("click", function () {
      if (state.mode === "month") {
        confirmPick(state.y + "-" + pad(state.m));
      } else {
        confirmPick(state.picked || (state.y + "-" + pad(state.m) + "-01"));
      }
    });
  }

  function render() {
    el.querySelector("#calYear").textContent = state.y + " 年";
    el.querySelector("#calMonth").textContent = state.m + " 月";

    var first = new Date(state.y, state.m - 1, 1);
    var startDow = first.getDay();
    var days = new Date(state.y, state.m, 0).getDate();
    var prevDays = new Date(state.y, state.m - 1, 0).getDate();

    var cells = [];
    for (var i = startDow - 1; i >= 0; i--) {
      cells.push({ d: prevDays - i, out: true });
    }
    for (var d = 1; d <= days; d++) {
      cells.push({ d: d, out: false });
    }
    while (cells.length % 7 !== 0) cells.push({ d: cells.length - startDow - days + 1, out: true });

    var today = todayStr();
    var pickedMonth = state.picked.slice(0, 7);
    var thisMonth = state.y + "-" + pad(state.m);

    el.querySelector("#calGrid").innerHTML = cells.map(function (c) {
      if (c.out) return '<span class="cal-day out">' + c.d + "</span>";
      var ds = state.y + "-" + pad(state.m) + "-" + pad(c.d);
      var cls = "cal-day";
      if (ds === today) cls += " today";
      if (state.mode === "date") {
        if (ds === state.picked) cls += " on";
      } else {
        if (thisMonth === pickedMonth && c.d === +state.picked.slice(8, 10)) cls += " on";
      }
      return '<button class="' + cls + '" data-d="' + ds + '">' + c.d + "</button>";
    }).join("");

    el.querySelectorAll(".cal-day[data-d]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (typeof window.haptic === "function") window.haptic("light");
        state.picked = b.dataset.d;
        if (state.mode === "month") {
          /* 选具体某天也把月份带过去 */
          var p = state.picked.split("-");
          state.y = +p[0]; state.m = +p[1];
        }
        render();
        if (state.mode === "date") {
          setTimeout(confirmPick, 120);
        }
      });
    });
  }

  function confirmPick(val) {
    var v = val;
    if (!v) {
      v = state.mode === "month"
        ? (state.y + "-" + pad(state.m))
        : (state.picked || (state.y + "-" + pad(state.m) + "-01"));
    }
    if (typeof state.onPick === "function") state.onPick(v, state.mode);
    close();
  }

  function open(opts) {
    if (!el) build();
    opts = opts || {};
    state.mode = opts.mode || "month";
    state.onPick = opts.onPick;
    var base = opts.value || todayStr();
    var p = base.split("-");
    state.y = +p[0]; state.m = +p[1];
    state.picked = state.mode === "date" ? base : (p[0] + "-" + p[1] + "-01");
    if (state.mode === "month" && opts.day) state.picked = base;

    el.querySelector("#calOk").textContent = state.mode === "month" ? "选择这个月" : "完成";
    el.querySelector(".cal-mask").classList.add("show");
    el.querySelector(".cal-sheet").classList.add("show");
    render();
  }

  function close() {
    if (!el) return;
    el.querySelector(".cal-mask").classList.remove("show");
    el.querySelector(".cal-sheet").classList.remove("show");
  }

  window.CalendarPicker = { open: open, close: close };
})();
