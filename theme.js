/* 主题：system / light / dark，存在 localStorage，页面渲染前就同步设置好，避免闪白 */
(function () {
  "use strict";

  var KEY = "preview_theme";
  var pref = "system";
  try { pref = localStorage.getItem(KEY) || "system"; } catch (e) {}

  function resolved() {
    if (pref === "dark") return "dark";
    if (pref === "light") return "light";
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch (e) { return "light"; }
  }

  function apply() {
    document.documentElement.setAttribute("data-theme", resolved());
  }

  apply();

  try {
    window.matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", function () {
        if (pref === "system") apply();
      });
  } catch (e) {}

  window.getThemePref = function () { return pref; };
  window.isDarkNow = function () { return resolved() === "dark"; };

  /* 三档：system -> dark -> light -> system */
  window.cycleTheme = function () {
    pref = pref === "system" ? "dark" : (pref === "dark" ? "light" : "system");
    try { localStorage.setItem(KEY, pref); } catch (e) {}
    apply();
    return pref;
  };

  window.setThemePref = function (p) {
    pref = p;
    try { localStorage.setItem(KEY, p); } catch (e) {}
    apply();
  };

  window.themeLabel = function () {
    return pref === "system" ? "跟随系统" : (pref === "dark" ? "深色" : "浅色");
  };
})();
