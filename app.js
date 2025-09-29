import { APP_VERSION } from './config.js';

/* ---------- Storage helpers ---------- */
const K_INDEX = 'docsIndex'; // array of {id,title,ts}
const load = (id) => localStorage.getItem('doc:' + id);
const save = (id, html) => localStorage.setItem('doc:' + id, html);
const del = (id) => localStorage.removeItem('doc:' + id);
const setLast = (id) => localStorage.setItem('lastDocId', id);
const getLast = () => localStorage.getItem('lastDocId');
const getIndex = () => {
  try {
    return JSON.parse(localStorage.getItem(K_INDEX)) || [];
  } catch {
    return [];
  }
};
const setIndex = (arr) => localStorage.setItem(K_INDEX, JSON.stringify(arr));

/* ---------- Elements ---------- */
const input = document.getElementById('input');
const viewer = document.getElementById('viewer');
const saveBtn = document.getElementById('saveBtn');
const installBtn = document.getElementById('installBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const docTitle = document.getElementById('docTitle');
const panel = document.getElementById('panel');
const togglePanel = document.getElementById('togglePanel');
const floatToggle = document.getElementById('floatToggle');
const appRoot = document.getElementById('appRoot');
const docList = document.getElementById('docList');
const docCount = document.getElementById('docCount');
const shareEmbedBtn = document.getElementById('shareEmbedBtn');

console.log('[Wrapper] Booting app.js', { APP_VERSION });
console.log('[Wrapper] Element presence', {
  input: !!input,
  viewer: !!viewer,
  saveBtn: !!saveBtn,
  shareEmbedBtn: !!shareEmbedBtn,
});

/* ---------- Utils ---------- */
function fmtTime(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function toBase64Url(bytes) {
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  const b64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return b64;
}
function fromBase64Url(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Compression with timeout + fallback
async function gzipCompressString(str, timeoutMs = 1500) {
  const hasCS = typeof CompressionStream !== 'undefined';
  console.log('[Share] CompressionStream available:', hasCS);
  const encodedString = new TextEncoder().encode(str);
  console.log('[Share] Original string byte length:', encodedString.length);
  if (!hasCS) {
    console.warn('[Share] No CompressionStream; using raw UTF-8.');
    return encodedString;
  }
  const start = performance.now();
  let timedOut = false;
  const timeout = new Promise((_, rej) =>
    setTimeout(() => {
      timedOut = true;
      rej(new Error('compress timeout'));
    }, timeoutMs)
  );

  const work = (async () => {
    console.log('[Share] compress: start');
    try {
      const readable = new Blob([encodedString]).stream();
      const cs = new CompressionStream('gzip');
      const compressedStream = readable.pipeThrough(cs);
      const buf = await new Response(compressedStream).arrayBuffer();
      console.log('[Share] compress: done in', Math.round(performance.now() - start), 'ms');
      return new Uint8Array(buf);
    } catch (e) {
      console.error('[Share] Compression error:', e);
      throw e;
    }
  })();

  try {
    return await Promise.race([work, timeout]);
  } catch (e) {
    console.warn('[Share] compress failed or timed out:', e.message);
    if (timedOut) console.warn('[Share] falling back to raw UTF-8 due to timeout.');
    return encodedString;
  }
}

async function gzipDecompressToString(bytes) {
  const hasDS = typeof DecompressionStream !== 'undefined';
  console.log('[OpenShare] DecompressionStream available:', hasDS);
  if (!hasDS) {
    console.warn('[OpenShare] No DecompressionStream; assuming raw UTF-8.');
    return new TextDecoder().decode(bytes);
  }
  console.log('[OpenShare] decompress: start');
  const blob = new Blob([bytes], { type: 'application/gzip' });
  const ds = new DecompressionStream('gzip');
  const decompressed = blob.stream().pipeThrough(ds);
  const text = await new Response(decompressed).text();
  console.log('[OpenShare] decompress: done');
  return text;
}

/* ---------- Version label ---------- */
(function () {
  const el = document.getElementById('appVersion');
  if (el) el.textContent = 'Version ' + APP_VERSION;
})();

/* ---------- PWA install prompt ---------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.hidden = false;
});
installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

/* ---------- Save ---------- */
saveBtn.addEventListener('click', () => {
  const html = input.value;
  const id = crypto.randomUUID().slice(0, 8);
  const title = (docTitle.value || 'Untitled').trim();
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
  url.searchParams.set('doc', id);
  url.searchParams.delete('s');
  history.replaceState({}, '', url.toString());

  exportBtn.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));

  setPanel(true);
});

/* ---------- Share (clipboard-first, always shows something) ---------- */
shareEmbedBtn.addEventListener('click', async () => {
  console.group('[Share] Click handler start');
  try {
    const id = currentId || getLast();
    const source = id ? 'stored' : 'editor';
    const html = id ? load(id) : input.value;
    const titleGuess = id ? getIndex().find((d) => d.id === id)?.title || '(untitled)' : docTitle.value || '(untitled)';
    console.log('[Share] Source:', source, 'id:', id, 'title:', titleGuess);
    console.log('[Share] HTML length:', html ? html.length : 0);

    if (!html) {
      console.warn('[Share] Nothing to share (empty HTML).');
      alert('Nothing to share.');
      return;
    }

    const payload = JSON.stringify({ t: titleGuess, h: html });
    console.log('[Share] Payload length (chars):', payload.length);

    const bytes = await gzipCompressString(payload);
    console.log('[Share] Compressed bytes:', bytes.length, 'first bytes:', Array.from(bytes.slice(0, 8)));

    const encoded = toBase64Url(bytes);
    console.log('[Share] Encoded length:', encoded.length);

    const url = new URL(location.href);
    url.searchParams.set('s', encoded);
    url.searchParams.delete('doc');
    const link = url.toString();
    console.log('[Share] Final URL length:', link.length);
    console.log('[Share] URL preview (first 120):', link.slice(0, 120) + (link.length > 120 ? '…' : ''));

    // Clipboard path first, always yields visible result
    let copied = false;
    try {
      await navigator.clipboard.writeText(link);
      console.log('[Share] Clipboard write succeeded');
      copied = true;
      alert('Share link copied to clipboard!');
    } catch (e) {
      console.warn('[Share] Clipboard write failed:', e);
    }

    // Always show prompt as a last resort so the user sees something
    if (!copied) {
      console.log('[Share] Showing prompt fallback');
      prompt('Copy this URL:', link);
    }
  } catch (err) {
    console.error('[Share] Fatal error in click handler:', err);
    alert('Sharing failed. See console for details.');
  } finally {
    console.groupEnd();
  }
});

/* ---------- Render current doc ---------- */
let currentId = null;
function render(id) {
  currentId = id;
  const html = load(id) || '<p>No content</p>';
  viewer.setAttribute('srcdoc', html);
  const t = getIndex().find((d) => d.id === id)?.title || 'HTML → PWA Wrapper';
  document.title = t;
  exportBtn.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  for (const li of docList.querySelectorAll('li')) li.classList.toggle('active', li.dataset.id === id);

  // Update the URL parameter to reflect the selected document
  const url = new URL(location.href);
  url.searchParams.set('doc', id);
  history.replaceState({}, '', url.toString());
}

/* ---------- Doc list ---------- */
function renderList() {
  const idx = getIndex();
  docCount.textContent = idx.length ? `${idx.length} saved` : 'No docs yet';
  docList.innerHTML = idx
    .map(
      (d) => `
    <li data-id="${d.id}">
      <div class="doc-meta">
        <button class="doc-title" data-action="open" title="Open">${escapeHtml(d.title)}</button>
        <span class="doc-time">${fmtTime(d.ts)}</span>
      </div>
      <div class="doc-actions">
        <button class="icon-btn tiny" data-action="delete" title="Delete">🗑</button>
      </div>
    </li>
  `
    )
    .join('');
  for (const li of docList.querySelectorAll('li')) li.classList.toggle('active', li.dataset.id === currentId);
}

/* ---------- List events (open/delete) ---------- */
docList.addEventListener('click', (e) => {
  const li = e.target.closest('li[data-id]');
  if (!li) return;
  const id = li.dataset.id;
  const action = e.target.dataset.action;
  if (action === 'open') {
    setLast(id);
    render(id);
  } else if (action === 'delete') {
    if (!confirm('Delete this document?')) return;
    const idx = getIndex().filter((d) => d.id !== id);
    setIndex(idx);
    del(id);
    if (currentId === id) {
      currentId = null;
      if (idx.length) {
        const nextId = idx[0].id;
        setLast(nextId);
        render(nextId);
      } else {
        viewer.removeAttribute('srcdoc');
        document.title = 'HTML → PWA Wrapper';
        const url = new URL(location.href);
        url.searchParams.delete('doc');
        history.replaceState({}, '', url.toString());
      }
    }
    renderList();
  }
});

/* ---------- Clear storage ---------- */
clearBtn?.addEventListener('click', () => {
  if (confirm('Clear ALL saved documents?')) {
    localStorage.clear();
    viewer.removeAttribute('srcdoc');
    document.title = 'HTML → PWA Wrapper';
    renderList();
    const url = new URL(location.href);
    url.searchParams.delete('doc');
    url.searchParams.delete('s');
    history.replaceState({}, '', url.toString());
  }
});

/* ---------- Open from share (?s=...) ---------- */
async function handleSharedOpen() {
  const url = new URL(location.href);
  const s = url.searchParams.get('s');
  if (!s) return false;
  console.group('[OpenShare] Handling ?s param');
  try {
    console.log('[OpenShare] Encoded length:', s.length);
    const bytes = fromBase64Url(s);
    console.log('[OpenShare] Bytes length:', bytes.length, 'first bytes:', Array.from(bytes.slice(0, 8)));
    const json = await gzipDecompressToString(bytes);
    console.log('[OpenShare] JSON length:', json.length);
    const obj = JSON.parse(json);
    const html = obj.h || '';
    const title = (obj.t || 'Shared').toString();

    viewer.setAttribute('srcdoc', html);
    document.title = title + ' • Shared preview';

    const id = crypto.randomUUID().slice(0, 8);
    const ts = new Date().toISOString();
    save(id, html);
    setLast(id);
    currentId = id;
    const idx = getIndex();
    idx.unshift({ id, title, ts });
    setIndex(idx);
    renderList();
    exportBtn.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));

    url.searchParams.delete('s');
    url.searchParams.set('doc', id);
    history.replaceState({}, '', url.toString());

    setPanel(true);
    console.groupEnd();
    return true;
  } catch (e) {
    console.error('[OpenShare] Failed:', e);
    alert("Couldn't open shared content. See console for details.");
    console.groupEnd();
    return false;
  }
}

