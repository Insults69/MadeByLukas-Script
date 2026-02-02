// ==UserScript==
// @name         MadeByLukas
// @namespace    madebylukas
// @version      1.0.7
// @description  Loader + Update UI
// @match        https://*.tankionline.com/play/*
// @match        https://*.tankionline.com/browser-public/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
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

  const DEBUG = true;
  const log = (...a) => { if (DEBUG) console.log("[MadeByLukas]", ...a); };

  // NEW: prevents running payload twice on SPA reloads
  const RUN_ONCE_KEY = "__MADEBYLUKAS_PAYLOAD_RAN__";

  function semverGt(a, b) {
    const pa = String(a).replace(/^v/i, "").split(".").map(n => parseInt(n, 10) || 0);
    const pb = String(b).replace(/^v/i, "").split(".").map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const x = pa[i] || 0, y = pb[i] || 0;
      if (x > y) return true;
      if (x < y) return false;
    }
    return false;
  }

  function waitForBody(cb) {
    if (document.body) return cb();
    const t = setInterval(() => {
      if (document.body) {
        clearInterval(t);
        cb();
      }
    }, 20);
  }

  function showUpdateMenu({ latestVersion, downloadUrl, changelog }) {
    waitForBody(() => {
      if (document.getElementById("lukas-updater-overlay")) return;

      const style = document.createElement("style");
      style.textContent = `
      #lukas-updater-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.6);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          animation: fadeIn .25s ease;
      }
      #lukas-updater {
          width: 420px;
          background: linear-gradient(180deg,#0b0b10,#06060a);
          border-radius: 16px;
          box-shadow: 0 0 40px rgba(255,60,60,.45);
          border: 1px solid rgba(255,70,70,.35);
          padding: 22px;
          color: white;
          font-family: Inter, system-ui, sans-serif;
          animation: scaleIn .3s ease;
      }
      .lukas-header {
          position: relative;
          text-align: center;
          font-size: 12px;
          letter-spacing: 2px;
          opacity: .85;
          margin-bottom: 6px;
      }
      .lukas-close {
          position: absolute;
          right: 0;
          top: -2px;
          cursor: pointer;
          font-size: 18px;
          opacity: .7;
          transition: .2s;
      }
      .lukas-close:hover { opacity: 1; }
      #lukas-updater h1 {
          margin: 18px 0;
          text-align: center;
          font-size: 20px;
          font-weight: 700;
      }
      .lukas-versions { display:flex; gap:14px; margin-bottom:16px; }
      .version-box {
          flex: 1;
          background: rgba(255,255,255,.04);
          border-radius: 12px;
          padding: 14px;
          text-align: center;
      }
      .version-box span { font-size:12px; opacity:.7; letter-spacing:1px; }
      .version-box strong { font-size:22px; display:block; margin-top:6px; }
      .version-box.latest {
          border: 1px solid rgba(255,70,70,.6);
          box-shadow: 0 0 16px rgba(255,70,70,.35);
      }
      .lukas-changelog-title {
          font-size: 12px;
          opacity: .7;
          letter-spacing: 1px;
          margin-bottom: 8px;
      }
      .lukas-changelog-box {
          background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 13px;
          line-height: 1.6;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.05);
      }
      .lukas-changelog-item { display:flex; align-items:center; gap:8px; }
      .lukas-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #ff3c3c;
          box-shadow: 0 0 6px rgba(255,60,60,.8);
      }
      .lukas-buttons { display:flex; gap:12px; margin-top:16px; }
      .lukas-btn {
          flex: 1;
          padding: 12px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: .2s;
      }
      .lukas-btn.discord { background: rgba(255,255,255,.08); color: white; }
      .lukas-btn.update {
          background: linear-gradient(135deg,#ff3c3c,#ff1f1f);
          color: white;
          box-shadow: 0 0 18px rgba(255,60,60,.5);
      }
      .lukas-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes scaleIn { from { transform: scale(.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `;
      document.head.appendChild(style);

      const overlay = document.createElement("div");
      overlay.id = "lukas-updater-overlay";

      const items = (Array.isArray(changelog) ? changelog : [])
        .slice(0, 6)
        .map(t => `<div class="lukas-changelog-item"><span class="lukas-dot"></span>${String(t)}</div>`)
        .join("") || `<div class="lukas-changelog-item"><span class="lukas-dot"></span>Update available</div>`;

      overlay.innerHTML = `
      <div id="lukas-updater">
        <div class="lukas-header">
          MADE BY LUKAS
          <span class="lukas-close">✕</span>
        </div>

        <h1>NEW VERSION AVAILABLE</h1>

        <div class="lukas-versions">
          <div class="version-box"><span>Current</span><strong>${CURRENT_VERSION}</strong></div>
          <div class="version-box latest"><span>Latest</span><strong>${latestVersion}</strong></div>
        </div>

        <div class="lukas-changelog">
          <div class="lukas-changelog-title">WHAT'S NEW</div>
          <div class="lukas-changelog-box">${items}</div>
        </div>

        <div class="lukas-buttons">
          <button class="lukas-btn discord">Discord</button>
          <button class="lukas-btn update">Update</button>
        </div>
      </div>
      `;

      document.body.appendChild(overlay);

      overlay.querySelector(".lukas-close").onclick = () => overlay.remove();

      overlay.querySelector(".discord").onclick = () => {
        const appURL = `discord://-/users/${DISCORD_ID}`;
        const webURL = `https://discord.com/users/${DISCORD_ID}`;
        window.location.href = appURL;
        setTimeout(() => window.open(webURL, "_blank"), 1200);
      };

      overlay.querySelector(".update").onclick = () => {
        window.open(downloadUrl, "_blank", "noopener,noreferrer");
      };
    });
  }

  function httpGet(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        headers: { "Cache-Control": "no-cache" },
        onload: (r) => (r.status >= 200 && r.status < 300)
          ? resolve(r.responseText)
          : reject(new Error("HTTP " + r.status + " " + url)),
        onerror: () => reject(new Error("network error " + url))
      });
    });
  }

  function runASAP(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => setTimeout(fn, 0), { once: true });
    } else {
      setTimeout(fn, 0);
    }
  }

  (async () => {
    let data;
    try {
      log("Fetching manifest…");
      data = JSON.parse(await httpGet(MANIFEST + "?t=" + Date.now()));
    } catch (e) {
      console.error("[MadeByLukas] Manifest failed:", e);
      return;
    }

    const latest = data.latest || "0.0.0";
    log("Manifest latest:", latest);

    if (semverGt(latest, CURRENT_VERSION)) {
      showUpdateMenu({
        latestVersion: latest,
        downloadUrl: data.downloadUrl,
        changelog: data.changelog
      });
    }

    if (!data.payloadUrl) {
      console.error("[MadeByLukas] manifest.payloadUrl missing");
      return;
    }

    const CACHE_VER_KEY = "lukas_payload_version";
    const CACHE_CODE_KEY = "lukas_payload_code";
    const LAST_GOOD_CODE_KEY = "lukas_payload_last_good_code";
    const LAST_GOOD_VER_KEY  = "lukas_payload_last_good_ver";

    let cachedVer = await GM_getValue(CACHE_VER_KEY, "");
    let code = await GM_getValue(CACHE_CODE_KEY, "");

    if (!code || cachedVer !== latest) {
      try {
        log("Downloading payload…");
        code = await httpGet(data.payloadUrl + "?t=" + Date.now());
        await GM_setValue(CACHE_CODE_KEY, code);
        await GM_setValue(CACHE_VER_KEY, latest);
        log("Payload cached.");
      } catch (e) {
        console.error("[MadeByLukas] Payload download failed:", e);
        return;
      }
    } else {
      log("Using cached payload.");
    }

    // Ensure unsafeWindow exists for payloads that expect it
    const shim = `
      var unsafeWindow = (typeof unsafeWindow !== "undefined") ? unsafeWindow : window;
    `;

    // NEW: prevent double-run + log payload crash only once
    let crashLogged = false;

    runASAP(() => {
      try {
        // Run once protection
        const uw = (typeof unsafeWindow !== "undefined") ? unsafeWindow : window;
        if (uw[RUN_ONCE_KEY]) return;
        uw[RUN_ONCE_KEY] = true;

        (0, eval)(shim + "\n" + code);
        log("Payload executed.");

        // NEW: save last known good payload (only after a successful eval)
        GM_setValue(LAST_GOOD_CODE_KEY, code);
        GM_setValue(LAST_GOOD_VER_KEY, latest);
      } catch (e) {
        if (!crashLogged) {
          crashLogged = true;
          console.error("[MadeByLukas] Payload crashed:", e);
        }

        // NEW: rollback to last known good payload if available
        try {
          const old = GM_getValue(LAST_GOOD_CODE_KEY, "");
          const oldVer = GM_getValue(LAST_GOOD_VER_KEY, "");
          if (old && old !== code) {
            console.warn("[MadeByLukas] Rolling back to last good payload:", oldVer);
            (0, eval)(shim + "\n" + old);
          }
        } catch (_) {}
      }
    });
  })();
})();
