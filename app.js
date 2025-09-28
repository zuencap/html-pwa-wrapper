// app.js — multi-doc index, switching, delete; scripts always allowed
const K_INDEX = "docsIndex"; // array of {id,title,ts}
const load = (id) => localStorage.getItem("doc:" + id);
const save = (id, html) => localStorage.setItem("doc:" + id, html);
const del = (id) => localStorage.removeItem("doc:" + id);
const setLast = (id) => localStorage.setItem("lastDocId", id);
const getLast = () => localStorage.getItem("lastDocId");
const getIndex = () => { try { return JSON.parse(localStorage.getItem(K_INDEX)) || []; } catch { return []; } };
const setIndex = (arr) => localStorage.setItem(K_INDEX, JSON.stringify(arr));

const input = document.getElementById("input");
const viewer = document.getElementById("viewer");
const saveBtn = document.getElementById("saveBtn");
const installBtn = document.getElementById("installBtn");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");
const docTitle = document.getElementById("docTitle");
const panel = document.getElementById("panel");
const togglePanel = document.getElementById("togglePanel");
const floatToggle = document.getElementById("floatToggle");
const appRoot = document.getElementById("appRoot");
const docList = document.getElementById("docList");
const docCount = document.getElementById("docCount");

let currentId = null;
let deferredPrompt = null;

// PWA install prompt
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn?.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

// Save → new doc, render, update index, auto-hide panel
saveBtn.addEventListener("click", () => {
  const html = input.value;
  const id = crypto.randomUUID().slice(0, 8);
  const title = (docTitle.value || "Untitled").trim();
  const ts = new Date().toISOString();
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
  history.replaceState({}, "", url.toString());
  exportBtn.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  setPanel(true);
});

// Render current doc
function render(id) {
  currentId = id;
  const html = load(id) || "<p>No content</p>";
  viewer.setAttribute("srcdoc", html);
  const t = (getIndex().find(d => d.id === id)?.title) || localStorage.getItem("title:" + id) || "HTML → PWA Wrapper";
  document.title = t;
  exportBtn.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  for (const li of docList.querySelectorAll("li")) li.classList.toggle("active", li.dataset.id === id);
}

// Build docs list
function fmtTime(iso) { try { return new Date(iso).toLocaleString(); } catch { return iso; } }
function escapeHtml(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
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

// List events (open/delete)
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

// Clear storage
clearBtn?.addEventListener("click", () => {
  if (confirm("Clear ALL saved documents?")) {
    localStorage.clear();
    viewer.removeAttribute("srcdoc");
    document.title = "HTML → PWA Wrapper";
    renderList();
    const url = new URL(location.href);
    url.searchParams.delete("doc");
    history.replaceState({}, "", url.toString());
  }
});

// Boot
(function boot() {
  renderList();
  const url = new URL(location.href);
  const id = url.searchParams.get("doc");
  if (id && load(id)) {
    render(id);
  } else if (url.searchParams.get("start") === "last") {
    const last = getLast();
    if (last && load(last)) render(last);
  }
})();

// SW
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

// Panel toggling
function setPanel(collapsed) {
  panel.classList.toggle("collapsed", collapsed);
  appRoot.classList.toggle("panel-collapsed", collapsed);
  floatToggle.hidden = !collapsed;
  togglePanel.textContent = collapsed ? "⟩" : "⟨";
  localStorage.setItem("panelCollapsed", collapsed ? "1" : "0");
}
togglePanel.addEventListener("click", () => setPanel(!panel.classList.contains("collapsed")));
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