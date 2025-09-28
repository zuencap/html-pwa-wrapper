// app.js
// Tiny local storage "DB" (for demo). Swap to IndexedDB for larger payloads.
const load = (id) => localStorage.getItem("doc:" + id);
const save = (id, html) => localStorage.setItem("doc:" + id, html);
const setLast = (id) => localStorage.setItem("lastDocId", id);
const getLast = () => localStorage.getItem("lastDocId");

const input = document.getElementById("input");
const viewer = document.getElementById("viewer");
const allowScripts = document.getElementById("allowScripts");
const saveBtn = document.getElementById("saveBtn");
const installBtn = document.getElementById("installBtn");
const shareBtn = document.getElementById("shareBtn");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");
const docTitle = document.getElementById("docTitle");

let deferredPrompt = null;

// Handle install prompt control
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
  console.log("Install outcome:", outcome);
});

// Save & Preview
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
});

shareBtn.addEventListener("click", async () => {
  const url = new URL(location.href);
  const id = url.searchParams.get("doc") || getLast();
  if (!id) return alert("No document to share yet.");
  url.searchParams.set("doc", id);
  const link = url.toString();
  try {
    await navigator.clipboard.writeText(link);
    alert("Share URL copied to clipboard!");
  } catch {
    prompt("Copy this URL:", link);
  }
});

clearBtn.addEventListener("click", () => {
  if (confirm("Clear all saved documents?")) {
    localStorage.clear();
    location.href = "/";
  }
});

function render(id) {
  const html = load(id) || "<p>No content</p>";
  const useScripts = allowScripts.checked;
  const sandbox = "allow-forms allow-pointer-lock allow-popups allow-modals allow-same-origin" + (useScripts ? " allow-scripts" : "");
  viewer.setAttribute("sandbox", sandbox);
  viewer.setAttribute("srcdoc", html);
  const t = localStorage.getItem("title:" + id) || "HTML → PWA Wrapper";
  document.title = t;
}

// Initial load: /?start=last OR /?doc=ID
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

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(console.error);
}
