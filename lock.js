/* ===== 应用锁：PIN 解锁遮罩 ===== */
(function () {
  "use strict";

  var UNLOCK_KEY = "jz_unlocked_session";

  function unlocked() {
    try { return sessionStorage.getItem(UNLOCK_KEY) === "1"; } catch (e) { return false; }
  }
  function markUnlocked() {
    try { sessionStorage.setItem(UNLOCK_KEY, "1"); } catch (e) {}
  }

  var buffer = "";
  var overlay = null;
  var dots = null;
  var hintEl = null;
  var wrong = 0;

  function build() {
    overlay = document.createElement("div");
    overlay.className = "lock-screen";
    overlay.innerHTML =
      '<div class="lock-inner">' +
        '<div class="lock-logo">简</div>' +
        '<div class="lock-title">输入密码</div>' +
        '<div class="lock-hint" id="lockHint">请输入 4 位数字密码</div>' +
        '<div class="lock-dots" id="lockDots">' +
          '<i></i><i></i><i></i><i></i>' +
        "</div>" +
        '<div class="lock-pad" id="lockPad"></div>' +
        '<button class="lock-forgot" id="lockForgot">忘记密码？</button>' +
      "</div>";
    document.body.appendChild(overlay);

    dots = overlay.querySelectorAll(".lock-dots i");
    hintEl = overlay.querySelector("#lockHint");

    /* 键盘 1-9 + 空白 + 0 + 退格 */
    var keys = ["1","2","3","4","5","6","7","8","9","","0","del"];
    var pad = overlay.querySelector("#lockPad");
    pad.innerHTML = keys.map(function (k) {
      if (k === "") return '<span class="lock-key empty"></span>';
      if (k === "del") {
        return '<button class="lock-key" data-k="del" aria-label="删除">' +
               '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
               'stroke-linecap="round" stroke-linejoin="round"><path d="M20 6H9l-5 6 5 6h11a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z"/>' +
               '<path d="M13 10l4 4M17 10l-4 4"/></svg></button>';
      }
      return '<button class="lock-key" data-k="' + k + '">' + k + "</button>";
    }).join("");

    pad.addEventListener("click", function (e) {
      var b = e.target.closest(".lock-key");
      if (!b || !b.dataset.k) return;
      if (typeof window.haptic === "function") window.haptic("light");
      var k = b.dataset.k;
      if (k === "del") { buffer = buffer.slice(0, -1); paint(); return; }
      if (buffer.length >= 4) return;
      buffer += k;
      paint();
      if (buffer.length === 4) setTimeout(submit, 120);
    });

    overlay.querySelector("#lockForgot").addEventListener("click", forgot);
  }

  function paint() {
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle("on", i < buffer.length);
    }
  }

  function submit() {
    if (window.Store.checkPin(buffer)) {
      markUnlocked();
      hide();
      if (typeof window.toast === "function") window.toast("已解锁");
      return;
    }
    wrong++;
    buffer = "";
    paint();
    overlay.classList.add("shake");
    setTimeout(function () { overlay.classList.remove("shake"); }, 320);

    if (wrong >= 5) {
      hintEl.textContent = "错误次数过多，请稍后再试";
      lockPad(true);
      setTimeout(function () { lockPad(false); hintEl.textContent = "请输入 4 位数字密码"; wrong = 0; }, 15000);
    } else {
      hintEl.textContent = "密码不对，还可以试 " + (5 - wrong) + " 次";
    }
    if (typeof window.haptic === "function") window.haptic("heavy");
  }

  function lockPad(disabled) {
    overlay.querySelectorAll(".lock-key").forEach(function (b) {
      b.disabled = disabled;
      b.style.opacity = disabled ? ".35" : "";
    });
  }

  function forgot() {
    if (!confirm("忘记密码只能清空全部账单后重新开始。\n\n当前数据会先自动备份一份。\n\n确定继续吗？")) return;
    window.Store.clearAll();
    window.Store.clearPin();
    markUnlocked();
    hide();
    if (typeof window.toast === "function") window.toast("已清空并关闭应用锁");
    setTimeout(function () { location.reload(); }, 600);
  }

  function show() {
    if (!overlay) build();
    overlay.classList.add("show");
    buffer = "";
    paint();
    lockPad(false);
    hintEl.textContent = "请输入 4 位数字密码";
  }
  function hide() { if (overlay) overlay.classList.remove("show"); }

  window.LockScreen = { show: show, hide: hide, unlocked: unlocked };

  /* 启动检查 */
  function init() {
    if (window.Store && window.Store.settings().lockEnabled && !unlocked()) show();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
