// app.js — full logic (gzip share + autosave) with guard + version display
const APP_VERSION = "v8";

// Guard: ensure Share link button exists and is wired
(function(){
  const btn = document.getElementById("shareEmbedBtn");
  if (!btn) {
    console.warn("[Wrapper] shareEmbedBtn not found in DOM. Make sure index.html has <button id=\"shareEmbedBtn\">.");
    // Create a placeholder to avoid 'nothing happens' experience
    const exp = document.getElementById("exportBtn");
    if (exp && exp.parentElement) {
      const ph = document.createElement("button");
      ph.id = "shareEmbedBtn";
      ph.className = "btn";
      ph.textContent = "Share link";
      exp.parentElement.appendChild(ph);
    }
  }
})();

// Show version in footer
(function(){
  const el = document.getElementById("appVersion");
  if (el) el.textContent = "Version " + APP_VERSION;
})();

/* ---------- Storage helpers ---------- */
const K_INDEX = "docsIndex"; // array of {id,title,ts}
const load    = (id) => localStorage.getItem("doc:" + id);
const save    = (id, html) => localStorage.setItem("doc:" + id, html);
const del     = (id) => localStorage.removeItem("doc:" + id);
const setLast = (id) => localStorage.setItem("lastDocId", id);
const getLast = () => localStorage.getItem("lastDocId");
const getIndex = () => { try { return JSON.parse(localStorage.getItem(K_INDEX)) || []; } catch { return []; } };
const setIndex = (arr) => localStorage.setItem(K_INDEX, JSON.stringify(arr));

/* ---------- Elements ---------- */
const input       = document.getElementById("input");
const viewer      = document.getElementById("viewer");
const saveBtn     = document.getElementById("saveBtn");
const installBtn  = document.getElementById("installBtn");
const exportBtn   = document.getElementById("exportBtn");
const clearBtn    = document.getElementById("clearBtn");
const docTitle    = document.getElementById("docTitle");
const panel       = document.getElementById("panel");
const togglePanel = document.getElementById("togglePanel");
const floatToggle = document.getElementById("floatToggle");
const appRoot     = document.getElementById("appRoot");
const docList     = document.getElementById("docList");
const docCount    = document.getElementById("docCount");
const shareEmbedBtn = document.getElementById("shareEmbedBtn");

let currentId = null;
let deferredPrompt = null;

/* ---------- Small utils ---------- */
function fmtTime(iso) { try { return new Date(iso).toLocaleString(); } catch { return iso; } }
function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function toBase64Url(bytes){
  let bin = "";
  const CHUNK = 0x8000;
  for (let i=0; i<bytes.length; i+=CHUNK){
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i+CHUNK));
  }
  const b64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/,"");
  return b64;
}
function fromBase64Url(b64url){
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i=0; i<bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
async function gzipCompressString(str){
  if (typeof CompressionStream === "undefined") {
    // Fallback: no compression, just UTF-8 bytes
    return new TextEncoder().encode(str);
  }
  const stream = new CompressionStream("gzip");
  const writer = stream.writable.getWriter();
  await writer.write(new TextEncoder().encode(str));
  await writer.close();
  const blob = await new Response(stream.readable).blob();
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}
async function gzipDecompressToString(bytes){
  if (typeof DecompressionStream === "undefined") {
    // Fallback: assume bytes are plain UTF-8 (no compression)
    return new TextDecoder().decode(bytes);
  }
  const blob = new Blob([bytes], {type:"application/gzip"});
  const ds = new DecompressionStream("gzip");
  const decompressed = blob.stream().pipeThrough(ds);
  const text = await new Response(decompressed).text();
  return text;
}

/* ---------- PWA install prompt ---------- */
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.hidden = false;
});
installBtn?.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

/* ---------- Save → new doc, render, list, auto-hide panel ---------- */
saveBtn.addEventListener("click", () => {
  const html  = input.value;
  const id    = crypto.randomUUID().slice(0, 8);
  const title = (docTitle.value || "Untitled").trim();
  const ts    = new Date().toISOString();

  save(id, html);
  setLast(id);
  currentId = id;

  const idx = getIndex();
  idx.unshift({ id, title, ts });
  setIndex(idx);

  renderList();
  render(id);

  const url = new URL(location.href);
  url.searchParams.set("doc", id);
  url.searchParams.delete("s");
  history.replaceState({}, "", url.toString());

  exportBtn.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));

  setPanel(true); // hide sidebar
});

/* ---------- Share link (gzip-compressed, Base64-URL) ---------- */
shareEmbedBtn?.addEventListener("click", async () => {
  const id   = currentId || getLast();
  const html = id ? load(id) : input.value;
  if (!html) return alert("Nothing to share yet.");
  const idx  = getIndex();
  const meta = id ? (idx.find(d => d.id===id) || {title: docTitle.value || "Shared"})
                  : {title: docTitle.value || "Shared"};
  const payload = JSON.stringify({ t: meta.title, h: html });
  const bytes   = await gzipCompressString(payload);
  const encoded = toBase64Url(bytes);

  const url = new URL(location.href);
  url.searchParams.set("s", encoded);
  url.searchParams.delete("doc");
  const link = url.toString();

  try { await navigator.clipboard.writeText(link); alert("Share link copied!"); }
  catch { prompt("Copy this URL:", link); }
});

