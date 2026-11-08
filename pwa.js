/* PWA：注册 Service Worker + 处理安装提示 */
(function () {
  "use strict";

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").catch(function () {});
    });
  }

  /* 安卓 Chrome 的「安装到桌面」提示 */
  var deferred = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    window.__canInstall = true;
    document.dispatchEvent(new CustomEvent("pwa-installable"));
  });

  window.installPWA = function () {
    if (!deferred) return false;
    deferred.prompt();
    deferred = null;
    return true;
  };

  /* iOS 没有安装提示，只能引导用户手动「添加到主屏幕」 */
  window.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  window.isStandalone = function () {
    return window.matchMedia("(display-mode: standalone)").matches ||
           window.navigator.standalone === true;
  };
})();