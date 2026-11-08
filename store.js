/* ===== 简账 数据层：账单 / 分类 / 设置 / 快照 =====
   预览版也真实读写 localStorage，所有页面共用
   ================================================ */
(function () {
  "use strict";

  var K_RECORDS = "jz_records_v1";
  var K_CATS    = "jz_cats_v1";
  var K_SET     = "jz_settings_v1";
  var K_SNAPS   = "jz_snapshots_v1";

  /* ---------- 内置分类 ---------- */
  var BUILTIN = [
    { id:"food",       name:"餐饮", icon:"food",       type:"expense" },
    { id:"traffic",    name:"交通", icon:"traffic",    type:"expense" },
    { id:"shop",       name:"购物", icon:"shop",       type:"expense" },
    { id:"home",       name:"住房", icon:"home",       type:"expense" },
    { id:"utilities",  name:"水电", icon:"utilities",  type:"expense" },
    { id:"phone",      name:"通讯", icon:"phone",      type:"expense" },
    { id:"clothes",    name:"服饰", icon:"clothes",    type:"expense" },
    { id:"medical",    name:"医疗", icon:"medical",    type:"expense" },
    { id:"fun",        name:"娱乐", icon:"fun",        type:"expense" },
    { id:"study",      name:"学习", icon:"study",      type:"expense" },
    { id:"sport",      name:"运动", icon:"sport",      type:"expense" },
    { id:"beauty",     name:"美容", icon:"beauty",     type:"expense" },
    { id:"pet",        name:"宠物", icon:"pet",        type:"expense" },
    { id:"travel",     name:"旅行", icon:"travel",     type:"expense" },
    { id:"gift",       name:"人情", icon:"gift",       type:"expense" },
    { id:"other",      name:"其他", icon:"other",      type:"expense" },
    { id:"salary",     name:"工资", icon:"salary",     type:"income"  },
    { id:"bonus",      name:"奖金", icon:"bonus",      type:"income"  },
    { id:"parttime",   name:"兼职", icon:"parttime",   type:"income"  },
    { id:"invest",     name:"理财", icon:"invest",     type:"income"  },
    { id:"reimburse",  name:"报销", icon:"reimburse",  type:"income"  },
    { id:"redpacket",  name:"红包", icon:"redpacket",  type:"income"  },
    { id:"refund",     name:"退款", icon:"refund",     type:"income"  },
    { id:"otherincome", name:"其他收入", icon:"otherincome", type:"income" }
  ];

  /* ---------- 按名称猜图标 ---------- */
  var ICON_RULES = [
    [/咖啡|奶茶|茶|饭|餐|吃|外卖|火锅|烧烤|零食/, "food"],
    [/打车|公交|地铁|出租|滴滴|加油|停车|高铁|火车|机票|单车/, "traffic"],
    [/买|购|超市|淘宝|京东|拼多多|日用品/, "shop"],
    [/房租|房贷|物业|中介|维修/, "home"],
    [/水费|电费|燃气|取暖|宽带|话费/, "utilities"],
    [/手机|流量|套餐/, "phone"],
    [/衣|裤|鞋|帽|包/, "clothes"],
    [/药|医院|门诊|体检|挂号|牙/, "medical"],
    [/电影|游戏|KTV|门票|会员|演出/, "fun"],
    [/书|课|培训|学费|考试/, "study"],
    [/健身|游泳|瑜伽|球|跑步/, "sport"],
    [/理发|美容|护肤|化妆|美甲/, "beauty"],
    [/猫|狗|宠物|粮|疫苗/, "pet"],
    [/旅行|旅游|酒店|民宿|景点/, "travel"],
    [/礼|红包|请客|份子/, "gift"],
    [/工资|薪/, "salary"],
    [/奖|年终|提成/, "bonus"],
    [/兼职|外快|稿费/, "parttime"],
    [/利息|分红|基金|股票|理财/, "invest"],
    [/报销/, "reimburse"],
    [/退款|退货|返现/, "refund"]
  ];

  function guessIcon(name, type) {
    for (var i = 0; i < ICON_RULES.length; i++) {
      if (ICON_RULES[i][0].test(name)) return ICON_RULES[i][1];
    }
    return type === "income" ? "otherincome" : "other";
  }

  /* ---------- 读写 ---------- */
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  }

  /* ---------- 默认数据（首次打开时灌入示例，之后就是真数据）---------- */
  function seedRecords() {
    var now = new Date();
    function ym(offset) {
      var d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    }
    var m0 = ym(0), m1 = ym(-1), m2 = ym(-2);
    var list = [
      [m0 + "-08", "午餐", "food", 25, "expense", "12:30"],
      [m0 + "-08", "地铁", "traffic", 6, "expense", "08:15"],
      [m0 + "-07", "超市采购", "shop", 158, "expense", "19:20"],
      [m0 + "-07", "咖啡", "food", 28, "expense", "15:05"],
      [m0 + "-05", "工资", "salary", 6200, "income", "09:00"],
      [m0 + "-03", "房租", "home", 2300, "expense", "10:00"],
      [m0 + "-02", "电影票", "fun", 90, "expense", "20:10"],
      [m0 + "-01", "健身房", "sport", 299, "expense", "18:00"],
      [m1 + "-28", "超市采购", "shop", 420, "expense", "17:30"],
      [m1 + "-20", "午餐", "food", 32, "expense", "12:10"],
      [m1 + "-18", "工资", "salary", 6200, "income", "09:00"],
      [m1 + "-15", "打车", "traffic", 45, "expense", "22:05"],
      [m1 + "-10", "房租", "home", 2300, "expense", "10:00"],
      [m1 + "-06", "网购", "shop", 268, "expense", "21:40"],
      [m1 + "-03", "电费", "utilities", 186, "expense", "11:00"],
      [m1 + "-02", "朋友结婚礼金", "gift", 800, "expense", "12:00"],
      [m2 + "-25", "工资", "salary", 6200, "income", "09:00"],
      [m2 + "-22", "旅行机票", "travel", 1280, "expense", "14:00"],
      [m2 + "-19", "酒店", "travel", 860, "expense", "16:30"],
      [m2 + "-14", "房租", "home", 2300, "expense", "10:00"],
      [m2 + "-09", "话费", "phone", 58, "expense", "09:30"],
      [m2 + "-05", "书", "study", 78, "expense", "15:00"]
    ];
    return list.map(function (r, i) {
      return {
        id: "seed_" + i,
        date: r[0],
        name: r[1],
        cat: r[2],
        amount: r[3],
        type: r[4],
        time: r[5]
      };
    });
  }

  /* ---------- 从 1.x 迁移旧数据 ---------- */
  var LEGACY_MAP = {
    "餐饮":"food","交通":"traffic","购物":"shop","住房":"home","水电":"utilities",
    "通讯":"phone","服饰":"clothes","医疗":"medical","娱乐":"fun","学习":"study",
    "运动":"sport","美容":"beauty","宠物":"pet","旅行":"travel","人情":"gift","其他":"other",
    "工资":"salary","奖金":"bonus","兼职":"parttime","理财":"invest","报销":"reimburse",
    "红包":"redpacket","退款":"refund","其他收入":"otherincome"
  };

  function migrateLegacy() {
    try {
      if (localStorage.getItem(K_RECORDS)) return 0;
      var raw = localStorage.getItem("finance_records_v1");
      if (!raw) return 0;
      var old = JSON.parse(raw);
      if (!Array.isArray(old) || !old.length) return 0;

      var conv = old.map(function (r, i) {
        var catName = r.category || "其他";
        var isIn = r.type === "income";
        return {
          id: "mig_" + i,
          date: /^\d{4}-\d{2}-\d{2}$/.test(r.date || "") ? r.date : today(),
          name: String(r.name || r.description || r.note || "未命名"),
          cat: LEGACY_MAP[catName] || (isIn ? "otherincome" : "other"),
          amount: Number(r.amount) || 0,
          type: isIn ? "income" : "expense",
          time: "00:00"
        };
      }).filter(function (r) { return r.amount > 0; });

      if (!conv.length) return 0;
      write(K_RECORDS, conv);

      /* 旧预算是个对象（按分类），累加成总预算 */
      try {
        var ob = JSON.parse(localStorage.getItem("finance_budget_v1") || "null");
        if (ob && typeof ob === "object") {
          var total = 0;
          for (var k in ob) total += Number(ob[k]) || 0;
          if (total > 0 && !settings.budget) { settings.budget = total; write(K_SET, settings); }
        }
      } catch (e2) {}

      return conv.length;
    } catch (e) { return 0; }
  }
  /* ---------- 初始化 ---------- */

  var cats = read(K_CATS, null);
  if (!cats) { cats = BUILTIN.map(function (c) { var o = {}; for (var k in c) o[k] = c[k]; o.hidden = false; o.custom = false; return o; }); write(K_CATS, cats); }
  else {
    /* 补齐新增的内置分类 */
    BUILTIN.forEach(function (b) {
      if (!cats.some(function (c) { return c.id === b.id; })) {
        var o = {}; for (var k in b) o[k] = b[k]; o.hidden = false; o.custom = false; cats.push(o);
      }
    });
  }

  var settings = read(K_SET, null) || {};
  var DEFAULT_SET = {
    budget: 0,
    pin: "",
    lockEnabled: false
  };
  for (var dk in DEFAULT_SET) if (settings[dk] === undefined) settings[dk] = DEFAULT_SET[dk];

  var snapshots = read(K_SNAPS, []);

  /* 先尝试从 1.x 迁移旧数据；迁移成功后不再灌示例数据 */
  migrateLegacy();

  var records = read(K_RECORDS, null);
  if (!records) { records = seedRecords(); write(K_RECORDS, records); }

  /* ---------- 工具 ---------- */
  function pad(n) { return String(n).padStart(2, "0"); }
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function nowTime() {
    var d = new Date();
    return pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function monthOf(dateStr) { return (dateStr || "").slice(0, 7); }
  function thisMonth() { return today().slice(0, 7); }

  function fmt(n) {
    return (Math.round(n * 100) / 100).toLocaleString("zh-CN", {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  }

  /* ---------- 简单哈希（预览用，正式版应换更强的）---------- */
  function hashPin(pin) {
    var h = 5381;
    var s = "jz$" + pin + "$salt";
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(16);
  }

  /* ================= 对外 API ================= */
  var Store = {};

  /* -- 账单 -- */
  Store.all = function () { return records.slice(); };

  Store.add = function (rec) {
    rec.id = "r_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    rec.date = rec.date || today();
    rec.time = rec.time || nowTime();
    records.push(rec);
    write(K_RECORDS, records);
    return rec;
  };

  Store.update = function (id, patch) {
    var r = records.find(function (x) { return x.id === id; });
    if (!r) return false;
    for (var k in patch) r[k] = patch[k];
    write(K_RECORDS, records);
    return true;
  };

  Store.remove = function (id) {
    var i = records.findIndex(function (x) { return x.id === id; });
    if (i < 0) return false;
    records.splice(i, 1);
    write(K_RECORDS, records);
    return true;
  };

  Store.byMonth = function (month) {
    return records.filter(function (r) { return monthOf(r.date) === (month || thisMonth()); });
  };

  Store.months = function () {
    var set = {};
    records.forEach(function (r) { set[monthOf(r.date)] = 1; });
    return Object.keys(set).sort().reverse();
  };

  /* -- 汇总 -- */
  Store.summary = function (month) {
    var list = Store.byMonth(month);
    var income = 0, expense = 0;
    list.forEach(function (r) {
      if (r.type === "income") income += Number(r.amount) || 0;
      else expense += Number(r.amount) || 0;
    });
    return { income: income, expense: expense, balance: income - expense, count: list.length };
  };

  Store.byCategory = function (month, type) {
    type = type || "expense";
    var map = {};
    Store.byMonth(month).forEach(function (r) {
      if ((r.type || "expense") !== type) return;
      map[r.cat] = (map[r.cat] || 0) + (Number(r.amount) || 0);
    });
    return Object.keys(map).map(function (id) {
      return { id: id, name: Store.catName(id), amount: map[id] };
    }).sort(function (a, b) { return b.amount - a.amount; });
  };

  /* -- 分类 -- */
  Store.cats = function (type) {
    return cats.filter(function (c) { return !type || c.type === type; });
  };
  Store.visibleCats = function (type) {
    return cats.filter(function (c) { return (!type || c.type === type) && !c.hidden; });
  };
  Store.cat = function (id) {
    return cats.find(function (c) { return c.id === id; }) || null;
  };
  Store.catName = function (id) {
    var c = Store.cat(id);
    return c ? c.name : "其他";
  };
  Store.catIcon = function (id) {
    var c = Store.cat(id);
    return c ? c.icon : "other";
  };

  Store.setCatHidden = function (id, hidden) {
    var c = Store.cat(id);
    if (!c) return false;
    c.hidden = !!hidden;
    write(K_CATS, cats);
    return true;
  };

  Store.addCat = function (name, type, icon) {
    name = (name || "").trim();
    if (!name) return { ok: false, msg: "名称不能为空" };
    if (cats.some(function (c) { return c.name === name && c.type === type; }))
      return { ok: false, msg: "已经有同名分类了" };

    var c = {
      id: "c_" + Date.now().toString(36),
      name: name,
      icon: icon || guessIcon(name, type),
      type: type,
      hidden: false,
      custom: true
    };
    cats.push(c);
    write(K_CATS, cats);
    return { ok: true, cat: c };
  };

  Store.updateCat = function (id, patch) {
    var c = Store.cat(id);
    if (!c) return false;
    for (var k in patch) c[k] = patch[k];
    write(K_CATS, cats);
    return true;
  };

  Store.removeCat = function (id) {
    var c = Store.cat(id);
    if (!c || !c.custom) return false;
    var i = cats.indexOf(c);
    cats.splice(i, 1);
    /* 该分类下的账单转为「其他」 */
    var fallback = c.type === "income" ? "otherincome" : "other";
    var changed = false;
    records.forEach(function (r) {
      if (r.cat === id) { r.cat = fallback; changed = true; }
    });
    if (changed) write(K_RECORDS, records);
    write(K_CATS, cats);
    return true;
  };

  Store.guessIcon = guessIcon;

  /* -- 设置 -- */
  Store.settings = function () { return settings; };
  Store.set = function (key, val) {
    settings[key] = val;
    write(K_SET, settings);
  };

  Store.setBudget = function (n) { Store.set("budget", Number(n) || 0); };

  Store.setPin = function (pin) { Store.set("pin", hashPin(pin)); Store.set("lockEnabled", true); };
  Store.clearPin = function () { Store.set("pin", ""); Store.set("lockEnabled", false); };
  Store.checkPin = function (pin) { return settings.pin && settings.pin === hashPin(pin); };
  Store.hasPin = function () { return !!settings.pin; };

  /* -- 快照 -- */
  Store.snapshot = function (note) {
    var snap = {
      at: Date.now(),
      note: note || "",
      records: records.slice()
    };
    snapshots.unshift(snap);
    if (snapshots.length > 7) snapshots = snapshots.slice(0, 7);
    write(K_SNAPS, snapshots);
    return snap;
  };
  Store.snapshots = function () { return snapshots.slice(); };
  Store.restoreSnapshot = function (at) {
    var s = snapshots.find(function (x) { return x.at === at; });
    if (!s) return false;
    Store.snapshot("恢复前自动备份");
    records = s.records.slice();
    write(K_RECORDS, records);
    return true;
  };
  Store.dropSnapshot = function (at) {
    var i = snapshots.findIndex(function (x) { return x.at === at; });
    if (i < 0) return false;
    snapshots.splice(i, 1);
    write(K_SNAPS, snapshots);
    return true;
  };

  /* -- 备份 -- */
  Store.exportData = function () {
    return {
      app: "简账",
      version: 1,
      exportedAt: new Date().toISOString(),
      records: records,
      categories: cats,
      settings: { budget: settings.budget }
    };
  };

  Store.importData = function (obj) {
    if (!obj || !Array.isArray(obj.records)) return { ok: false, msg: "备份文件格式不正确" };
    var clean = obj.records.filter(function (r) {
      return r && r.date && Number(r.amount) > 0;
    }).map(function (r) {
      return {
        id: r.id || ("imp_" + Math.random().toString(36).slice(2)),
        date: /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : today(),
        name: String(r.name || "未命名"),
        cat: r.cat || "other",
        amount: Number(r.amount),
        type: r.type === "income" ? "income" : "expense",
        time: r.time || "00:00"
      };
    });
    if (!clean.length) return { ok: false, msg: "备份里没有有效账单" };
    Store.snapshot("导入前自动备份");
    records = clean;
    write(K_RECORDS, records);
    return { ok: true, count: clean.length };
  };

  /* -- 清空 -- */
  Store.clearAll = function () {
    Store.snapshot("清空前自动备份");
    records = [];
    write(K_RECORDS, records);
  };

  /* -- 工具 -- */
  Store.today = today;
  Store.nowTime = nowTime;
  Store.monthOf = monthOf;
  Store.thisMonth = thisMonth;
  Store.fmt = fmt;
  Store.monthLabel = function (m) {
    if (!m) return "";
    var p = m.split("-");
    return p[0] + " 年 " + parseInt(p[1], 10) + " 月";
  };
  Store.dayLabel = function (dateStr) {
    var p = dateStr.split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    var week = "日一二三四五六"[d.getDay()];
    return parseInt(p[1], 10) + "月" + parseInt(p[2], 10) + "日 周" + week;
  };

  window.Store = Store;
})();
