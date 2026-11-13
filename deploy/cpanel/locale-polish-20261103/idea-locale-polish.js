/* IDEA live material studio: locale consistency patch, 2026-11-03.
 * Targets untranslated interface copy only; never rewrites SKU, maker, or product data.
 */
(() => {
  "use strict";
  const key = "idea-language";
  const texts = new WeakMap();
  const arabic = /[\u0600-\u06FF]/;
  const map = new Map([
    ["IDEA · تصميم الصور للعملاء والشركات والإدارة", "IDEA · Image design for customers, companies and administrators"],
    ["اضغط لاختيار خامة", "Click to select material"],
  ]);
  function translate(value) {
    const trimmed = value.trim();
    if (map.has(trimmed)) return map.get(trimmed);
    if (trimmed.startsWith("الخامة التي تختارها الآن ستُحفظ لـ"))
      return "The selected material will be applied to this surface. Choose Floor or Walls to assign a different material to each.";
    return null;
  }
  const targets = ".eyebrow, .surface-material-note, em";
  let frame = 0;
  function check() {
    frame = 0;
    const english = document.documentElement.lang === "en";
    if (!document.body) return;
    document.querySelectorAll(targets).forEach(element => {
      if (element.closest("script,style")) return;
      element.childNodes.forEach(node => {
        if (node.nodeType !== Node.TEXT_NODE) return;
        const value = node.nodeValue || "";
        if (!english) {
          const original = texts.get(node);
          if (original && node.nodeValue !== original) node.nodeValue = original;
          texts.delete(node);
          return;
        }
        if (!arabic.test(value)) return;
        const translated = translate(value);
        if (!translated) return;
        const prefix = value.match(/^\s*/)?.[0] || "";
        const suffix = value.match(/\s*$/)?.[0] || "";
        texts.set(node, value);
        node.nodeValue = prefix + translated + suffix;
      });
    });
  }
  function queue() {
    if (frame || document.hidden) return;
    frame = requestAnimationFrame(check);
  }
  let initialized = false;
  function applySaved() {
    if (initialized || !document.body) return;
    const preferred = (() => {
      try { return localStorage.getItem(key); } catch { return null; }
    })();
    if (!["ar","en","fr"].includes(preferred)) { initialized = true; return; }
    const buttons = [...document.querySelectorAll("button")];
    const target = buttons.find(b => b.textContent.trim() === preferred.toUpperCase());
    if (!target) return;
    initialized = true;
    if (document.documentElement.lang !== preferred) target.click();
  }
  document.addEventListener("click", event => {
    const button = event.target instanceof Element ? event.target.closest("button") : null;
    const candidate = button?.textContent.trim().toLowerCase();
    if (["en","ar","fr"].includes(candidate)) {
      try { localStorage.setItem(key, candidate); } catch {}
      queue();
    }
  }, true);
  function boot() {
    const observer = new MutationObserver(() => {
      applySaved();
      queue();
    });
    observer.observe(document.documentElement, {
      subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: ["lang","dir"],
    });
    applySaved();
    queue();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
