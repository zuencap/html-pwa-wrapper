
// Minimal LZ-String subset for URI encoding (MIT License)
const LZString=(function(){var f=String.fromCharCode;var keyStrUriSafe="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";var baseReverseDic={};
function getBaseValue(alphabet, character){if(!baseReverseDic[alphabet]){baseReverseDic[alphabet]={};for(var i=0;i<alphabet.length;i++){baseReverseDic[alphabet][alphabet.charAt(i)]=i;}}return baseReverseDic[alphabet][character];}
function compressToEncodedURIComponent(input){if(input==null)return"";return _compress(input,6,function(a){return keyStrUriSafe.charAt(a);});}
function decompressFromEncodedURIComponent(input){if(input==null)return"";if(input=="")return null;return _decompress(input.length,32,function(index){return getBaseValue(keyStrUriSafe,input.charAt(index));});}
function _compress(uncompressed, bitsPerChar, getCharFromInt){if(uncompressed==null)return"";var i,value,context_dictionary={},context_dictionaryToCreate={},context_c="",context_wc="",context_w="",context_enlargeIn=2,context_dictSize=3,context_numBits=2,context_data=[],context_data_val=0,context_data_position=0,ii;for(ii=0;ii<uncompressed.length;ii+=1){context_c=uncompressed.charAt(ii);if(!Object.prototype.hasOwnProperty.call(context_dictionary,context_c)){context_dictionary[context_c]=context_dictSize++;context_dictionaryToCreate[context_c]=true;}context_wc=context_w+context_c;if(Object.prototype.hasOwnProperty.call(context_dictionary,context_wc)){context_w=context_wc;}else{if(Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)){if(context_w.charCodeAt(0)<256){for(i=0;i<context_numBits;i++){context_data_val=context_data_val<<1;if(context_data_position==bitsPerChar-1){context_data_position=0;context_data.push(getCharFromInt(context_data_val));context_data_val=0;}else{context_data_position++;}}value=context_w.charCodeAt(0);for(i=0;i<8;i++){context_data_val=(context_data_val<<1)|(value&1);if(context_data_position==bitsPerChar-1){context_data_position=0;context_data.push(getCharFromInt(context_data_val));context_data_val=0;}else{context_data_position++;}value=value>>1;}}else{value=1;for(i=0;i<context_numBits;i++){context_data_val=(context_data_val<<1)|value;if(context_data_position==bitsPerChar-1){context_data_position=0;context_data.push(getCharFromInt(context_data_val));context_data_val=0;}else{context_data_position++;}value=0;}value=context_w.charCodeAt(0);for(i=0;i<16;i++){context_data_val=(context_data_val<<1)|(value&1);if(context_data_position==bitsPerChar-1){context_data_position=0;context_data.push(getCharFromInt(context_data_val));context_data_val=0;}else{context_data_position++;}value=value>>1;}}context_enlargeIn--;if(context_enlargeIn==0){context_enlargeIn=Math.pow(2,context_numBits);context_numBits++;}delete context_dictionaryToCreate[context_w];}else{value=context_dictionary[context_w];for(i=0;i<context_numBits;i++){context_data_val=(context_data_val<<1)|(value&1);if(context_data_position==bitsPerChar-1){context_data_position=0;context_data.push(getCharFromInt(context_data_val));context_data_val=0;}else{context_data_position++;}value=value>>1;}}context_enlargeIn--;if(context_enlargeIn==0){context_enlargeIn=Math.pow(2,context_numBits);context_numBits++;}context_dictionary[context_wc]=context_dictSize++;context_w=String(context_c);}if(context_w!==""){if(Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)){if(context_w.charCodeAt(0)<256){for(i=0;i<context_numBits;i++){context_data_val=context_data_val<<1;if(context_data_position==bitsPerChar-1){context_data_position=0;context_data.push(getCharFromInt(context_data_val));context_data_val=0;}else{context_data_position++;}}value=context_w.charCodeAt(0);for(i=0;i<8;i++){context_data_val=(context_data_val<<1)|(value&1);if(context_data_position==bitsPerChar-1){context_data_position=0;context_data.push(getCharFromInt(context_data_val));context_data_val=0;}else{context_data_position++;}value=value>>1;}}else{value=1;for(i=0;i<context_numBits;i++){context_data_val=(context_data_val<<1)|value;if(context_data_position==bitsPerChar-1){context_data_position=0;context_data.push(getCharFromInt(context_data_val));context_data_val=0;}else{context_data_position++;}value=0;}value=context_w.charCodeAt(0);for(i=0;i<16;i++){context_data_val=(context_data_val<<1)|(value&1);if(context_data_position==bitsPerChar-1){context_data_position=0;context_data.push(getCharFromInt(context_data_val));context_data_val=0;}else{context_data_position++;}value=value>>1;}}context_enlargeIn--;if(context_enlargeIn==0){context_enlargeIn=Math.pow(2,context_numBits);context_numBits++;}delete context_dictionaryToCreate[context_w];}else{value=context_dictionary[context_w];for(i=0;i<context_numBits;i++){context_data_val=(context_data_val<<1)|(value&1);if(context_data_position==bitsPerChar-1){context_data_position=0;context_data.push(getCharFromInt(context_data_val));context_data_val=0;}else{context_data_position++;}value=value>>1;}}context_enlargeIn--;if(context_enlargeIn==0){context_enlargeIn=Math.pow(2,context_numBits);context_numBits++;}}value=2;for(i=0;i<context_numBits;i++){context_data_val=(context_data_val<<1)|(value&1);if(context_data_position==bitsPerChar-1){context_data_position=0;context_data.push(getCharFromInt(context_data_val));context_data_val=0;}else{context_data_position++;}value=value>>1;}for(;;){context_data_val=context_data_val<<1;if(context_data_position==bitsPerChar-1){context_data.push(getCharFromInt(context_data_val));break;}else context_data_position++;}return context_data.join("");}
function _decompress(length, resetValue, getNextValue){var dictionary=[],next,dictSize=4,numBits=3,entry="",result=[],i,w,bits,resb,maxpower,power,c, data={val:getNextValue(0),position:resetValue,index:1};for(i=0;i<3;i+=1){dictionary[i]=i;}bits=0;maxpower=Math.pow(2,2);power=1;while(power!=maxpower){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetValue;data.val=getNextValue(data.index++);}bits|=(resb>0?1:0)*power;power<<=1;}switch(next=bits){case 0:bits=0;maxpower=Math.pow(2,8);power=1;while(power!=maxpower){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetValue;data.val=getNextValue(data.index++);}bits|=(resb>0?1:0)*power;power<<=1;}c=f(bits);break;case 1:bits=0;maxpower=Math.pow(2,16);power=1;while(power!=maxpower){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetValue;data.val=getNextValue(data.index++);}bits|=(resb>0?1:0)*power;power<<=1;}c=f(bits);break;case 2:return"";}dictionary[3]=c;w=c;result.push(c);while(true){if(data.index>length)return"";bits=0;maxpower=Math.pow(2,numBits);power=1;while(power!=maxpower){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetValue;data.val=getNextValue(data.index++);}bits|=(resb>0?1:0)*power;power<<=1;}switch(c=next=bits){case 0:bits=0;maxpower=Math.pow(2,8);power=1;while(power!=maxpower){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetValue;data.val=getNextValue(data.index++);}bits|=(resb>0?1:0)*power;power<<=1;}dictionary[dictSize++]=f(bits);c=dictSize-1;data.enlargeIn--;break;case 1:bits=0;maxpower=Math.pow(2,16);power=1;while(power!=maxpower){resb=data.val&data.position;data.position>>=1;if(data.position==0){data.position=resetValue;data.val=getNextValue(data.index++);}bits|=(resb>0?1:0)*power;power<<=1;}dictionary[dictSize++]=f(bits);c=dictSize-1;data.enlargeIn--;break;case 2:return result.join("");}if(data.enlargeIn&&data.enlargeIn==0){data.enlargeIn=Math.pow(2,numBits);numBits++;}if(dictionary[c]){entry=dictionary[c];}else{if(c===dictSize){entry=w+w.charAt(0);}else{return null;}}result.push(entry);dictionary[dictSize++]=w+entry.charAt(0);w=entry;if(--data.enlargeIn==0){data.enlargeIn=Math.pow(2,numBits);numBits++;}}}
return {compressToEncodedURIComponent, decompressFromEncodedURIComponent};})();

