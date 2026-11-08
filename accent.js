/* ===== 主题色：可自选界面主色 ===== */
(function () {
  "use strict";

  var KEY = "jz_accent";

  var LIST = [
    { id: "blue",     name: "靛蓝", color: "#4C6FFF" },
    { id: "green",    name: "青绿", color: "#0FA958" },
    { id: "orange",   name: "橙橙", color: "#F76707" },
    { id: "pink",     name: "玫红", color: "#E64980" },
    { id: "purple",   name: "紫罗兰", color: "#7C6CF5" },
    { id: "graphite", name: "石墨", color: "#4A5160" }
  ];

  var cur = "blue";
  try { cur = localStorage.getItem(KEY) || "blue"; } catch (e) {}

  function apply() {
    document.documentElement.setAttribute("data-accent", cur);
  }
  apply();

  window.ACCENTS = LIST;
  window.getAccent = function () { return cur; };
  window.accentName = function () {
    var a = LIST.filter(function (x) { return x.id === cur; })[0];
    return a ? a.name : "靛蓝";
  };
  window.setAccent = function (id) {
    if (!LIST.some(function (x) { return x.id === id; })) return;
    cur = id;
    try { localStorage.setItem(KEY, id); } catch (e) {}
    apply();
  };
})();