/* ---------- Boot ---------- */
(function boot() {
  console.log('[Wrapper] Boot init');
  renderList();
  handleSharedOpen().then((handled) => {
    if (handled) return;
    const url = new URL(location.href);
    const id = url.searchParams.get('doc');
    if (id && load(id)) {
      render(id);
    } else {
      const last = getLast();
      if (last && load(last)) {
        render(last);
      } else {
        console.log('[Wrapper] No last document found.');
      }
    }
  });
})();

/* ---------- SW ---------- */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(
    () => console.log('[Wrapper] SW registered'),
    (e) => console.warn('[Wrapper] SW register failed:', e)
  );
}

/* ---------- Panel toggling ---------- */
function setPanel(collapsed) {
  panel.classList.toggle('collapsed', collapsed);
  appRoot.classList.toggle('panel-collapsed', collapsed);
  floatToggle.hidden = !collapsed;
  togglePanel.textContent = collapsed ? '⟩' : '⟨';
  localStorage.setItem('panelCollapsed', collapsed ? '1' : '0');
}
togglePanel.addEventListener('click', () => setPanel(!panel.classList.contains('collapsed')));
floatToggle.addEventListener('click', () => setPanel(false));
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault();
    setPanel(!panel.classList.contains('collapsed'));
  }
});
(function initPanel() {
  const collapsed = localStorage.getItem('panelCollapsed') === '1';
  setPanel(collapsed);
})();