// app.js — embedded share links (compressed), doc list, panel toggle
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
const shareEmbedBtn = document.getElementById("shareEmbedBtn");

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
  url.searchParams.delete("s");
  history.replaceState({}, "", url.toString());
  exportBtn.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  setPanel(true);
});

// Embedded share link (compress to URI-safe string)
shareEmbedBtn.addEventListener("click", async () => {
  const id = currentId || getLast();
  const html = id ? load(id) : input.value;
  if (!html) return alert("Nothing to share yet.");
  const idx = getIndex();
  const meta = id ? (idx.find(d => d.id===id) || {title: docTitle.value || "Shared"}) : {title: docTitle.value || "Shared"};
  const payload = JSON.stringify({ t: meta.title, h: html });
  const encoded = LZString.compressToEncodedURIComponent(payload);
  const url = new URL(location.href);
  url.searchParams.set("s", encoded);
  url.searchParams.delete("doc");
  const link = url.toString();
  try { await navigator.clipboard.writeText(link); alert("Share link copied!"); }
  catch { prompt("Copy this URL:", link); }
});

// Render current doc
function render(id) {
  currentId = id;
  const html = load(id) || "<p>No content</p>";
  viewer.setAttribute("srcdoc", html);
  const t = (getIndex().find(d => d.id === id)?.title) || "HTML → PWA Wrapper";
  document.title = t;
  exportBtn.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  for (const li of docList.querySelectorAll("li")) li.classList.toggle("active", li.dataset.id === id);
}

// Build docs list
function fmtTime(iso) { try { return new Date(iso).toLocaleString(); } catch { return iso; } }
function escapeHtml(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',\"'\":'&#39;'}[c])); }
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
    url.searchParams.delete("s");
    history.replaceState({}, "", url.toString());
  }
});

// Handle embedded share param (?s=...)
function tryOpenShared() {
  const url = new URL(location.href);
  const s = url.searchParams.get("s");
  if (!s) return false;
  try {
    const json = LZString.decompressFromEncodedURIComponent(s);
    const obj = JSON.parse(json);
    const html = obj.h || "";
    const title = obj.t || "Shared";
    input.value = html;
    docTitle.value = title;
    viewer.setAttribute("srcdoc", html);
    document.title = title + " • Shared preview";
    setPanel(true);
    return true;
  } catch (e) {
    alert("Couldn't open shared content.");
    return false;
  }
}

// Boot
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