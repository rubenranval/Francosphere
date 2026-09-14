/* Francosphère — start-up and wiring */

import { state, $, $$ } from "./core.js";
import { CONFIG } from "./config.js";
import { ui } from "./i18n.js";
import { data, load, loadWorld, applyLang } from "./api.js";
import { buildGlobe } from "./globe.js";
import { eventHref } from "./urls.js";
import { applySeo } from "./seo.js";
import { route } from "./router.js";
import {
  renderBrand, renderStatic, renderPhotos, renderLoading, renderError,
  renderContent, select, setGlobe, wireImages
} from "./views.js";

let globe = null;

function readLanguage() {
  const p = new URLSearchParams(location.search).get("lang");
  state.hasLangParam = (p === "en" || p === "fr");
  const nav = (navigator.language || "fr").slice(0, 2);
  state.lang = state.hasLangParam ? p : (nav === "en" ? "en" : "fr");
}

function setLang(l) {
  state.lang = l;
  state.hasLangParam = true;
  try {
    const u = new URL(location.href);
    u.searchParams.set("lang", l);
    history.replaceState(null, "", u);
  } catch (e) { /* older browsers: the URL just doesn't update */ }
  renderStatic(); renderPhotos(); wireImages();
  if (!data.loaded) { applySeo(null); return; }
  applyLang();
  renderContent();
  if (globe) globe.relabel();
  route();
}

function fetchContent() {
  return load().then(() => {
    renderContent();
    wireImages();
  }).catch(err => {
    data.error = err;
    console.error("[Francosphère] content could not be loaded:", err);
    renderError(fetchContent);
  });
}

function wire() {
  $$("[data-lang]").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));

  $$("[data-home]").forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    history.pushState(null, "", location.pathname + location.search);
    route();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }));

  /* Event cards carry real hrefs so they can be crawled, copied and opened in a new
     tab; a plain left click navigates without a reload. */
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[data-event]");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    history.pushState(null, "", a.getAttribute("href"));
    route();
  });

  window.addEventListener("hashchange", route);
  window.addEventListener("popstate", route);
}

function boot() {
  readLanguage();

  /* Links shared before event URLs became ?event= still resolve. */
  const legacy = /^#\/event\/(.+)$/.exec(location.hash);
  if (legacy) history.replaceState(null, "", eventHref(decodeURIComponent(legacy[1])));

  renderBrand(); renderStatic(); renderPhotos(); wireImages(); renderLoading();
  wire();

  Promise.all([loadWorld(), fetchContent()]).then(() => {
    globe = buildGlobe(select);
    setGlobe(globe);
    route();
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
