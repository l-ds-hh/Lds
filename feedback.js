/* ===== 触感反馈：震动 + 记账提示音 ===== */
(function () {
  "use strict";

  var K_HAPTIC = "jz_haptic";
  var K_SOUND  = "jz_sound";

  var hapticOn = true;
  var soundOn  = true;
  try {
    hapticOn = localStorage.getItem(K_HAPTIC) !== "0";
    soundOn  = localStorage.getItem(K_SOUND)  !== "0";
  } catch (e) {}

  /* ---------- 震动 ---------- */
  function capHaptics() {
    return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) || null;
  }

  window.haptic = function (kind) {
    if (!hapticOn) return;
    kind = kind || "light";

    var p = capHaptics();
    if (p && typeof p.impact === "function") {
      try { p.impact({ style: kind === "heavy" ? "HEAVY" : "LIGHT" }); } catch (e) {}
      return;
    }

    /* 安卓 WebView：需要 VIBRATE 权限；时长太短会感觉不到 */
    if (navigator.vibrate) {
      try { navigator.vibrate(kind === "heavy" ? 32 : 18); } catch (e) {}
    }
  };

  /* ---------- 提示音 ---------- */
  var ctx = null;

  function audioCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    return ctx;
  }

  var unlocked = false;
  function unlockAudio() {
    if (unlocked) return;
    var c = audioCtx();
    if (!c) return;
    if (c.state === "suspended") {
      c.resume().then(function () { unlocked = true; }).catch(function () {});
    } else { unlocked = true; }
    try {
      var o = c.createOscillator(), g = c.createGain();
      g.gain.value = 0.00001;
      o.connect(g); g.connect(c.destination);
      o.start(); o.stop(c.currentTime + 0.02);
    } catch (e) {}
  }

  function beep(freq, startAt, dur, vol, type) {
    var c = ctx;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || "triangle";
    osc.frequency.setValueAtTime(freq, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(vol, startAt + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(startAt);
    osc.stop(startAt + dur + 0.03);
  }

  window.playSuccess = function () {
    if (!soundOn) return;
    var c = audioCtx();
    if (!c) return;
    if (c.state === "suspended") { try { c.resume(); } catch (e) {} }
    var t0 = c.currentTime + 0.01;
    beep(1046.5, t0,        0.18, 0.30);
    beep(1318.5, t0 + 0.10, 0.22, 0.26);
  };

  window.playRemove = function () {
    if (!soundOn) return;
    var c = audioCtx();
    if (!c) return;
    if (c.state === "suspended") { try { c.resume(); } catch (e) {} }
    var t0 = c.currentTime + 0.01;
    beep(660, t0,        0.14, 0.24);
    beep(494, t0 + 0.09, 0.18, 0.22);
  };

  /* ---------- 开关 ---------- */
  window.isHapticOn = function () { return hapticOn; };
  window.isSoundOn  = function () { return soundOn; };

  window.setHapticOn = function (v) {
    hapticOn = !!v;
    try { localStorage.setItem(K_HAPTIC, hapticOn ? "1" : "0"); } catch (e) {}
    syncUI();
    if (hapticOn) window.haptic("light");
  };

  window.setSoundOn = function (v) {
    soundOn = !!v;
    try { localStorage.setItem(K_SOUND, soundOn ? "1" : "0"); } catch (e) {}
    syncUI();
    if (soundOn) window.playSuccess();
  };

  window.cycleHaptic = function () { window.setHapticOn(!hapticOn); };
  window.cycleSound  = function () { window.setSoundOn(!soundOn); };

  function syncUI() {
    var hs = document.getElementById("hapticSwitch");
    var ht = document.getElementById("hapticState");
    if (hs) hs.classList.toggle("on", hapticOn);
    if (ht) ht.textContent = hapticOn ? "已开启" : "已关闭";

    var ss = document.getElementById("soundSwitch");
    var st = document.getElementById("soundState");
    if (ss) ss.classList.toggle("on", soundOn);
    if (st) st.textContent = soundOn ? "已开启" : "已关闭";
  }
  window.syncFeedbackUI = syncUI;

  /* ---------- 全局轻震动 ---------- */
  var SELECTOR = "button, .tab, .record, .menu-item, .cat, .chip, .profile, .switch, .cal-day, .accent-item";

  document.addEventListener("pointerdown", function (e) {
    unlockAudio();
    if (!e.target.closest) return;
    if (e.target.closest(SELECTOR)) window.haptic("light");
  }, { passive: true });

  document.addEventListener("touchstart", unlockAudio, { passive: true, once: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncUI);
  } else { syncUI(); }
})();