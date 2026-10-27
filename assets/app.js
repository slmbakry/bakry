// Shared helpers for every page: Supabase client, header, theme, rendering.
(function () {
  const cfg = window.MBM_CONFIG;
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);

  const KINDS = {
    instruction: { label: "التعليمات", single: "تعليمات" },
    experiment: { label: "ملخص التجارب", single: "ملخص تجربة" },
    tip: { label: "نصائح", single: "نصيحة" },
  };

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Tiny, safe formatter: escapes first, then supports lists, **bold**, links,
  // and `code` lines (shown as a left-to-right box, kept inside the list item above).
  function format(text) {
    const inline = (s) =>
      esc(s)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    const out = [];
    let list = null;
    const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
    for (const raw of String(text ?? "").split(/\r?\n/)) {
      const line = raw.trim();
      const code = line.match(/^`(.+)`$/);
      const ul = line.match(/^[-•*]\s+(.*)/);
      const ol = line.match(/^\d+[.)]\s+(.*)/);
      if (code) {
        const box = `<code class="code-line" dir="ltr">${esc(code[1])}</code>`;
        const last = out.length - 1;
        if (list && out[last].endsWith("</li>")) out[last] = out[last].slice(0, -5) + box + "</li>";
        else out.push(box);
      } else if (ul || ol) {
        const tag = ul ? "ul" : "ol";
        if (list !== tag) { close(); out.push(`<${tag}>`); list = tag; }
        out.push(`<li>${inline((ul || ol)[1])}</li>`);
      } else if (!line) {
        close();
      } else {
        close();
        out.push(`<p>${inline(line)}</p>`);
      }
    }
    close();
    return out.join("");
  }

  function fmtDate(d) {
    if (!d) return "";
    try { return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }); }
    catch { return d; }
  }

  function safeUrl(u) {
    return /^https?:\/\//i.test(u || "") ? u : "";
  }

  // Theme toggle: stored per viewer, falls back to system preference.
  function getTheme() { try { return localStorage.getItem("mbm-theme"); } catch { return null; } }
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }
  applyTheme(getTheme());
  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem("mbm-theme", next); } catch {}
  }

  function header(active) {
    const el = document.getElementById("site-header");
    if (!el) return;
    el.className = "topbar";
    el.innerHTML = `
      <div class="wrap">
        <a class="brand" href="./">
          <span class="logo">${esc(cfg.brand)}</span>
          <span>مركز المعرفة<small>أدوات وتعليمات وتجارب</small></span>
        </a>
        <nav class="nav">
          <a class="btn btn-ghost btn-sm hide-sm" href="./">الأدوات</a>
          <a class="btn btn-ghost btn-sm" href="admin.html" id="nav-admin">لوحة التحكم</a>
          <button class="btn icon-btn" id="theme-toggle" aria-label="تبديل الوضع"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></button>
        </nav>
      </div>`;
    document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
  }

  function footer() {
    const el = document.getElementById("site-footer");
    if (!el) return;
    el.innerHTML = `<div class="wrap"><span>جميع الحقوق محفوظة ${new Date().getFullYear()}</span><span class="ltr">${esc(cfg.brand)}</span></div>`;
  }

  let toastTimer;
  function toast(msg, isError) {
    let el = document.getElementById("toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.toggle("error", !!isError);
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
  }

  window.MBM = { sb, KINDS, esc, format, fmtDate, safeUrl, header, footer, toast };
})();