/* ---------- Render current doc ---------- */
function render(id) {
  currentId = id;
  const html = load(id) || "<p>No content</p>";
  viewer.setAttribute("srcdoc", html);
  const t = (getIndex().find(d => d.id === id)?.title) || "HTML → PWA Wrapper";
  document.title = t;
  exportBtn.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  for (const li of docList.querySelectorAll("li")) li.classList.toggle("active", li.dataset.id === id);
}

/* ---------- Doc list ---------- */
function renderList() {
  const idx = getIndex();
  docCount.textContent = idx.length ? `${idx.length} saved` : "No docs yet";
  docList.innerHTML = idx.map(d => `
    <li data-id="${d.id}">
      <div class="doc-meta">
        <button class="doc-title" data-action="open" title="Open">${escapeHtml(d.title)}</button>
        <span class="doc-time">${fmtTime(d.ts)}</span>
      </div>
      <div class="doc-actions">
        <button class="icon-btn tiny" data-action="delete" title="Delete">🗑</button>
      </div>
    </li>
  `).join("");
  for (const li of docList.querySelectorAll("li")) li.classList.toggle("active", li.dataset.id === currentId);
}

/* ---------- List events (open/delete) ---------- */
docList.addEventListener("click", (e) => {
  const li = e.target.closest("li[data-id]");
  if (!li) return;
  const id = li.dataset.id;
  const action = e.target.dataset.action;
  if (action === "open") {
    setLast(id);
    render(id);
  } else if (action === "delete") {
    if (!confirm("Delete this document?")) return;
    const idx = getIndex().filter(d => d.id !== id);
    setIndex(idx);
    del(id);
    if (currentId === id) {
      currentId = null;
      if (idx.length) {
        const nextId = idx[0].id;
        setLast(nextId);
        render(nextId);
      } else {
        viewer.removeAttribute("srcdoc");
        document.title = "HTML → PWA Wrapper";
        const url = new URL(location.href);
        url.searchParams.delete("doc");
        history.replaceState({}, "", url.toString());
      }
    }
    renderList();
  }
});

/* ---------- Clear storage ---------- */
clearBtn?.addEventListener("click", () => {
  if (confirm("Clear ALL saved documents?")) {
    localStorage.clear();
    viewer.removeAttribute("srcdoc");
    document.title = "HTML → PWA Wrapper";
    renderList();
    const url = new URL(location.href);
    url.searchParams.delete("doc");
    url.searchParams.delete("s");
    history.replaceState({}, "", url.toString());
  }
});

/* ---------- Open from share (?s=...) — render, auto-save, update URL ---------- */
async function handleSharedOpen() {
  const url = new URL(location.href);
  const s = url.searchParams.get("s");
  if (!s) return false;
  try {
    const bytes = fromBase64Url(s);
    const json  = await gzipDecompressToString(bytes);
    const obj   = JSON.parse(json);
    const html  = obj.h || "";
    const title = (obj.t || "Shared").toString();

    // Render immediately
    viewer.setAttribute("srcdoc", html);
    document.title = title + " • Shared preview";

    // Auto-save: always create a new doc and focus it
    const id = crypto.randomUUID().slice(0,8);
    const ts = new Date().toISOString();
    save(id, html);
    setLast(id);
    currentId = id;
    const idx = getIndex();
    idx.unshift({ id, title, ts });
    setIndex(idx);
    renderList();

    // Replace URL with ?doc=ID (remove ?s=) to shorten and persist
    url.searchParams.delete("s");
    url.searchParams.set("doc", id);
    history.replaceState({}, "", url.toString());

    // Prepare export and hide panel
    exportBtn.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    setPanel(true);
    return true;
  } catch (e) {
    console.error("Share open failed:", e);
    alert("Couldn't open shared content.");
    return false;
  }
}

/* ---------- Boot ---------- */
(function boot() {
  renderList();
  handleSharedOpen().then((handled)=>{
    if (handled) return;
    const url = new URL(location.href);
    const id = url.searchParams.get("doc");
    if (id && load(id)) {
      render(id);
    } else if (url.searchParams.get("start") === "last") {
      const last = getLast();
      if (last && load(last)) render(last);
    }
  });
})();

/* ---------- SW ---------- */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

/* ---------- Panel toggling (grid + element) ---------- */
function setPanel(collapsed) {
  panel.classList.toggle("collapsed", collapsed);
  appRoot.classList.toggle("panel-collapsed", collapsed);
  floatToggle.hidden = !collapsed;
  togglePanel.textContent = collapsed ? "⟩" : "⟨";
  localStorage.setItem("panelCollapsed", collapsed ? "1" : "0");
}
togglePanel.addEventListener("click", () =>
  setPanel(!panel.classList.contains("collapsed"))
);
floatToggle.addEventListener("click", () => setPanel(false));
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
    e.preventDefault();
    setPanel(!panel.classList.contains("collapsed"));
  }
});
(function initPanel() {
  const collapsed = localStorage.getItem("panelCollapsed") === "1";
  setPanel(collapsed);
})();