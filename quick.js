/* ===== 共用组件：底部 FAB + 快速记账 + 轻提示 ===== */
(function () {
  "use strict";

  /* ---------- 轻提示 Toast ---------- */
  var toastBox = null;
  window.toast = function (msg, opts) {
    if (!toastBox) {
      toastBox = document.createElement("div");
      toastBox.className = "toast-box";
      document.body.appendChild(toastBox);
    }
    if (opts && opts.sound === "success" && typeof window.playSuccess === "function") {
      window.playSuccess();
    } else if (opts && opts.sound === "remove" && typeof window.playRemove === "function") {
      window.playRemove();
    }
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    toastBox.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });
    setTimeout(function () {
      el.classList.remove("show");
      setTimeout(function () { el.remove(); }, 260);
    }, 1700);
  };

  /* ---------- 解析 ---------- */
  var RULES = [
    ["food", /饭|餐|午餐|晚餐|早餐|奶茶|咖啡|吃|外卖|饮料|火锅|烧烤|零食/],
    ["traffic", /公交|地铁|打车|出租|滴滴|加油|停车|高铁|火车|机票|单车/],
    ["shop", /买|购物|网购|淘宝|京东|拼多多|超市|日用品/],
    ["home", /房租|房贷|物业|中介|维修/],
    ["utilities", /水费|电费|燃气|取暖|宽带/],
    ["phone", /话费|手机|套餐|流量/],
    ["medical", /药|医院|看病|门诊|体检|挂号/],
    ["fun", /电影|游戏|KTV|唱歌|演出|门票|会员/],
    ["study", /书|课程|培训|学费|网课/],
    ["sport", /健身|游泳|瑜伽|跑步/],
    ["travel", /旅行|旅游|酒店|民宿|景点/]
  ];
  var INCOME_RULES = [
    ["salary", /工资|薪水|发薪/],
    ["bonus", /奖金|年终奖|提成/],
    ["parttime", /兼职|外快|接单|稿费/],
    ["invest", /利息|分红|基金|股票|理财/],
    ["reimburse", /报销/],
    ["redpacket", /红包|压岁钱/],
    ["refund", /退款|退货|返现/]
  ];

  function parseText(text) {
    var m = text.match(/(\d+(?:\.\d{1,2})?)/);
    if (!m) return null;
    var isIncome = /收入|工资|奖金|收到|到账|赚|报销|退款|红包|利息|分红/.test(text);
    var rules = isIncome ? INCOME_RULES : RULES;
    var cat = null;
    for (var i = 0; i < rules.length; i++) {
      if (rules[i][1].test(text)) { cat = rules[i][0]; break; }
    }
    if (!cat && window.Store) {
      var custom = Store.visibleCats(isIncome ? "income" : "expense").filter(function (c) {
        return c.custom && text.indexOf(c.name) >= 0;
      })[0];
      if (custom) cat = custom.id;
    }
    if (!cat) cat = isIncome ? "otherincome" : "other";

    var date = window.Store ? Store.today() : "";
    if (/昨天/.test(text)) {
      var d1 = new Date(); d1.setDate(d1.getDate() - 1);
      date = d1.getFullYear() + "-" + String(d1.getMonth() + 1).padStart(2, "0") + "-" + String(d1.getDate()).padStart(2, "0");
    }
    return { amount: m[1], cat: cat, income: isIncome, date: date };
  }

  var quickCat = null;

  function quickCats() {
    if (!window.Store) return [];
    return Store.visibleCats("expense").slice(0, 10);
  }

  /* ---------- FAB ---------- */
  function buildFab() {
    var slot = document.getElementById("fabSlot");
    if (!slot) return;
    slot.innerHTML =
      '<button class="fab-btn" id="fabBtn" aria-label="记一笔">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
        'stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>' +
      "</button>";
    document.getElementById("fabBtn").addEventListener("click", openQuick);
  }

  /* ---------- 弹层 ---------- */
  function buildSheet() {
    var box = document.createElement("div");
    box.innerHTML =
      '<div class="sheet-mask" id="qMask"></div>' +
      '<div class="sheet" id="qSheet">' +
        '<div class="handle"></div>' +
        "<h3>快速记一笔</h3>" +
        '<div class="s-sub">说一句话就行，例如「午餐25元」</div>' +
        '<div class="input-row" style="margin-top:14px">' +
          '<input id="qInput" type="text" placeholder="午餐 25 元" autocomplete="off">' +
        "</div>" +
        '<div class="parse-hint" id="qHint"></div>' +
        '<div class="chips" id="qChips"></div>' +
        '<div class="btns">' +
          '<button class="btn-ghost" onclick="closeQuick()">取消</button>' +
          '<button class="btn-primary" style="flex:1" onclick="submitQuick()">记下</button>' +
        "</div>" +
      "</div>";
    document.body.appendChild(box);

    document.getElementById("qMask").addEventListener("click", closeQuick);
    document.getElementById("qInput").addEventListener("input", function () {
      var r = parseText(this.value);
      var h = document.getElementById("qHint");
      if (!r) { h.className = "parse-hint"; return; }
      quickCat = r.cat;
      renderChips();
      h.className = "parse-hint show";
      h.innerHTML = "识别为 <b>" + Store.catName(r.cat) + "</b> ｜ " +
                    (r.income ? "收入" : "支出") + " <b>¥" + r.amount + "</b>";
    });
  }

  function renderChips() {
    var box = document.getElementById("qChips");
    if (!box) return;
    var list = quickCats();
    if (!quickCat && list.length) quickCat = list[0].id;
    box.innerHTML = list.map(function (c) {
      var on = c.id === quickCat ? " active" : "";
      return '<button class="chip' + on + '" data-id="' + c.id + '">' + c.name + "</button>";
    }).join("");
    Array.prototype.forEach.call(box.querySelectorAll(".chip"), function (b) {
      b.addEventListener("click", function () {
        quickCat = this.dataset.id;
        renderChips();
      });
    });
  }

  window.openQuick = function () {
    quickCat = null;
    document.getElementById("qInput").value = "";
    document.getElementById("qHint").className = "parse-hint";
    renderChips();
    document.getElementById("qMask").classList.add("show");
    document.getElementById("qSheet").classList.add("show");
    setTimeout(function () { document.getElementById("qInput").focus(); }, 260);
  };

  window.closeQuick = function () {
    document.getElementById("qMask").classList.remove("show");
    document.getElementById("qSheet").classList.remove("show");
  };

  window.submitQuick = function () {
    var v = document.getElementById("qInput").value.trim();
    if (!v) { toast("请输入内容，例如「午餐25元」"); return; }
    var r = parseText(v);
    if (!r) { toast("没有识别到金额"); return; }

    var name = v.replace(/今天|昨天|前天|花了|消费|支出|收入|元/g, "")
                .replace(/(\d+(?:\.\d{1,2})?)/, "").trim() || Store.catName(r.cat);

    Store.add({ date: r.date, name: name, cat: r.cat, amount: Number(r.amount), type: r.income ? "income" : "expense" });
    closeQuick();
    toast("已记下：" + Store.catName(r.cat) + " ¥" + r.amount, { sound: "success" });

    /* 当前页如果有刷新函数，就地更新 */
    if (typeof window.renderBalance === "function") window.renderBalance();
    if (typeof window.renderRecent === "function") window.renderRecent();
    if (typeof window.render === "function") window.render();
    if (typeof window.refresh === "function") window.refresh();
  };

  function init() {
    if (!window.Store) return;
    buildFab();
    buildSheet();
    renderChips();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
