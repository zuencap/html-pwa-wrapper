// app.js — fixes panel collapse and changes Save behavior
const load = (id) => localStorage.getItem("doc:" + id);
const save = (id, html) => localStorage.setItem("doc:" + id, html);
const setLast = (id) => localStorage.setItem("lastDocId", id);
const getLast = () => localStorage.getItem("lastDocId");

const input = document.getElementById("input");
const viewer = document.getElementById("viewer");
const saveBtn = document.getElementById("saveBtn");
const installBtn = document.getElementById("installBtn");
const shareBtn = document.getElementById("shareBtn");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");
const docTitle = document.getElementById("docTitle");
const panel = document.getElementById("panel");
const togglePanel = document.getElementById("togglePanel");
const floatToggle = document.getElementById("floatToggle");
const appRoot = document.getElementById("appRoot");

let deferredPrompt = null;

// PWA install prompt
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

// Save & open full preview (and auto-hide panel)
saveBtn.addEventListener("click", () => {
  const html = input.value;
  const id = crypto.randomUUID().slice(0, 8);
  save(id, html);
  setLast(id);
  if (docTitle.value) localStorage.setItem("title:" + id, docTitle.value);
  render(id);
  const url = new URL(location.href);
  url.searchParams.set("doc", id);
  history.replaceState({}, "", url.toString());
  exportBtn.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  setPanel(true);
});

// Share link
shareBtn?.addEventListener("click", async () => {
  const url = new URL(location.href);
  const id = url.searchParams.get("doc") || getLast();
  if (!id) return alert("No document to share yet.");
  url.searchParams.set("doc", id);
  const link = url.toString();
  try {
    await navigator.clipboard.writeText(link);
    alert("Share URL copied!");
  } catch {
    prompt("Copy this URL:", link);
  }
});

// Clear storage
clearBtn?.addEventListener("click", () => {
  if (confirm("Clear all saved documents?")) {
    localStorage.clear();
    location.href = "./";
  }
});

function render(id) {
  const html = load(id) || "<p>No content</p>";
  viewer.setAttribute("srcdoc", html);
  const t = localStorage.getItem("title:" + id) || "HTML → PWA Wrapper";
  document.title = t;
}

// Boot: only render if there's a doc
(function boot() {
  const url = new URL(location.href);
  const id = url.searchParams.get("doc");
  if (id) {
    render(id);
  } else if (url.searchParams.get("start") === "last") {
    const last = getLast();
    if (last) render(last);
  }
})();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

// Panel toggling; also toggle grid columns on the root .app
function setPanel(collapsed) {
  panel.classList.toggle("collapsed", collapsed);
  appRoot.classList.toggle("panel-collapsed", collapsed);
  floatToggle.hidden = !collapsed;
  togglePanel.textContent = collapsed ? "⟩" : "⟨";
  localStorage.setItem("panelCollapsed", collapsed ? "1" : "0");
}

togglePanel.addEventListener("click", () => setPanel(!panel.classList.contains("collapsed")));
floatToggle.addEventListener("click", () => setPanel(false));

// Keyboard shortcut: Ctrl/Cmd + B
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