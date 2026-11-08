/* 简账 Service Worker —— 发新版本时把 VERSION 改一下即可 */
var VERSION = "jz-v2.1.0-1";
var SHELL = [
  "./",
  "./index.html",
  "./records.html",
  "./stats.html",
  "./mine.html",
  "./app.css",
  "./extra.css",
  "./lock.css",
  "./calendar.css",
  "./store.js",
  "./icons.js",
  "./quick.js",
  "./feedback.js",
  "./theme.js",
  "./accent.js",
  "./lock.js",
  "./calendar.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (c) {
      return c.addAll(SHELL).catch(function () { /* 个别文件缺失不阻断 */ });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== VERSION) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  /* HTML 走网络优先，保证一刷新就是新版本 */
  if (req.mode === "navigate" || /\.html$/.test(url.pathname)) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (r) {
          return r || caches.match("./index.html");
        });
      })
    );
    return;
  }

  /* 其它静态资源：先用缓存，同时后台更新 */
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});