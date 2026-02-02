// ==UserScript==
// @name         MadeByLukas
// @namespace    madebylukas
// @version      1.0.1
// @description  Loader + Update UI (stable & cached)
// @match        https://*.tankionline.com/play/
// @match        https://*.tankionline.com/browser-public/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      raw.githubusercontent.com
// ==/UserScript==

(function () {
  "use strict";

  const MANIFEST =
    "https://raw.githubusercontent.com/Insults69/MadeByLukas-Script/main/manifest.json";

  const DISCORD_ID = "528556499614826526";

  const CURRENT_VERSION =
    (typeof GM_info !== "undefined" && GM_info.script && GM_info.script.version)
      ? GM_info.script.version
      : "0.0.0";

  function semverGt(a, b) {
    const pa = String(a).replace(/^v/i, "").split(".").map(n => parseInt(n, 10) || 0);
    const pb = String(b).replace(/^v/i, "").split(".").map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      if ((pa[i] || 0) > (pb[i] || 0)) return true;
      if ((pa[i] || 0) < (pb[i] || 0)) return false;
    }
    return false;
  }

  function waitForBody(cb) {
    if (document.body) return cb();
    const i = setInterval(() => {
      if (document.body) {
        clearInterval(i);
        cb();
      }
    }, 20);
  }

  /* ================= UPDATE MENU UI ================= */
  function showUpdateMenu({ latestVersion, downloadUrl, changelog }) {
    waitForBody(() => {
      if (document.getElementById("lukas-updater-overlay")) return;

      const style = document.createElement("style");
      style.textContent = `
      #lukas-updater-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(6px);
      display:flex;align-items:center;justify-content:center;z-index:999999}
      #lukas-updater{width:420px;background:#0b0b10;border-radius:16px;padding:22px;color:#fff;
      font-family:system-ui;box-shadow:0 0 40px rgba(255,60,60,.45)}
      .lukas-header{text-align:center;font-size:12px;letter-spacing:2px;opacity:.8}
      .lukas-close{position:absolute;right:18px;top:14px;cursor:pointer}
      h1{text-align:center;font-size:20px;margin:16px 0}
      .lukas-versions{display:flex;gap:10px}
      .version-box{flex:1;background:#111;border-radius:10px;padding:10px;text-align:center}
      .latest{border:1px solid red}
      .lukas-buttons{display:flex;gap:10px;margin-top:16px}
      button{flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer}
      .update{background:red;color:white}
      `;
      document.head.appendChild(style);

      const overlay = document.createElement("div");
      overlay.id = "lukas-updater-overlay";
      overlay.innerHTML = `
        <div id="lukas-updater">
          <div class="lukas-header">MADE BY LUKAS</div>
          <span class="lukas-close">✕</span>
          <h1>UPDATE AVAILABLE</h1>
          <div class="lukas-versions">
            <div class="version-box">Current<br><b>${CURRENT_VERSION}</b></div>
            <div class="version-box latest">Latest<br><b>${latestVersion}</b></div>
          </div>
          <div style="margin-top:10px;font-size:13px">
            ${(changelog || []).map(x => "• " + x).join("<br>")}
          </div>
          <div class="lukas-buttons">
            <button onclick="window.open('https://discord.com/users/${DISCORD_ID}','_blank')">Discord</button>
            <button class="update">Update</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.querySelector(".lukas-close").onclick = () => overlay.remove();
      overlay.querySelector(".update").onclick = () =>
        window.open(downloadUrl, "_blank");
    });
  }

  function httpGet(url) {
    return new Promise((res, rej) => {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        onload: r => r.status === 200 ? res(r.responseText) : rej(),
        onerror: rej
      });
    });
  }

  /* ================= MAIN ================= */
  (async () => {
    let manifest;
    try {
      manifest = JSON.parse(await httpGet(MANIFEST + "?t=" + Date.now()));
    } catch {
      return;
    }

    if (semverGt(manifest.latest, CURRENT_VERSION)) {
      showUpdateMenu({
        latestVersion: manifest.latest,
        downloadUrl: manifest.downloadUrl,
        changelog: manifest.changelog
      });
    }

    const CACHE_VER = "lukas_cache_ver";
    const CACHE_CODE = "lukas_cache_code";

    let code = await GM_getValue(CACHE_CODE);
    let ver = await GM_getValue(CACHE_VER);

    if (!code || ver !== manifest.latest) {
      code = await httpGet(manifest.payloadUrl + "?t=" + Date.now());
      await GM_setValue(CACHE_CODE, code);
      await GM_setValue(CACHE_VER, manifest.latest);
    }

    // run SAME timing as before, just async-safe
    Promise.resolve().then(() => {
      try { eval(code); } catch {}
    });
  })();
})();
