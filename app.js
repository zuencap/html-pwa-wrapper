// app.js — doc list + URL-safe Base64 share (no external libs)

const K_INDEX = "docsIndex"; // array of {id,title,ts}
const load   = (id) => localStorage.getItem("doc:" + id);
const save   = (id, html) => localStorage.setItem("doc:" + id, html);
const del    = (id) => localStorage.removeItem("doc:" + id);
const setLast= (id) => localStorage.setItem("lastDocId", id);
const getLast= () => localStorage.getItem("lastDocId");
const getIndex = () => { try { return JSON.parse(localStorage.getItem(K_INDEX)) || []; } catch { return []; } };
const setIndex = (arr) => localStorage.setItem(K_INDEX, JSON.stringify(arr));

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

/* ---------- Share link (URL-safe Base64 of {t,h}) ---------- */
function b64urlEncode(str) {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/,"");
}
function b64urlDecode(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  return decodeURIComponent(escape(atob(b64 + pad)));
}
shareEmbedBtn?.addEventListener("click", async () => {
  const id   = currentId || getLast();
  const html = id ? load(id) : input.value;
  if (!html) return alert("Nothing to share yet.");
  const idx  = getIndex();
  const meta = id ? (idx.find(d => d.id===id) || {title: docTitle.value || "Shared"})
                  : {title: docTitle.value || "Shared"};
  const payload = JSON.stringify({ t: meta.title, h: html });
  const encoded = b64urlEncode(payload);

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
function fmtTime(iso) { try { return new Date(iso).toLocaleString(); } catch { return iso; } }
function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
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

/* ---------- Open from share (?s=...) ---------- */
function tryOpenShared() {
  const url = new URL(location.href);
  const s = url.searchParams.get("s");
  if (!s) return false;
  try {
    const obj = JSON.parse(b64urlDecode(s));
    const html  = obj.h || "";
    const title = obj.t || "Shared";
    input.value = html;
    docTitle.value = title;
    viewer.setAttribute("srcdoc", html);
    document.title = title + " • Shared preview";
    setPanel(true);
    return true;
  } catch {
    alert("Couldn't open shared content.");
    return false;
  }
}

/* ---------- Boot ---------- */
(function boot() {
  renderList();
  if (tryOpenShared()) return;
  const url = new URL(location.href);
  const id = url.searchParams.get("doc");
  if (id && load(id)) {
    render(id);
  } else if (url.searchParams.get("start") === "last") {
    const last = getLast();
    if (last && load(last)) render(last);
  }
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
