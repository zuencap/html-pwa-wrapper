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